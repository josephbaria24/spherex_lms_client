export const COURSE_CATEGORIES = [
  "OSH / Workplace Safety",
  "Healthcare / First Aid",
  "IELTS Preparation",
  "Soft Skills",
  "Technical Training",
] as const

export type CourseCategoryOption = (typeof COURSE_CATEGORIES)[number]

export const COURSE_CATEGORY_OTHER = "__other__"
