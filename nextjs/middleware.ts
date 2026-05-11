import { NextRequest, NextResponse } from "next/server"

const AUTH_COOKIE = "auth_token"

// Paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/register"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE)?.value

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Root path: redirect based on auth state
  if (pathname === "/") {
    const destination = token ? "/dashboard" : "/login"
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Protected route, no token → login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Already authenticated, trying to reach auth pages → dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|images).*)",
  ],
}
