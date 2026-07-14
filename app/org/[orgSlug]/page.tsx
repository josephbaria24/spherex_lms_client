"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrgSelector } from "@/components/org/org-selector"
import { OrgBrandedBanner } from "@/components/org/org-branded-banner"
import { useOrgAdmin } from "@/components/org/org-provider"
import { apiGet } from "@/lib/api"
import { orgRoute } from "@/lib/org-routes"
import { Building2, BookOpen, Users, GraduationCap } from "lucide-react"

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
  const stats = data
    ? [
        { label: "Members", value: data.stats.members, icon: Users, href: orgRoute(slug, "members") },
        { label: "Courses", value: data.stats.courses, icon: BookOpen, href: orgRoute(slug, "courses") },
        { label: "Students", value: data.stats.students, icon: GraduationCap, href: orgRoute(slug, "members") },
        { label: "Teachers", value: data.stats.teachers, icon: Users, href: orgRoute(slug, "members") },
      ]
    : []

  const memberLimit = data?.organization.max_members
  const atCapacity =
    memberLimit != null && data != null && data.stats.members >= memberLimit

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Building2}
          title="Organization Dashboard"
          description="Manage your organization, members, and course catalog"
        >
          <OrgSelector />
        </PageHeader>

        {loading || !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <OrgBrandedBanner
              name={data.organization.name}
              logo={data.organization.logo}
              industry={data.organization.industry}
              status={data.organization.status}
              logo_padding={data.organization.logo_padding}
              logo_position_x={data.organization.logo_position_x}
              logo_position_y={data.organization.logo_position_y}
            />

            {memberLimit != null && (
              <Card className="premium-card border border-border shadow-none">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Member capacity</p>
                    <p className="mt-1 text-lg font-semibold">
                      {data.stats.members} / {memberLimit} members
                    </p>
                  </div>
                  {atCapacity && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Limit reached — contact SphereX support to increase capacity.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="premium-card border border-border shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">Teacher join code</p>
                  <p
                    className="mt-1 font-mono text-lg font-bold tracking-wider"
                    style={{ color: "var(--org-primary, #0d9488)" }}
                  >
                    {data.organization.teacher_join_code}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Share with instructors joining {data.organization.name}.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card border border-border shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">Student join code</p>
                  <p
                    className="mt-1 font-mono text-lg font-bold tracking-wider"
                    style={{ color: "var(--org-primary, #0d9488)" }}
                  >
                    {data.organization.student_join_code ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Share with learners to access org courses.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Link href={orgRoute(slug, "settings")} className="inline-block">
              <Button size="sm" variant="outline" className="rounded-full">
                Manage join codes in Settings
              </Button>
            </Link>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <Link key={stat.label} href={stat.href}>
                    <Card className="premium-card border border-border shadow-none transition hover:border-[color:var(--org-primary)]/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                          </div>
                          <Icon className="h-5 w-5" style={{ color: "var(--org-primary, #0d9488)" }} />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
