"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Input } from "@/components/ui/input"
import { TeacherOrgSelector } from "@/components/teacher/teacher-org-selector"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { apiGet } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Video,
  type LucideIcon,
} from "lucide-react"

type Session = {
  id: string
  title: string
  description?: string | null
  scheduled_date: string
  duration_minutes?: number | null
  location?: string | null
  status?: string | null
  course_title?: string | null
}

type StatusFilter = "all" | "upcoming" | "past" | string
type SortKey = "date" | "title" | "duration"

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

function isUpcoming(iso: string) {
  return new Date(iso).getTime() >= Date.now()
}

export default function TeacherSessionsPage() {
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const [sessions, setSessions] = useState<Session[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setSessions([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<{ sessions: Session[] }>(
        teacherApiPath(selectedOrgId, "/sessions"),
      )
      setSessions(data.sessions ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const upcoming = sessions.filter((s) => isUpcoming(s.scheduled_date)).length
    const withLocation = sessions.filter((s) => !!s.location).length
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
    return {
      all: sessions.length,
      upcoming,
      past: sessions.length - upcoming,
      withLocation,
      totalMinutes,
    }
  }, [sessions])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    let list = sessions.filter((s) => {
      const upcoming = isUpcoming(s.scheduled_date)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "upcoming" && upcoming) ||
        (statusFilter === "past" && !upcoming) ||
        (s.status ?? "").toLowerCase() === statusFilter
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.course_title ?? "").toLowerCase().includes(q) ||
        (s.location ?? "").toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") cmp = a.title.localeCompare(b.title)
      else if (sortKey === "duration")
        cmp = (a.duration_minutes ?? 0) - (b.duration_minutes ?? 0)
      else cmp = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [sessions, searchTerm, statusFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "title" ? "asc" : key === "date" ? "asc" : "desc")
    }
  }

  const statusTabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "upcoming", label: "Upcoming", count: counts.upcoming },
    { id: "past", label: "Past", count: counts.past },
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
                Training sessions
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Scheduled live or virtual sessions for your courses.
              </p>
            </div>
            <TeacherOrgSelector />
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={CalendarDays}
              value={counts.all}
              label="Total sessions"
              hint="Across your courses"
            />
            <MetricCard
              icon={Video}
              value={counts.upcoming}
              label="Upcoming"
              hint="Still on the calendar"
            />
            <MetricCard
              icon={Clock}
              value={counts.totalMinutes}
              label="Total minutes"
              hint="Scheduled duration"
            />
            <MetricCard
              icon={MapPin}
              value={counts.withLocation}
              label="With location"
              hint="Venue or meeting link"
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
                    <span className="ml-1 tabular-nums">{tab.count}</span>
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  placeholder="Search sessions"
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
                <CalendarDays className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {sessions.length === 0
                    ? "No sessions scheduled"
                    : "No sessions match your filters"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {sessions.length === 0
                    ? "Upcoming training sessions for your courses will show here."
                    : "Try another tab or search term."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>
                        <SortHeader
                          label="Session"
                          active={sortKey === "title"}
                          dir={sortDir}
                          onClick={() => toggleSort("title")}
                        />
                      </th>
                      <th className={thClass}>Course</th>
                      <th className={thClass}>
                        <SortHeader
                          label="When"
                          active={sortKey === "date"}
                          dir={sortDir}
                          onClick={() => toggleSort("date")}
                        />
                      </th>
                      <th className={thClass}>
                        <SortHeader
                          label="Duration"
                          active={sortKey === "duration"}
                          dir={sortDir}
                          onClick={() => toggleSort("duration")}
                        />
                      </th>
                      <th className={thClass}>Location</th>
                      <th className={thClass}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filtered.map((s) => {
                      const upcoming = isUpcoming(s.scheduled_date)
                      return (
                        <tr key={s.id} className="transition-colors hover:bg-[#fafbfc]">
                          <td className="py-3.5 pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <CalendarDays
                                className="h-5 w-5 shrink-0 text-[#64748b]"
                                strokeWidth={1.5}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#0f172a]">
                                  {s.title}
                                </p>
                                {s.description ? (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-[#94a3b8]">
                                    {s.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {s.course_title || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {formatDateTime(s.scheduled_date)}
                          </td>
                          <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                            {s.duration_minutes != null ? `${s.duration_minutes} min` : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {s.location || "—"}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
                                upcoming
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-[#f1f5f9] text-[#64748b]",
                              )}
                            >
                              {s.status || (upcoming ? "Upcoming" : "Past")}
                            </span>
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
                  {filtered.length} session{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
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

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return "—"
  }
}
