import type React from "react"
import { cn } from "@/lib/utils"
import { grow } from "@/lib/grow-shell"

type GrowShellProps = {
  children: React.ReactNode
  className?: string
  /** When true, wraps children in grow-bento spacing (default: true) */
  bento?: boolean
  /** Fill the panel and let a child region scroll, instead of scrolling the whole page */
  fill?: boolean
}

/** Grow Shell page canvas — white background with optional bento grid spacing */
export function GrowShell({ children, className, bento = true, fill = false }: GrowShellProps) {
  return (
    <div
      className={cn(
        grow.shell,
        "flex h-full min-h-0 w-full flex-col rounded-t-none rounded-b-[var(--sidebar-float-radius)] bg-white p-4 pb-6 md:p-5 dark:bg-background",
        fill ? "overflow-hidden" : "overflow-y-auto",
        className,
      )}
    >
      {bento ? (
        <div className={cn(grow.bento, fill ? "flex min-h-0 flex-1 flex-col gap-5" : "space-y-5")}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
