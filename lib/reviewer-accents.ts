export const REVIEWER_ACCENTS = [
  "coral",
  "indigo",
  "amber",
  "emerald",
  "rose",
  "sky",
  "violet",
  "slate",
] as const

export type ReviewerAccent = (typeof REVIEWER_ACCENTS)[number]

export type ReviewerAccentStyles = {
  label: string
  card: string
  header: string
  badge: string
  chip: string
  button: string
  ring: string
  soft: string
  swatch: string
}

export const REVIEWER_ACCENT_STYLES: Record<ReviewerAccent, ReviewerAccentStyles> = {
  coral: {
    label: "Coral",
    card: "border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-rose-50/40 dark:border-orange-900/50 dark:from-orange-950/40 dark:via-card dark:to-rose-950/20",
    header: "from-orange-500/90 to-rose-500/80",
    badge: "bg-orange-600 text-white hover:bg-orange-600",
    chip: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800",
    button: "bg-orange-600 hover:bg-orange-700 text-white",
    ring: "ring-orange-200 dark:ring-orange-800",
    soft: "text-orange-700 dark:text-orange-300",
    swatch: "bg-gradient-to-br from-orange-400 to-rose-500",
  },
  indigo: {
    label: "Indigo",
    card: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-card dark:to-slate-950/40",
    header: "from-indigo-600/90 to-blue-500/80",
    badge: "bg-indigo-600 text-white hover:bg-indigo-600",
    chip: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-800",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white",
    ring: "ring-indigo-200 dark:ring-indigo-800",
    soft: "text-indigo-700 dark:text-indigo-300",
    swatch: "bg-gradient-to-br from-indigo-500 to-blue-500",
  },
  amber: {
    label: "Amber",
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-yellow-50/50 dark:border-amber-900/50 dark:from-amber-950/40 dark:via-card dark:to-yellow-950/20",
    header: "from-amber-500/90 to-yellow-500/80",
    badge: "bg-amber-600 text-white hover:bg-amber-600",
    chip: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
    ring: "ring-amber-200 dark:ring-amber-800",
    soft: "text-amber-800 dark:text-amber-300",
    swatch: "bg-gradient-to-br from-amber-400 to-yellow-500",
  },
  emerald: {
    label: "Emerald",
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-card dark:to-teal-950/20",
    header: "from-emerald-600/90 to-teal-500/80",
    badge: "bg-emerald-600 text-white hover:bg-emerald-600",
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    soft: "text-emerald-700 dark:text-emerald-300",
    swatch: "bg-gradient-to-br from-emerald-500 to-teal-500",
  },
  rose: {
    label: "Rose",
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-pink-50/40 dark:border-rose-900/50 dark:from-rose-950/40 dark:via-card dark:to-pink-950/20",
    header: "from-rose-500/90 to-pink-500/80",
    badge: "bg-rose-600 text-white hover:bg-rose-600",
    chip: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800",
    button: "bg-rose-600 hover:bg-rose-700 text-white",
    ring: "ring-rose-200 dark:ring-rose-800",
    soft: "text-rose-700 dark:text-rose-300",
    swatch: "bg-gradient-to-br from-rose-500 to-pink-500",
  },
  sky: {
    label: "Sky",
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50/40 dark:border-sky-900/50 dark:from-sky-950/40 dark:via-card dark:to-cyan-950/20",
    header: "from-sky-500/90 to-cyan-500/80",
    badge: "bg-sky-600 text-white hover:bg-sky-600",
    chip: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-200 dark:border-sky-800",
    button: "bg-sky-600 hover:bg-sky-700 text-white",
    ring: "ring-sky-200 dark:ring-sky-800",
    soft: "text-sky-700 dark:text-sky-300",
    swatch: "bg-gradient-to-br from-sky-400 to-cyan-500",
  },
  violet: {
    label: "Violet",
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/30 dark:border-violet-900/50 dark:from-violet-950/40 dark:via-card dark:to-fuchsia-950/20",
    header: "from-violet-600/90 to-fuchsia-500/70",
    badge: "bg-violet-600 text-white hover:bg-violet-600",
    chip: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800",
    button: "bg-violet-600 hover:bg-violet-700 text-white",
    ring: "ring-violet-200 dark:ring-violet-800",
    soft: "text-violet-700 dark:text-violet-300",
    swatch: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
  },
  slate: {
    label: "Slate",
    card: "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100/60 dark:border-border dark:from-slate-900/60 dark:via-card dark:to-slate-900/40",
    header: "from-slate-600/90 to-slate-500/80",
    badge: "bg-slate-700 text-white hover:bg-slate-700",
    chip: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-muted dark:text-slate-200 dark:border-border",
    button: "bg-slate-700 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
    ring: "ring-slate-200 dark:ring-slate-700",
    soft: "text-slate-700 dark:text-slate-300",
    swatch: "bg-gradient-to-br from-slate-500 to-slate-700",
  },
}

export function getReviewerAccent(color?: string | null): ReviewerAccentStyles {
  if (color && color in REVIEWER_ACCENT_STYLES) {
    return REVIEWER_ACCENT_STYLES[color as ReviewerAccent]
  }
  return REVIEWER_ACCENT_STYLES.slate
}
