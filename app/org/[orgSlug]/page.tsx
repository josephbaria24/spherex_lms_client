"use client"

import { PageLoader } from "@/components/ui/spinner"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { OrgSelector } from "@/components/org/org-selector"
import { OrgLogo } from "@/components/org/org-logo"
import { useOrgAdmin } from "@/components/org/org-provider"
import { apiGet } from "@/lib/api"
import { orgRoute } from "@/lib/org-routes"
import {
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  Copy,
  Settings2,
  ArrowUpRight,
  Check,
} from "lucide-react"
import { toast } from "sonner"

type DashboardData = {
  organization: {
    id: string
    name: string
    slug: string
    status: string
    industry?: string | null
    logo?: string | null
    teacher_join_code: string
    student_join_code?: string | null
    brand_primary?: string | null
    brand_accent?: string | null
    logo_padding?: number | null
    logo_position_x?: number | null
    logo_position_y?: number | null
    max_members?: number | null
  }
  stats: {
    members: number
    courses: number
    students: number
    teachers: number
  }
}

export default function OrgAdminDashboardPage() {
  const { selectedOrgId, selectedOrgSlug, loadingOrgs } = useOrgAdmin()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<"teacher" | "student" | null>(null)

  const load = useCallback(async () => {
    if (!selectedOrgId) return
    setLoading(true)
    try {
      const res = await apiGet<DashboardData>(`/org-admin/${selectedOrgId}/dashboard`)
      setData(res)
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId])

  useEffect(() => {
    if (!loadingOrgs) load()
  }, [load, loadingOrgs])

  const slug = selectedOrgSlug ?? data?.organization.slug ?? ""
  const org = data?.organization
  const memberLimit = org?.max_members
  const atCapacity =
    memberLimit != null && data != null && data.stats.members >= memberLimit
  const capacityPct =
    memberLimit != null && data != null && memberLimit > 0
      ? Math.min(100, Math.round((data.stats.members / memberLimit) * 100))
      : null

  const stats = data
    ? [
        {
          label: "Members",
          value: data.stats.members,
          caption: memberLimit != null ? `of ${memberLimit} capacity` : "All roles",
          icon: Users,
          href: orgRoute(slug, "members"),
          variant: "grow-card-coral" as const,
        },
        {
          label: "Courses",
          value: data.stats.courses,
          caption: "In your catalog",
          icon: BookOpen,
          href: orgRoute(slug, "courses"),
          variant: "grow-card" as const,
        },
        {
          label: "Students",
          value: data.stats.students,
          caption: "Active learners",
          icon: GraduationCap,
          href: orgRoute(slug, "members"),
          variant: "grow-card-lime" as const,
        },
        {
          label: "Teachers",
          value: data.stats.teachers,
          caption: "Instructors",
          icon: Users,
          href: orgRoute(slug, "members"),
          variant: "grow-card-dark" as const,
        },
      ]
    : []

  const quickActions = [
    {
      icon: Users,
      title: "Manage members",
      desc: "Invite, review, and update roles",
      href: orgRoute(slug, "members"),
    },
    {
      icon: BookOpen,
      title: "Browse courses",
      desc: "Preview your org course catalog",
      href: orgRoute(slug, "courses"),
    },
    {
      icon: Settings2,
      title: "Organization settings",
      desc: "Branding, join codes, and details",
      href: orgRoute(slug, "settings"),
    },
  ]

  async function copyCode(code: string, key: "teacher" | "student") {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedKey(key)
      toast.success("Copied to clipboard")
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600)
    } catch {
      toast.error("Could not copy code")
    }
  }

  const statusLabel = org?.status
    ? org.status.charAt(0).toUpperCase() + org.status.slice(1)
    : null

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Building2}
          title="Organization"
          accent="command center"
          description="Members, courses, and join access for your training org"
          showDate
        >
          <OrgSelector />
        </PageHeader>

        {loading || !data || !org ? (
          <PageLoader label="Loading…" className="min-h-[20vh] py-6" />
        ) : (
          <>
            <section className="grow-card overflow-hidden p-5 md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <OrgLogo
                    logo={org.logo}
                    name={org.name}
                    brandColor={org.brand_primary}
                    className="h-16 w-16 shrink-0 rounded-2xl"
                    logo_padding={org.logo_padding}
                    logo_position_x={org.logo_position_x}
                    logo_position_y={org.logo_position_y}
                  />
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-extrabold tracking-[-0.03em] text-neutral-950 dark:text-foreground md:text-2xl">
                        {org.name}
                      </h2>
                      {statusLabel ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                            org.status === "active"
                              ? "bg-[#FFE8E0] text-[#FF4B1A]"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-muted-foreground">
                      {[org.industry, `/${org.slug}`].filter(Boolean).join(" · ")}
                    </p>
                    {capacityPct != null && memberLimit != null ? (
                      <div className="max-w-sm space-y-1.5 pt-1">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium text-neutral-600 dark:text-muted-foreground">
                            Member capacity
                          </span>
                          <span className="font-semibold tabular-nums text-neutral-900 dark:text-foreground">
                            {data.stats.members} / {memberLimit}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#f3ede4] dark:bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              atCapacity ? "bg-amber-500" : "bg-[#FF4B1A]"
                            }`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                        {atCapacity ? (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            Limit reached — contact PetroCademia support to increase capacity.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <Link
                  href={orgRoute(slug, "settings")}
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:border-[#FFD8C8] hover:bg-[#FFF8F5] dark:border-border dark:bg-card dark:text-foreground dark:hover:border-[#FF4B1A]/35"
                >
                  <Settings2 className="h-4 w-4 stroke-[1.5]" />
                  Settings
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                const isDark =
                  stat.variant === "grow-card-coral" || stat.variant === "grow-card-dark"
                return (
                  <Link key={stat.label} href={stat.href} className="group block">
                    <article
                      className={`${stat.variant} h-full p-4 transition-transform group-hover:-translate-y-0.5 md:p-5`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium ${
                              isDark ? "text-white/75" : "text-muted-foreground"
                            }`}
                          >
                            {stat.label}
                          </p>
                          <p
                            className={`mt-1 font-mono text-2xl font-bold tracking-tight md:text-3xl ${
                              isDark ? "text-white" : "text-[#1c1917] dark:text-foreground"
                            }`}
                          >
                            {String(stat.value).padStart(2, "0")}
                          </p>
                          <p
                            className={`mt-1 text-[11px] font-medium ${
                              isDark ? "text-white/70" : "text-neutral-500 dark:text-muted-foreground"
                            }`}
                          >
                            {stat.caption}
                          </p>
                        </div>
                        <div
                          className={`rounded-2xl p-2.5 ${
                            isDark
                              ? "bg-white/20 text-white"
                              : "bg-[#FFE8E0] text-[#FF4B1A] dark:bg-muted dark:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 stroke-[1.5]" />
                        </div>
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <section className="grow-card p-5 lg:col-span-3 md:p-6">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-foreground">
                      Join codes
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-muted-foreground">
                      Share these so people can join {org.name}
                    </p>
                  </div>
                  <Link
                    href={orgRoute(slug, "settings")}
                    className="text-xs font-semibold text-[#FF4B1A] hover:underline"
                  >
                    Manage in Settings
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        key: "teacher" as const,
                        label: "Teacher join code",
                        code: org.teacher_join_code,
                        hint: "For instructors",
                      },
                      {
                        key: "student" as const,
                        label: "Student join code",
                        code: org.student_join_code ?? null,
                        hint: "For learners",
                      },
                    ] as const
                  ).map((item) => {
                    const CopiedIcon = copiedKey === item.key ? Check : Copy
                    return (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-[#ebe4da] bg-[#faf8f5] p-4 dark:border-border dark:bg-muted/30"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500 dark:text-muted-foreground">
                          {item.label}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="truncate font-mono text-lg font-bold tracking-wider text-neutral-950 dark:text-foreground">
                            {item.code ?? "—"}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!item.code}
                            className="h-8 shrink-0 rounded-full border-neutral-200 bg-white px-3 shadow-none hover:border-[#FFD8C8] hover:bg-[#FFF8F5] dark:border-border dark:bg-card"
                            onClick={() => item.code && copyCode(item.code, item.key)}
                          >
                            <CopiedIcon className="h-3.5 w-3.5" />
                            <span className="ml-1.5 text-xs">
                              {copiedKey === item.key ? "Copied" : "Copy"}
                            </span>
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-neutral-500 dark:text-muted-foreground">
                          {item.hint}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="grow-card p-5 lg:col-span-2 md:p-6">
                <h3 className="mb-4 text-sm font-semibold tracking-tight text-neutral-950 dark:text-foreground">
                  Quick actions
                </h3>
                <div className="grid gap-2.5">
                  {quickActions.map((action) => (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="group flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#FFD8C8] hover:bg-[#FFF8F5] hover:shadow-[0_12px_28px_-18px_rgba(255,75,26,0.45)] dark:border-border dark:bg-card dark:hover:border-[#FF4B1A]/35 dark:hover:bg-[#FF4B1A]/5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE8E0] text-[#FF4B1A] transition group-hover:bg-[#FF4B1A] group-hover:text-white">
                        <action.icon className="h-4 w-4 stroke-[1.5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-foreground">
                          {action.title}
                        </p>
                        <p className="text-xs leading-snug text-neutral-500 dark:text-muted-foreground">
                          {action.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
