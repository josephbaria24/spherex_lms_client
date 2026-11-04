import type { Course } from "@/lib/types"

export type CatalogTrackId = "ielts" | "osh" | "reviewers"

export function isOshCourse(course: Pick<Course, "title" | "category" | "description">) {
  const hay = `${course.category} ${course.title} ${course.description}`.toLowerCase()
  return /\b(osh|hse|dole|bosh|cosh|safety)\b/.test(hay)
}

export function isIeltsCourse(course: Pick<Course, "title" | "category" | "description">) {
  const hay = `${course.category} ${course.title} ${course.description}`.toLowerCase()
  return hay.includes("ielts")
}
