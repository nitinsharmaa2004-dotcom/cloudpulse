import { prisma } from "@/lib/prisma";
import { ok, withAuth } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { createSessionCookie } from "@/lib/session";

const select = { id: true, name: true, email: true, role: true, company: true, jobTitle: true, monthlyBudget: true, createdAt: true } as const;

export const GET = withAuth(async (_req, { session }) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.sub }, select });
  return ok({ user });
});

export const PATCH = withAuth(async (req, { session }) => {
  const input = profileSchema.parse(await req.json());
  const user = await prisma.user.update({
    where: { id: session.sub },
    data: { name: input.name, company: input.company || null, jobTitle: input.jobTitle || null, monthlyBudget: input.monthlyBudget },
    select,
  });
  await createSessionCookie({ sub: user.id, email: user.email, name: user.name, role: user.role });
  return ok({ user });
});
