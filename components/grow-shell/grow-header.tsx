import type React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { GROW_SHELL } from "@/lib/grow-shell"

type GrowHeaderProps = {
  title: string
  /** Accent phrase appended after an em dash */
  accent?: string
  description?: string
  showDate?: boolean
  icon?: LucideIcon
  compact?: boolean
  /** Hide the date, accent, description, and actions below the md breakpoint */
  denseOnMobile?: boolean
  className?: string
  children?: React.ReactNode
}

/** Grow Shell page header — compact title row with optional brand accent */
export function GrowHeader({
  title,
  accent,
  description,
  showDate = false,
  icon: Icon,
  compact = true,
  denseOnMobile = false,
  className,
  children,
}: GrowHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between",
        denseOnMobile ? "gap-2 md:gap-3" : "gap-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center bg-[#FFE8E0] text-[#FF4B1A] shadow-sm",
              compact ? "h-9 w-9 rounded-xl" : "h-10 w-10 rounded-xl",
            )}
          >
            <Icon className="h-4 w-4 stroke-[1.5]" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-0.5">
          {showDate ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:border-border dark:bg-card",
                denseOnMobile && "hidden md:inline-flex",
              )}
            >
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : null}
          <h1
            className={cn(
              "font-bold tracking-[-0.03em] text-neutral-950 dark:text-foreground",
              denseOnMobile
                ? "text-lg md:text-xl"
                : compact
                  ? "text-lg md:text-xl"
                  : "text-xl md:text-2xl",
            )}
          >
            {title}
            {accent ? (
              <span className={cn("font-medium text-neutral-400 dark:text-neutral-500", denseOnMobile && "hidden md:inline")}>
                {" — "}
                <span style={{ color: GROW_SHELL.colors.accent }}>{accent}</span>
              </span>
            ) : null}
          </h1>
          {description ? (
            <p
              className={cn(
                "max-w-xl text-sm leading-5 text-neutral-500 dark:text-muted-foreground",
                denseOnMobile && "hidden md:block",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children ? (
        <div className={cn("flex flex-wrap items-center gap-2", denseOnMobile && "hidden md:flex")}>
          {children}
        </div>
      ) : null}
    </header>
  )
}
