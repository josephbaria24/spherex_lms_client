export const COURSE_CARD_THEMES = [
  "coral",
  "sunflower",
  "sage",
  "mint",
  "sky",
  "lilac",
] as const

export type CourseCardTheme = (typeof COURSE_CARD_THEMES)[number]

export const DEFAULT_COURSE_CARD_THEME: CourseCardTheme = "sage"

/** Maps legacy cube theme ids saved before the palette refresh. */
const LEGACY_THEME_MAP: Record<string, CourseCardTheme> = {
  "cubes-emerald": "sage",
  "cubes-sky": "sky",
  "cubes-violet": "lilac",
  "cubes-amber": "sunflower",
  "cubes-rose": "coral",
  "cubes-slate": "sage",
}

export type CourseCardThemeOption = {
  id: CourseCardTheme
  label: string
  background: string
  blobA: string
  blobB: string
  blobC: string
  panelClass: string
  labelClass: string
}

export const COURSE_CARD_THEME_OPTIONS: CourseCardThemeOption[] = [
  {
    id: "coral",
    label: "Coral",
    background: "#FF6B5B",
    blobA: "bg-[#ff8f82]/70",
    blobB: "bg-[#e85a4a]/55",
    blobC: "bg-[#ffb4ab]/45",
    panelClass: "bg-white/92",
    labelClass: "text-white",
  },
  {
    id: "sunflower",
    label: "Sunflower",
    background: "#FFD166",
    blobA: "bg-[#ffe08a]/75",
    blobB: "bg-[#f5b84a]/50",
    blobC: "bg-[#fff0b3]/55",
    panelClass: "bg-white/92",
    labelClass: "text-foreground",
  },
  {
    id: "sage",
    label: "Sage",
    background: "#A8C0B0",
    blobA: "bg-[#bfd4c6]/70",
    blobB: "bg-[#8fa899]/50",
    blobC: "bg-[#d4e4da]/55",
    panelClass: "bg-white/92",
    labelClass: "text-foreground",
  },
  {
    id: "mint",
    label: "Mint",
    background: "#DCF7A1",
    blobA: "bg-[#eafcb8]/80",
    blobB: "bg-[#c8eb7a]/55",
    blobC: "bg-[#f4fde0]/65",
    panelClass: "bg-white/92",
    labelClass: "text-foreground",
  },
  {
    id: "sky",
    label: "Sky",
    background: "#7EC8E3",
    blobA: "bg-[#a5dbf0]/70",
    blobB: "bg-[#5eb3d4]/50",
    blobC: "bg-[#c8ebf7]/55",
    panelClass: "bg-white/92",
    labelClass: "text-foreground",
  },
  {
    id: "lilac",
    label: "Lilac",
    background: "#C4B5FD",
    blobA: "bg-[#d8ccff]/75",
    blobB: "bg-[#a78bfa]/50",
    blobC: "bg-[#ebe4ff]/60",
    panelClass: "bg-white/92",
    labelClass: "text-foreground",
  },
]

export function normalizeCourseCardTheme(value: string | null | undefined): CourseCardTheme {
  if (!value) return DEFAULT_COURSE_CARD_THEME
  if (COURSE_CARD_THEMES.includes(value as CourseCardTheme)) {
    return value as CourseCardTheme
  }
  return LEGACY_THEME_MAP[value] ?? DEFAULT_COURSE_CARD_THEME
}

export function getCourseCardThemeOption(theme: CourseCardTheme): CourseCardThemeOption {
  const normalized = normalizeCourseCardTheme(theme)
  return (
    COURSE_CARD_THEME_OPTIONS.find((option) => option.id === normalized) ??
    COURSE_CARD_THEME_OPTIONS[0]
  )
}
