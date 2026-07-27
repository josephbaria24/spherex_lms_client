"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
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
import { apiGet } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  FileText,
  GraduationCap,
  Info,
  MoreVertical,
  Users,
} from "lucide-react"

type DashboardData = {
  stats: {
    total_users: number
    active_courses: number
    materials: number
    completion_rate: number
    enrollments?: number
    completed_enrollments?: number
    in_progress_enrollments?: number
    new_users_month?: number
  }
  changes: {
    users: string
    courses: string
    materials: string
    completion_rate: string
  }
  recent_activity: {
    id: string
    user: string
    action: string
    target: string
    occurred_at: string
  }[]
}

type UserRow = { role: string }

const enrollmentTrend = [
  { month: "Jan", enrollments: 12, completions: 8 },
  { month: "Feb", enrollments: 18, completions: 11 },
  { month: "Mar", enrollments: 15, completions: 12 },
  { month: "Apr", enrollments: 22, completions: 14 },
  { month: "May", enrollments: 28, completions: 19 },
  { month: "Jun", enrollments: 24, completions: 17 },
  { month: "Jul", enrollments: 31, completions: 21 },
  { month: "Aug", enrollments: 27, completions: 20 },
  { month: "Sep", enrollments: 35, completions: 24 },
  { month: "Oct", enrollments: 33, completions: 22 },
  { month: "Nov", enrollments: 40, completions: 28 },
  { month: "Dec", enrollments: 38, completions: 26 },
]

const CATEGORY_COLORS = ["#2563eb", "#0d9488", "#7c3aed", "#ea580c", "#64748b"]

const courseCategories = [
  { name: "Safety", value: 32 },
  { name: "Health", value: 24 },
  { name: "Oil & Gas", value: 20 },
  { name: "Leadership", value: 14 },
  { name: "Other", value: 10 },
]

const trendConfig = {
  enrollments: { label: "Enrollments", color: "#2563eb" },
  completions: { label: "Completions", color: "#94a3b8" },
} satisfies ChartConfig

const donutConfig = {
  value: { label: "Share" },
  Safety: { label: "Safety", color: CATEGORY_COLORS[0] },
  Health: { label: "Health", color: CATEGORY_COLORS[1] },
  "Oil & Gas": { label: "Oil & Gas", color: CATEGORY_COLORS[2] },
  Leadership: { label: "Leadership", color: CATEGORY_COLORS[3] },
  Other: { label: "Other", color: CATEGORY_COLORS[4] },
} satisfies ChartConfig

