import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function shouldUseSecureAuthCookie(request: NextRequest): boolean {
  return (
    request.nextUrl.protocol === "https:" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1"
  );
}

/** Read Auth.js session JWT in middleware (must match production cookie name). */
export async function getMiddlewareAuthToken(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const secureCookie = shouldUseSecureAuthCookie(request);
  const token = await getToken({
    req: request,
    secret,
    secureCookie,
  });

  if (token) return token;

  // Fallback for mismatched env/runtime cookie settings.
  return getToken({
    req: request,
    secret,
    secureCookie: !secureCookie,
  });
}
