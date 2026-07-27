"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { TeacherOrgSelector } from "@/components/teacher/teacher-org-selector"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { apiGet, apiPost } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  ClipboardCheck,
  CircleDashed,
  Pencil,
  RotateCcw,
  Search,
  type LucideIcon,
} from "lucide-react"

type Evaluation = {
  id: string
  enrollment_id: string
  score: number | null
  feedback: string | null
  status: "pending" | "graded" | "returned"
  full_name: string | null
  name: string | null
  email: string
  course_title: string
  progress_percent: number
}

type StatusFilter = "all" | "pending" | "graded" | "returned"
type SortKey = "student" | "score" | "progress"

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

export default function TeacherEvaluationsPage() {
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("student")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState<Evaluation | null>(null)
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setEvaluations([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<{ evaluations: Evaluation[] }>(
        teacherApiPath(selectedOrgId, "/evaluations"),
      )
      setEvaluations(data.evaluations ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    return {
      all: evaluations.length,
      pending: evaluations.filter((e) => e.status === "pending").length,
      graded: evaluations.filter((e) => e.status === "graded").length,
      returned: evaluations.filter((e) => e.status === "returned").length,
      avgScore: (() => {
        const scored = evaluations.filter((e) => e.score != null)
        if (scored.length === 0) return null
        return Math.round(scored.reduce((sum, e) => sum + (e.score ?? 0), 0) / scored.length)
      })(),
    }
  }, [evaluations])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    let list = evaluations.filter((e) => {
      const matchesStatus = statusFilter === "all" || e.status === statusFilter
      const name = (e.full_name || e.name || e.email).toLowerCase()
      const matchesSearch =
        !q ||
        name.includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.course_title.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })

    list = [...list].sort((a, b) => {
      const nameA = a.full_name || a.name || a.email
      const nameB = b.full_name || b.name || b.email
      let cmp = 0
      if (sortKey === "student") cmp = nameA.localeCompare(nameB)
      else if (sortKey === "score") cmp = (a.score ?? -1) - (b.score ?? -1)
      else cmp = a.progress_percent - b.progress_percent
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [evaluations, searchTerm, statusFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "student" ? "asc" : "desc")
    }
  }

  function openGrade(ev: Evaluation) {
    setGrading(ev)
    setScore(ev.score != null ? String(ev.score) : "")
    setFeedback(ev.feedback ?? "")
  }

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault()
    if (!grading || !selectedOrgId) return
    setSubmitting(true)
    try {
      await apiPost(teacherApiPath(selectedOrgId, "/evaluations"), {
        enrollment_id: grading.enrollment_id,
        score: Number(score),
        feedback: feedback || undefined,
        status: "graded",
      })
      setGrading(null)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "graded", label: "Graded" },
    { id: "returned", label: "Returned" },
  ]

  return (
    <GrowMainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Teaching workspace
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Evaluations
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Review submissions and assign grades to your students.
              </p>
            </div>
            <TeacherOrgSelector />
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={ClipboardCheck}
              value={counts.all}
              label="Total evaluations"
              hint="Across your courses"
            />
            <MetricCard
              icon={CircleDashed}
              value={counts.pending}
              label="Pending"
              hint="Awaiting review"
            />
            <MetricCard
              icon={CheckCircle2}
              value={counts.graded}
              label="Graded"
              hint="Scores submitted"
            />
            <MetricCard
              icon={RotateCcw}
              value={counts.avgScore != null ? `${counts.avgScore}%` : "—"}
              label="Avg. score"
              hint={`${counts.returned} returned`}
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={cn(
                      "text-sm transition-colors",
                      statusFilter === tab.id
                        ? "font-semibold text-[#0f172a]"
                        : "font-medium text-[#94a3b8] hover:text-[#64748b]",
                    )}
                  >
                    {tab.label}
                    <span className="ml-1 tabular-nums">{counts[tab.id]}</span>
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  placeholder="Search evaluations"
                  className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[240px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-[#f1f5f9]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-5 w-5 animate-pulse rounded bg-[#f1f5f9]" />
                    <div className="h-4 w-56 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <ClipboardCheck className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {evaluations.length === 0
                    ? "No evaluations"
                    : "No evaluations match your filters"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {evaluations.length === 0
                    ? "Evaluations appear when students are enrolled in your courses."
                    : "Try another status tab or search term."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>
                        <SortHeader
                          label="Student"
                          active={sortKey === "student"}
                          dir={sortDir}
                          onClick={() => toggleSort("student")}
                        />
                      </th>
                      <th className={thClass}>Course</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>
                        <SortHeader
                          label="Score"
                          active={sortKey === "score"}
                          dir={sortDir}
                          onClick={() => toggleSort("score")}
                        />
                      </th>
                      <th className={thClass}>
                        <SortHeader
                          label="Progress"
                          active={sortKey === "progress"}
                          dir={sortDir}
                          onClick={() => toggleSort("progress")}
                        />
                      </th>
                      <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filtered.map((ev) => {
                      const displayName = ev.full_name || ev.name || ev.email
                      return (
                        <tr key={ev.id} className="transition-colors hover:bg-[#fafbfc]">
                          <td className="py-3.5 pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <ClipboardCheck
                                className="h-5 w-5 shrink-0 text-[#64748b]"
                                strokeWidth={1.5}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#0f172a]">
                                  {displayName}
                                </p>
                                {ev.feedback ? (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-[#94a3b8]">
                                    {ev.feedback}
                                  </p>
                                ) : (
                                  <p className="mt-0.5 truncate text-xs text-[#94a3b8]">{ev.email}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">{ev.course_title}</td>
                          <td className="px-4 py-3.5">
                            <StatusPill status={ev.status} />
                          </td>
                          <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                            {ev.score != null ? `${ev.score}%` : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                            {ev.progress_percent}%
                          </td>
                          <td className="px-4 py-3.5 pr-4">
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg border-[#e2e8f0] shadow-none"
                                onClick={() => openGrade(ev)}
                              >
                                <Pencil className="h-3.5 w-3.5 text-[#64748b]" strokeWidth={1.5} />
                                {ev.status === "graded" ? "Update" : "Grade"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {filtered.length} evaluation{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog open={!!grading} onOpenChange={() => setGrading(null)}>
        <DialogContent className="rounded-xl border-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle>Grade student</DialogTitle>
            <DialogDescription>
              {grading && `${grading.full_name || grading.email} — ${grading.course_title}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGrade} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="score">Score (0–100)</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={100}
                required
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="rounded-lg border-[#e2e8f0] shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <textarea
                id="feedback"
                className="flex min-h-[80px] w-full rounded-lg border border-[#e2e8f0] bg-background px-3 py-2 text-sm shadow-none"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-lg bg-[#0f172a] hover:bg-[#1e293b]"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Submit grade"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </GrowMainLayout>
  )
}

function MetricCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: LucideIcon
  value: number | string
  label: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tabular-nums text-[#0f172a]">{value}</p>
          <p className="mt-0.5 text-sm font-medium text-[#334155]">{label}</p>
          <p className="mt-1 text-xs text-[#94a3b8]">{hint}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
      </div>
    </div>
  )
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-[#64748b]",
        active && "text-[#64748b]",
      )}
    >
      {label}
      {active && <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "graded"
      ? "bg-emerald-50 text-emerald-700"
      : status === "returned"
        ? "bg-amber-50 text-amber-700"
        : "bg-[#f1f5f9] text-[#64748b]"
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize", tone)}>
      {status}
    </span>
  )
}
