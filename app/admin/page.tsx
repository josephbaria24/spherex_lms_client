"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { apiGet } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { ComponentType, SVGProps } from "react"
import {
  AcademicCapIcon,
  BookOpenIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  DocumentTextIcon,
  UsersIcon,
} from "@heroicons/react/24/outline"
import type { LucideIcon } from "lucide-react"
import {
  Building2,
  Check,
  ChevronDown,
  FileText,
  MessageSquare,
  Plus,
  Star,
  UserPlus,
  ClipboardList,
  FolderOpen,
} from "lucide-react"

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>

type DashboardData = {
  stats: {
    total_users: number
    active_courses: number
    materials: number
    completion_rate: number
    organizations: number
    enrollments: number
    completed_enrollments: number
    in_progress_enrollments: number
    new_users_month: number
    new_courses_week: number
    new_materials_week: number
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

const linkAction = "text-sm font-medium text-primary hover:underline"
const card =
  "rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
/** Matches Customer Hub labels: text-xs font-semibold uppercase tracking-wider text-muted-foreground */
const sectionLabel =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground"
const hubButton =
  "mt-4 block rounded-md border border-border/70 bg-muted/25 py-2.5 text-center text-[13px] font-normal text-foreground transition hover:bg-muted/40"
const hubCardSubtitle = "mt-2 text-sm font-normal leading-snug text-foreground"
const hubMetricValue = "text-3xl font-semibold tabular-nums tracking-tight text-foreground"
const hubMetricMeta = "mt-0.5 text-[13px] font-normal text-muted-foreground"
const hubMetricBand =
  "flex shrink-0 items-end justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4"
const hubTableHead =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
const hubTableRow =
  "grid items-center border-b border-[#eef0f2] px-5 py-2.5 text-sm last:border-b-0 hover:bg-[#fafbfc]/80"
/** PetroBook-style card chrome: header/footer bands with full-width separators */
const hubCardHeader =
  "flex h-[52px] shrink-0 items-center justify-between border-b border-[#e5e7eb] px-5"
const hubCardFooter =
  "flex h-11 shrink-0 items-center border-t border-[#e5e7eb] px-5"
const hubCardFilter =
  "inline-flex h-[30px] items-center gap-1 rounded-md border border-[#e5e7eb] bg-background px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
const hubCardHeaderSpacer =
  "inline-flex h-[30px] items-center gap-1 px-2.5 text-xs font-medium opacity-0 pointer-events-none select-none"

function HubMetricSummary({
  label,
  value,
  meta,
}: {
  label: string
  value: string
  meta: string
}) {
  return (
    <>
      <div className="min-w-0">
        <p className="text-[13px] font-normal text-muted-foreground">{label}</p>
        <p className={cn(hubMetricValue, "mt-0.5 text-[28px] leading-none tracking-[-0.03em]")}>
          {value}
        </p>
      </div>
      <p className={cn(hubMetricMeta, "shrink-0 pb-0.5 text-right")}>{meta}</p>
    </>
  )
}

type PipelineStage = {
  key: string
  label: string
  count: number
  icon: HeroIcon
  href: string
  badge: string | null
}

function PipelineStepper({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="w-full">
      <ol className="flex w-full items-start">
        {stages.map((stage, index) => {
          const Icon = stage.icon

          return (
            <li key={stage.key} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div className="h-px flex-1 bg-[#e5e7eb]" aria-hidden />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}

                <Link
                  href={stage.href}
                  title={`${stage.label}: ${stage.count.toLocaleString()}`}
                  className="relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#64748b] transition-colors hover:border-[#cbd5e1] hover:text-[#0f172a]"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </Link>

                {index < stages.length - 1 ? (
                  <div className="h-px flex-1 bg-[#e5e7eb]" aria-hidden />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>

              <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
                {stage.count.toLocaleString()}
              </p>

              <p className="mt-1.5 text-center text-xs font-normal leading-tight text-muted-foreground">
                {stage.label}
              </p>

              {stage.badge ? (
                <span className="mt-1.5 rounded-full bg-[#fff1e6] px-2 py-0.5 text-[11px] font-medium leading-none text-[#c2410c]">
                  {stage.badge}
                </span>
              ) : (
                <span className="mt-1.5 h-[18px]" aria-hidden />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ShortcutItem({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2.5 text-center"
    >
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition group-hover:border-primary/30 group-hover:text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white shadow-sm">
          <Plus className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      </span>
      <span className="whitespace-nowrap text-xs font-medium leading-none text-muted-foreground">
        {label}
      </span>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await apiGet<DashboardData>("/admin/dashboard"))
    } catch (err) {
      console.error("Error fetching admin dashboard:", err)
      setData(null)
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = data?.stats
  const orgs = stats?.organizations ?? 0
  const users = stats?.total_users ?? 0
  const courses = stats?.active_courses ?? 0
  const materials = stats?.materials ?? 0
  const enrollments = stats?.enrollments ?? 0
  const completed = stats?.completed_enrollments ?? 0
  const inProgress = stats?.in_progress_enrollments ?? 0
  const completion = stats?.completion_rate ?? 0
  const newUsers = stats?.new_users_month ?? 0
  const newCourses = stats?.new_courses_week ?? 0
  const newMaterials = stats?.new_materials_week ?? 0
  const activity = data?.recent_activity ?? []

  const attentionIndex = inProgress > 0 ? 4 : materials === 0 && courses > 0 ? 3 : -1
  const stagesWithActivity = attentionIndex >= 0 ? 1 : 0

  const pipelineStages: PipelineStage[] = [
    {
      key: "orgs",
      label: "Organizations",
      count: orgs,
      icon: BuildingOffice2Icon,
      href: "/admin/organizations",
      badge: null,
    },
    {
      key: "users",
      label: "Users",
      count: users,
      icon: UsersIcon,
      href: "/admin/users",
      badge: null,
    },
    {
      key: "courses",
      label: "Courses",
      count: courses,
      icon: BookOpenIcon,
      href: "/admin/courses",
      badge: null,
    },
    {
      key: "materials",
      label: "Materials",
      count: materials,
      icon: DocumentTextIcon,
      href: "/admin/materials",
      badge: attentionIndex === 3 ? "Needs content" : null,
    },
    {
      key: "progress",
      label: "In progress",
      count: inProgress,
      icon: AcademicCapIcon,
      href: "/admin/users",
      badge: attentionIndex === 4 ? `${inProgress} open` : null,
    },
    {
      key: "done",
      label: "Completions",
      count: completed,
      icon: CheckCircleIcon,
      href: "/admin/courses",
      badge: null,
    },
  ]
  return (
    <GrowMainLayout variant="ops" bento={false}>
      <div className="min-h-full w-full bg-background px-5 py-6 md:px-8 md:py-7">
        {/* Page header — Customer Hub style */}
        <header className="mb-6">
          <p className={sectionLabel}>
            Learning operations
          </p>
          <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Admin Hub Overview
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Platform at a glance</p>
            </div>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium",
                linkAction,
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Give us feedback
            </button>
          </div>
        </header>

        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        ) : error && !data ? (
          <div className={cn(card, "px-6 py-10 text-center")}>
            <p className="text-sm font-semibold text-foreground">Couldn&apos;t load dashboard</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => load()}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Learning pipeline */}
            <section className={cn(card, "overflow-hidden")}>
              <div className={hubCardHeader}>
                <div className="flex min-w-0 items-center gap-2.5">
                  <BriefcaseIcon className="h-4 w-4 shrink-0 text-primary" />
                  <p className={sectionLabel}>Learning pipeline</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" className={hubCardFilter}>
                    Today
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2} />
                  </button>
                  {stagesWithActivity > 0 ? (
                    <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline">
                      {stagesWithActivity} stage{stagesWithActivity === 1 ? "" : "s"} with activity
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="border-b border-[#e5e7eb] px-5 py-3 text-sm font-normal text-muted-foreground">
                Track work from first organization through learning and completions
              </p>

              <div className="hidden px-3 py-8 md:block lg:px-6">
                <PipelineStepper stages={pipelineStages} />
              </div>

              {/* Mobile */}
              <div className="space-y-2 px-4 py-4 md:hidden">
                {pipelineStages.map((stage) => {
                  const Icon = stage.icon
                  return (
                    <Link
                      key={stage.key}
                      href={stage.href}
                      className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] px-3 py-2.5 transition-colors hover:bg-muted/30"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#64748b]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-normal text-foreground">
                        {stage.label}
                      </span>
                      {stage.badge ? (
                        <span className="rounded-full bg-[#fff1e6] px-1.5 py-0.5 text-[10px] font-medium text-[#c2410c]">
                          {stage.badge}
                        </span>
                      ) : null}
                      <span className="text-base font-semibold tabular-nums text-foreground">
                        {stage.count.toLocaleString()}
                      </span>
                    </Link>
                  )
                })}
              </div>

              <div className={cn(hubCardFooter, "justify-between gap-3")}>
                <p className="text-sm font-normal text-muted-foreground">
                  {inProgress > 0
                    ? `${inProgress} open enrollment${inProgress === 1 ? "" : "s"} need attention${completion > 0 ? ` (${completion}% completion rate)` : ""}`
                    : enrollments > 0
                      ? `${completion}% completion rate across all enrollments`
                      : "No enrollments yet — invite learners to get started"}
                </p>
                <Link href="/admin/users" className={cn(linkAction, "shrink-0")}>
                  Review learners
                </Link>
              </div>
            </section>

            {/* Insight cards — 3 column */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <article className={cn(card, "flex flex-col p-5")}>
                <p className={sectionLabel}>
                  New learners
                </p>
                <p className={hubCardSubtitle}>
                  {newUsers > 0
                    ? `${newUsers} learner${newUsers === 1 ? "" : "s"} joined this month`
                    : "No new learners this month"}
                </p>
                <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-[#eef0f3] bg-[#fafbfc]/40 px-4 py-6">
                  <div className="text-center">
                    <p className={hubMetricValue}>
                      {users.toLocaleString()}
                    </p>
                    <p className={hubMetricMeta}>
                      total users · {data?.changes.users}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/users"
                  className={hubButton}
                >
                  Manage users
                </Link>
              </article>

              <article className={cn(card, "flex flex-col p-5")}>
                <p className={sectionLabel}>
                  Course catalog
                </p>
                <p className={hubCardSubtitle}>
                  {newCourses > 0
                    ? `${newCourses} new course${newCourses === 1 ? "" : "s"} this week`
                    : "Catalog is steady this week"}
                </p>
                <div className="mt-4 flex flex-1 items-center justify-center rounded-lg border border-[#eef0f3] bg-[#fafbfc]/40 px-4 py-6">
                  <div className="text-center">
                    <p className={hubMetricValue}>
                      {courses.toLocaleString()}
                    </p>
                    <p className={hubMetricMeta}>
                      active courses · {data?.changes.courses}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/courses"
                  className={hubButton}
                >
                  Manage courses
                </Link>
              </article>

              <article className={cn(card, "flex flex-col p-5")}>
                <p className={sectionLabel}>
                  Completion health
                </p>
                <p className={hubCardSubtitle}>
                  Learners are finishing at {completion}% overall
                </p>
                <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border border-[#eef0f3] bg-[#fafbfc]/40 px-4 py-6">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-5 w-5",
                          i < Math.round(completion / 20)
                            ? "fill-[#fbbf24] text-[#fbbf24]"
                            : "text-[#e5e7eb]",
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(hubMetricMeta, "mt-2")}>
                    {completed.toLocaleString()} completed · {data?.changes.completion_rate}
                  </p>
                </div>
                <Link
                  href="/admin/courses"
                  className={hubButton}
                >
                  View course performance
                </Link>
              </article>
            </div>

            {/* Tasks + Shortcuts */}
            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
              <section className={cn(card, "flex min-h-[260px] flex-col overflow-hidden")}>
                <div className={hubCardHeader}>
                  <p className={sectionLabel}>Tasks</p>
                  <button type="button" className={hubCardFilter}>
                    All open tasks
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2} />
                  </button>
                </div>

                {inProgress > 0 ? (
                  <div className="flex flex-1 flex-col justify-center px-5 py-4">
                    <div className="flex items-start gap-3 py-1">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-normal text-foreground">
                          {inProgress} enrollment{inProgress === 1 ? "" : "s"} still in progress
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                          Follow up with learners who haven&apos;t finished their courses yet.
                        </p>
                      </div>
                      <Link href="/admin/users" className={cn(linkAction, "shrink-0 text-[13px]")}>
                        Review
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22c55e] text-white">
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <p className="mt-3 text-sm font-normal text-foreground">
                      You&apos;re caught up!
                    </p>
                    <p className="mt-1 max-w-[240px] text-[13px] leading-relaxed text-muted-foreground">
                      You don&apos;t have any tasks to do. Check back soon to stay on top of
                      things.
                    </p>
                  </div>
                )}

                <div className={hubCardFooter}>
                  <Link href="/admin/users" className={linkAction}>
                    Show all
                  </Link>
                </div>
              </section>

              <section className={cn(card, "flex min-h-[260px] flex-col overflow-hidden")}>
                <div className={hubCardHeader}>
                  <p className={sectionLabel}>Shortcuts</p>
                  <span className={hubCardHeaderSpacer} aria-hidden="true">
                    All open tasks
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  </span>
                </div>
                <div className="flex flex-1 items-center px-5 py-6">
                  <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4">
                    <ShortcutItem
                      href="/admin/users"
                      label="New user"
                      icon={UserPlus}
                    />
                    <ShortcutItem
                      href="/admin/organizations"
                      label="New organization"
                      icon={Building2}
                    />
                    <ShortcutItem
                      href="/admin/courses"
                      label="Create course"
                      icon={ClipboardList}
                    />
                    <ShortcutItem
                      href="/admin/materials"
                      label="Upload material"
                      icon={FolderOpen}
                    />
                  </div>
                </div>
                <div className={hubCardFooter} aria-hidden="true">
                  <span className="invisible text-sm font-medium">Show all</span>
                </div>
              </section>
            </div>

            {/* Activity + CTA */}
            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1.35fr_1fr]">
              <section className={cn(card, "flex min-h-[320px] flex-col overflow-hidden")}>
                <div className={hubCardHeader}>
                  <p className={sectionLabel}>Recent activity</p>
                  <span className={cn(hubCardFilter, "pointer-events-none")}>
                    As of today
                  </span>
                </div>

                <div className={hubMetricBand}>
                  <HubMetricSummary
                    label="Total of recent events"
                    value={activity.length.toLocaleString()}
                    meta={`${enrollments.toLocaleString()} total enrollment${enrollments === 1 ? "" : "s"}`}
                  />
                </div>

                {activity.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center px-5 py-8">
                    <p className="text-[13px] font-normal text-muted-foreground">
                      No recent activity yet.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-x-auto">
                    <div className="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1.35fr)] border-b border-[#eef0f2] bg-[#fafbfc]/70 px-5 py-2">
                      <span className={hubTableHead}>User</span>
                      <span className={hubTableHead}>Date</span>
                      <span className={cn(hubTableHead, "text-right")}>Course</span>
                    </div>
                    {activity.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          hubTableRow,
                          "grid-cols-[minmax(0,1fr)_88px_minmax(0,1.35fr)]",
                        )}
                      >
                        <span className="truncate">
                          <span className={cn(linkAction, "text-[13px]")}>{item.user}</span>
                        </span>
                        <span className="text-[13px] text-muted-foreground">
                          {format(new Date(item.occurred_at), "M/d/yy")}
                        </span>
                        <span className="truncate text-right text-[13px] font-normal text-foreground">
                          {item.target}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={hubCardFooter}>
                  <button
                    type="button"
                    onClick={() => load()}
                    className={linkAction}
                  >
                    View activity
                  </button>
                </div>
              </section>

              <section className={cn(card, "flex min-h-[320px] flex-col overflow-hidden")}>
                <div className={hubCardHeader}>
                  <p className={sectionLabel}>Materials library</p>
                  <span className={cn(hubCardFilter, "pointer-events-none opacity-0")} aria-hidden="true">
                    As of today
                  </span>
                </div>

                <div className={hubMetricBand}>
                  <HubMetricSummary
                    label="Total materials"
                    value={materials.toLocaleString()}
                    meta={
                      newMaterials > 0
                        ? `${newMaterials} uploaded this week`
                        : "No uploads this week"
                    }
                  />
                </div>

                {materials === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eef0f3] bg-[#fafbfc] text-muted-foreground">
                      <FileText className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <p className="mt-3 max-w-[220px] text-[13px] leading-relaxed text-muted-foreground">
                      You have no learning materials yet.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary">
                      <FileText className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <p className="mt-3 max-w-[240px] text-[13px] leading-relaxed text-muted-foreground">
                      Keep your e-learning library current so teachers and learners always have
                      what they need.
                    </p>
                  </div>
                )}

                <div className={hubCardFooter}>
                  <Link href="/admin/materials" className={linkAction}>
                    {materials === 0 ? "Upload a material" : "Browse materials"}
                  </Link>
                </div>
              </section>
            </div>

            <p className="pb-2 text-center text-xs text-muted-foreground">
              Updated {formatDistanceToNow(new Date(), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>
    </GrowMainLayout>
  )
}
