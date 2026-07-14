"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Badge } from "@/components/ui/badge"
import { TeacherPageHeader } from "@/components/teacher/teacher-page-header"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { useAuth } from "@/app/provider"
import { apiGet } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import { teacherRoute } from "@/lib/teacher-routes"
import {
  type LucideIcon,
  LayoutDashboard,
  BookOpen,
  Users,
  ListOrdered,
  ClipboardCheck,
  CalendarDays,
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

type StatCard = {
  title: string
  value: number
  icon: LucideIcon
  href: string
  progress: number
  caption: string
  className: string
  iconClassName: string
  progressClassName: string
}

function percent(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

function CircularProgress({
  value,
  className,
}: {
  value: number
  className: string
}) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const background = `conic-gradient(currentColor ${clampedValue * 3.6}deg, color-mix(in srgb, currentColor 18%, transparent) 0deg)`

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ background }}
      aria-label={`${clampedValue}%`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/75 text-[10px] font-semibold shadow-sm dark:bg-slate-950/70">
        {clampedValue}%
      </div>
    </div>
  )
}

export function TeacherDashboard() {
  const { user } = useAuth()
  const { selectedOrgId, selectedOrgSlug, loadingOrgs } = useTeacherOrg()
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
        completedStudents: students.filter((student) => student.completed || student.progress_percent >= 100).length,
        totalStudents: students.length,
        publishedLessons: lessons.filter((lesson) => lesson.status === "published").length,
        totalLessons: lessons.length,
        pendingEvaluations: evaluations.filter((evaluation) => evaluation.status === "pending").length,
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

  const statCards: StatCard[] = selectedOrgSlug
    ? [
        {
          title: "My Courses",
          value: stats.courses,
          icon: BookOpen,
          href: teacherRoute(selectedOrgSlug, "courses"),
          progress: percent(progressData.coursesWithLessons, progressData.totalCourses),
          caption: `${progressData.coursesWithLessons} of ${progressData.totalCourses} with lessons`,
          className: "bg-[#fff5dc] dark:bg-amber-500/10 dark:ring-1 dark:ring-amber-300/10",
          iconClassName: "bg-[#ff806f] text-white dark:bg-orange-500",
          progressClassName: "text-[#ff9f87] dark:text-orange-300",
        },
        {
          title: "Students",
          value: stats.students,
          icon: Users,
          href: teacherRoute(selectedOrgSlug, "students"),
          progress: percent(progressData.completedStudents, progressData.totalStudents),
          caption: `${progressData.completedStudents} of ${progressData.totalStudents} completed`,
          className: "bg-[#ffe2e9] dark:bg-rose-500/10 dark:ring-1 dark:ring-rose-300/10",
          iconClassName: "bg-[#ef4777] text-white dark:bg-rose-500",
          progressClassName: "text-[#f28fab] dark:text-rose-300",
        },
        {
          title: "Lessons",
          value: stats.lessons,
          icon: ListOrdered,
          href: teacherRoute(selectedOrgSlug, "lessons"),
          progress: percent(progressData.publishedLessons, progressData.totalLessons),
          caption: `${progressData.publishedLessons} of ${progressData.totalLessons} published`,
          className: "bg-[#fff4db] dark:bg-amber-500/10 dark:ring-1 dark:ring-amber-300/10",
          iconClassName: "bg-[#ff806f] text-white dark:bg-orange-500",
          progressClassName: "text-[#ff9f87] dark:text-orange-300",
        },
        {
          title: "Pending Grades",
          value: stats.pending_evaluations,
          icon: ClipboardCheck,
          href: teacherRoute(selectedOrgSlug, "evaluations"),
          progress: percent(progressData.pendingEvaluations, progressData.totalEvaluations),
          caption: `${progressData.pendingEvaluations} of ${progressData.totalEvaluations} pending`,
          className: "bg-[#ffe1e8] dark:bg-rose-500/10 dark:ring-1 dark:ring-rose-300/10",
          iconClassName: "bg-[#ef4777] text-white dark:bg-rose-500",
          progressClassName: "text-[#f28fab] dark:text-rose-300",
        },
        {
          title: "Upcoming Sessions",
          value: stats.upcoming_sessions,
          icon: CalendarDays,
          href: teacherRoute(selectedOrgSlug, "sessions"),
          progress: percent(progressData.upcomingSessions, progressData.totalSessions),
          caption: `${progressData.upcomingSessions} of ${progressData.totalSessions} upcoming`,
          className: "bg-[#dff9e8] dark:bg-emerald-500/10 dark:ring-1 dark:ring-emerald-300/10",
          iconClassName: "bg-[#2fcf62] text-white dark:bg-emerald-500",
          progressClassName: "text-[#5fd986] dark:text-emerald-300",
        },
      ]
    : []

  const displayName =
    user?.full_name || user?.name || user?.email?.split("@")[0] || "Teacher"
  const firstName = displayName.split(" ")[0]

  const statVariants = [
    "grow-card-coral",
    "grow-card-accent",
    "grow-card-coral",
    "grow-card-lime",
    "grow-card-dark",
  ] as const

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={LayoutDashboard}
          title={`Hi, ${firstName}`}
          accent="lead with purpose"
          description="Manage your courses, lessons, and student evaluations"
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {statCards.map((stat, index) => {
                const Icon = stat.icon
                const variant = statVariants[index % statVariants.length]
                const isDark = variant === "grow-card-coral" || variant === "grow-card-dark"
                return (
                  <Link key={stat.title} href={stat.href}>
                    <article className={`${variant} p-5 transition-transform hover:-translate-y-0.5`}>
                      <div className="flex h-full items-start justify-between gap-4">
                        <div className="min-w-0 pt-1">
                          <div
                            className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${
                              isDark ? "bg-white/20 text-white" : "bg-white/60 text-[#1a1f2e] dark:bg-white/10"
                            }`}
                          >
                            <Icon className="h-5 w-5 stroke-[1.8]" />
                          </div>
                          <p
                            className={`font-mono text-2xl font-bold leading-none ${isDark ? "text-white" : "text-[#1c1917] dark:text-foreground"}`}
                          >
                            {String(stat.value).padStart(2, "0")}
                          </p>
                          <p
                            className={`mt-2 text-sm font-semibold leading-tight ${isDark ? "text-white/90" : "text-[#1c1917] dark:text-foreground"}`}
                          >
                            {stat.title}
                          </p>
                          <p
                            className={`mt-1 text-xs font-medium leading-tight ${isDark ? "text-white/70" : "text-[#6b5c4f] dark:text-muted-foreground"}`}
                          >
                            {stat.caption}
                          </p>
                        </div>
                        <CircularProgress
                          value={stat.progress}
                          className={isDark ? "text-white/80" : stat.progressClassName}
                        />
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>

            <div className="grow-card p-5">
                <h3 className="setup-type-module-title">Recent Evaluations</h3>
                {recent_evaluations.length === 0 ? (
                  <p className="setup-type-module-sub mt-2">
                    No evaluations yet. Grade students from the Evaluations page.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-border/60">
                    {recent_evaluations.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{ev.full_name || ev.email}</p>
                          <p className="text-xs text-muted-foreground">{ev.course_title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ev.score != null && (
                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {ev.score}%
                            </span>
                          )}
                          <Badge variant={ev.status === "graded" ? "default" : "secondary"}>
                            {ev.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </>
        )}
      </div>
    </GrowMainLayout>
  )
}
