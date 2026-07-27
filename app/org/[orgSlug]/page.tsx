"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { OrgSelector } from "@/components/org/org-selector"
import { OrgLogo } from "@/components/org/org-logo"
import { useOrgAdmin } from "@/components/org/org-provider"
import { apiGet } from "@/lib/api"
import { orgRoute } from "@/lib/org-routes"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Copy,
  FolderOpen,
  GraduationCap,
  Presentation,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

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

const METRIC_ICON = "h-[22px] w-[22px] shrink-0 text-[#334155]"
const ICON_STROKE = 1.5

function LineIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return <Icon className={cn(METRIC_ICON, className)} strokeWidth={ICON_STROKE} />
}

export default function OrgAdminDashboardPage() {
  const { selectedOrgId, selectedOrgSlug, loadingOrgs } = useOrgAdmin()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

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
    memberLimit != null && data
      ? Math.min(100, Math.round((data.stats.members / memberLimit) * 100))
      : null

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Could not copy code")
    }
  }

  const stats = data
    ? [
        {
          label: "Members",
          value: data.stats.members,
          href: orgRoute(slug, "members"),
          icon: Users,
          hint: "Total people in this organization",
        },
        {
          label: "Courses",
          value: data.stats.courses,
          href: orgRoute(slug, "courses"),
          icon: FolderOpen,
          hint: "Programs in your catalog",
        },
        {
          label: "Students",
          value: data.stats.students,
          href: orgRoute(slug, "members"),
          icon: GraduationCap,
          hint: "Learners with student access",
        },
        {
          label: "Teachers",
          value: data.stats.teachers,
          href: orgRoute(slug, "members"),
          icon: Presentation,
          hint: "Instructors delivering content",
        },
      ]
    : []

  const quickLinks = [
    {
      title: "Members",
      description:
        "Invite teachers and students, assign roles, and control who can access your organization.",
      href: orgRoute(slug, "members"),
      icon: Users,
    },
    {
      title: "Courses",
      description:
        "Create lessons, organize modules, and publish the programs your learners will take.",
      href: orgRoute(slug, "courses"),
      icon: FolderOpen,
    },
    {
      title: "Settings",
      description:
        "Update your public profile, branding, join codes, and organization preferences.",
      href: orgRoute(slug, "settings"),
      icon: Settings,
    },
  ]

  const insights = data ? getWorkspaceInsights(data) : []

  return (
    <MainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] md:-m-6">
        <div className="w-full space-y-8 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          {/* Header */}
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Organization workspace
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                {loading ? "Loading…" : (org?.name ?? "Dashboard")}
              </h1>
              {org ? (
                <>
                  <p className="mt-1.5 text-sm text-[#64748b]">
                    {[org.industry, org.status ? capitalize(org.status) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                    This is your command center for {org.name}. Review activity, share join
                    codes, and manage the people and courses that power your learning programs.
                  </p>
                </>
              ) : null}
            </div>
            <OrgSelector />
          </header>

          {loading || !data || !org ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-48 animate-pulse rounded-xl bg-[#eef0f4]" />
              <div className="h-48 animate-pulse rounded-xl bg-[#eef0f4]" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(260px,24%)_minmax(0,1fr)]">
              {/* Identity rail */}
              <aside className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
                  <div className="border-b border-[#eef0f4] px-5 py-5">
                    <OrgLogo
                      slug={org.slug}
                      logo={org.logo}
                      name={org.name}
                      brandColor={org.brand_primary}
                      className="h-16 w-16 rounded-xl border border-[#e2e8f0]"
                      logo_padding={org.logo_padding}
                      logo_position_x={org.logo_position_x}
                      logo_position_y={org.logo_position_y}
                    />
                    <p className="mt-4 font-mono text-xs text-[#94a3b8]">/{org.slug}</p>
                    <StatusPill status={org.status} className="mt-3" />
                    <p className="mt-3 text-xs leading-relaxed text-[#94a3b8]">
                      {getStatusMessage(org.status)}
                    </p>
                  </div>

                  {memberLimit != null ? (
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#64748b]">Capacity</span>
                        <span className="tabular-nums text-[#0f172a]">
                          {data.stats.members} / {memberLimit}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${capacityPct ?? 0}%`,
                            backgroundColor: org.brand_primary ?? "#0f172a",
                          }}
                        />
                      </div>
                      {atCapacity ? (
                        <p className="mt-2 text-xs leading-relaxed text-amber-700">
                          Member limit reached — contact support to increase capacity before
                          inviting more people.
                        </p>
                      ) : memberLimit != null ? (
                        <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">
                          Seats remaining: {Math.max(0, memberLimit - data.stats.members)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                    Access keys
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#64748b]">
                    Unique codes let teachers and students join without a manual invite. Share the
                    right code with each audience.
                  </p>
                  <div className="mt-4 space-y-4">
                    <CodeBlock
                      label="Teacher"
                      hint="For instructors who will create and manage courses."
                      code={org.teacher_join_code}
                      onCopy={() => copyCode(org.teacher_join_code)}
                    />
                    <CodeBlock
                      label="Student"
                      hint="For learners enrolling in your organization's programs."
                      code={org.student_join_code ?? null}
                      onCopy={() => org.student_join_code && copyCode(org.student_join_code)}
                    />
                  </div>
                  <Link
                    href={orgRoute(slug, "settings")}
                    className="mt-4 inline-block text-xs font-medium text-[#64748b] hover:text-[#0f172a]"
                  >
                    Manage in settings →
                  </Link>
                </div>
              </aside>

              {/* Main workspace */}
              <section className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[#0f172a]">Overview</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#64748b]">
                    A live snapshot of your organization — members, courses, and roles across your
                    learning network.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {stats.map((stat) => (
                    <Link key={stat.label} href={stat.href}>
                      <div className="flex h-full items-start gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 transition hover:border-[#cbd5e1]">
                        <LineIcon icon={stat.icon} />
                        <div>
                          <p className="text-2xl font-bold tabular-nums leading-none text-[#0f172a]">
                            {stat.value}
                          </p>
                          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
                            {stat.label}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-[#94a3b8]">{stat.hint}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {insights.length > 0 ? (
                  <div className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
                      Suggested next steps
                    </p>
                    <ul className="mt-3 space-y-2">
                      {insights.map((item) => (
                        <li key={item} className="text-sm leading-relaxed text-[#64748b]">
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-xl border border-[#e2e8f0] bg-white">
                  <div className="border-b border-[#eef0f4] px-5 py-4">
                    <h2 className="text-sm font-semibold text-[#0f172a]">Navigate</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#94a3b8]">
                      Go directly to the areas you manage most — people, content, and organization
                      settings.
                    </p>
                  </div>
                  <ul className="divide-y divide-[#f1f5f9]">
                    {quickLinks.map((item) => (
                      <li key={item.title}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#fafbfc]"
                        >
                          <LineIcon icon={item.icon} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#0f172a]">{item.title}</p>
                            <p className="mt-0.5 text-sm text-[#94a3b8]">{item.description}</p>
                          </div>
                          <span className="text-[#cbd5e1]">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getStatusMessage(status: string) {
  if (status === "active") {
    return "Your organization is live. Members can join and access published courses."
  }
  if (status === "suspended") {
    return "Access is currently restricted. Contact your platform administrator for help."
  }
  return "Setup is in progress. Review members and courses while activation is pending."
}

function getWorkspaceInsights(data: DashboardData) {
  const { stats, organization } = data
  const tips: string[] = []

  if (organization.status === "pending") {
    tips.push("Your organization is pending activation — confirm your profile and branding in Settings.")
  }
  if (stats.courses === 0) {
    tips.push("No courses yet. Head to Courses to create your first program.")
  }
  if (stats.teachers === 0) {
    tips.push("Add at least one teacher so someone can build and deliver content.")
  }
  if (stats.students === 0 && stats.courses > 0) {
    tips.push("You have courses but no students yet — share the student join code to start enrollments.")
  }
  if (stats.members > 0 && stats.courses > 0 && stats.students > 0) {
    tips.push("Your organization is active. Monitor member roles and keep course content up to date.")
  }

  return tips.slice(0, 3)
}

function StatusPill({ status, className }: { status: string; className?: string }) {
  const tone =
    status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : status === "suspended"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700"
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        tone,
        className,
      )}
    >
      {status}
    </span>
  )
}

function CodeBlock({
  label,
  hint,
  code,
  onCopy,
}: {
  label: string
  hint?: string
  code: string | null
  onCopy: () => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[#334155]">{label}</p>
      {hint ? <p className="mt-0.5 text-xs leading-relaxed text-[#94a3b8]">{hint}</p> : null}
      <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
        <code className="truncate font-mono text-sm font-semibold tracking-wide text-[#0f172a]">
          {code ?? "—"}
        </code>
        <button
          type="button"
          onClick={onCopy}
          disabled={!code}
          className="shrink-0 text-[#94a3b8] transition hover:text-[#0f172a] disabled:opacity-40"
          aria-label={`Copy ${label.toLowerCase()} code`}
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
