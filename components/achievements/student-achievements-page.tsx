"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  Flame,
  GraduationCap,
  History,
  Medal,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { LearnAchievementsPayload } from "@/lib/learn-achievements-types"

type StudentAchievementsPageProps = {
  data: LearnAchievementsPayload
}

type Milestone = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  earned: boolean
}

type TabKey = "overview" | "progress" | "certificates" | "history"

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function activityIcon(kind: string): LucideIcon {
  switch (kind) {
    case "course_completed":
      return GraduationCap
    case "quiz_attempt":
      return Target
    case "enrolled":
      return BookOpen
    default:
      return CheckCircle2
  }
}

function buildMilestones(summary: LearnAchievementsPayload["summary"]): Milestone[] {
  return [
    {
      id: "first-lesson",
      title: "First step",
      description: "Complete your first lesson",
      icon: Sparkles,
      earned: summary.lessons_completed >= 1,
    },
    {
      id: "lesson-10",
      title: "Dedicated learner",
      description: "Complete 10 lessons",
      icon: BookOpen,
      earned: summary.lessons_completed >= 10,
    },
    {
      id: "streak-7",
      title: "On fire",
      description: "Maintain a 7-day learning streak",
      icon: Flame,
      earned: summary.streak_days >= 7,
    },
    {
      id: "course-done",
      title: "Course graduate",
      description: "Finish your first course",
      icon: GraduationCap,
      earned: summary.courses_completed >= 1,
    },
    {
      id: "certified",
      title: "Certified",
      description: "Earn your first certificate",
      icon: Award,
      earned: summary.certificates >= 1,
    },
    {
      id: "quiz-5",
      title: "Quiz master",
      description: "Complete 5 quiz attempts",
      icon: Medal,
      earned: summary.quiz_attempts >= 5,
    },
  ]
}

