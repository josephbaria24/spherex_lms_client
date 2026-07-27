import { cn } from "@/lib/utils"

interface IconProps {
  className?: string
}

export function HatIcon({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M2.652 14.714V9.78" />
      <path d="M5.832 11.85l4.049 2.667a4 4 0 0 0 4.402 0l4.049-2.668" />
      <path d="M5.832 11.85L3.099 10.05a.99.99 0 0 1-.45-.815" />
      <path d="M5.832 11.85v5.061c0 .495.119.987.44 1.364c.747.877 2.514 2.39 5.81 2.39s5.063-1.513 5.81-2.39c.32-.377.44-.869.44-1.364V11.85" />
      <path d="M18.332 11.85l2.48-1.634a1.2 1.2 0 0 0 0-2.004l-6.53-4.302a4 4 0 0 0-4.401 0L3.099 8.379a.99.99 0 0 0-.45.855" />
      <path d="M2.649 9.234v.547" />
    </svg>
  )
}
