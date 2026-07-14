import type { LucideIcon } from "lucide-react"
import { LayoutDashboard, BookOpen, Users, Settings } from "lucide-react"

export const ORG_ID_STORAGE_KEY = "spherex:selected-org-id"
export const ORG_SLUG_STORAGE_KEY = "spherex:selected-org-slug"

const ORG_LEGACY_SUBPATHS = new Set(["members", "courses", "settings"])

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1)
  return path
}

export function getOrgSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/org\/([^/]+)/)
  if (!match?.[1]) return null
  if (ORG_LEGACY_SUBPATHS.has(match[1])) return null
  return match[1]
}

export function getOrgLegacySubpath(pathname: string): string | null {
  const path = normalizePath(pathname)
  if (path === "/org") return ""
  const match = path.match(/^\/org\/(members|courses|settings)$/)
  return match ? `/${match[1]}` : null
}

export function orgRoute(orgSlug: string, subpath = ""): string {
  const suffix = subpath ? (subpath.startsWith("/") ? subpath : `/${subpath}`) : ""
  return `/org/${orgSlug}${suffix}`
}

export function getOrgSubpath(pathname: string, orgSlug: string): string {
  const prefix = `/org/${orgSlug}`
  const path = normalizePath(pathname)
  if (!path.startsWith(prefix)) return ""
  return path.slice(prefix.length) || ""
}

export type OrgNavItem = {
  label: string
  icon: LucideIcon
  href: string
}

export function buildOrgAdminNav(orgSlug: string): OrgNavItem[] {
  return [
    { label: "Dashboard", icon: LayoutDashboard, href: orgRoute(orgSlug) },
    { label: "Members", icon: Users, href: orgRoute(orgSlug, "members") },
    { label: "Courses", icon: BookOpen, href: orgRoute(orgSlug, "courses") },
    { label: "Settings", icon: Settings, href: orgRoute(orgSlug, "settings") },
  ]
}

/** Fallback when org slug is not in the URL yet — `/org` redirects to the active org. */
export const orgAdminNavFallback: OrgNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/org" },
  { label: "Members", icon: Users, href: "/org" },
  { label: "Courses", icon: BookOpen, href: "/org" },
  { label: "Settings", icon: Settings, href: "/org" },
]

export function isOrgNavHrefActive(pathname: string, href: string): boolean {
  const path = normalizePath(pathname)
  const link = normalizePath(href)

  const pathSlug = getOrgSlugFromPath(path)
  const hrefSlug = getOrgSlugFromPath(link)

  if (pathSlug && hrefSlug) {
    if (pathSlug !== hrefSlug) return false
    const pathSub = getOrgSubpath(path, pathSlug)
    const hrefSub = getOrgSubpath(link, hrefSlug)
    if (hrefSub === "") return pathSub === ""
    return pathSub === hrefSub || pathSub.startsWith(`${hrefSub}/`)
  }

  const pathLegacy = getOrgLegacySubpath(path)
  const hrefLegacy = getOrgLegacySubpath(link)

  if (pathLegacy !== null && hrefLegacy !== null) {
    if (hrefLegacy === "") return pathLegacy === ""
    return pathLegacy === hrefLegacy || pathLegacy.startsWith(`${hrefLegacy}/`)
  }

  // Slug-scoped pathname with legacy flat href (e.g. /org/petrosphere/members vs /org/members)
  if (pathSlug && hrefLegacy !== null) {
    const pathSub = getOrgSubpath(path, pathSlug)
    if (hrefLegacy === "") return pathSub === ""
    return pathSub === hrefLegacy || pathSub.startsWith(`${hrefLegacy}/`)
  }

  if (link === "/org") {
    return path === "/org" || (pathSlug !== null && getOrgSubpath(path, pathSlug) === "")
  }

  return false
}

export function isOrgAdminPath(pathname: string): boolean {
  return pathname === "/org" || pathname.startsWith("/org/")
}