export function StudentAchievementsPage({ data }: StudentAchievementsPageProps) {
  const { summary, enrollments, certificates, activity_history } = data
  const [tab, setTab] = useState<TabKey>("overview")
  const milestones = buildMilestones(summary)
  const earnedCount = milestones.filter((m) => m.earned).length
  const inProgressCourses = enrollments.filter((e) => !e.completed)
  const completedCourses = enrollments.filter((e) => e.completed)

  const growth =
    summary.knowledge_growth_percent >= 0
      ? `+${summary.knowledge_growth_percent}%`
      : `${summary.knowledge_growth_percent}%`

  const tabs: { id: TabKey; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "progress", label: "Progress", count: enrollments.length },
    { id: "certificates", label: "Certificates", count: certificates.length },
    { id: "history", label: "History", count: activity_history.length },
  ]

  return (
    <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
      <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
              Learning workspace
            </p>
            <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
              Achievements
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
              Track milestones, certificates, and your full learning history.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-lg border-[#e2e8f0] bg-white shadow-none"
          >
            <Link href="/courses">
              <BookOpen className="mr-1.5 h-4 w-4 text-[#64748b]" strokeWidth={1.5} />
              My courses
            </Link>
          </Button>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Flame}
            value={summary.streak_days}
            label="Learning streak"
            hint={`${summary.streak_days === 1 ? "day" : "days"} active`}
          />
          <MetricCard
            icon={BookOpen}
            value={summary.lessons_completed}
            label="Lessons completed"
            hint={`${growth} vs last week`}
          />
          <MetricCard
            icon={Award}
            value={summary.certificates}
            label="Certificates"
            hint="Credentials earned"
          />
          <MetricCard
            icon={GraduationCap}
            value={summary.courses_completed}
            label="Courses finished"
            hint={`of ${summary.courses_enrolled} enrolled`}
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-4 border-b border-[#eef0f4] px-4 py-3 sm:gap-5">
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
                {item.count != null ? (
                  <span className="ml-1 tabular-nums">{item.count}</span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-6">
            {tab === "overview" && (
              <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[#0f172a]">Milestones</h2>
                      <p className="mt-1 text-sm text-[#64748b]">
                        {earnedCount} of {milestones.length} unlocked
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-1 text-[11px] font-semibold tabular-nums text-[#475569]">
                      <Trophy className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {earnedCount}/{milestones.length}
                    </span>
                  </div>

                  <ul className="mt-4 divide-y divide-[#f1f5f9] overflow-hidden rounded-lg border border-[#e2e8f0]">
                    {milestones.map((milestone) => {
                      const Icon = milestone.icon
                      return (
                        <li
                          key={milestone.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3.5",
                            !milestone.earned && "opacity-60",
                          )}
                        >
                          <Icon
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#64748b]"
                            strokeWidth={1.5}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[#0f172a]">
                                {milestone.title}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                                  milestone.earned
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-[#f1f5f9] text-[#94a3b8]",
                                )}
                              >
                                {milestone.earned ? "Unlocked" : "Locked"}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[#94a3b8]">{milestone.description}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div className="rounded-lg border border-[#e2e8f0] bg-[#fafbfc] p-5">
                  <h2 className="text-base font-semibold text-[#0f172a]">Weekly goal</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {summary.hours_completed}h of {summary.hours_goal}h learning time
                  </p>

                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-[#64748b]">Progress</span>
                      <span className="font-medium tabular-nums text-[#0f172a]">
                        {summary.weekly_goal_percent}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#eef2f6]">
                      <div
                        className="h-full rounded-full bg-[#0f172a]"
                        style={{
                          width: `${Math.min(100, summary.weekly_goal_percent)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-[#e2e8f0] pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748b]">Quiz attempts</span>
                      <span className="font-medium tabular-nums text-[#0f172a]">
                        {summary.quiz_attempts}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748b]">Enrolled courses</span>
                      <span className="font-medium tabular-nums text-[#0f172a]">
                        {summary.courses_enrolled}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748b]">Milestones unlocked</span>
                      <span className="font-medium tabular-nums text-[#0f172a]">
                        {earnedCount}/{milestones.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "progress" &&
              (enrollments.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No course progress yet"
                  body="Enroll in a course to get started."
                  actionHref="/courses"
                  actionLabel="Browse courses"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                        <th className={thClass}>Course</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Lessons</th>
                        <th className={thClass}>Progress</th>
                        <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="transition-colors hover:bg-[#fafbfc]">
                          <td className="py-3.5 pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <BookOpen
                                className="h-5 w-5 shrink-0 text-[#64748b]"
                                strokeWidth={1.5}
                              />
                              <p className="truncate text-sm font-semibold text-[#0f172a]">
                                {enrollment.course.title}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={cn(
                                "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
                                enrollment.completed
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-[#f1f5f9] text-[#64748b]",
                              )}
                            >
                              {enrollment.completed ? "Completed" : "In progress"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                            {enrollment.lessons_completed} / {enrollment.lessons_total}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex min-w-[120px] items-center gap-3">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f1f5f9]">
                                <div
                                  className="h-full rounded-full bg-[#0f172a]"
                                  style={{
                                    width: `${Math.min(100, enrollment.progress_percent)}%`,
                                  }}
                                />
                              </div>
                              <span className="w-10 text-right text-sm tabular-nums text-[#64748b]">
                                {enrollment.progress_percent}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 pr-4">
                            <div className="flex justify-end">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-lg border-[#e2e8f0] shadow-none"
                              >
                                <Link href={`/courses/${enrollment.course_id}/learn`}>
                                  {enrollment.completed ? "Review" : "Continue"}
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === "certificates" &&
              (certificates.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No certificates yet"
                  body="Complete a course to earn one."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                        <th className={thClass}>Certificate</th>
                        <th className={thClass}>Issued</th>
                        <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {certificates.map((cert) => (
                        <tr key={cert.id} className="transition-colors hover:bg-[#fafbfc]">
                          <td className="py-3.5 pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <Award
                                className="h-5 w-5 shrink-0 text-[#64748b]"
                                strokeWidth={1.5}
                              />
                              <p className="truncate text-sm font-semibold text-[#0f172a]">
                                {cert.course_title ?? "Course certificate"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {formatDate(cert.issued_at)}
                          </td>
                          <td className="px-4 py-3.5 pr-4">
                            <div className="flex justify-end">
                              {cert.certificate_url ? (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 rounded-lg border-[#e2e8f0] shadow-none"
                                >
                                  <a
                                    href={cert.certificate_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download
                                      className="h-3.5 w-3.5 text-[#64748b]"
                                      strokeWidth={1.5}
                                    />
                                    View
                                    <ExternalLink
                                      className="h-3 w-3 text-[#94a3b8]"
                                      strokeWidth={1.5}
                                    />
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-sm text-[#94a3b8]">On file</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === "history" &&
              (activity_history.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No activity yet"
                  body="Your learning history will appear here as you complete lessons and quizzes."
                />
              ) : (
                <ul className="divide-y divide-[#f1f5f9]">
                  {activity_history.map((item, index) => {
                    const Icon = activityIcon(item.kind)
                    return (
                      <li
                        key={`${item.kind}-${item.occurred_at}-${index}`}
                        className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <Icon
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#64748b]"
                            strokeWidth={1.5}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0f172a]">{item.label}</p>
                            <p className="mt-0.5 text-xs text-[#94a3b8]">
                              {item.detail}
                              {item.course_title && item.kind !== "course_completed"
                                ? ` · ${item.course_title}`
                                : null}
                            </p>
                          </div>
                        </div>
                        <time className="shrink-0 text-xs tabular-nums text-[#94a3b8]">
                          {formatDateTime(item.occurred_at)}
                        </time>
                      </li>
                    )
                  })}
                </ul>
              ))}
          </div>
        </section>

        {(inProgressCourses.length > 0 || completedCourses.length > 0) && tab === "overview" ? (
          <p className="text-xs text-[#94a3b8]">
            {inProgressCourses.length} in progress · {completedCourses.length} completed
          </p>
        ) : null}
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

function EmptyState({
  icon: Icon,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon
  title: string
  body: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
      <p className="mt-3 text-sm font-medium text-[#0f172a]">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">{body}</p>
      {actionHref && actionLabel ? (
        <Button
          asChild
          className="mt-5 h-9 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
        >
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
