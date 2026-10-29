import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, ok, withErrorHandling } from "@/lib/api";
import { signupSchema } from "@/lib/validation";
import { createSessionCookie } from "@/lib/session";
import { provisionDemoWorkspace } from "@/lib/workspace";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const POST = withErrorHandling(async (req: Request) => {
  const limit = rateLimit(`signup:${clientIp(req)}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) throw new ApiError(429, "RATE_LIMITED", `Too many sign-up attempts. Try again in ${limit.retryAfter}s.`);

  const input = signupSchema.parse(await req.json());
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      company: input.company || null,
      passwordHash: await bcrypt.hash(input.password, 12),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  try {
    await provisionDemoWorkspace(user.id);
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } });
    throw error;
  }

  await createSessionCookie({ sub: user.id, email: user.email, name: user.name, role: user.role });
  return ok({ user }, { status: 201 });
});
