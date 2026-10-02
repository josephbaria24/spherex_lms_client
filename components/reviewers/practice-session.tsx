"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import {
  HiArrowLeft,
  HiBookOpen,
  HiClock,
  HiHeadphones,
  HiMic,
  HiNote,
  HiPen,
  HiTarget,
} from "@/components/icons/hugeicons"
import { LandingHeader } from "@/components/landing/landing-header"
import { ReviewerQuizTaker } from "@/components/reviewers/reviewer-quiz-taker"
import {
  fetchPublicReviewerQuiz,
  type PublicReviewerQuizDetail,
} from "@/lib/public-reviewers"
import { cn } from "@/lib/utils"

function skillFromQuiz(quiz: PublicReviewerQuizDetail) {
  const hay = `${quiz.category ?? ""} ${quiz.title}`.toLowerCase()
  if (hay.includes("listen")) return { label: "Listening", Icon: HiHeadphones, tone: "sky" as const }
  if (hay.includes("read")) return { label: "Reading", Icon: HiBookOpen, tone: "indigo" as const }
  if (hay.includes("writ")) return { label: "Writing", Icon: HiPen, tone: "amber" as const }
  if (hay.includes("speak")) return { label: "Speaking", Icon: HiMic, tone: "rose" as const }
  return { label: "Practice", Icon: HiNote, tone: "teal" as const }
}

const toneStyles = {
  sky: {
    badge: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
    glow: "from-sky-100/80 via-white to-teal-50/60 dark:from-sky-950/30 dark:via-background dark:to-teal-950/20",
    bar: "from-sky-400 to-teal-500",
    chipIcon: "text-sky-600 dark:text-sky-400",
  },
  indigo: {
    badge: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
    glow: "from-indigo-100/70 via-white to-sky-50/50 dark:from-indigo-950/30 dark:via-background dark:to-sky-950/20",
    bar: "from-indigo-400 to-sky-500",
    chipIcon: "text-indigo-600 dark:text-indigo-400",
  },
  amber: {
    badge: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
    glow: "from-amber-100/70 via-white to-orange-50/40 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20",
    bar: "from-amber-400 to-orange-400",
    chipIcon: "text-amber-700 dark:text-amber-400",
  },
  rose: {
    badge: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
    glow: "from-rose-100/70 via-white to-orange-50/40 dark:from-rose-950/30 dark:via-background dark:to-orange-950/20",
    bar: "from-rose-400 to-orange-400",
    chipIcon: "text-rose-600 dark:text-rose-400",
  },
  teal: {
    badge: "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200",
    glow: "from-teal-100/70 via-white to-cyan-50/50 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/20",
    bar: "from-teal-400 to-cyan-500",
    chipIcon: "text-teal-600 dark:text-teal-400",
  },
}

type PracticeSessionProps = {
  quizId: string
  backHref: string
  backLabel: string
}

export function PracticeSession({ quizId, backHref, backLabel }: PracticeSessionProps) {
  const [quiz, setQuiz] = useState<PublicReviewerQuizDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPublicReviewerQuiz(quizId)
      .then((data) => {
        if (!cancelled) setQuiz(data.quiz)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load quiz")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [quizId])

  const skill = quiz ? skillFromQuiz(quiz) : null
  const SkillIcon = skill?.Icon ?? HiNote
  const tone = toneStyles[skill?.tone ?? "teal"]
  const hasPassage = Boolean(quiz?.passage_html?.trim())

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7f9] text-slate-800 dark:bg-background dark:text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className={cn("absolute inset-0 bg-gradient-to-br", tone.glow)} />
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-amber-100/40 blur-3xl dark:bg-amber-500/10" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15, 55, 70, 0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <LandingHeader />

      <main
        className={cn(
          "relative mx-auto px-4 pb-20 pt-28 sm:px-6",
          hasPassage ? "max-w-6xl" : "max-w-3xl",
        )}
      >
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-400"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-sm transition-colors group-hover:border-teal-300 group-hover:bg-teal-50 dark:border-border dark:bg-card dark:group-hover:border-teal-800 dark:group-hover:bg-teal-950/40">
            <HiArrowLeft className="h-3.5 w-3.5" />
          </span>
          {backLabel}
        </Link>

        {loading ? (
          <div className="mt-20 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <p className="text-sm tracking-wide">Preparing your session…</p>
          </div>
        ) : error || !quiz ? (
          <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error ?? "Quiz not found"}
          </div>
        ) : (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80 shadow-[0_20px_60px_-28px_rgba(15,55,70,0.35)] backdrop-blur-sm dark:border-border dark:bg-card/80 dark:shadow-black/40">
              <div
                className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", tone.bar)}
                aria-hidden
              />
              <div className="relative px-6 py-7 sm:px-8 sm:py-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                      tone.badge,
                    )}
                  >
                    <SkillIcon className="h-3.5 w-3.5" />
                    {quiz.exam_type}
                    {skill ? ` · ${skill.label}` : ""}
                  </span>
                  {quiz.category ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600 dark:border-border dark:bg-muted dark:text-slate-300">
                      {quiz.category}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                  {quiz.title}
                </h1>
                {quiz.description ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {quiz.description}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <MetaChip
                    icon={HiNote}
                    label={`${quiz.question_count} questions`}
                    iconClass={tone.chipIcon}
                  />
                  <MetaChip
                    icon={HiTarget}
                    label={`Pass ${quiz.passing_score}%`}
                    iconClass={tone.chipIcon}
                  />
                  <MetaChip
                    icon={HiClock}
                    label={
                      quiz.time_limit_seconds
                        ? `${Math.round(quiz.time_limit_seconds / 60)} min`
                        : "Untimed"
                    }
                    iconClass={tone.chipIcon}
                  />
                </div>
              </div>
            </header>

            <div className="mt-6">
              <ReviewerQuizTaker quiz={quiz} accent={skill?.tone ?? "teal"} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function MetaChip({
  icon: Icon,
  label,
  iconClass,
}: {
  icon: (props: { className?: string }) => React.ReactElement
  label: string
  iconClass: string
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-border dark:from-card dark:to-muted dark:text-slate-200">
      <Icon className={cn("h-3.5 w-3.5", iconClass)} />
      {label}
    </span>
  )
}
