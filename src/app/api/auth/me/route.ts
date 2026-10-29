import { prisma } from "@/lib/prisma";
import { ApiError, ok, withAuth } from "@/lib/api";

export const GET = withAuth(async (_req, { session }) => {
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, company: true, jobTitle: true, monthlyBudget: true, createdAt: true },
  });
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Session is no longer valid");
  return ok({ user });
});
