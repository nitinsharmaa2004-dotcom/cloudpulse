import { NextResponse } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { clearSessionCookie } from "@/lib/session";

export const POST = withErrorHandling(async () => {
  await clearSessionCookie();
  return ok({ loggedOut: true });
});

/** Used for server-side redirects when a session references a user that no longer exists. */
export const GET = withErrorHandling(async (req: Request) => {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", req.url));
});
