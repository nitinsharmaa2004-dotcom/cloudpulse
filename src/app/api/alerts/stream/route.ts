import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { fail } from "@/lib/api";
import { maybeEmitLiveAlert } from "@/lib/live-alerts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_MS = 10_000;

/** Server-Sent Events stream pushing new alerts to the dashboard in real time. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return fail(401, "UNAUTHORIZED", "Authentication required");

  const encoder = new TextEncoder();
  let since = new Date();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          cleanup();
        }
      };
      const cleanup = () => {
        if (timer) clearInterval(timer);
        timer = undefined;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      send("ready", { connectedAt: since.toISOString() });

      timer = setInterval(async () => {
        try {
          await maybeEmitLiveAlert(session.sub);
          const fresh = await prisma.alert.findMany({
            where: { userId: session.sub, createdAt: { gt: since } },
            orderBy: { createdAt: "asc" },
          });
          if (fresh.length) {
            since = fresh.at(-1)!.createdAt;
            const unread = await prisma.alert.count({ where: { userId: session.sub, read: false } });
            send("alerts", { alerts: fresh, unread });
          } else {
            send("ping", { t: Date.now() });
          }
        } catch (error) {
          console.error("[alerts/stream] poll failed", error);
        }
      }, POLL_MS);

      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
