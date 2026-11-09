"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Award,
  BookOpen,
  Clock3,
  Download,
  MessageSquare,
  RefreshCcw,
  Sparkles,
} from "lucide-react"
import { apiGet } from "@/lib/api"
import type { CourseCompletionSummary } from "@/lib/course-completion-types"
import { ConfettiBurst } from "@/components/lessons/confetti-burst"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

function formatStudyTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

type CourseCompletionCelebrationProps = {
  courseId: string
  /** Fire confetti when this celebration first appears after a fresh pass */
  celebrate?: boolean
  quizScore?: number | null
}

export function CourseCompletionCelebration({
  courseId,
  celebrate = true,
  quizScore = null,
}: CourseCompletionCelebrationProps) {
  const [summary, setSummary] = useState<CourseCompletionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiGet<CourseCompletionSummary>(`/learn/courses/${courseId}/completion-summary`)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch(() => {
        if (!cancelled) setSummary(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  async function downloadCertificate() {
    if (!summary?.certificate) return
    setDownloading(true)
    try {
      const res = await fetch(summary.certificate.pdf_url, { credentials: "include" })
      if (!res.ok) throw new Error("Could not download certificate")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${summary.course.title.replace(/[^\w.-]+/g, "_")}-certificate.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download certificate")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-[1.5rem] border border-border bg-muted/20">
        <Spinner size={24} />
      </div>
    )
  }

  if (!summary?.completed) return null

  const stats = [
    {
      icon: BookOpen,
      label: "Lessons",
      value: `${summary.lessons_completed}/${summary.lessons_total}`,
    },
    {
      icon: Clock3,
      label: "Study time",
      value: formatStudyTime(summary.study_seconds),
    },
    {
      icon: RefreshCcw,
      label: "Repeats",
      value: String(summary.quiz_repeats),
    },
    {
      icon: Award,
      label: "Quizzes",
      value:
        summary.quiz_attempts > 0
          ? `${summary.quizzes_passed} passed · ${summary.quiz_attempts} tries`
          : "None yet",
    },
    {
      icon: MessageSquare,
      label: "Interactions",
      value:
        summary.interactions_total > 0
          ? `${summary.interactions_correct}/${summary.interactions_total} correct`
          : "—",
    },
    {
      icon: Sparkles,
      label: "Best quiz",
      value:
        quizScore != null
          ? `${quizScore}%`
          : summary.quiz_best_score != null
            ? `${summary.quiz_best_score}%`
            : "—",
    },
  ]

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[#FFD8C8] bg-gradient-to-br from-[#FFF6F2] via-white to-[#F3FFF8] p-5 shadow-sm dark:border-[#FF4B1A]/35 dark:from-[#FF4B1A]/10 dark:via-card dark:to-emerald-950/20 sm:p-6">
      <ConfettiBurst active={celebrate} />
      <div className="relative z-20 space-y-5">
        <div className="space-y-2 text-center sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF4B1A]">
            Course complete
          </p>
          <h3 className="text-2xl font-bold tracking-tight text-[#1c1917] dark:text-foreground">
            You finished {summary.course.title}
          </h3>
          <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
            High-level look at how you got here — lessons, time, quiz attempts, and in-slide
            interactions.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/80 bg-white/80 px-3 py-3 dark:border-white/10 dark:bg-black/20"
            >
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <stat.icon className="h-3.5 w-3.5 text-[#FF4B1A]" />
                {stat.label}
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-[#1a1f2e]/10 bg-[#1a1f2e] p-4 text-white dark:border-white/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                Certificate
              </p>
              {summary.certificate?.has_template ? (
                <>
                  <p className="mt-1 text-sm font-semibold">Ready to download</p>
                  <p className="text-xs text-white/65">
                    {summary.certificate.serial_number
                      ? `Serial ${summary.certificate.serial_number}`
                      : "Your completion certificate is available."}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm font-semibold">On its way</p>
                  <p className="text-xs text-white/65">
                    This course does not have a certificate design yet. You will see it here once
                    it is set up.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.certificate?.has_template ? (
                <Button
                  type="button"
                  className="rounded-full bg-[#FF4B1A] text-white hover:bg-[#e84314]"
                  disabled={downloading}
                  onClick={() => void downloadCertificate()}
                >
                  {downloading ? <Spinner size={16} /> : <Download className="mr-1.5 h-4 w-4" />}
                  Download
                </Button>
              ) : null}
              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/achievements/certificates">All certificates</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
