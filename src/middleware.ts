import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMiddlewareAuthToken } from "@/lib/middleware-auth";

export async function middleware(request: NextRequest) {
  const token = await getMiddlewareAuthToken(request);

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname === "/~offline";

  const canAccessApp =
    !!token?.id && token.isApproved !== false;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname === "/sw.js" || pathname === "/manifest.webmanifest") {
    return NextResponse.next();
  }

  if (!canAccessApp && !isAuthPage && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (canAccessApp && isAuthPage && !pathname.startsWith("/reset-password")) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (canAccessApp && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Skip /api so multipart uploads are not buffered/truncated by middleware (Next.js 16).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|pwa-icon|apple-icon|icon|api/).*)",
  ],
};
