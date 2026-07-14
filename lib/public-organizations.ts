import { apiGet } from "@/lib/api"
import type { OrgLogoAppearance } from "@/components/org/org-logo"

export type PublicOrganization = OrgLogoAppearance & {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  website: string | null
  industry: string | null
  status: "pending" | "active" | "suspended"
  member_count: number
  course_count: number
  brand_primary?: string | null
  created_at?: string
}

export type PublicOrganizationCourse = {
  id: string
  title: string
  description: string | null
  category: string | null
  level: string | null
  duration: string | null
  lessons: number
  enrolled_count: number
  thumbnail: string | null
  image: string | null
}

export function isOrgCatalogLive(status: PublicOrganization["status"]) {
  return status === "active"
}

export function orgStatusLabel(status: PublicOrganization["status"]) {
  return status === "active" ? "Active" : status === "pending" ? "Coming soon" : "Unavailable"
}

export async function fetchPublicOrganizations() {
  return apiGet<{ organizations: PublicOrganization[] }>("/organizations/public")
}

export async function fetchPublicOrganization(slug: string) {
  return apiGet<{ organization: PublicOrganization; courses: PublicOrganizationCourse[] }>(
    `/organizations/public/${encodeURIComponent(slug)}`,
  )
}
