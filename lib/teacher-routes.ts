import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  BookOpen,
  ListOrdered,
  Users,
  ClipboardCheck,
  FileText,
  CalendarDays,
} from "lucide-react"

export const TEACHER_ORG_ID_STORAGE_KEY = "spherex:teacher-org-id"
export const TEACHER_ORG_SLUG_STORAGE_KEY = "spherex:teacher-org-slug"

export function getTeacherOrgSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/teacher\/([^/]+)/)
  if (!match?.[1] || match[1] === "join") return null
  return match[1]
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

export function isTeacherNavHrefActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  const slug = getTeacherOrgSlugFromPath(href)
  if (slug) {
    if (href === teacherRoute(slug)) return pathname === href
    return pathname.startsWith(`${href}/`) || pathname === href
  }
  if (href === "/teacher") return pathname === "/teacher"
  return pathname.startsWith(`${href}/`)
}
