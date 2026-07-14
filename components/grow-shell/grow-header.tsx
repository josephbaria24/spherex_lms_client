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
  className,
  children,
}: GrowHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        {Icon ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/50 bg-white/40 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10">
            <Icon className="h-6 w-6 text-[#5c4d8a] dark:text-violet-200" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-2">
          {showDate ? (
            <span className="inline-flex items-center rounded-full border border-[#e8dfd3] bg-white/70 px-3 py-1 text-xs font-medium text-[#6b5c4f] dark:border-border dark:bg-card">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-[#1c1917] dark:text-foreground sm:text-4xl">
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
