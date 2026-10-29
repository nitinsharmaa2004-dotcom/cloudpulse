import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { getSession } from "./session";
import type { SessionPayload } from "./jwt";

export type ApiSuccess<T> = { success: true; data: T; meta?: Record<string, unknown> };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  const body: ApiSuccess<T> = { success: true, data, ...(init?.meta ? { meta: init.meta } : {}) };
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  const body: ApiFailure = { success: false, error: { code, message, ...(details ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) return fail(error.status, error.code, error.message, error.details);
  if (error instanceof ZodError) {
    return fail(
      422,
      "VALIDATION_ERROR",
      error.issues[0]?.message ?? "Invalid request",
      error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  }
  if (error instanceof SyntaxError) return fail(400, "BAD_REQUEST", "Malformed JSON body");
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return fail(409, "CONFLICT", "A record with these details already exists");
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[api] database unavailable", error.message);
    return fail(503, "SERVICE_UNAVAILABLE", "Database is unavailable. Please try again shortly.");
  }
  console.error("[api] unhandled error", error);
  return fail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;
type AuthedHandler<C> = (req: Request, ctx: C & { session: SessionPayload }) => Promise<Response>;

export function withErrorHandling<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function withAuth<C = unknown>(handler: AuthedHandler<C>): Handler<C> {
  return withErrorHandling(async (req, ctx) => {
    const session = await getSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    return handler(req, { ...(ctx as C), session });
  });
}

export function requireRole(session: SessionPayload, roles: SessionPayload["role"][]) {
  if (!roles.includes(session.role)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
}
