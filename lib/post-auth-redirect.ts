import { apiGet, apiPost, authMe } from "@/lib/api"
import { fetchOrgAdminOrganizations, pickOrgAdminHomeSlug } from "@/lib/home-route"
import { hasTeachingOrganization } from "@/lib/org-membership"
import type { OrgMembership } from "@/lib/org-types"
import { orgRoute } from "@/lib/org-routes"

export async function completeAuthSession(options?: {
  teacherOrgCode?: string
  studentOrgCode?: string
}) {
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
