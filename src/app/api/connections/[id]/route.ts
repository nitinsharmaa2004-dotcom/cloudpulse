import { prisma } from "@/lib/prisma";
import { ApiError, ok, requireRole, withAuth } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withAuth<Ctx>(async (_req, { params, session }) => {
  requireRole(session, ["OWNER", "ADMIN"]);
  const { id } = await params;
  const { count } = await prisma.cloudConnection.deleteMany({ where: { id, userId: session.sub } });
  if (!count) throw new ApiError(404, "NOT_FOUND", "Connection not found");
  return ok({ deleted: true });
});
