import type { OrgMembership } from "@/lib/org-types"

const TEACHING_ROLES = new Set(["owner", "admin", "teacher"])

export function hasTeachingOrganization(memberships: OrgMembership[]): boolean {
  return memberships.some((m) => TEACHING_ROLES.has(m.role))
}

export function getTeachingMemberships(memberships: OrgMembership[]): OrgMembership[] {
  return memberships.filter((m) => TEACHING_ROLES.has(m.role))
}

export function hasStudentOrganization(memberships: OrgMembership[]): boolean {
  return memberships.some((m) => m.role === "student")
}

export function getStudentMemberships(memberships: OrgMembership[]): OrgMembership[] {
  return memberships.filter((m) => m.role === "student")
}

export function hasAnyOrganization(memberships: OrgMembership[]): boolean {
  return memberships.length > 0
}
