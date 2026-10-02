"use client"

import Link from "next/link"
import { ArrowRight, PlayCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { assetUrl } from "@/lib/asset-url"
import { getReviewerAccent } from "@/lib/reviewer-accents"
import type { PublicReviewerGroup } from "@/lib/public-reviewers"
import { cn } from "@/lib/utils"

const PREVIEW_PARTS = 2

type ReviewerGroupCardProps = {
  group: PublicReviewerGroup
  /** Base path for detail + practice links (default `/reviewers`) */
  basePath?: "/reviewers" | "/ielts"
}

export function ReviewerGroupCard({ group, basePath = "/reviewers" }: ReviewerGroupCardProps) {
  const accent = getReviewerAccent(group.accent_color)
  const cover = assetUrl(group.cover_url)
  const parts = group.quizzes ?? []
  const preview = parts.slice(0, PREVIEW_PARTS)
  const remaining = Math.max(0, parts.length - PREVIEW_PARTS)
  const detailHref = `${basePath}/${group.id}`
  const practiceBase = `${basePath}/practice`

  return (
    <article
      className={cn(
        "flex h-[420px] flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        accent.card,
      )}
    >
      <Link href={detailHref} className="relative block h-32 shrink-0 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={cn("h-full w-full bg-gradient-to-br", accent.header)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge className={accent.badge}>{group.exam_type}</Badge>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm">
              {parts.length} {parts.length === 1 ? "part" : "parts"}
            </span>
          </div>
          <h2 className="truncate text-xl font-bold tracking-tight drop-shadow-sm">{group.title}</h2>
        </div>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-5">
        {group.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{group.description}</p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500">Practice parts for this subject.</p>
        )}

        <p className={cn("mt-3 text-xs font-semibold uppercase tracking-wide", accent.soft)}>
          {group.question_count} questions total
        </p>

        <ul className="mt-3 space-y-2">
          {preview.map((quiz, index) => (
            <li
              key={quiz.id}
              className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-border/70 dark:bg-background/60"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                  accent.badge,
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{quiz.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {quiz.question_count} questions · Pass {quiz.passing_score}%
                </p>
              </div>
              <Button asChild size="sm" className={cn("shrink-0 rounded-full", accent.button)}>
                <Link href={`${practiceBase}/${quiz.id}`}>
                  <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
                  Start
                </Link>
              </Button>
            </li>
          ))}
        </ul>

        {parts.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-4 text-center text-sm text-slate-500 dark:border-border dark:bg-background/40 dark:text-slate-400">
            No practice parts published yet.
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          <Button asChild variant="outline" className="w-full rounded-full bg-white/80 dark:border-border dark:bg-background/60 dark:hover:bg-muted">
            <Link href={detailHref}>
              See all{remaining > 0 ? ` (${parts.length} parts)` : ""}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
