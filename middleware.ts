import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/api-config"
import { canAccessAdminPanel, canAccessTeacherPanel, isStudent } from "@/lib/roles"
import { getSessionClaims } from "@/lib/session-token"

function isCourseLearnPath(pathname: string) {
  return /^\/courses\/[^/]+\/learn(?:\/|$)/.test(pathname)
}

function isPublicCatalogPath(pathname: string) {
  if (pathname === "/courses") return true
  if (pathname.startsWith("/courses/") && !isCourseLearnPath(pathname)) return true
  return false
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const pathname = req.nextUrl.pathname
  const claims = token ? getSessionClaims(token) : { role: null, email_verified: null }
  const role = claims.role
  const unverifiedStudent = Boolean(token) && isStudent(role) && claims.email_verified === false

  if (pathname === "/verify-email") {
    if (!token) return NextResponse.redirect(new URL("/login", req.url))
    return NextResponse.next()
  }

  if (unverifiedStudent && pathname !== "/change-password" && !isPublicCatalogPath(pathname)) {
    return NextResponse.redirect(new URL("/verify-email", req.url))
  }

  const studentProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/achievements") ||
    pathname.startsWith("/materials") ||
    pathname.startsWith("/training") ||
    pathname.startsWith("/change-password")

  if (studentProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isCourseLearnPath(pathname) && !token) {
    const login = new URL("/login", req.url)
    login.searchParams.set("next", "/courses")
    return NextResponse.redirect(login)
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
    if (unverifiedStudent) {
      return NextResponse.redirect(new URL("/verify-email", req.url))
    }
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
    "/verify-email",
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
