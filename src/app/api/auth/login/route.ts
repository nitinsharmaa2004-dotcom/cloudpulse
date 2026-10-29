import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, ok, withErrorHandling } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { createSessionCookie } from "@/lib/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Compared against for unknown emails so response timing doesn't reveal which accounts exist.
let dummyHash: string | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("cloudpulse-timing-guard", 12));

export const POST = withErrorHandling(async (req: Request) => {
  const limit = rateLimit(`login:${clientIp(req)}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) throw new ApiError(429, "RATE_LIMITED", `Too many login attempts. Try again in ${limit.retryAfter}s.`);

  const { email, password } = loginSchema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
  if (!user || !valid) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  await createSessionCookie({ sub: user.id, email: user.email, name: user.name, role: user.role });
  return ok({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
