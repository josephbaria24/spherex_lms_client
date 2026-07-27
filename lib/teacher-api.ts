export function teacherApiPath(orgId: string, path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `/teacher/${orgId}${suffix}`
}
