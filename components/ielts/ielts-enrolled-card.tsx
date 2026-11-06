import Link from "next/link"
import { ArrowUpRight, Clock } from "lucide-react"

function IeltsMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center bg-[#E31837] px-3 text-white">
      <span
        className={
          compact
            ? "text-sm font-black uppercase leading-none tracking-[-0.04em]"
            : "text-6xl font-black uppercase leading-none tracking-[-0.04em] sm:text-7xl"
        }
      >
        IELTS
        <sup className="ml-0.5 align-super text-[0.45em] font-bold tracking-normal">TM</sup>
      </span>
      {compact ? null : (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  )
}

export function ieltsMatchesSearch(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return "ielts preparation academic general training ukvi life skills".includes(q)
}

export function IeltsEnrolledCard({ variant }: { variant: "resume" | "compact" }) {
  if (variant === "compact") {
    return (
      <Link
        href="/ielts"
        className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-sm dark:border-border dark:bg-card"
      >
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl">
          <IeltsMark compact />
        </div>
        <div className="min-w-0 flex-1 py-0.5 pr-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-neutral-950 dark:text-foreground">
              IELTS Preparation
            </h3>
            <span className="shrink-0 text-xs font-bold text-[#FF4B1A]">Access</span>
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-500">Continue</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href="/ielts"
      className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-[#FFD8C8] dark:border-border dark:bg-card"
    >
      <div className="relative h-36 overflow-hidden">
        <IeltsMark />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-950 dark:text-foreground">
            IELTS Preparation
          </h3>
          <span className="inline-flex shrink-0 items-baseline rounded-md bg-[#E8F8EF] px-2 py-1 text-xs font-semibold text-[#128A3E] dark:bg-emerald-500/15 dark:text-emerald-300">
            Access
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-[#FF4B1A]" />
          Academic, General Training, and UKVI
        </span>
        <span className="mt-auto inline-flex items-center text-sm font-semibold text-[#FF4B1A]">
          Continue
        </span>
      </div>
    </Link>
  )
}
