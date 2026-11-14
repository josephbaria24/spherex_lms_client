import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  BookOpen,
  ListOrdered,
  Users,
  ClipboardCheck,
  FileText,
  CalendarDays,
  BarChart3,
  Mail,
  Award,
  ToggleLeft,
} from "lucide-react"

export const TEACHER_ORG_ID_STORAGE_KEY = "spherex:teacher-org-id"
export const TEACHER_ORG_SLUG_STORAGE_KEY = "spherex:teacher-org-slug"

export function getTeacherOrgSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/teacher\/([^/]+)/)
  if (!match?.[1] || match[1] === "join" || match[1] === "ielts") return null
  return match[1]
}

export function isTeacherIeltsPath(pathname: string): boolean {
  return pathname === "/teacher/ielts" || pathname.startsWith("/teacher/ielts/")
}

export function teacherRoute(orgSlug: string, subpath = ""): string {
  const suffix = subpath ? (subpath.startsWith("/") ? subpath : `/${subpath}`) : ""
  return `/teacher/${orgSlug}${suffix}`
}

export function getTeacherSubpath(pathname: string, orgSlug: string): string {
  const prefix = `/teacher/${orgSlug}`
  if (!pathname.startsWith(prefix)) return ""
  return pathname.slice(prefix.length) || ""
}

export type TeacherNavItem = {
  label: string
  icon: LucideIcon
  href: string
}

export function buildTeacherNav(orgSlug: string): TeacherNavItem[] {
  return [
    { label: "Dashboard", icon: LayoutDashboard, href: teacherRoute(orgSlug) },
    { label: "My Courses", icon: BookOpen, href: teacherRoute(orgSlug, "courses") },
    { label: "Lessons", icon: ListOrdered, href: teacherRoute(orgSlug, "lessons") },
    { label: "Students", icon: Users, href: teacherRoute(orgSlug, "students") },
    { label: "Evaluations", icon: ClipboardCheck, href: teacherRoute(orgSlug, "evaluations") },
    { label: "Materials", icon: FileText, href: teacherRoute(orgSlug, "materials") },
    { label: "Sessions", icon: CalendarDays, href: teacherRoute(orgSlug, "sessions") },
  ]
}

/** Fallback links when org slug is not known yet — `/teacher` redirects to the active org. */
export const teacherNavFallback: TeacherNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/teacher" },
  { label: "My Courses", icon: BookOpen, href: "/teacher" },
  { label: "Lessons", icon: ListOrdered, href: "/teacher" },
  { label: "Students", icon: Users, href: "/teacher" },
  { label: "Evaluations", icon: ClipboardCheck, href: "/teacher" },
  { label: "Materials", icon: FileText, href: "/teacher" },
  { label: "Sessions", icon: CalendarDays, href: "/teacher" },
]

export function isTeacherNavHrefActive(
  pathname: string,
  href: string,
  searchParams?: { get: (key: string) => string | null },
): boolean {
  const [hrefPath, hrefQuery = ""] = href.split("?")
  const hrefView = new URLSearchParams(hrefQuery).get("view")

  if (hrefPath === "/teacher/ielts" || hrefPath.startsWith("/teacher/ielts/")) {
    const onIelts =
      pathname === "/teacher/ielts" || pathname.startsWith("/teacher/ielts/")
    if (!onIelts) return false
    const currentView = searchParams?.get("view")
    const effectiveView = !currentView || currentView === "skills" ? "materials" : currentView
    if (!hrefView) return effectiveView === "materials"
    return effectiveView === hrefView
  }

  if (pathname === href || pathname === hrefPath) return true
  const slug = getTeacherOrgSlugFromPath(hrefPath)
  if (slug) {
    if (hrefPath === teacherRoute(slug)) return pathname === hrefPath
    return pathname.startsWith(`${hrefPath}/`) || pathname === hrefPath
  }
  if (hrefPath === "/teacher") return pathname === "/teacher"
  return pathname.startsWith(`${hrefPath}/`)
}

export function buildIeltsTeacherNav(): TeacherNavItem[] {
  return [
    { label: "Materials", icon: FileText, href: "/teacher/ielts?view=materials" },
    { label: "Learners", icon: Users, href: "/teacher/ielts?view=progress" },
    { label: "Results", icon: BarChart3, href: "/teacher/ielts?view=results" },
    { label: "Session", icon: ToggleLeft, href: "/teacher/ielts?view=session" },
    { label: "Access", icon: ClipboardCheck, href: "/teacher/ielts?view=requests" },
    { label: "Announce", icon: Mail, href: "/teacher/ielts?view=announce" },
    { label: "Certificates", icon: Award, href: "/teacher/ielts?view=progress" },
  ]
}
