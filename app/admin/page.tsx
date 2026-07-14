"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { apiGet } from "@/lib/api"
import { Users, BookOpen, FileText, TrendingUp, Activity, Clock, LayoutGrid } from "lucide-react"

type DashboardData = {
  stats: {
    total_users: number
    active_courses: number
    materials: number
    completion_rate: number
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

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet<DashboardData>("/admin/dashboard")
      setData(res)
    } catch (error) {
      console.error("Error fetching admin dashboard:", error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    if (!data) return []
    return [
      {
        title: "Total Users",
        value: data.stats.total_users.toLocaleString(),
        change: data.changes.users,
        icon: Users,
        color: "text-blue-500",
      },
      {
        title: "Active Courses",
        value: data.stats.active_courses.toLocaleString(),
        change: data.changes.courses,
        icon: BookOpen,
        color: "text-yellow-500",
      },
      {
        title: "Materials",
        value: data.stats.materials.toLocaleString(),
        change: data.changes.materials,
        icon: FileText,
        color: "text-green-500",
      },
      {
        title: "Completion Rate",
        value: `${data.stats.completion_rate}%`,
        change: data.changes.completion_rate,
        icon: TrendingUp,
        color: "text-purple-500",
      },
    ]
  }, [data])

  const recentActivity = data?.recent_activity ?? []

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={LayoutGrid}
          title="Admin dashboard"
          accent="platform pulse"
          description="Monitor and manage your training platform"
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Unable to load dashboard data.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                const variants = [
                  "grow-card-coral",
                  "grow-card",
                  "grow-card-lime",
                  "grow-card-dark",
                ] as const
                const variant = variants[index % variants.length]
                const isDark = variant === "grow-card-coral" || variant === "grow-card-dark"
                return (
                  <div key={stat.title} className={`${variant} p-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={`text-xs font-medium ${isDark ? "text-white/75" : "text-muted-foreground"}`}
                        >
                          {stat.title}
                        </p>
                        <p
                          className={`mt-1 text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-[#1c1917] dark:text-foreground"}`}
                        >
                          {stat.value}
                        </p>
                        <p
                          className={`mt-1 text-[10px] ${isDark ? "text-emerald-200" : "text-emerald-600 dark:text-emerald-400"}`}
                        >
                          {stat.change}
                        </p>
                      </div>
                      <div
                        className={`rounded-2xl p-2.5 ${isDark ? "bg-white/20 text-white" : "bg-[#f3ede4] text-[#1a1f2e] dark:bg-muted"}`}
                      >
                        <Icon className="h-4 w-4 stroke-[1.5]" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="premium-card border border-border shadow-none">
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="setup-type-module-title flex items-center gap-2">
                      <Activity className="h-4 w-4 stroke-[1.5]" />
                      Recent Activity
                    </h2>
                  </div>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 border-b border-border pb-3 last:border-0"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {activity.user.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground">
                              <span className="font-medium">{activity.user}</span>{" "}
                              <span className="text-muted-foreground">{activity.action}</span>{" "}
                              <span className="font-medium">{activity.target}</span>
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="premium-card border border-border shadow-none">
                <CardContent className="p-4">
                  <h2 className="setup-type-module-title mb-4">Quick Actions</h2>
                  <div className="grid gap-2">
                    {[
                      {
                        icon: BookOpen,
                        title: "Create New Course",
                        desc: "Add a new training course",
                        href: "/admin/courses",
                      },
                      {
                        icon: FileText,
                        title: "Upload Material",
                        desc: "Add e-learning resources",
                        href: "/admin/materials",
                      },
                      {
                        icon: Users,
                        title: "Manage Users",
                        desc: "View and edit user accounts",
                        href: "/admin/users",
                      },
                    ].map((action) => (
                      <Link
                        key={action.title}
                        href={action.href}
                        className="premium-row flex items-center gap-3 rounded-xl border border-border/60 p-3 text-left"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          <action.icon className="h-4 w-4 stroke-[1.5]" />
                        </div>
                        <div>
                          <p className="setup-type-module-title">{action.title}</p>
                          <p className="setup-type-module-sub">{action.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </GrowMainLayout>
  )
}
