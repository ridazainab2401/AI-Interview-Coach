import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect /interview routes
  if (path.startsWith("/interview")) {
    // Check if there is a supabase auth session cookie
    // Supabase stores auth token in cookies usually named sb-access-token or sb-[project-id]-auth-token
    const hasSession = request.cookies.getAll().some((cookie) => 
      cookie.name.includes("auth-token") || cookie.name.includes("sb-access-token") || cookie.name.includes("supabase.auth.token")
    );

    // If no session found in cookies, we can also check for a mock/bypass header or cookie
    // To make it easy to develop locally without DB setup, we can bypass if BYPASS_AUTH is set or let it slide
    const bypassAuth = process.env.NODE_ENV === "development";

    if (!hasSession && !bypassAuth) {
      // Allow local development bypass or redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
