import { apiGet } from "@/lib/api"
import type { AuthUser } from "@/lib/api"
import { orgRoute, ORG_SLUG_STORAGE_KEY } from "@/lib/org-routes"

type OrgSummary = { slug: string }

export async function fetchOrgAdminOrganizations(): Promise<OrgSummary[]> {
  const data = await apiGet<{ organizations: OrgSummary[] }>("/org-admin/mine")
  return data.organizations ?? []
}

export function pickOrgAdminHomeSlug(organizations: OrgSummary[]): string | null {
  if (organizations.length === 0) return null
  if (typeof window !== "undefined") {
    const storedSlug = localStorage.getItem(ORG_SLUG_STORAGE_KEY)
    if (storedSlug && organizations.some((o) => o.slug === storedSlug)) {
      return storedSlug
    }
  }
  return organizations[0]!.slug
}

/** Default landing path after sign-in (org admin portal takes priority over teacher). */
export async function resolveAppHomePath(user: AuthUser): Promise<string> {
  if (user.role === "admin") return "/admin"

  try {
    const organizations = await fetchOrgAdminOrganizations()
    const slug = pickOrgAdminHomeSlug(organizations)
    if (slug) return orgRoute(slug)
  } catch {
    /* not an org admin */
  }

  if (user.role === "teacher") return "/teacher"
  return "/dashboard"
}

export function orgAdminHomeFromStorage(): string {
  const slug = typeof window !== "undefined" ? localStorage.getItem(ORG_SLUG_STORAGE_KEY) : null
  return slug ? orgRoute(slug) : "/org"
}
