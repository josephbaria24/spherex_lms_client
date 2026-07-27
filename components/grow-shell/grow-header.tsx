"use client"

import type React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { GROW_SHELL } from "@/lib/grow-shell"
import { useAuth } from "@/app/provider"

type GrowHeaderProps = {
  title: string
  /** Serif italic accent phrase appended after an em dash (Grow Shell only) */
  accent?: string
  description?: string
  showDate?: boolean
  icon?: LucideIcon
  className?: string
  children?: React.ReactNode
  /**
   * `grow` — coral serif accent, date pill
   * `ops` — Petrosphere-style greeting + date card
   */
  variant?: "grow" | "ops"
}

function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

/** Page header — Grow Shell or editorial ops */
export function GrowHeader({
  title,
  accent,
  description,
  showDate = true,
  icon: Icon,
  className,
  children,
  variant = "grow",
}: GrowHeaderProps) {
  const { user } = useAuth()

  if (variant === "ops") {
    const displayName =
      user?.full_name?.trim() ||
      user?.name?.trim() ||
      user?.email?.split("@")[0] ||
      title
    const now = new Date()
    const weekday = now.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()
    const month = now.toLocaleDateString(undefined, { month: "short" }).toUpperCase()
    const day = now.getDate()
    const year = now.getFullYear()

    return (
      <header
        className={cn(
          "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between",
          className,
        )}
      >
        <div className="min-w-0 space-y-1">
          <p className="ops-kicker">{accent || greetingForNow()}</p>
          <h1 className="text-[1.85rem] font-bold tracking-tight text-[#0f172a] sm:text-[2rem]">
            {displayName}
          </h1>
          {description ? (
            <p className="max-w-xl text-[13px] leading-relaxed text-[#8b93a7]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {children}
          {showDate ? (
            <div className="ops-date-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b93a7]">
                {weekday} {month} {year}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums leading-none text-[#0f172a]">
                {day}
              </p>
            </div>
          ) : null}
        </div>
      </header>
    )
  }

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
