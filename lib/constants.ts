// Application constants

export const APP_NAME = "PetroCademia"
export const APP_DESCRIPTION = "PetroCademia — professional training and e-learning platform"

/** Primary PetroCademia mark — icon only, no wordmark */
export const APP_LOGO = "/PetroCademia%20logo%20only.png"
/** @deprecated Prefer APP_LOGO — kept for older imports */
export const SPHEREX_LOGO_LIGHT = APP_LOGO
/** @deprecated Prefer APP_LOGO — kept for older imports */
export const SPHEREX_LOGO_DARK = APP_LOGO

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
