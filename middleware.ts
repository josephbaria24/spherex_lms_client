import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/api-config"
import { canAccessAdminPanel, canAccessTeacherPanel, isStudent } from "@/lib/roles"
import { getSessionClaims } from "@/lib/session-token"

const IELTS_ANSWER_KEY_PATHS = new Set([
  "/ielts-academic/academic-listening-answers.pdf",
  "/ielts-academic/academic-reading-answers.pdf",
  "/ielts-academic/academic-writing-examples.pdf",
])

const IELTS_MOCK_PATHS = new Set([
  "/ielts-academic/academic-mock-1-questions.pdf",
  "/ielts-academic/academic-mock-2-questions.pdf",
  "/ielts-academic/academic-mock-2-listening.mp3",
  "/ielts-academic/academic-mock-3-questions.pdf",
  "/ielts-academic/academic-mock-3-listening.mp3",
  "/ielts-academic/academic-mock-4-questions.pdf",
  "/ielts-academic/academic-mock-4-listening.mp3",
  "/ielts-academic/academic-mock-5-questions.pdf",
  "/ielts-academic/academic-mock-5-listening.mp3",
])

function isCourseLearnPath(pathname: string) {
  return /^\/courses\/[^/]+\/learn(?:\/|$)/.test(pathname)
}

function isPublicCatalogPath(pathname: string) {
  if (pathname === "/courses") return true
  if (pathname.startsWith("/courses/") && !isCourseLearnPath(pathname)) return true
  return false
}

const IELTS_MOCK_PATH_TO_ID: Record<string, string> = {
  "/ielts-academic/academic-mock-1-questions.pdf": "mock-1",
  "/ielts-academic/academic-mock-2-questions.pdf": "mock-2",
  "/ielts-academic/academic-mock-2-listening.mp3": "mock-2",
  "/ielts-academic/academic-mock-3-questions.pdf": "mock-3",
  "/ielts-academic/academic-mock-3-listening.mp3": "mock-3",
  "/ielts-academic/academic-mock-4-questions.pdf": "mock-4",
  "/ielts-academic/academic-mock-4-listening.mp3": "mock-4",
  "/ielts-academic/academic-mock-5-questions.pdf": "mock-5",
  "/ielts-academic/academic-mock-5-listening.mp3": "mock-5",
}

async function ieltsCatalogFlags(req: NextRequest) {
  try {
    const flagUrl = new URL("/api/lms/reviewers/ielts/answer-keys", req.nextUrl.origin)
    const res = await fetch(flagUrl, { cache: "no-store" })
    if (!res.ok) {
      return { show_answer_keys: false, mock_session_open: false, open_mock_ids: [] as string[] }
    }
    const data = (await res.json()) as {
      show_answer_keys?: boolean
      mock_session_open?: boolean
      open_mock_ids?: string[]
    }
    return {
      show_answer_keys: data.show_answer_keys === true,
      mock_session_open: data.mock_session_open === true,
      open_mock_ids: Array.isArray(data.open_mock_ids) ? data.open_mock_ids : [],
    }
  } catch {
    return { show_answer_keys: false, mock_session_open: false, open_mock_ids: [] as string[] }
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const pathname = req.nextUrl.pathname

  if (IELTS_ANSWER_KEY_PATHS.has(pathname) || IELTS_MOCK_PATHS.has(pathname)) {
    const role = token ? getSessionClaims(token).role : null
    if (canAccessTeacherPanel(role)) return NextResponse.next()
    const flags = await ieltsCatalogFlags(req)
    if (IELTS_ANSWER_KEY_PATHS.has(pathname)) {
      if (flags.show_answer_keys) return NextResponse.next()
      return new NextResponse(null, { status: 404 })
    }
    const mockId = IELTS_MOCK_PATH_TO_ID[pathname]
    const allowed =
      flags.mock_session_open &&
      Boolean(mockId) &&
      (flags.open_mock_ids.length === 0 || flags.open_mock_ids.includes(mockId))
    if (allowed) return NextResponse.next()
    return new NextResponse(null, { status: 404 })
  }
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
    "/ielts-academic/academic-listening-answers.pdf",
    "/ielts-academic/academic-reading-answers.pdf",
    "/ielts-academic/academic-writing-examples.pdf",
    "/ielts-academic/academic-mock-1-questions.pdf",
    "/ielts-academic/academic-mock-2-questions.pdf",
    "/ielts-academic/academic-mock-2-listening.mp3",
    "/ielts-academic/academic-mock-3-questions.pdf",
    "/ielts-academic/academic-mock-3-listening.mp3",
    "/ielts-academic/academic-mock-4-questions.pdf",
    "/ielts-academic/academic-mock-4-listening.mp3",
    "/ielts-academic/academic-mock-5-questions.pdf",
    "/ielts-academic/academic-mock-5-listening.mp3",
  ],
}
