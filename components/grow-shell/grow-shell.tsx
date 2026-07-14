import type React from "react"
import { cn } from "@/lib/utils"
import { grow } from "@/lib/grow-shell"

type GrowShellProps = {
  children: React.ReactNode
  className?: string
  /** When true, wraps children in grow-bento spacing (default: true) */
  bento?: boolean
}

/** Grow Shell page canvas — white background with optional bento grid spacing */
export function GrowShell({ children, className, bento = true }: GrowShellProps) {
  return (
    <div
      className={cn(
        grow.shell,
        "flex h-full min-h-0 w-full flex-col overflow-y-auto rounded-[var(--sidebar-float-radius)] bg-white p-4 pb-6 md:p-5 dark:bg-background",
        className,
      )}
    >
      {bento ? <div className={cn(grow.bento, "space-y-5")}>{children}</div> : children}
    </div>
  )
}
