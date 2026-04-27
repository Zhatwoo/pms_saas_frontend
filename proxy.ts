import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login"];
const SESSION_EXPIRED_REASON = "session-expired";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes, and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.match(/\.(ico|jpg|jpeg|png|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("pms_token")?.value;
  const hadPreviousSession =
    request.cookies.get("pms_was_logged_in")?.value === "1";
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // No token + protected path -> redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("redirect", redirectTarget);
    if (hadPreviousSession) {
      loginUrl.searchParams.set("reason", SESSION_EXPIRED_REASON);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Has token + on login page -> redirect to dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.jpg|.*\\.png$).*)",
  ],
};
