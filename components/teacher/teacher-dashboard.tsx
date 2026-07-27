"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { TeacherOrgSelector } from "@/components/teacher/teacher-org-selector"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { useAuth } from "@/app/provider"
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
import { apiGet } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import { teacherRoute } from "@/lib/teacher-routes"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ListOrdered,
  MoreVertical,
  Users,
} from "lucide-react"

type DashboardData = {
  stats: {
    courses: number
    students: number
    lessons: number
    pending_evaluations: number
    upcoming_sessions: number
  }
  recent_evaluations: {
    id: string
    score: number | null
    status: string
    updated_at: string
    full_name: string | null
    email: string
    course_title: string
  }[]
}

type Course = {
  id: string
  lesson_count?: number
}

type Lesson = {
  id: string
  course_id?: string
  status?: string
}

type StudentRow = {
  enrollment_id: string
  progress_percent: number
  completed: boolean
}

type Evaluation = {
  id: string
  status: "pending" | "graded" | "returned"
}

type Session = {
  id: string
  status?: string | null
  scheduled_date: string
}

type DashboardProgress = {
  coursesWithLessons: number
  totalCourses: number
  completedStudents: number
  totalStudents: number
  publishedLessons: number
  totalLessons: number
  pendingEvaluations: number
  totalEvaluations: number
  upcomingSessions: number
  totalSessions: number
}

