import { apiGet, apiPost, authMe } from "@/lib/api"
import { fetchOrgAdminOrganizations, pickOrgAdminHomeSlug } from "@/lib/home-route"
import { hasTeachingOrganization } from "@/lib/org-membership"
import type { OrgMembership } from "@/lib/org-types"
import { orgRoute } from "@/lib/org-routes"
import { isStudent } from "@/lib/roles"

const AUTH_NEXT_KEY = "spherex:auth:next"

function isSafeInternalPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://")
}

function rememberNext(path?: string) {
  if (typeof window === "undefined" || !path || !isSafeInternalPath(path)) return
  try {
    sessionStorage.setItem(AUTH_NEXT_KEY, path)
  } catch {
    /* ignore quota / private mode */
  }
}

function consumeNext(): string | null {
  if (typeof window === "undefined") return null
  try {
    const path = sessionStorage.getItem(AUTH_NEXT_KEY)
    sessionStorage.removeItem(AUTH_NEXT_KEY)
    return path && isSafeInternalPath(path) ? path : null
  } catch {
    return null
  }
}

export async function completeAuthSession(options?: {
  teacherOrgCode?: string
  studentOrgCode?: string
  next?: string
}) {
  rememberNext(options?.next)

  if (options?.teacherOrgCode?.trim()) {
    await apiPost("/organizations/join", { code: options.teacherOrgCode.trim() })
  }
  if (options?.studentOrgCode?.trim()) {
    await apiPost("/organizations/join/student", { code: options.studentOrgCode.trim() })
  }

  const { user } = await authMe()

  if (user.must_change_password) {
    window.location.href = "/change-password"
    return
  }

  if (isStudent(user.role) && user.email_verified === false) {
    window.location.href = "/verify-email"
    return
  }

  const next = consumeNext()
  if (next && isStudent(user.role)) {
    window.location.href = next
    return
  }

  const memberships = await apiGet<{ memberships: OrgMembership[] }>("/organizations/me")
  const teachingOrg = hasTeachingOrganization(memberships.memberships ?? [])

  if (user.role === "admin") {
    window.location.href = "/admin"
    return
  }

  try {
    const list = await fetchOrgAdminOrganizations()
    const slug = pickOrgAdminHomeSlug(list)
    if (slug) {
      window.location.href = orgRoute(slug)
      return
    }
  } catch {
    /* not an org admin */
  }

  if (user.role === "teacher" || teachingOrg) {
    window.location.href = teachingOrg ? "/teacher" : "/teacher/join"
    return
  }

  window.location.href = "/dashboard"
}