function isDown(change: string) {
  const t = change.toLowerCase()
  return t.includes("down") || t.includes("no ") || t.startsWith("-") || t.includes("prior")
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("month")
  const [data, setData] = useState<DashboardData | null>(null)
  const [roles, setRoles] = useState({
    student: 0,
    teacher: 0,
    admin: 0,
    user: 0,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dashboard, usersRes] = await Promise.all([
        apiGet<DashboardData>("/admin/dashboard"),
        apiGet<{ users: UserRow[] }>("/users").catch(() => ({ users: [] as UserRow[] })),
      ])
      setData(dashboard)
      const users = usersRes.users ?? []
      setRoles({
        student: users.filter((u) => u.role === "student").length,
        teacher: users.filter((u) => u.role === "teacher").length,
        admin: users.filter((u) => u.role === "admin").length,
        user: users.filter((u) => u.role === "user").length,
      })
    } catch (error) {
      console.error("Failed to load analytics:", error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = data?.stats
  const usersCount = stats?.total_users ?? 0
  const coursesCount = stats?.active_courses ?? 0
  const materialsCount = stats?.materials ?? 0
  const enrollments = stats?.enrollments ?? 0
  const completed = stats?.completed_enrollments ?? 0
  const inProgress = stats?.in_progress_enrollments ?? 0
  const completionRate = stats?.completion_rate ?? 0

  const overviewBars = useMemo(() => {
    const max = Math.max(usersCount, coursesCount, materialsCount, 1)
    return [
      {
        label: "Users",
        value: usersCount,
        color: "bg-[#16a34a]",
        width: Math.max(8, (usersCount / max) * 100),
      },
      {
        label: "Courses",
        value: coursesCount,
        color: "bg-[#0d9488]",
        width: Math.max(8, (coursesCount / max) * 100),
      },
      {
        label: "Materials",
        value: materialsCount,
        color: "bg-[#64748b]",
        width: Math.max(8, (materialsCount / max) * 100),
      },
    ]
  }, [usersCount, coursesCount, materialsCount])

  const roleAccounts = [
    {
      label: "Students",
      detail: `${roles.student} accounts`,
      value: roles.student,
      icon: GraduationCap,
    },
    {
      label: "Teachers",
      detail: `${roles.teacher} accounts`,
      value: roles.teacher,
      icon: BookOpen,
    },
    {
      label: "Admins",
      detail: `${roles.admin} accounts`,
      value: roles.admin,
      icon: Users,
    },
    {
      label: "Materials library",
      detail: `${materialsCount} files uploaded`,
      value: materialsCount,
      icon: FileText,
      attention: materialsCount === 0,
    },
  ]

  const periodSelect = (
    <Select value={range} onValueChange={setRange}>
      <SelectTrigger className="h-8 w-auto min-w-[118px] rounded-md border-[#dbe0e6] bg-white px-2.5 text-[13px] text-[#334155] shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="month">This month</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
        <SelectItem value="2025">Year 2025</SelectItem>
        <SelectItem value="2024">Year 2024</SelectItem>
      </SelectContent>
    </Select>
  )

  return (
    <GrowMainLayout variant="ops" bento={false}>
      <div className="min-h-full min-w-0 overflow-x-hidden bg-[#f4f6f8] font-[family-name:var(--font-outfit)]">
        <div className="w-full max-w-full space-y-5 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#0f172a]">
                Analytics
              </h1>
              <p className="mt-1 text-[14px] text-[#64748b]">
                Platform performance across people, courses, and enrollments
              </p>
            </div>
          </header>

          {loading ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[360px] animate-pulse rounded-lg border border-[#e5e8ee] bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="grid items-stretch gap-5 lg:grid-cols-2">
              {/* Card 1 — Overview */}
              <WaveCard
                title="Overview"
                period={periodSelect}
                footerHref="/admin/users"
                footerLabel="See users and accounts"
              >
                <div className="flex h-full flex-col space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[1.85rem] font-bold tracking-tight tabular-nums text-[#0f172a]">
                        {completionRate}%
                      </p>
                      <Badge className="rounded-full border-0 bg-[#dbeafe] px-2 py-0.5 text-[11px] font-semibold text-[#1d4ed8] shadow-none hover:bg-[#dbeafe]">
                        <Info className="h-3 w-3" />
                        completion
                      </Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-[#64748b]">
                      Net completion across all enrollments
                    </p>
                    <TrendLine
                      text={data?.changes.completion_rate ?? "No prior data"}
                      down={isDown(data?.changes.completion_rate ?? "")}
                    />
                  </div>

                  <div className="mt-auto space-y-3.5">
                    {overviewBars.map((bar) => (
                      <div
                        key={bar.label}
                        className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3"
                      >
                        <span className="text-[13px] text-[#334155]">{bar.label}</span>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2f6]">
                          <div
                            className={cn("h-full rounded-full", bar.color)}
                            style={{ width: `${bar.width}%` }}
                          />
                        </div>
                        <span className="min-w-[2rem] text-right text-[13px] font-semibold tabular-nums text-[#0f172a]">
                          {bar.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </WaveCard>

              {/* Card 2 — Categories (same hero + list rhythm as Overview) */}
              <WaveCard
                title="Course categories"
                period={periodSelect}
                footerHref="/admin/courses"
                footerLabel="See course catalog"
              >
                <div className="flex h-full flex-col space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[1.85rem] font-bold tracking-tight tabular-nums text-[#0f172a]">
                        {courseCategories.length}
                      </p>
                      <Badge className="rounded-full border-0 bg-[#dbeafe] px-2 py-0.5 text-[11px] font-semibold text-[#1d4ed8] shadow-none hover:bg-[#dbeafe]">
                        categories
                      </Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-[#64748b]">
                      Share of courses across the catalog
                    </p>
                    <p className="mt-2 text-[13px] font-medium text-[#64748b]">
                      Top: {courseCategories[0]?.name ?? "—"} · {courseCategories[0]?.value ?? 0}%
                    </p>
                  </div>

                  <div className="mt-auto flex items-center gap-5">
                    <ChartContainer
                      config={donutConfig}
                      className="mx-auto h-[120px] w-[120px] shrink-0 aspect-square"
                    >
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie
                          data={courseCategories}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={36}
                          outerRadius={54}
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {courseCategories.map((entry, i) => (
                            <Cell
                              key={entry.name}
                              fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>

                    <ul className="min-w-0 flex-1 space-y-2.5">
                      {courseCategories.map((cat, i) => (
                        <li
                          key={cat.name}
                          className="grid grid-cols-[1fr_auto] items-center gap-3 text-[13px]"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                              }}
                            />
                            <span className="truncate text-[#334155]">{cat.name}</span>
                          </div>
                          <span className="font-semibold tabular-nums text-[#0f172a]">
                            {cat.value}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </WaveCard>

              {/* Card 3 — Enrollments */}
              <WaveCard
                title="Enrollments"
                period={periodSelect}
                footerHref="/admin/courses"
                footerLabel="See enrollment details"
              >
                <div className="flex h-full flex-col space-y-4">
                  <div>
                    <p className="text-[1.85rem] font-bold tracking-tight tabular-nums text-[#0f172a]">
                      {enrollments.toLocaleString()}
                    </p>
                    <p className="mt-1 text-[13px] text-[#64748b]">
                      Total enrollments · {completed} completed · {inProgress} in progress
                    </p>
                    <TrendLine
                      text={
                        completed > 0
                          ? `${Math.round((completed / Math.max(enrollments, 1)) * 100)}% finished`
                          : data?.changes.courses ?? "No completions yet"
                      }
                      down={completed === 0}
                    />
                  </div>

                  <ChartContainer
                    config={trendConfig}
                    className="mt-auto h-[160px] w-full min-w-0 aspect-auto"
                  >
                    <AreaChart
                      data={enrollmentTrend}
                      margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} stroke="#eef2f6" />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={28}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="enrollments"
                        type="monotone"
                        fill="#2563eb"
                        fillOpacity={0.12}
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
                        activeDot={{ r: 4 }}
                      />
                      <Area
                        dataKey="completions"
                        type="monotone"
                        fill="transparent"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: "#94a3b8", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </WaveCard>

              {/* Card 4 — Accounts */}
              <WaveCard
                title="Accounts"
                period={periodSelect}
                footerHref="/admin/users"
                footerLabel="Go to user directory"
              >
                <div className="flex h-full flex-col">
                  <div>
                    <p className="text-[1.85rem] font-bold tracking-tight tabular-nums text-[#0f172a]">
                      {roleAccounts.reduce((sum, item) => sum + item.value, 0)}
                    </p>
                    <p className="mt-1 text-[13px] text-[#64748b]">
                      Total accounts across roles and library assets
                    </p>
                    <TrendLine
                      text={
                        data?.changes.users
                          ? `${data.changes.users} users`
                          : `${roleAccounts.filter((a) => a.value > 0).length} active roles`
                      }
                      down={false}
                    />
                  </div>

                  <ul className="mt-5 divide-y divide-[#eef2f6]">
                    {roleAccounts.map((item) => {
                      const Icon = item.icon
                      return (
                        <li
                          key={item.label}
                          className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <Icon
                            className="h-5 w-5 shrink-0 text-[#64748b]"
                            strokeWidth={1.5}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-[#0f172a]">
                              {item.label}
                            </p>
                            <p className="truncate text-[12px] text-[#94a3b8]">{item.detail}</p>
                            {item.attention ? (
                              <p className="mt-0.5 text-[12px] font-medium text-[#dc2626]">
                                Needs attention
                              </p>
                            ) : null}
                          </div>
                          <p className="shrink-0 text-[15px] font-semibold tabular-nums text-[#0f172a]">
                            {item.value}
                          </p>
                        </li>
                      )
                    })}
                  </ul>

                  {(data?.recent_activity?.length ?? 0) > 0 ? (
                    <div className="mt-auto border-t border-[#eef2f6] pt-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                        Latest activity
                      </p>
                      <p className="text-[13px] leading-snug text-[#334155]">
                        <span className="font-semibold text-[#0f172a]">
                          {data!.recent_activity[0].user}
                        </span>{" "}
                        {data!.recent_activity[0].action} {data!.recent_activity[0].target}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#94a3b8]">
                        {formatDistanceToNow(new Date(data!.recent_activity[0].occurred_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-auto" />
                  )}
                </div>
              </WaveCard>
            </div>
          )}
        </div>
      </div>
    </GrowMainLayout>
  )
}

function WaveCard({
  title,
  period,
  footerHref,
  footerLabel,
  children,
}: {
  title: string
  period: React.ReactNode
  footerHref: string
  footerLabel: string
  children: ReactNode
}) {
  return (
    <Card className="flex h-full flex-col gap-0 overflow-hidden rounded-lg border border-[#e5e8ee] bg-white py-0 shadow-none">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3 space-y-0 border-b border-[#eef2f6] px-5 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
          {title}
        </p>
        {period}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-5 py-5">{children}</CardContent>
      <CardFooter className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-[#eef2f6] px-5 py-3.5">
        <Link
          href={footerHref}
          className="text-[13px] font-medium leading-none text-[#2563eb] hover:underline"
        >
          {footerLabel}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-[#94a3b8] hover:text-[#64748b]"
              aria-label={`${title} options`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={footerHref}>Open page</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.reload()}>
              Refresh data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

function TrendLine({ text, down }: { text: string; down?: boolean }) {
  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1 text-[13px] font-medium",
        down ? "text-[#dc2626]" : "text-[#16a34a]",
      )}
    >
      {down ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
      {text}
    </p>
  )
}
