import { ok, withAuth } from "@/lib/api";
import { getCostAnalytics } from "@/lib/analytics";
import { costQuerySchema } from "@/lib/validation";

export const GET = withAuth(async (req, { session }) => {
  const { searchParams } = new URL(req.url);
  const { range } = costQuerySchema.parse({ range: searchParams.get("range") ?? undefined });
  return ok(await getCostAnalytics(session.sub, range));
});
