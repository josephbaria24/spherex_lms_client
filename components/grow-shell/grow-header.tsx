import type React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { GROW_SHELL } from "@/lib/grow-shell"

type GrowHeaderProps = {
  title: string
  /** Serif italic accent phrase appended after an em dash */
  accent?: string
  description?: string
  showDate?: boolean
  icon?: LucideIcon
  compact?: boolean
  className?: string
  children?: React.ReactNode
}

/** Grow Shell page header — date pill, bold title, coral serif accent */
export function GrowHeader({
  title,
  accent,
  description,
  showDate = true,
  icon: Icon,
  compact = false,
  className,
  children,
}: GrowHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-end sm:justify-between",
        compact ? "gap-3" : "gap-4",
        className,
      )}
    >
      <div className={cn("flex min-w-0 items-start", compact ? "gap-3" : "gap-4")}>
        {Icon ? (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center border border-white/50 bg-white/40 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10",
              compact ? "h-10 w-10 rounded-lg" : "h-14 w-14 rounded-2xl",
            )}
          >
            <Icon className={cn(compact ? "h-5 w-5" : "h-6 w-6", "text-[#5c4d8a] dark:text-violet-200")} />
          </div>
        ) : null}
        <div className={cn("min-w-0", compact ? "space-y-0.5" : "space-y-2")}>
          {showDate ? (
            <span className="inline-flex items-center rounded-full border border-[#e8dfd3] bg-white/70 px-3 py-1 text-xs font-medium text-[#6b5c4f] dark:border-border dark:bg-card">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : null}
          <h1
            className={cn(
              "font-bold tracking-tight text-[#1c1917] dark:text-foreground",
              compact ? "text-2xl" : "text-3xl sm:text-4xl",
            )}
          >
            {title}
            {accent ? (
              <>
                {" — "}
                <span
                  className="font-serif italic"
                  style={{ color: GROW_SHELL.colors.accent }}
                >
                  {accent}
                </span>
              </>
            ) : null}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-[#6b5c4f] dark:text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className="flex flex-wrap gap-2">{children}</div>
      ) : null}
    </header>
  )
}
