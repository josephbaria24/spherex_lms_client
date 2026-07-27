export type OrgMemberRole = "owner" | "admin" | "teacher" | "student"

export type OrgAdminOrganization = {
  id: string
  name: string
  slug: string
  logo: string | null
  status: string
  industry: string | null
  teacher_join_code?: string
  role: OrgMemberRole | string
  brand_primary?: string | null
  brand_accent?: string | null
  logo_padding?: number | null
  logo_position_x?: number | null
  logo_position_y?: number | null
  max_members?: number | null
}

export type OrgMembership = {
  id: string
  organization_id: string
  user_id: string
  role: OrgMemberRole
  joined_at: string
  organization: {
    id: string
    name: string
    slug: string
    logo: string | null
    status: string
    industry: string | null
    brand_primary?: string | null
    logo_padding?: number | null
    logo_position_x?: number | null
    logo_position_y?: number | null
  }
}

export type OrgMember = {
  id: string
  role: OrgMemberRole
  joined_at: string
  user_id: string
  email: string
  full_name: string | null
  name: string | null
  platform_role: string
  status: string
}
