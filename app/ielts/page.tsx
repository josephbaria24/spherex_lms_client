"use client"

import { Spinner } from "@/components/ui/spinner"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

import {
  HiArrowRight,
  HiBookOpen,
  HiHeadphones,
  HiLanguageSkill,
  HiMic,
  HiPen,
} from "@/components/icons/hugeicons"
import { LandingHeader } from "@/components/landing/landing-header"
import { IeltsCertificatePanel } from "@/components/ielts/ielts-certificate-panel"
import { ReviewerGroupCard } from "@/components/reviewers/reviewer-group-card"
import { Button } from "@/components/ui/button"
import { Ban } from "lucide-react"
import {
  fetchPublicReviewerGroups,
  type PublicReviewerGroup,
} from "@/lib/public-reviewers"
import { cn } from "@/lib/utils"
import { IeltsAccessDialog, useIeltsAccess } from "@/components/ielts/ielts-access-dialog"
import { IeltsUkviRequestDialog } from "@/components/ielts/ielts-ukvi-request-dialog"
import { IeltsCompanyMaterials } from "@/components/ielts/ielts-company-materials"
import { IELTS_TRACKS, type IeltsTrackId } from "@/lib/ielts-tracks"

type IeltsTrack = IeltsTrackId

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

function trackFromQuery(value: string | null): IeltsTrack | null {
  if (value === "academic" || value === "general" || value === "ukvi") return value
  return null
}

export default function IeltsHubPage() {
  const [groups, setGroups] = useState<PublicReviewerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [track, setTrack] = useState<IeltsTrack | null>(null)
  const [ukviOpen, setUkviOpen] = useState(false)
  const pendingMocksScroll = useRef(false)
  const access = useIeltsAccess()

  function scrollToMocks() {
    pendingMocksScroll.current = true
    window.setTimeout(() => {
      const target = document.getElementById("ielts-academic-mocks")
      if (!target) return
      pendingMocksScroll.current = false
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

  useEffect(() => {
    const next = trackFromQuery(new URLSearchParams(window.location.search).get("track"))
    if (next === "ukvi") {
      setUkviOpen(true)
      return
    }
    if (next) setTrack(next)
  }, [])

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

  useEffect(() => {
    if (!pendingMocksScroll.current || track !== "academic" || loading) return
    const target = document.getElementById("ielts-academic-mocks")
    if (!target) return
    pendingMocksScroll.current = false
    target.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [track, loading])

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
              Practice by test
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Choose Academic, General Training, or UKVI Life Skills. These are PetroCademia practice
              sets, not official sample papers.
            </p>
            {track === "academic" && !loading && !error ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {sorted.length} skills · {totalParts} practice sets
              </p>
            ) : null}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-6">
            {IELTS_TRACKS.map((item) => {
              const selected = track === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.available) {
                      setUkviOpen(true)
                      return
                    }
                    if (item.id === "academic") {
                      if (!access.unlocked) access.ask(item.title)
                      setTrack("academic")
                      scrollToMocks()
                      return
                    }
                    if (!access.unlocked) {
                      access.ask(item.title)
                      return
                    }
                    setTrack(item.id)
                  }}
                  aria-pressed={selected}
                  className={cn(
                    "group text-left",
                    item.available && "cursor-pointer",
                    !item.available && "opacity-80",
                  )}
                >
                  <span
                    className={cn(
                      "relative block overflow-hidden transition",
                      item.available
                        ? "rounded-2xl border border-[#FFD0C2] bg-white shadow-[0_12px_28px_-18px_rgba(255,75,26,0.85)] group-hover:-translate-y-0.5 group-hover:border-[#FF4B1A] group-active:scale-[0.98] dark:bg-card"
                        : "rounded-2xl bg-neutral-100 dark:bg-muted",
                      selected && item.available && "border-[#FF4B1A] ring-2 ring-[#FF4B1A]",
                    )}
                  >
                    <img
                      src={encodeURI(item.image)}
                      alt={item.imageAlt}
                      className={cn(
                        "aspect-[4/3] w-full bg-white object-contain object-center p-1.5 sm:p-3",
                        !item.available && "opacity-35 grayscale",
                      )}
                    />
                    {!item.available ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-1 text-[9px] font-semibold text-neutral-500 shadow-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs dark:bg-background/95 dark:text-muted-foreground">
                          <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="sr-only sm:not-sr-only">Not available</span>
                        </span>
                      </span>
                    ) : !access.unlocked ? (
                      <span className="absolute right-1 top-1 inline-flex items-center gap-1 rounded-full bg-neutral-950/85 px-1.5 py-0.5 text-[8px] font-semibold text-white sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                        Locked
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "mt-1.5 flex items-start gap-1 text-[11px] font-semibold leading-4 sm:mt-3 sm:text-[15px] sm:leading-snug",
                      item.available
                        ? "text-slate-900 group-hover:text-[#FF4B1A] dark:text-white dark:group-hover:text-[#FF8A6A]"
                        : "text-neutral-400 dark:text-muted-foreground",
                      selected && item.available && "text-[#FF4B1A] dark:text-[#FF8A6A]",
                    )}
                  >
                    {item.title}
                    {item.available ? (
                      <HiArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF4B1A] transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Ban className="mt-0.5 hidden h-4 w-4 shrink-0 sm:block" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <IeltsUkviRequestDialog open={ukviOpen} onOpenChange={setUkviOpen} />
          <IeltsCertificatePanel />
          <IeltsAccessDialog
            open={access.open}
            onOpenChange={access.setOpen}
            training={access.training}
            onUnlocked={() => {
              access.markUnlocked()
              const picked = IELTS_TRACKS.find((item) => item.title === access.training)
              if (picked) setTrack(picked.id)
            }}
          />

          {!track ? (
            <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Choose Academic, General Training, or UKVI Life Skills to see practice sets.
            </p>
          ) : track !== "academic" ? (
            <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-border dark:bg-card">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {track === "general" ? "IELTS General Training" : "IELTS for UKVI Life Skills"}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                {track === "general"
                  ? "General Training practice — everyday reading and letter-style writing — is not published yet. The sets below Academic are not General Training papers."
                  : "UKVI Life Skills is speaking and listening only, for certain UK visa routes. Those practice sets are not published yet."}
              </p>
            </div>
          ) : loading ? (
            <div className="mt-16 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
              <Spinner size={28} />
              Loading IELTS practice…
            </div>
          ) : error ? (
            <div className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          ) : (
            <>
              <div className="mt-6 sm:mt-10">
                <IeltsCompanyMaterials
                  unlocked={access.unlocked}
                  onLocked={(title) => access.ask(title)}
                />
              </div>
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
