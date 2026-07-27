"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardCourseCarousel } from "@/components/dashboard/dashboard-course-carousel"
import { cn } from "@/lib/utils"
import type { AuthUser } from "@/lib/api"
import type { LearnDashboardPayload } from "@/lib/learn-dashboard-types"
import {
  Award,
  BookOpen,
  Flame,
  ListOrdered,
  MoreVertical,
  Play,
  Users,
} from "lucide-react"

type StudentDashboardProps = {
  user: AuthUser
  dashboard: LearnDashboardPayload
}

type RangeKey = "1D" | "1W" | "1M" | "1Y"

function displayName(user: AuthUser) {
  const full = user.full_name ?? user.name ?? user.email.split("@")[0]
  return full.split(" ")[0] || full
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function inRange(date: Date, range: RangeKey, now = new Date()) {
  const ms = date.getTime()
  const start = new Date(now)
  if (range === "1D") {
    start.setHours(0, 0, 0, 0)
    return ms >= start.getTime()
  }
  if (range === "1W") {
    return ms >= startOfWeek(now).getTime()
  }
  if (range === "1M") {
    start.setDate(start.getDate() - 30)
    return ms >= start.getTime()
  }
  start.setFullYear(start.getFullYear() - 1)
  return ms >= start.getTime()
}

function buildKnowledgeSeries(
  timeline: Array<{ occurred_at: string }>,
  range: RangeKey,
) {
  const now = new Date()
  const events = timeline
    .map((e) => new Date(e.occurred_at))
    .filter((d) => inRange(d, range, now))
    .sort((a, b) => a.getTime() - b.getTime())

  if (events.length === 0) {
    return [{ label: "—", lessons: 0 }]
  }

  const buckets = new Map<string, number>()
  for (const event of events) {
    let key: string
    if (range === "1D") {
      key = event.toLocaleTimeString(undefined, { hour: "2-digit" })
    } else if (range === "1Y") {
      key = event.toLocaleDateString(undefined, { month: "short" })
    } else {
      key = event.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    }
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  let cumulative = 0
  return Array.from(buckets.entries()).map(([label, count]) => {
    cumulative += count
    return { label, lessons: cumulative }
  })
}

function percent(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

export function StudentDashboard({ user, dashboard }: StudentDashboardProps) {
  const [range, setRange] = useState<RangeKey>("1M")
  const name = displayName(user)
  const { summary, enrollments, knowledge_timeline, course_peers, recent_activity } =
    dashboard

  const inProgress = enrollments.find((e) => !e.completed && e.progress_percent < 100)
  const resumeCourse = inProgress ?? enrollments.find((e) => !e.completed) ?? null

  const knowledgeSeries = useMemo(
    () => buildKnowledgeSeries(knowledge_timeline, range),
    [knowledge_timeline, range],
  )

  const knowledgeGrowth =
    summary.knowledge_growth_percent >= 0
      ? `+${summary.knowledge_growth_percent}%`
      : `${summary.knowledge_growth_percent}%`

  const activeEnrollments = enrollments.filter((e) => !e.completed)
  const completedEnrollments = enrollments.filter((e) => e.completed)

  const periodSelect = (
    <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
      <SelectTrigger className="h-8 w-[110px] rounded-md border-[#e5e8ee] bg-white text-[12px] shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1D">Today</SelectItem>
        <SelectItem value="1W">This week</SelectItem>
        <SelectItem value="1M">This month</SelectItem>
        <SelectItem value="1Y">This year</SelectItem>
      </SelectContent>
    </Select>
  )

  const overviewBars = [
    {
      label: "Weekly goal",
      width: Math.min(100, summary.weekly_goal_percent),
      caption: `${summary.hours_completed} / ${summary.hours_goal} hrs`,
      color: "bg-[#0f172a]",
    },
    {
      label: "Courses done",
      width: percent(summary.courses_completed, summary.courses_enrolled),
      caption: `${summary.courses_completed} of ${summary.courses_enrolled}`,
      color: "bg-[#64748b]",
    },
    {
      label: "Streak",
      width: Math.min(100, summary.streak_days * 14),
      caption: `${summary.streak_days} day${summary.streak_days === 1 ? "" : "s"}`,
      color: "bg-[#94a3b8]",
    },
  ]

  return (
    <div className="-m-4 min-h-full bg-[#f4f6f8] font-[family-name:var(--font-outfit)] md:-m-6">
      <div className="w-full space-y-5 px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
              Learning workspace
            </p>
            <h1 className="mt-1.5 text-[1.85rem] font-semibold tracking-tight text-[#0f172a] md:text-[2rem]">
              Hi, {name}
            </h1>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-[#64748b]">
              Track progress, resume lessons, and explore courses from your organizations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-lg border-[#e5e8ee] bg-white shadow-none"
            >
              <Link href="/courses">Browse courses</Link>
            </Button>
            {resumeCourse ? (
              <Button
                asChild
                className="h-9 gap-1.5 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
              >
                <Link href={`/courses/${resumeCourse.course_id}/learn`}>
                  <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Resume lesson
                </Link>
              </Button>
            ) : null}
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={BookOpen}
            value={summary.courses_enrolled}
            label="Enrolled courses"
            hint={`${summary.courses_completed} completed`}
          />
          <MetricCard
            icon={ListOrdered}
            value={summary.lessons_completed}
            label="Lessons completed"
            hint={`${knowledgeGrowth} vs last week`}
          />
          <MetricCard
            icon={Flame}
            value={summary.streak_days}
            label="Day streak"
            hint="Consecutive learning days"
          />
          <MetricCard
            icon={Award}
            value={summary.certificates}
            label="Certificates"
            hint={`${summary.quiz_attempts} quiz attempts`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard
            title="Learning overview"
            period={periodSelect}
            footerHref="/courses"
            footerLabel="Browse courses"
          >
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <p className="text-[1.85rem] font-bold tracking-tight tabular-nums text-[#0f172a]">
                    {summary.lessons_completed}
                  </p>
                  <p className="text-[13px] text-[#64748b]">lessons completed</p>
                </div>
                <p className="mt-1 text-[13px] text-[#94a3b8]">
                  {summary.courses_enrolled} courses · {summary.hours_completed} hrs logged
                </p>
              </div>

              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={knowledgeSeries}
                    margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="studentKnowledgeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f172a" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="lessons"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fill="url(#studentKnowledgeFill)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3.5">
                {overviewBars.map((bar) => (
                  <div
                    key={bar.label}
                    className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3"
                  >
                    <span className="text-[13px] text-[#334155]">{bar.label}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2f6]">
                      <div
                        className={cn("h-full rounded-full", bar.color)}
                        style={{ width: `${bar.width}%` }}
                      />
                    </div>
                    <span className="min-w-[4.5rem] text-right text-[12px] tabular-nums text-[#64748b]">
                      {bar.caption}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </PanelCard>

          <PanelCard
            title="Continue learning"
            period={periodSelect}
            footerHref="/courses"
            footerLabel="See all courses"
          >
            {enrollments.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-start justify-center">
                <BookOpen className="h-5 w-5 text-[#94a3b8]" strokeWidth={1.5} />
                <p className="mt-3 text-[14px] font-medium text-[#0f172a]">No enrollments yet</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#64748b]">
                  Browse the catalog and enroll in a course to start learning.
                </p>
                <Button
                  asChild
                  className="mt-4 h-9 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
                >
                  <Link href="/courses">Browse courses</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-[#eef2f6]">
                {enrollments.slice(0, 5).map((enrollment) => (
                  <li key={enrollment.id}>
                    <Link
                      href={`/courses/${enrollment.course_id}/learn`}
                      className="flex items-center gap-4 py-4 transition hover:bg-[#fafbfc] first:pt-1 last:pb-1"
                    >
                      <BookOpen
                        className="h-5 w-5 shrink-0 text-[#64748b]"
                        strokeWidth={1.5}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-[14px] font-medium text-[#0f172a]">
                          {enrollment.course.title}
                        </p>
                        <p className="truncate text-[12px] text-[#94a3b8]">
                          {enrollment.lessons_completed} of {enrollment.lessons_total} lessons ·{" "}
                          {enrollment.completed ? "Completed" : "In progress"}
                        </p>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#eef2f6]">
                          <div
                            className="h-full rounded-full bg-[#0f172a]"
                            style={{
                              width: `${Math.min(100, enrollment.progress_percent)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <p className="shrink-0 text-[15px] font-semibold tabular-nums text-[#0f172a]">
                        {enrollment.progress_percent}%
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard
            title="Progress snapshot"
            period={periodSelect}
            footerHref="/achievements"
            footerLabel="View achievements"
          >
            <div className="space-y-5">
              <div>
                <p className="text-[1.85rem] font-bold tracking-tight tabular-nums text-[#0f172a]">
                  {summary.weekly_goal_percent}%
                </p>
                <p className="mt-1 text-[13px] text-[#64748b]">of weekly learning goal</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  label="In progress"
                  value={activeEnrollments.length}
                  hint="active courses"
                />
                <MiniStat
                  label="Completed"
                  value={completedEnrollments.length}
                  hint="finished courses"
                />
              </div>

              <div className="rounded-lg border border-[#eef2f6] bg-[#fafbfc] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#64748b]" strokeWidth={1.5} />
                  <p className="text-[13px] font-medium text-[#0f172a]">Studying with you</p>
                </div>
                {course_peers.length === 0 ? (
                  <p className="mt-2 text-[13px] text-[#94a3b8]">
                    No classmates enrolled in your courses yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {course_peers.slice(0, 3).map((peer) => (
                      <li
                        key={`${peer.id}-${peer.course_title}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[#0f172a]">
                            {peer.name}
                          </p>
                          <p className="truncate text-[12px] text-[#94a3b8]">{peer.course_title}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </PanelCard>

          <PanelCard
            title="Recent activity"
            period={periodSelect}
            footerHref="/courses"
            footerLabel="Continue learning"
          >
            {recent_activity.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-start justify-center">
                <ListOrdered className="h-5 w-5 text-[#94a3b8]" strokeWidth={1.5} />
                <p className="mt-3 text-[14px] font-medium text-[#0f172a]">No activity yet</p>
                <p className="mt-1 text-[13px] leading-relaxed text-[#64748b]">
                  Complete a lesson to see your recent learning activity here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#eef2f6]">
                {recent_activity.slice(0, 6).map((item, index) => (
                  <li
                    key={`${item.occurred_at}-${index}`}
                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-[#0f172a]">
                        {item.detail}
                      </p>
                      <p className="truncate text-[12px] text-[#94a3b8]">
                        {item.course_title || item.label}
                      </p>
                    </div>
                    <p className="shrink-0 text-[12px] tabular-nums text-[#94a3b8]">
                      {formatActivityDate(item.occurred_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>
        </div>

        <DashboardCourseCarousel />
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: typeof BookOpen
  value: number | string
  label: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-[#e5e8ee] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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

function PanelCard({
  title,
  period,
  footerHref,
  footerLabel,
  children,
}: {
  title: string
  period: ReactNode
  footerHref: string
  footerLabel: string
  children: ReactNode
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-lg border border-[#e5e8ee] bg-white py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 border-b border-[#eef2f6] px-5 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
          {title}
        </p>
        {period}
      </CardHeader>
      <CardContent className="px-5 py-5">{children}</CardContent>
      <CardFooter className="flex items-center justify-between gap-3 border-t border-[#eef2f6] px-5 py-3">
        <Link
          href={footerHref}
          className="text-[13px] font-medium text-[#2563eb] hover:underline"
        >
          {footerLabel}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#94a3b8] hover:text-[#64748b]"
              aria-label={`${title} options`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={footerHref}>Open page</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint: string
}) {
  return (
    <div className="rounded-lg border border-[#eef2f6] bg-[#fafbfc] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
        {label}
      </p>
      <p className="mt-1 text-[1.35rem] font-bold tabular-nums text-[#0f172a]">{value}</p>
      <p className="mt-0.5 text-[12px] text-[#94a3b8]">{hint}</p>
    </div>
  )
}

function formatActivityDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(iso))
  } catch {
    return "—"
  }
}
