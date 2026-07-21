import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/api-config"
import { canAccessAdminPanel, canAccessTeacherPanel } from "@/lib/roles"
import { getRoleFromSessionToken } from "@/lib/session-token"

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const pathname = req.nextUrl.pathname
  const role = token ? getRoleFromSessionToken(token) : null

  const studentProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/achievements") ||
    pathname.startsWith("/materials") ||
    pathname.startsWith("/training") ||
    pathname.startsWith("/change-password")

  if (studentProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url))
    if (!canAccessAdminPanel(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  if (pathname.startsWith("/teacher")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url))
    if (!canAccessTeacherPanel(role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  if (pathname.startsWith("/org")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url))
  }

  if ((pathname === "/" || pathname === "/login") && token) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
    if (role === "teacher") {
      return NextResponse.redirect(new URL("/teacher", req.url))
    }
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/teacher/:path*",
    "/org/:path*",
    "/dashboard/:path*",
    "/courses/:path*",
    "/settings/:path*",
    "/achievements/:path*",
    "/materials/:path*",
    "/training/:path*",
    "/change-password",
  ],
}
