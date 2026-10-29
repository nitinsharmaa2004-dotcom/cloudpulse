import { prisma } from "@/lib/prisma";
import { ok, withAuth } from "@/lib/api";
import { evaluateResource } from "@/lib/mock-data";

/** Re-samples utilisation metrics (simulated CloudWatch pull) and re-evaluates recommendations. */
export const POST = withAuth(async (_req, { session }) => {
  const resources = await prisma.cloudResource.findMany({ where: { userId: session.sub, status: { not: "STOPPED" } } });
  const jitter = (v: number, spread: number) => Math.max(0, Math.round((v + (Math.random() - 0.5) * spread) * 10) / 10);

  await prisma.$transaction(
    resources.map((r) => {
      const cpuUtilization = r.cpuUtilization === 0 ? 0 : jitter(r.cpuUtilization, Math.max(1, r.cpuUtilization * 0.15));
      const evaluated = evaluateResource({ ...r, cpuUtilization });
      return prisma.cloudResource.update({ where: { id: r.id }, data: { cpuUtilization, ...evaluated } });
    }),
  );

  const flagged = await prisma.cloudResource.count({ where: { userId: session.sub, status: { in: ["IDLE", "UNDERUTILIZED"] } } });
  return ok({ scanned: resources.length, flagged, scannedAt: new Date().toISOString() });
});
