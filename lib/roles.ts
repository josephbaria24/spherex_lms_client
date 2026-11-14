export type AppRole = "admin" | "teacher" | "student" | "user"
export type TeachingField = "ielts" | "courses"

export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  USER: "user",
} as const satisfies Record<string, AppRole>

export const TEACHING_FIELDS = {
  IELTS: "ielts",
  COURSES: "courses",
} as const satisfies Record<string, TeachingField>

/** Full platform administration (users, course CRUD, analytics, uploads). */
export function isAdmin(role?: string | null): boolean {
  return role === ROLES.ADMIN
}

export function isTeacher(role?: string | null): boolean {
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

export function isIeltsTeacher(
  role?: string | null,
  teachingField?: string | null,
): boolean {
  return isTeacher(role) && teachingField === TEACHING_FIELDS.IELTS
}

export function isCoursesTeacher(
  role?: string | null,
  teachingField?: string | null,
): boolean {
  return isTeacher(role) && teachingField !== TEACHING_FIELDS.IELTS
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

export function teachingFieldLabel(field?: string | null): string {
  if (field === TEACHING_FIELDS.IELTS) return "IELTS"
  if (field === TEACHING_FIELDS.COURSES) return "Courses"
  return "—"
}
