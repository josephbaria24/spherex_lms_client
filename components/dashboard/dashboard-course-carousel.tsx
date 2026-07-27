"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/api"
import { formatCoursePrice } from "@/lib/course-pricing"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Briefcase,
  Building2,
  ChevronRight,
  Flame,
  GraduationCap,
  HardHat,
  HeartPulse,
  Layers,
  type LucideIcon,
} from "lucide-react"

type CatalogCourse = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  duration?: string | null
  price_cents?: number
  is_enrolled?: boolean
  organization_name?: string | null
}

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

function courseIcon(category?: string | null): LucideIcon {
  const key = (category ?? "").toLowerCase()
  if (key.includes("safety") || key.includes("hse")) return HardHat
  if (key.includes("leader")) return Briefcase
  if (key.includes("oil") || key.includes("gas") || key.includes("energy")) return Flame
  if (key.includes("health") || key.includes("medical")) return HeartPulse
  if (key.includes("soft")) return Layers
  return BookOpen
}

export function DashboardCourseCarousel() {
  const [courses, setCourses] = useState<CatalogCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiGet<{ courses: CatalogCourse[] }>("/courses")
      .then((data) => {
        if (cancelled) return
        const withOrg = (data.courses ?? []).filter((c) => c.organization_name)
        setCourses(withOrg.length > 0 ? withOrg : (data.courses ?? []))
      })
      .catch(() => {
        if (!cancelled) setCourses([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const preview = useMemo(() => courses.slice(0, 6), [courses])

  if (loading) {
    return (
      <section className="overflow-hidden rounded-xl border border-[#e5e8ee] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="border-b border-[#eef2f6] px-5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
            From our organizations
          </p>
        </div>
        <div className="divide-y divide-[#f1f5f9]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <div className="h-5 w-5 animate-pulse rounded bg-[#f1f5f9]" />
              <div className="h-4 w-56 animate-pulse rounded bg-[#f1f5f9]" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (courses.length === 0) {
    return (
      <section className="overflow-hidden rounded-xl border border-[#e5e8ee] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="border-b border-[#eef2f6] px-5 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
            From our organizations
          </p>
        </div>
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <GraduationCap className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium text-[#0f172a]">No courses available yet</p>
          <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
            Browse the catalog once organizations publish learning paths for you.
          </p>
          <Button
            asChild
            className="mt-5 h-9 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
          >
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e8ee] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f6] px-5 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
          From our organizations
        </p>
        <p className="text-xs text-[#94a3b8]">
          {courses.length} course{courses.length === 1 ? "" : "s"} available
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
              <th className={thClass}>Course</th>
              <th className={thClass}>Organization</th>
              <th className={thClass}>Level</th>
              <th className={thClass}>Duration</th>
              <th className={thClass}>Price</th>
              <th className={cn(thClass, "pr-4 text-right")}>Open</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {preview.map((course) => {
              const Icon = courseIcon(course.category)
              const href = course.is_enrolled
                ? `/courses/${course.id}/learn`
                : `/courses/${course.id}`
              return (
                <tr key={course.id} className="transition-colors hover:bg-[#fafbfc]">
                  <td className="py-3.5 pl-4 pr-4">
                    <Link href={href} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0f172a]">
                          {course.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#94a3b8]">
                          {course.category ||
                            course.description?.trim() ||
                            "Structured lessons from partner organizations"}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 text-sm text-[#64748b]">
                      <Building2 className="h-4 w-4 shrink-0 text-[#94a3b8]" strokeWidth={1.5} />
                      <span className="truncate">{course.organization_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {course.level ? (
                      <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#475569]">
                        {course.level}
                      </span>
                    ) : (
                      <span className="text-sm text-[#cbd5e1]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#64748b]">
                    {course.duration || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium tabular-nums text-[#0f172a]">
                    {formatCoursePrice(course.price_cents ?? 0)}
                  </td>
                  <td className="px-4 py-3.5 pr-4">
                    <div className="flex justify-end">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 rounded-lg border-[#e2e8f0] shadow-none"
                      >
                        <Link href={href}>
                          {course.is_enrolled ? "Continue" : "View"}
                          <ChevronRight className="h-3.5 w-3.5 text-[#94a3b8]" strokeWidth={1.5} />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#eef2f6] px-5 py-3">
        <Link href="/courses" className="text-[13px] font-medium text-[#2563eb] hover:underline">
          Browse all courses
        </Link>
        {courses.length > preview.length ? (
          <p className="text-xs text-[#94a3b8]">
            Showing {preview.length} of {courses.length}
          </p>
        ) : null}
      </div>
    </section>
  )
}
