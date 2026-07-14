import { apiGet } from "@/lib/api"
import { getTeachingMemberships } from "@/lib/org-membership"
import type { OrgMembership } from "@/lib/org-types"

type AdminOrganizationRow = {
  id: string
  name: string
  slug: string
  logo?: string | null
  status: string
  industry?: string | null
  brand_primary?: string | null
  logo_padding?: number | null
  logo_position_x?: number | null
  logo_position_y?: number | null
}

export function adminOrgsToTeachingMemberships(orgs: AdminOrganizationRow[]): OrgMembership[] {
  return orgs.map((org) => ({
    id: `platform-admin-${org.id}`,
    organization_id: org.id,
    user_id: "",
    role: "owner",
    joined_at: new Date().toISOString(),
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo ?? null,
      status: org.status,
      industry: org.industry ?? null,
      brand_primary: org.brand_primary ?? null,
      logo_padding: org.logo_padding ?? null,
      logo_position_x: org.logo_position_x ?? null,
      logo_position_y: org.logo_position_y ?? null,
    },
  }))
}

/** Orgs the user can access in the teacher workspace (memberships or all orgs for platform admin). */
export async function fetchTeacherWorkspaceOrgs(isPlatformAdmin: boolean): Promise<OrgMembership[]> {
  if (isPlatformAdmin) {
    const data = await apiGet<{ organizations: AdminOrganizationRow[] }>("/admin/organizations")
    return adminOrgsToTeachingMemberships(data.organizations ?? [])
  }
  const data = await apiGet<{ memberships: OrgMembership[] }>("/organizations/me")
  return getTeachingMemberships(data.memberships ?? [])
}
