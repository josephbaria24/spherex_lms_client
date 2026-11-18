"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileText, Lock, PlayCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/app/provider"
import { apiGet } from "@/lib/api"
import {
  HiArrowRight,
  HiBookOpen,
  HiHeadphones,
  HiMic,
  HiPen,
} from "@/components/icons/hugeicons"
import {
  IELTS_ACADEMIC_KEYS,
  IELTS_ACADEMIC_MOCKS,
  IELTS_ACADEMIC_SKILL_GROUPS,
  isMockOpenForSession,
  type IeltsSkill,
  type IeltsSkillMockItem,
} from "@/lib/ielts-academic-materials"
import { fetchPublicReviewerGroups } from "@/lib/public-reviewers"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type IeltsProgressTest = {
  id: string
  title: string
  skill: string
  passed: boolean
}

function skillKey(value: string): IeltsSkill | null {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes("listening")) return "Listening"
  if (normalized.includes("reading")) return "Reading"
  if (normalized.includes("writing")) return "Writing"
  if (normalized.includes("speaking")) return "Speaking"
  return null
}

const SKILL_CARD: Record<
  IeltsSkill,
  {
    icon: (props: { className?: string }) => React.ReactElement
    tint: string
    itemTint: string
    accent: string
  }
> = {
  Listening: {
    icon: HiHeadphones,
    tint: "from-sky-50 to-cyan-50 border-sky-200 dark:from-sky-950/40 dark:to-cyan-950/30 dark:border-sky-800",
    itemTint:
      "from-sky-50/90 via-white to-cyan-50/70 border-sky-200/80 dark:from-sky-950/35 dark:via-card dark:to-cyan-950/25 dark:border-sky-800",
    accent: "bg-sky-600 text-white",
  },
  Reading: {
    icon: HiBookOpen,
    tint: "from-indigo-50 to-sky-50 border-indigo-200 dark:from-indigo-950/40 dark:to-sky-950/30 dark:border-indigo-800",
    itemTint:
      "from-indigo-50/90 via-white to-sky-50/70 border-indigo-200/80 dark:from-indigo-950/35 dark:via-card dark:to-sky-950/25 dark:border-indigo-800",
    accent: "bg-indigo-600 text-white",
  },
  Writing: {
    icon: HiPen,
    tint: "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/40 dark:to-orange-950/30 dark:border-amber-800",
    itemTint:
      "from-amber-50/90 via-white to-orange-50/70 border-amber-200/80 dark:from-amber-950/35 dark:via-card dark:to-orange-950/25 dark:border-amber-800",
    accent: "bg-amber-600 text-white",
  },
  Speaking: {
    icon: HiMic,
    tint: "from-rose-50 to-orange-50 border-rose-200 dark:from-rose-950/40 dark:to-orange-950/30 dark:border-rose-800",
    itemTint:
      "from-rose-50/90 via-white to-orange-50/70 border-rose-200/80 dark:from-rose-950/35 dark:via-card dark:to-orange-950/25 dark:border-rose-800",
    accent: "bg-rose-600 text-white",
  },
}

