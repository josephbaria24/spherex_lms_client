export type AppRole = "admin" | "teacher" | "student" | "user"

export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  USER: "user",
} as const satisfies Record<string, AppRole>

/** Full platform administration (users, course CRUD, analytics, uploads). */
export function isAdmin(role?: string | null): role is typeof ROLES.ADMIN {
  return role === ROLES.ADMIN
}

export function isTeacher(role?: string | null): role is typeof ROLES.TEACHER {
  return role === ROLES.TEACHER
}

export function canAccessAdminPanel(role?: string | null): boolean {
  return isAdmin(role)
}

export function canAccessTeacherPanel(role?: string | null): boolean {
  return isTeacher(role) || isAdmin(role)
}

/** True when user has at least one owner/admin organization membership (set in auth provider). */
export function canAccessOrgAdminPanel(
  role?: string | null,
  orgAdminCount?: number,
): boolean {
  return isAdmin(role) || (orgAdminCount ?? 0) > 0
}

export function isStudent(role?: string | null): boolean {
  return role === ROLES.STUDENT || role === ROLES.USER
}

export function roleLabel(role?: string | null): string {
  switch (role) {
    case ROLES.ADMIN:
      return "Administrator"
    case ROLES.TEACHER:
      return "Teacher"
    case ROLES.STUDENT:
      return "Student"
    default:
      return "User"
  }
}
