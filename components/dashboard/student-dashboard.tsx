"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { DashboardCourseCarousel } from "@/components/dashboard/dashboard-course-carousel"
import { cn } from "@/lib/utils"
import type { AuthUser } from "@/lib/api"
import type { LearnDashboardPayload } from "@/lib/learn-dashboard-types"
import {
  Flame,
  Play,
  Plus,
  Sparkles,
} from "lucide-react"

type StudentDashboardProps = {
  user: AuthUser
  dashboard: LearnDashboardPayload
}

type RangeKey = "1D" | "1W" | "1M" | "1Y"

function displayName(user: AuthUser) {
  return user.full_name ?? user.name ?? user.email.split("@")[0]
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

export function StudentDashboard({ user, dashboard }: StudentDashboardProps) {
  const [range, setRange] = useState<RangeKey>("1M")
  const name = displayName(user)
  const { summary, enrollments, knowledge_timeline, focus_by_day, course_peers, recent_activity } =
    dashboard

  const inProgress = enrollments.find((e) => !e.completed && e.progress_percent < 100)
  const resumeCourse = inProgress ?? enrollments.find((e) => !e.completed) ?? null

  const knowledgeSeries = useMemo(
    () => buildKnowledgeSeries(knowledge_timeline, range),
    [knowledge_timeline, range],
  )

  const knowledgeTotal = summary.lessons_completed
  const knowledgeGrowth =
    summary.knowledge_growth_percent >= 0
      ? `+${summary.knowledge_growth_percent}%`
      : `${summary.knowledge_growth_percent}%`

  const tickerItems = useMemo(() => {
    if (recent_activity.length === 0) {
      return [{ text: "Complete a lesson to see your activity here" }]
    }
    return recent_activity.map((item) => ({
      text: item.course_title
        ? `${item.detail} — ${item.course_title}`
        : `${item.detail}: ${item.label}`,
    }))
  }, [recent_activity])

  const donutData = [
    { name: "done", value: summary.weekly_goal_percent },
    { name: "remaining", value: 100 - summary.weekly_goal_percent },
  ]

  return (
    <div className="dashboard-bento grow-bento space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full border border-[#e8dfd3] bg-white/70 px-3 py-1 text-xs font-medium text-[#6b5c4f] dark:border-border dark:bg-card">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#1c1917] dark:text-foreground sm:text-4xl">
            Hi, {name} —{" "}
            <span className="font-serif italic text-[#e85d4a]">today you grow</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#ddd6ce] bg-white/80 shadow-sm dark:bg-card"
          >
            <Link href="/courses">
              <Plus className="mr-1.5 h-4 w-4" />
              New path
            </Link>
          </Button>
          {resumeCourse ? (
            <Button
              asChild
              className="rounded-full bg-[#1a1f2e] text-white hover:bg-[#252b3d] dark:bg-primary"
            >
              <Link href={`/courses/${resumeCourse.course_id}/learn`}>
                <Play className="mr-1.5 h-4 w-4 fill-current" />
                Resume lesson
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="bento-card relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#ff7a45] via-[#ff6b35] to-[#e85a4a] p-4 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/85">On a roll</p>
                <p className="mt-1 text-4xl font-bold tracking-tight">{summary.streak_days}</p>
                <p className="text-sm text-white/80">day streak</p>
              </div>
              <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full",
                    i < Math.min(7, summary.streak_days) ? "bg-white" : "bg-white/25",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="bento-card flex flex-1 flex-col rounded-[1.75rem] bg-[#dcf7a1] p-4 dark:bg-lime-950/30">
            <p className="text-sm font-medium text-[#3d4f2f] dark:text-lime-200/90">
              Studying with you
            </p>
            {course_peers.length === 0 ? (
              <p className="mt-3 flex-1 text-sm text-[#4a5c3a] dark:text-muted-foreground">
                No classmates enrolled in your courses yet.
              </p>
            ) : (
              <ul className="mt-3 flex-1 space-y-2">
                {course_peers.slice(0, 4).map((peer) => (
                  <li
                    key={`${peer.id}-${peer.course_title}`}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-200/80 px-3 py-2 dark:bg-white/10"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold text-[#1c1917]">
                        {peer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1c1917] dark:text-foreground">
                          {peer.name}
                        </p>
                        <p className="truncate text-[10px] text-[#4a5c3a] dark:text-muted-foreground">
                          {peer.course_title}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bento-card rounded-[1.75rem] border border-[#ebe4da] bg-white p-4 shadow-sm dark:border-border dark:bg-card lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Lessons completed</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">
                {knowledgeTotal.toLocaleString()}
              </p>
              <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {knowledgeGrowth} vs last week
              </span>
            </div>
            <div className="flex rounded-full bg-[#f3ede4] p-0.5 dark:bg-muted">
              {(["1D", "1W", "1M", "1Y"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRange(key)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                    range === key
                      ? "bg-[#1a1f2e] text-white dark:bg-foreground dark:text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={knowledgeSeries} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="knowledgeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                />
                <Area
                  type="monotone"
                  dataKey="lessons"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#knowledgeFill)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 border-t border-[#ebe4da] pt-3 dark:border-border">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-muted-foreground">Learning activity</p>
              <p className="text-[11px] text-muted-foreground">This week</p>
            </div>
            <div className="mt-1.5 h-12 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={focus_by_day} margin={{ top: 0, right: 4, left: -24, bottom: -4 }}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 8, fill: "#9ca3af" }}
                  />
                  <Bar dataKey="activities" radius={[4, 4, 2, 2]} maxBarSize={14}>
                    {focus_by_day.map((entry) => (
                      <Cell
                        key={entry.day}
                        fill={entry.peak ? "#3b82f6" : "#1a1f2e"}
                        fillOpacity={entry.peak ? 1 : 0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bento-card flex min-h-0 flex-col rounded-[1.75rem] bg-[#1a1f2e] p-4 text-white shadow-lg dark:bg-[#12151f] lg:col-span-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/70">Course hours</p>
            <Sparkles className="h-4 w-4 text-amber-300" />
          </div>
          <div className="relative mx-auto mt-2 flex min-h-[120px] w-full max-w-[11rem] flex-1 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius="62%"
                  outerRadius="88%"
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#ff6b35" />
                  <Cell fill="rgba(255,255,255,0.12)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{summary.weekly_goal_percent}%</span>
            </div>
          </div>
          <p className="text-center text-sm text-white/75">
            {summary.hours_completed} / {summary.hours_goal} hrs
          </p>
          <p className="mt-1 text-center text-[11px] text-white/50">
            {summary.certificates} certificate{summary.certificates === 1 ? "" : "s"} ·{" "}
            {summary.quiz_attempts} quiz attempt{summary.quiz_attempts === 1 ? "" : "s"}
          </p>
        </div>

        <DashboardCourseCarousel />
      </div>

      <div className="overflow-hidden rounded-[11px] bg-[#1a1f2e] py-3 text-white dark:bg-[#12151f]">
        <div className="dashboard-ticker flex gap-8 whitespace-nowrap text-sm">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={`${item.text}-${i}`} className="inline-flex items-center gap-2 text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b35]" />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
