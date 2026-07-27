import type React from "react"
import { cn } from "@/lib/utils"
import { grow } from "@/lib/grow-shell"

type GrowShellProps = {
  children: React.ReactNode
  className?: string
  /** When true, wraps children in grow-bento spacing (default: true) */
  bento?: boolean
  /**
   * `grow` — warm student/teacher canvas
   * `ops` — cool editorial admin console (no cream remaps / pill chrome)
   */
  variant?: "grow" | "ops"
}

/** Grow Shell page canvas — white background with optional bento grid spacing */
export function GrowShell({
  children,
  className,
  bento = true,
  variant = "grow",
}: GrowShellProps) {
  const isOps = variant === "ops"

  return (
    <div
      className={cn(
        grow.shell,
        isOps && "admin-ops",
        "flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden overflow-y-auto rounded-[var(--sidebar-float-radius)]",
        !isOps && "p-4 pb-6 md:p-5",
        isOps
          ? "bg-[#f8f9fa] p-0 dark:bg-background"
          : "bg-white dark:bg-background",
        className,
      )}
    >
      {bento ? (
        <div className={cn(grow.bento, isOps && "admin-ops", "space-y-5", isOps && "p-4 md:p-5")}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
