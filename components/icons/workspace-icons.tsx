import { cn } from "@/lib/utils"

const ROW_ICON = "h-[22px] w-[22px] shrink-0 text-[#64748b]"

export function CourseModuleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(ROW_ICON, className)} fill="none" aria-hidden>
      <path
        d="M5 7.5 12 4.5l7 3v9l-7 3-7-3v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <path
        d="M8 9.5 12 7.5l4 2v6l-4 2-4-2v-6Z"
        fill="currentColor"
        opacity="0.18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.5v11M8 9.5l4 2 4-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CourseSafetyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(ROW_ICON, className)} fill="none" aria-hidden>
      <path
        d="M12 3.5 18.5 6.75V12c0 3.2-2.4 5.8-6.5 7.25C7.9 17.8 5.5 15.2 5.5 12V6.75L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <path
        d="M12 3.5 18.5 6.75V12c0 3.2-2.4 5.8-6.5 7.25C7.9 17.8 5.5 15.2 5.5 12V6.75L12 3.5Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M9.2 12.1 11 13.9l3.8-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CourseIndustrialIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(ROW_ICON, className)} fill="none" aria-hidden>
      <path
        d="M4.5 12h15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <rect
        x="9"
        y="8.5"
        width="6"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        opacity="0.12"
      />
      <path d="M12 8.5V6.5M10 6.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="12" r="1.6" fill="currentColor" opacity="0.55" />
      <circle cx="17" cy="12" r="1.6" fill="currentColor" opacity="0.55" />
    </svg>
  )
}

export function CourseLeadershipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn(ROW_ICON, className)} fill="none" aria-hidden>
      <circle cx="12" cy="7.5" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="16" r="2" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="16" r="2" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 10v3.2M12 13.2 8.2 14.8M12 13.2l3.8 1.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  )
}

export function CourseRowIcon({ category }: { category?: string | null }) {
  const key = (category ?? "").toLowerCase()
  if (key.includes("safety") || key.includes("hse")) return <CourseSafetyIcon />
  if (
    key.includes("oil") ||
    key.includes("gas") ||
    key.includes("industrial") ||
    key.includes("operations")
  ) {
    return <CourseIndustrialIcon />
  }
  if (key.includes("leadership") || key.includes("management") || key.includes("soft")) {
    return <CourseLeadershipIcon />
  }
  return <CourseModuleIcon />
}
