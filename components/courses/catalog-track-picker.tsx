"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CatalogTrackId } from "@/lib/catalog-tracks"

const TRACKS: {
  id: CatalogTrackId
  title: string
  term: string
  description: string
  image: string
}[] = [
  {
    id: "ielts",
    title: "IELTS",
    term: "Preparation",
    description: "Listening, reading, writing, and speaking practice for the official exam.",
    image: "/IELTS listening study essentials-1.png",
  },
  {
    id: "osh",
    title: "OSH Trainings",
    term: "DOLE-prescribed",
    description: "Occupational safety and health courses recognized for workplace compliance.",
    image: "/Workplace safety essentials-2.png",
  },
  {
    id: "reviewers",
    title: "Reviewers",
    term: "Licensure & CSE",
    description: "Practice sets for the Civil Service Exam, NLE, and LET.",
    image: "/Exam prep with pencil and books-3.png",
  },
]

export function CatalogTrackPicker({
  value,
  onChange,
}: {
  value: CatalogTrackId | null
  onChange: (track: CatalogTrackId) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {TRACKS.map((track) => {
        const selected = value === track.id
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => onChange(track.id)}
            aria-pressed={selected}
            className={cn(
              "relative min-h-[11.5rem] overflow-hidden rounded-2xl border bg-[#1a1f2e] bg-cover bg-[position:right_center] p-4 text-left transition hover:-translate-y-0.5",
              selected
                ? "border-[#FF4B1A] ring-2 ring-[#FF4B1A]/70"
                : "border-transparent hover:border-[#FFD8C8]",
            )}
            style={{ backgroundImage: `url("${encodeURI(track.image)}")` }}
          >
            <div className="relative max-w-[14rem]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF8A6A]">
                {track.term}
              </p>
              <p className="mt-1 text-base font-semibold text-white">{track.title}</p>
              <p className="mt-1 text-sm leading-5 text-white/75">{track.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function CatalogTrackIntro({ track }: { track: CatalogTrackId }) {
  if (track === "ielts") {
    return (
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-border dark:bg-muted/30">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          IELTS practice lives in its own section. A PetroCademia certificate of completion is not an
          official IELTS result.
        </p>
        <Link
          href="/ielts"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#FF4B1A] px-5 text-sm font-semibold text-white hover:bg-[#e84314]"
        >
          Open IELTS practice
        </Link>
      </div>
    )
  }

  if (track === "reviewers") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-border dark:bg-muted/30">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Reviewers are practice quizzes, separate from training courses.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { href: "/reviewers?exam=CSE", label: "Civil Service Exam" },
            { href: "/reviewers?exam=NLE", label: "NLE" },
            { href: "/reviewers?exam=LET", label: "LET" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-[#FFD8C8] dark:border-border dark:bg-card dark:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
      Workplace safety courses under DOLE’s Occupational Safety and Health standards. Healthcare
      courses such as Basic Life Support are not listed here.
    </p>
  )
}
