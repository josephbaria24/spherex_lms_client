"use client"

import { useMemo, useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockTrainingSessions } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  Clock,
  Search,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react"

type TabKey = "upcoming" | "past" | "all"

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

function isThisWeek(date: Date) {
  const now = new Date()
  const start = new Date(now)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  const t = date.getTime()
  return t >= start.getTime() && t < end.getTime()
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export default function TrainingPage() {
  const [tab, setTab] = useState<TabKey>("upcoming")
  const [search, setSearch] = useState("")

  const upcoming = useMemo(
    () => mockTrainingSessions.filter((s) => s.status === "upcoming"),
    [],
  )
  const past = useMemo(
    () => mockTrainingSessions.filter((s) => s.status === "completed" || s.status === "cancelled"),
    [],
  )
  const thisWeek = useMemo(
    () => upcoming.filter((s) => isThisWeek(s.scheduledDate)),
    [upcoming],
  )

  const filtered = useMemo(() => {
    const base =
      tab === "upcoming" ? upcoming : tab === "past" ? past : mockTrainingSessions
    const q = search.trim().toLowerCase()
    if (!q) return base
    return base.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.instructor.toLowerCase().includes(q),
    )
  }, [tab, upcoming, past, search])

  const tabs: { id: TabKey; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcoming.length },
    { id: "past", label: "Past", count: past.length },
    { id: "all", label: "All", count: mockTrainingSessions.length },
  ]

  return (
    <MainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
              Learning workspace
            </p>
            <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
              Training sessions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
              View and join your scheduled live training sessions.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={CalendarDays}
              value={upcoming.length}
              label="Upcoming"
              hint="Sessions scheduled"
            />
            <MetricCard
              icon={Clock}
              value={thisWeek.length}
              label="This week"
              hint="On your calendar"
            />
            <MetricCard
              icon={Users}
              value={upcoming.reduce((sum, s) => sum + s.participants, 0)}
              label="Participants"
              hint="Across upcoming sessions"
            />
            <MetricCard
              icon={Video}
              value={upcoming.reduce((sum, s) => sum + s.duration, 0)}
              label="Total minutes"
              hint="Scheduled duration"
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "text-sm transition-colors",
                      tab === item.id
                        ? "font-semibold text-[#0f172a]"
                        : "font-medium text-[#94a3b8] hover:text-[#64748b]",
                    )}
                  >
                    {item.label}
                    <span className="ml-1 tabular-nums">{item.count}</span>
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  placeholder="Search sessions"
                  className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[240px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <CalendarDays className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {tab === "past"
                    ? "No past sessions to display"
                    : search
                      ? "No sessions match your search"
                      : "No sessions scheduled"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {tab === "past"
                    ? "Completed sessions will appear here after they finish."
                    : "Upcoming live sessions for your courses will show here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>Session</th>
                      <th className={thClass}>Instructor</th>
                      <th className={thClass}>When</th>
                      <th className={thClass}>Duration</th>
                      <th className={thClass}>Participants</th>
                      <th className={thClass}>Status</th>
                      <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filtered.map((session) => (
                      <tr key={session.id} className="transition-colors hover:bg-[#fafbfc]">
                        <td className="py-3.5 pl-4 pr-4">
                          <div className="flex items-center gap-3">
                            <Video
                              className="h-5 w-5 shrink-0 text-[#64748b]"
                              strokeWidth={1.5}
                            />
                            <p className="truncate text-sm font-semibold text-[#0f172a]">
                              {session.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#64748b]">
                          {session.instructor}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#64748b]">
                          {formatWhen(session.scheduledDate)}
                        </td>
                        <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                          {session.duration} min
                        </td>
                        <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                          {session.participants}/{session.maxParticipants}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
                              session.status === "upcoming"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-[#f1f5f9] text-[#64748b]",
                            )}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {session.status === "upcoming" ? (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
                              >
                                <Video className="h-3.5 w-3.5" strokeWidth={1.5} />
                                Join
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg border-[#e2e8f0] shadow-none"
                            >
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filtered.length > 0 && (
              <div className="border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {filtered.length} session{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
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
