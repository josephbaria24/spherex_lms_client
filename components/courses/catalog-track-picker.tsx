"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CatalogTrackId } from "@/lib/catalog-tracks"

const TRACKS: {
  id: CatalogTrackId
  title: string
  term: string
  description: string
  card: string
  termClass: string
  titleClass: string
  descriptionClass: string
  selected: string
  arrow: string
}[] = [
  {
    id: "ielts",
    title: "IELTS",
    term: "Preparation",
    description: "Listening, reading, writing, and speaking practice for the official exam.",
    card: "border-[#E31837] bg-[#E31837] text-white",
    termClass: "text-white/80",
    titleClass: "text-white",
    descriptionClass: "text-white/85",
    selected: "ring-2 ring-white ring-offset-2 ring-offset-[#E31837]",
    arrow: "bg-white/15 text-white",
  },
  {
    id: "osh",
    title: "Petrosphere Inc. Trainings",
    term: "DOLE-prescribed",
    description: "Occupational safety and health courses recognized for workplace compliance.",
    card: "border-[#0B2340] bg-[#0B2340] text-white",
    termClass: "text-[#F5C518]",
    titleClass: "text-[#F5C518]",
    descriptionClass: "text-white/80",
    selected: "ring-2 ring-[#F5C518] ring-offset-2 ring-offset-[#0B2340]",
    arrow: "bg-[#F5C518]/20 text-[#F5C518]",
  },
  {
    id: "reviewers",
    title: "Reviewers",
    term: "Licensure & CSE",
    description: "Practice sets for the Civil Service Exam, NLE, and LET.",
    card: "border-[#1a1f2e] bg-[#1a1f2e] text-white",
    termClass: "text-[#FF8A4C]",
    titleClass: "text-[#FF8A4C]",
    descriptionClass: "text-white/80",
    selected: "ring-2 ring-[#FF4B1A] ring-offset-2 ring-offset-[#1a1f2e]",
    arrow: "bg-[#FF4B1A]/20 text-[#FF8A4C]",
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
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {TRACKS.map((track) => {
        const selected = value === track.id
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => onChange(track.id)}
            aria-pressed={selected}
            className={cn(
              "relative flex min-h-[4.75rem] flex-col justify-center overflow-hidden rounded-xl border px-2 py-2 pr-7 text-left shadow-sm transition hover:-translate-y-0.5 sm:min-h-[5.25rem] sm:rounded-2xl sm:px-3 sm:py-3 sm:pr-9 lg:min-h-[6.5rem] lg:px-5 lg:py-4 lg:pr-14",
              track.card,
              track.id === "osh" && "border-[#1B1464] bg-[#1B1464] pb-2.5 lg:pb-5",
              selected && track.id !== "osh" && track.selected,
              selected && "max-lg:ring-offset-1",
            )}
          >
            {track.id === "osh" ? <span className="absolute inset-x-0 bottom-0 h-1 bg-[#F5C518] lg:h-1.5" /> : null}
            <span className={cn("absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full sm:right-2 sm:top-2 sm:h-6 sm:w-6 lg:right-3 lg:top-3 lg:h-8 lg:w-8", track.arrow)}>
              <ArrowUpRight className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="sr-only">Open {track.title}</span>
            </span>
            <span
              className={cn(
                "block font-black leading-[1.05] tracking-[-0.04em]",
                track.id === "ielts"
                  ? "text-[0.95rem] uppercase text-white sm:text-xl lg:text-[2.35rem] lg:leading-none"
                  : track.id === "osh"
                    ? "line-clamp-3 text-[10px] normal-case text-[#F5C518] sm:text-xs lg:line-clamp-none lg:text-[1.35rem] lg:leading-none"
                    : "text-[11px] uppercase sm:text-sm lg:text-[1.65rem] lg:leading-none",
                track.id !== "ielts" && track.titleClass,
              )}
            >
              {track.title}
              {track.id === "ielts" ? (
                <sup className="ml-0.5 align-super text-[0.45em] font-bold tracking-normal">TM</sup>
              ) : null}
            </span>
            <span className={cn("mt-2 hidden line-clamp-2 max-w-[16rem] text-xs font-medium leading-4 lg:block", track.descriptionClass)}>
              {track.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function CatalogTrackIntro({ track }: { track: CatalogTrackId }) {
  if (track === "ielts") return null

  if (track === "reviewers") {
    const exams = [
      { href: "/reviewers?exam=CSE", code: "CSE", label: "Civil Service Exam", hint: "Professional and sub-professional" },
      { href: "/reviewers?exam=NLE", code: "NLE", label: "Nursing Licensure", hint: "Board exam practice" },
      { href: "/reviewers?exam=LET", code: "LET", label: "Licensure for Teachers", hint: "LET practice sets" },
    ]
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Practice quizzes</p>
          <p className="text-xs text-muted-foreground">Separate from training courses.</p>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {exams.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3 transition hover:border-[#FF4B1A]/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a1f2e] text-[11px] font-black tracking-wide text-[#FF8A4C]">
                {item.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{item.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-[#FF4B1A]" />
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
      Every course published by the organization, including workplace safety, first aid, and other
      training.
    </p>
  )
}
