import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "./env";
import { SESSION_TTL_SECONDS } from "./constants";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
};

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer("cloudpulse")
    .setAudience("cloudpulse-app")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "cloudpulse",
      audience: "cloudpulse-app",
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as SessionPayload["role"],
    };
  } catch {
    return null;
  }
}
