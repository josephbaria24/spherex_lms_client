// Application constants

export const APP_NAME = "SphereX"
export const APP_DESCRIPTION = "SphereX LMS — professional training and e-learning platform"

/** Dark logo mark for light backgrounds */
export const SPHEREX_LOGO_LIGHT = "/spx.png"
/** Light logo mark for dark backgrounds */
export const SPHEREX_LOGO_DARK = "/spxwhite.png"

export const COURSE_CATEGORIES = [
  "Technical Skills",
  "Soft Skills",
  "Language Learning",
  "Professional Development",
  "Safety & Compliance",
  "Leadership",
] as const

export const MATERIAL_TYPES = ["EILTS", "TOEFL", "Technical", "Soft Skills", "Other"] as const

export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const

export const TRAINING_STATUS = ["upcoming", "ongoing", "completed", "cancelled"] as const
