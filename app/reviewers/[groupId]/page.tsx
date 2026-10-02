"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { assetUrl } from "@/lib/asset-url"
import { getReviewerAccent } from "@/lib/reviewer-accents"
import {
  fetchPublicReviewerGroup,
  type PublicReviewerGroup,
} from "@/lib/public-reviewers"
import { cn } from "@/lib/utils"

export default function ReviewerGroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<PublicReviewerGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPublicReviewerGroup(groupId)
      .then((data) => {
        if (cancelled) return
        if (data.group.exam_type === "IELTS") {
          router.replace(`/ielts/${groupId}`)
          return
        }
        setGroup(data.group)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load subject")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [groupId, router])

  const accent = getReviewerAccent(group?.accent_color)
  const cover = assetUrl(group?.cover_url)
  const parts = group?.quizzes ?? []

  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-background dark:text-foreground">
      <LandingHeader />
      <main className="pb-16 pt-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href="/reviewers?tab=quizzes"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:underline dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to reviewers
          </Link>

          {loading || (!group && !error) ? (
            <div className="mt-16 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading subject…
            </div>
          ) : error || !group ? (
            <div className="mt-10 rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error ?? "Subject not found"}
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className={cn("overflow-hidden rounded-2xl border shadow-sm", accent.card)}>
                <div className="relative h-44 overflow-hidden sm:h-52">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className={cn("h-full w-full bg-gradient-to-br", accent.header)} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge className={accent.badge}>{group.exam_type}</Badge>
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                        {parts.length} {parts.length === 1 ? "part" : "parts"}
                      </span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">
                      {group.title}
                    </h1>
                  </div>
                </div>

                <div className="space-y-2 p-5 sm:p-6">
                  {group.description ? (
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{group.description}</p>
                  ) : null}
                  <p className={cn("text-xs font-semibold uppercase tracking-wide", accent.soft)}>
                    {group.question_count} questions total
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">All practice parts</h2>
                {parts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500 dark:border-border dark:bg-muted/30 dark:text-slate-400">
                    No practice parts published yet.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {parts.map((quiz, index) => (
                      <li
                        key={quiz.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-border dark:bg-card"
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                            accent.badge,
                          )}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{quiz.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {quiz.question_count} questions · Pass {quiz.passing_score}%
                            {quiz.category ? ` · ${quiz.category}` : ""}
                          </p>
                        </div>
                        <Button asChild className={cn("shrink-0 rounded-full", accent.button)}>
                          <Link href={`/reviewers/practice/${quiz.id}`}>
                            <PlayCircle className="mr-1.5 h-4 w-4" />
                            Start
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