function percent(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

export function TeacherDashboard() {
  const { user } = useAuth()
  const { selectedOrgId, selectedOrgSlug, selectedOrg, loadingOrgs } = useTeacherOrg()
  const [range, setRange] = useState("month")
  const [data, setData] = useState<DashboardData | null>(null)
  const [progressData, setProgressData] = useState<DashboardProgress>({
    coursesWithLessons: 0,
    totalCourses: 0,
    completedStudents: 0,
    totalStudents: 0,
    publishedLessons: 0,
    totalLessons: 0,
    pendingEvaluations: 0,
    totalEvaluations: 0,
    upcomingSessions: 0,
    totalSessions: 0,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setData(null)
      setProgressData({
        coursesWithLessons: 0,
        totalCourses: 0,
        completedStudents: 0,
        totalStudents: 0,
        publishedLessons: 0,
        totalLessons: 0,
        pendingEvaluations: 0,
        totalEvaluations: 0,
        upcomingSessions: 0,
        totalSessions: 0,
      })
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const [dashboardRes, coursesRes, lessonsRes, studentsRes, evaluationsRes, sessionsRes] =
        await Promise.all([
          apiGet<DashboardData>(teacherApiPath(selectedOrgId, "/dashboard")),
          apiGet<{ courses: Course[] }>(teacherApiPath(selectedOrgId, "/courses")),
          apiGet<{ lessons: Lesson[] }>(teacherApiPath(selectedOrgId, "/lessons")),
          apiGet<{ students: StudentRow[] }>(teacherApiPath(selectedOrgId, "/students")),
          apiGet<{ evaluations: Evaluation[] }>(teacherApiPath(selectedOrgId, "/evaluations")),
          apiGet<{ sessions: Session[] }>(teacherApiPath(selectedOrgId, "/sessions")),
        ])

      const courses = coursesRes.courses ?? []
      const lessons = lessonsRes.lessons ?? []
      const students = studentsRes.students ?? []
      const evaluations = evaluationsRes.evaluations ?? []
      const sessions = sessionsRes.sessions ?? []
      const courseIdsWithLessons = new Set(
        lessons.map((lesson) => lesson.course_id).filter(Boolean),
      )
      const now = Date.now()

      setData(dashboardRes)
      setProgressData({
        coursesWithLessons: courses.filter(
          (course) => (course.lesson_count ?? 0) > 0 || courseIdsWithLessons.has(course.id),
        ).length,
        totalCourses: courses.length,
        completedStudents: students.filter(
          (student) => student.completed || student.progress_percent >= 100,
        ).length,
        totalStudents: students.length,
        publishedLessons: lessons.filter((lesson) => lesson.status === "published").length,
        totalLessons: lessons.length,
        pendingEvaluations: evaluations.filter((evaluation) => evaluation.status === "pending")
          .length,
        totalEvaluations: evaluations.length,
        upcomingSessions: sessions.filter((session) => {
          if (session.status) return session.status === "upcoming"
          return new Date(session.scheduled_date).getTime() >= now
        }).length,
        totalSessions: sessions.length,
      })
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  const stats = data?.stats ?? {
    courses: 0,
    students: 0,
    lessons: 0,
    pending_evaluations: 0,
    upcoming_sessions: 0,
  }
  const recent_evaluations = data?.recent_evaluations ?? []

  const displayName =
    user?.full_name || user?.name || user?.email?.split("@")[0] || "Teacher"
  const firstName = displayName.split(" ")[0]
  const orgName = selectedOrg?.organization?.name ?? "your organization"
  const slug = selectedOrgSlug ?? ""

  const periodSelect = (
    <Select value={range} onValueChange={setRange}>
      <SelectTrigger className="h-8 w-auto min-w-[118px] rounded-md border-[#dbe0e6] bg-white px-2.5 text-[13px] text-[#334155] shadow-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="month">This month</SelectItem>
        <SelectItem value="week">This week</SelectItem>
        <SelectItem value="all">All time</SelectItem>
      </SelectContent>
    </Select>
  )

  const teachingBars = useMemo(() => {
    const rows = [
      {
        label: "Courses ready",
        part: progressData.coursesWithLessons,
        total: progressData.totalCourses,
        color: "bg-[#0f172a]",
      },
      {
        label: "Lessons published",
        part: progressData.publishedLessons,
        total: progressData.totalLessons,
        color: "bg-[#334155]",
      },
      {
        label: "Students completed",
        part: progressData.completedStudents,
        total: progressData.totalStudents,
        color: "bg-[#64748b]",
      },
    ]
    return rows.map((row) => ({
      ...row,
      width: Math.max(row.total > 0 ? percent(row.part, row.total) : 0, row.part > 0 ? 8 : 0),
      caption: `${row.part} of ${row.total}`,
    }))
  }, [progressData])

  const queueItems = [
    {
      label: "Pending grades",
      detail: `${progressData.pendingEvaluations} of ${progressData.totalEvaluations} awaiting review`,
      value: stats.pending_evaluations,
      icon: ClipboardCheck,
      href: slug ? teacherRoute(slug, "evaluations") : "#",
      attention: stats.pending_evaluations > 0,
    },
    {
      label: "Upcoming sessions",
      detail: `${progressData.upcomingSessions} of ${progressData.totalSessions} scheduled`,
      value: stats.upcoming_sessions,
      icon: CalendarDays,
      href: slug ? teacherRoute(slug, "sessions") : "#",
    },
    {
      label: "Active students",
      detail: `${progressData.completedStudents} completed coursework`,
      value: stats.students,
      icon: Users,
      href: slug ? teacherRoute(slug, "students") : "#",
    },
    {
      label: "Lesson library",
      detail: `${progressData.publishedLessons} published`,
      value: stats.lessons,
      icon: ListOrdered,
      href: slug ? teacherRoute(slug, "lessons") : "#",
    },
  ]

  return (
    <GrowMainLayout>
      <div className="-m-4 min-h-full bg-[#f4f6f8] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-5 px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                Teaching workspace
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-semibold tracking-tight text-[#0f172a] md:text-[2rem]">
                Hi, {firstName}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-[#64748b]">
                Manage courses, lessons, and evaluations for {orgName}.
              </p>
            </div>
            <TeacherOrgSelector />
          </header>

          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[300px] animate-pulse rounded-lg border border-[#e5e8ee] bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <PanelCard
                title="Teaching overview"
                period={periodSelect}
                footerHref={slug ? teacherRoute(slug, "courses") : "#"}
                footerLabel="See my courses"
              >
                <div className="space-y-5">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <p className="text-[1.85rem] font-bold tracking-tight tabular-nums text-[#0f172a]">
                        {stats.courses}
                      </p>
                      <p className="text-[13px] text-[#64748b]">courses assigned to you</p>
                    </div>
                    <p className="mt-1 text-[13px] text-[#94a3b8]">
                      {progressData.coursesWithLessons} with lessons · {stats.lessons} total lessons
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {teachingBars.map((bar) => (
                      <div
                        key={bar.label}
                        className="grid grid-cols-[8.5rem_1fr_auto] items-center gap-3"
                      >
                        <span className="text-[13px] text-[#334155]">{bar.label}</span>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2f6]">
                          <div
                            className={cn("h-full rounded-full", bar.color)}
                            style={{ width: `${bar.width}%` }}
                          />
                        </div>
                        <span className="min-w-[3.5rem] text-right text-[12px] tabular-nums text-[#64748b]">
                          {bar.caption}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </PanelCard>

              <PanelCard
                title="Work queue"
                period={periodSelect}
                footerHref={slug ? teacherRoute(slug, "evaluations") : "#"}
                footerLabel="Open evaluations"
              >
                <ul className="divide-y divide-[#eef2f6]">
                  {queueItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-4 py-4 transition hover:bg-[#fafbfc] first:pt-1 last:pb-1"
                        >
                          <Icon
                            className="h-5 w-5 shrink-0 text-[#64748b]"
                            strokeWidth={1.5}
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="truncate text-[14px] font-medium text-[#0f172a]">
                              {item.label}
                            </p>
                            <p className="truncate text-[12px] leading-relaxed text-[#94a3b8]">
                              {item.detail}
                            </p>
                            {item.attention ? (
                              <p className="pt-0.5 text-[12px] font-medium text-[#dc2626]">
                                Needs attention
                              </p>
                            ) : null}
                          </div>
                          <p className="shrink-0 text-[15px] font-semibold tabular-nums text-[#0f172a]">
                            {item.value}
                          </p>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </PanelCard>

              <PanelCard
                title="Learner progress"
                period={periodSelect}
                footerHref={slug ? teacherRoute(slug, "students") : "#"}
                footerLabel="See all students"
              >
                <div className="space-y-5">
                  <div>
                    <p className="text-[1.85rem] font-bold tracking-tight tabular-nums text-[#0f172a]">
                      {stats.students}
                    </p>
                    <p className="mt-1 text-[13px] text-[#64748b]">
                      students across your courses
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat
                      label="Completed"
                      value={progressData.completedStudents}
                      hint={`${percent(progressData.completedStudents, progressData.totalStudents)}%`}
                    />
                    <MiniStat
                      label="In progress"
                      value={Math.max(
                        progressData.totalStudents - progressData.completedStudents,
                        0,
                      )}
                      hint="still learning"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-[12px] text-[#64748b]">
                      <span>Completion rate</span>
                      <span className="font-medium tabular-nums text-[#0f172a]">
                        {percent(progressData.completedStudents, progressData.totalStudents)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eef2f6]">
                      <div
                        className="h-full rounded-full bg-[#0f172a]"
                        style={{
                          width: `${percent(progressData.completedStudents, progressData.totalStudents)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </PanelCard>

              <PanelCard
                title="Recent evaluations"
                period={periodSelect}
                footerHref={slug ? teacherRoute(slug, "evaluations") : "#"}
                footerLabel="Go to evaluations"
              >
                {recent_evaluations.length === 0 ? (
                  <div className="flex min-h-[180px] flex-col items-start justify-center">
                    <ClipboardCheck
                      className="h-5 w-5 text-[#94a3b8]"
                      strokeWidth={1.5}
                    />
                    <p className="mt-3 text-[14px] font-medium text-[#0f172a]">
                      No evaluations yet
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#64748b]">
                      When you grade students, their latest results will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#eef2f6]">
                    {recent_evaluations.slice(0, 5).map((ev) => (
                      <li
                        key={ev.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-[#0f172a]">
                            {ev.full_name || ev.email}
                          </p>
                          <p className="truncate text-[12px] text-[#94a3b8]">{ev.course_title}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {ev.score != null ? (
                            <span className="text-[13px] font-semibold tabular-nums text-[#0f172a]">
                              {ev.score}%
                            </span>
                          ) : null}
                          <StatusPill status={ev.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </PanelCard>
            </div>
          )}

          {!loading && slug ? (
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { label: "Courses", href: teacherRoute(slug, "courses"), icon: BookOpen },
                  { label: "Lessons", href: teacherRoute(slug, "lessons"), icon: ListOrdered },
                  { label: "Students", href: teacherRoute(slug, "students"), icon: Users },
                  {
                    label: "Sessions",
                    href: teacherRoute(slug, "sessions"),
                    icon: CalendarDays,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.label}
                    asChild
                    variant="outline"
                    className="h-9 gap-1.5 rounded-lg border-[#e2e8f0] bg-white text-[13px] shadow-none"
                  >
                    <Link href={item.href}>
                      <Icon className="h-3.5 w-3.5 text-[#64748b]" strokeWidth={1.5} />
                      {item.label}
                    </Link>
                  </Button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </GrowMainLayout>
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

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "graded"
      ? "bg-emerald-50 text-emerald-700"
      : status === "returned"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700"
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        tone,
      )}
    >
      {status}
    </span>
  )
}
