"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import {
  HiArrowRight,
  HiBookOpen,
  HiHeadphones,
  HiLanguageSkill,
  HiMic,
  HiPen,
} from "@/components/icons/hugeicons"
import { LandingHeader } from "@/components/landing/landing-header"
import { ReviewerGroupCard } from "@/components/reviewers/reviewer-group-card"
import { Button } from "@/components/ui/button"
import {
  fetchPublicReviewerGroups,
  type PublicReviewerGroup,
} from "@/lib/public-reviewers"
import { cn } from "@/lib/utils"

type SkillIcon = (props: { className?: string }) => React.ReactElement

const SKILL_META: Record<string, { icon: SkillIcon; blurb: string; tint: string }> = {
  Listening: {
    icon: HiHeadphones,
    blurb: "Form completion, conversations, monologues, and ads with practice audio.",
    tint: "from-sky-50 to-cyan-50 border-sky-200 dark:from-sky-950/40 dark:to-cyan-950/30 dark:border-sky-800",
  },
  Reading: {
    icon: HiBookOpen,
    blurb: "Academic passages with a shared reading panel, MCQ, multi-select, and fill-blank.",
    tint: "from-indigo-50 to-sky-50 border-indigo-200 dark:from-indigo-950/40 dark:to-sky-950/30 dark:border-indigo-800",
  },
  Writing: {
    icon: HiPen,
    blurb: "Task 1 & Task 2 practice coming soon.",
    tint: "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/40 dark:to-orange-950/30 dark:border-amber-800",
  },
  Speaking: {
    icon: HiMic,
    blurb: "Part 1–3 speaking practice coming soon.",
    tint: "from-rose-50 to-orange-50 border-rose-200 dark:from-rose-950/40 dark:to-orange-950/30 dark:border-rose-800",
  },
}

export default function IeltsHubPage() {
  const [groups, setGroups] = useState<PublicReviewerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPublicReviewerGroups({ exam_type: "IELTS" })
      .then((data) => {
        if (!cancelled) setGroups(data.groups ?? [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load IELTS practice")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const sorted = useMemo(
    () =>
      [...groups].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.title.localeCompare(b.title),
      ),
    [groups],
  )

  const totalParts = sorted.reduce((n, g) => n + (g.quizzes?.length ?? 0), 0)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7f9] text-slate-800 dark:bg-background dark:text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/70 via-white to-indigo-50/60 dark:from-background dark:via-sky-950/20 dark:to-indigo-950/20" />
        <div className="absolute -left-16 top-28 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-500/10" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15, 55, 70, 0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <LandingHeader />

      <main className="relative pb-20 pt-28">
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300">
              <HiLanguageSkill className="h-3.5 w-3.5" />
              IELTS Preparation
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Practice by skill
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Listening and Reading drills with timers, passages, and audio — separate from CSE,
              NLE, and LET reviewers.
            </p>
            {!loading && !error ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {sorted.length} skills · {totalParts} practice sets
              </p>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-16 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              Loading IELTS practice…
            </div>
          ) : error ? (
            <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          ) : (
            <>
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sorted.map((group) => {
                  const meta = SKILL_META[group.subject] ?? SKILL_META[group.title]
                  const Icon = meta?.icon ?? HiBookOpen
                  return (
                    <Link
                      key={group.id}
                      href={`/ielts/${group.id}`}
                      className={cn(
                        "group rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                        meta?.tint ?? "from-slate-50 to-white border-slate-200 dark:from-muted/40 dark:to-card dark:border-border",
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-background">
                        <Icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                      </span>
                      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{group.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {meta?.blurb ?? group.description}
                      </p>
                      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {group.quiz_count} {group.quiz_count === 1 ? "set" : "sets"}
                        {group.question_count
                          ? ` · ${group.question_count} questions`
                          : ""}
                      </p>
                      <span className="mt-4 inline-flex items-center text-sm font-semibold text-teal-700 dark:text-teal-400">
                        Open
                        <HiArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  )
                })}
              </div>

              <div className="mt-14">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">All practice sets</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Jump into a skill card below</p>
                  </div>
                  <Button asChild variant="outline" className="rounded-full dark:border-border dark:bg-transparent dark:hover:bg-muted">
                    <Link href="/reviewers">Exam reviewers (CSE, NLE, LET)</Link>
                  </Button>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {sorted
                    .filter((g) => (g.quizzes?.length ?? 0) > 0)
                    .map((group) => (
                      <ReviewerGroupCard key={group.id} group={group} basePath="/ielts" />
                    ))}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