export function IeltsCompanyMaterials({
  unlocked,
  onLocked,
}: {
  unlocked: boolean
  onLocked: (title: string) => void
}) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showAnswerKeys, setShowAnswerKeys] = useState(false)
  const [mockSessionOpen, setMockSessionOpen] = useState(false)
  const [openMockIds, setOpenMockIds] = useState<string[]>([])
  const [openingPractice, setOpeningPractice] = useState<string | null>(null)
  const [activeSkill, setActiveSkill] = useState<IeltsSkill | null>(null)
  const [progressTests, setProgressTests] = useState<IeltsProgressTest[]>([])

  useEffect(() => {
    let cancelled = false
    apiGet<{
      show_answer_keys?: boolean
      mock_session_open?: boolean
      open_mock_ids?: string[]
    }>("/reviewers/ielts/answer-keys")
      .then((data) => {
        if (cancelled) return
        setShowAnswerKeys(data.show_answer_keys === true)
        setMockSessionOpen(data.mock_session_open === true)
        setOpenMockIds(Array.isArray(data.open_mock_ids) ? data.open_mock_ids : [])
      })
      .catch(() => {
        if (cancelled) return
        setShowAnswerKeys(false)
        setMockSessionOpen(false)
        setOpenMockIds([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setProgressTests([])
      return
    }
    let cancelled = false
    apiGet<{ tests?: IeltsProgressTest[] }>("/reviewers/ielts/certificate")
      .then((data) => {
        if (cancelled) return
        setProgressTests(Array.isArray(data.tests) ? data.tests : [])
      })
      .catch(() => {
        if (cancelled) return
        setProgressTests([])
      })
    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const passedPracticeTitles = useMemo(
    () =>
      new Set(
        progressTests
          .filter((test) => test.passed)
          .map((test) => test.title.trim().toLowerCase()),
      ),
    [progressTests],
  )

  const finishedBySkill = useMemo(() => {
    const passedBySkill: Record<IeltsSkill, number> = {
      Listening: 0,
      Reading: 0,
      Writing: 0,
      Speaking: 0,
    }
    for (const test of progressTests) {
      if (!test.passed) continue
      const skill = skillKey(test.skill)
      if (skill) passedBySkill[skill] += 1
    }

    const result: Record<IeltsSkill, number> = {
      Listening: 0,
      Reading: 0,
      Writing: 0,
      Speaking: 0,
    }
    for (const group of IELTS_ACADEMIC_SKILL_GROUPS) {
      const hasLinkedPractice = group.items.some((item) => Boolean(item.practiceTitle))
      if (hasLinkedPractice) {
        result[group.skill] = group.items.filter((item) => {
          if (!item.practiceTitle) return false
          return passedPracticeTitles.has(item.practiceTitle.trim().toLowerCase())
        }).length
      } else {
        // Writing/Speaking packs without linked quizzes use skill-wide passed sets.
        result[group.skill] = passedBySkill[group.skill]
      }
    }
    return result
  }, [passedPracticeTitles, progressTests])

  function itemFinished(item: IeltsSkillMockItem): boolean {
    if (!item.practiceTitle) return false
    return passedPracticeTitles.has(item.practiceTitle.trim().toLowerCase())
  }

  function openFile(title: string, href: string) {
    if (!unlocked) {
      onLocked(title)
      return
    }
    window.open(href, "_blank", "noopener,noreferrer")
  }

  async function openInteractivePractice(mockTitle: string, practiceTitle: string) {
    if (!unlocked) {
      onLocked(mockTitle)
      return
    }
    setOpeningPractice(practiceTitle)
    try {
      const data = await fetchPublicReviewerGroups({ exam_type: "IELTS" })
      const quiz = data.groups
        .flatMap((group) => group.quizzes)
        .find((item) => item.title === practiceTitle)
      if (!quiz) {
        toast.error("Interactive mock is not available yet")
        return
      }
      router.push(`/ielts/practice/${quiz.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open interactive mock")
    } finally {
      setOpeningPractice(null)
    }
  }

  function itemLocked(item: IeltsSkillMockItem): boolean {
    if (!unlocked) return true
    if (!item.mockId) return !showAnswerKeys
    return !isMockOpenForSession(item.mockId, mockSessionOpen, openMockIds)
  }

  function takeItem(item: IeltsSkillMockItem) {
    if (!unlocked) {
      onLocked(item.title)
      return
    }
    if (itemLocked(item)) return
    if (item.practiceTitle) {
      void openInteractivePractice(item.title, item.practiceTitle)
      return
    }
    if (item.primaryFile) {
      openFile(item.title, item.primaryFile.href)
    }
  }

  const anyMockOpen = IELTS_ACADEMIC_MOCKS.some((mock) =>
    isMockOpenForSession(mock.id, mockSessionOpen, openMockIds),
  )
  const waitingForTrainer = unlocked && !anyMockOpen
  const expanded = IELTS_ACADEMIC_SKILL_GROUPS.find((g) => g.skill === activeSkill) ?? null

  return (
    <section id="ielts-academic-mocks" className="scroll-mt-24 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Academic mock exams</h3>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {waitingForTrainer
            ? "Locked until your trainer starts the live session. Optional practice tests below stay available."
            : anyMockOpen && unlocked
              ? "Your trainer has opened selected mock tests for this live session."
              : "Live-session mocks by skill. Optional practice tests (not recorded) are listed below."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {IELTS_ACADEMIC_SKILL_GROUPS.map((group) => {
          const meta = SKILL_CARD[group.skill]
          const Icon = meta.icon
          const selected = activeSkill === group.skill
          const total = group.items.length
          const finishedCount = Math.min(finishedBySkill[group.skill] ?? 0, total)
          const progressPct = total > 0 ? Math.round((finishedCount / total) * 100) : 0
          return (
            <button
              key={group.skill}
              type="button"
              onClick={() => setActiveSkill(selected ? null : group.skill)}
              aria-pressed={selected}
              className={cn(
                "group flex flex-col rounded-2xl border bg-gradient-to-br p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                meta.tint,
                selected && "ring-2 ring-[#FF4B1A]",
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-background">
                <Icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {group.skill}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                {group.blurb}
              </p>
              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span>
                    {total > 0
                      ? `${total} ${total === 1 ? "mock" : "mocks"}`
                      : "Coming soon"}
                  </span>
                  <span className="tabular-nums">
                    {total > 0 ? `${finishedCount}/${total} done` : "—"}
                  </span>
                </div>
                <Progress
                  value={progressPct}
                  className="mt-1.5 h-1.5 bg-slate-200/80 dark:bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#FF4B1A]"
                  aria-label={`${group.skill} mocks finished`}
                />
              </div>
              <span className="mt-3 inline-flex items-center text-sm font-semibold text-teal-700 dark:text-teal-400">
                {selected ? "Hide" : "Open"}
                <HiArrowRight
                  className={cn(
                    "ml-1 h-4 w-4 transition-transform",
                    selected ? "rotate-90" : "group-hover:translate-x-0.5",
                  )}
                />
              </span>
            </button>
          )
        })}
      </div>

      {expanded ? (
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FF4B1A]">
                {expanded.skill}
              </p>
              <p className="text-base font-semibold text-foreground">Choose a mock</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pick a day pack. Interactive mocks open in the exam suite when available.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSkill(null)}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
            >
              Close
            </button>
          </div>

          {expanded.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 px-3 py-6 text-center text-sm text-muted-foreground">
              Full speaking mocks are not published for live sessions yet. Use optional Speaking
              practice below.
            </p>
          ) : (
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {expanded.items.map((item, index) => {
                const locked = itemLocked(item)
                const finished = itemFinished(item)
                const busy = item.practiceTitle != null && openingPractice === item.practiceTitle
                const meta = SKILL_CARD[expanded.skill]
                const Icon = meta.icon
                const interactive = Boolean(item.practiceTitle)
                const status = finished
                  ? { label: "Done", className: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200" }
                  : locked
                    ? { label: "Locked", className: "bg-slate-100 text-slate-500 dark:bg-muted dark:text-muted-foreground" }
                    : { label: "Open", className: "bg-[#FFE8E0] text-[#FF4B1A]" }
                return (
                  <article
                    key={item.id}
                    className={cn(
                      "group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition",
                      meta.itemTint,
                      !locked && "hover:-translate-y-0.5 hover:shadow-md",
                      locked && "opacity-80",
                      finished && "ring-1 ring-teal-300/70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-sm",
                          finished
                            ? "bg-teal-600 text-white"
                            : locked
                              ? "bg-white/80 text-slate-400 dark:bg-background/60"
                              : cn(meta.accent),
                        )}
                      >
                        {finished ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : locked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-3 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.day ? (
                          <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 shadow-sm dark:bg-background/70 dark:text-slate-300">
                            {item.day}
                          </span>
                        ) : (
                          <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 shadow-sm dark:bg-background/70 dark:text-slate-300">
                            Pack {index + 1}
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {interactive ? "Interactive" : "Paper / file"}
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {finished
                          ? "Completed — retake anytime to sharpen your score."
                          : locked
                            ? "Opens when your trainer unlocks this live session mock."
                            : interactive
                              ? "Timed exam suite with on-page answers."
                              : "Open the session material to practise offline."}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={locked || busy}
                      onClick={() => takeItem(item)}
                      className={cn(
                        "mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition",
                        locked
                          ? "cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-muted dark:text-muted-foreground"
                          : finished
                            ? "bg-teal-700 text-white hover:bg-teal-800"
                            : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
                      )}
                    >
                      {locked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <PlayCircle className="h-4 w-4" />
                      )}
                      {busy
                        ? "Opening…"
                        : finished
                          ? "Retake mock"
                          : locked
                            ? "Locked"
                            : item.ctaLabel.replace(/^Take\s+/i, "Start ")}
                      {!locked && !busy ? (
                        <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      ) : null}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      {showAnswerKeys ? (
        <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2">
          {IELTS_ACADEMIC_KEYS.filter((file) => file.id !== "writing-examples").map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => openFile(file.title, file.href)}
              className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#FFD8C8] bg-[#FFF1EC] px-2 py-2 text-left text-[10px] font-semibold leading-4 text-[#FF4B1A] sm:px-3 sm:text-xs dark:border-[#FF4B1A]/30 dark:bg-[#FF4B1A]/15"
            >
              {!unlocked ? (
                <Lock className="h-3 w-3 shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{file.title}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
