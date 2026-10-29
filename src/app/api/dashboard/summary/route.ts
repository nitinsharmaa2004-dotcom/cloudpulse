import { ok, withAuth } from "@/lib/api";
import { getSummary } from "@/lib/analytics";

export const GET = withAuth(async (_req, { session }) => ok(await getSummary(session.sub)));
