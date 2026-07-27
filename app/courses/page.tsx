"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StudentJoinBanner } from "@/components/settings/join-org-section"
import { CourseDetailsModal } from "@/components/course-detail-modal"
import { useAuth } from "@/app/provider"
import { apiGet } from "@/lib/api"
import { formatCoursePrice } from "@/lib/course-pricing"
import type { Course } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Flame,
  GraduationCap,
  HardHat,
  HeartPulse,
  Layers,
  Search,
  type LucideIcon,
} from "lucide-react"

type CourseRow = {
  id: string
  title: string
  description?: string
  category?: string
  level?: string
  enrolled_count?: number
  duration?: string
  created_at?: string
  updated_at?: string
  price_cents?: number
  requires_enroll_code?: boolean
  is_enrolled?: boolean
  organization_name?: string | null
}

type EnrollmentRow = {
  course_id: string
  progress_percent?: number
  course?: CourseRow
}

type TabKey = "catalog" | "enrolled" | "completed"

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

export default function CoursesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [completedCourses, setCompletedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<TabKey>("catalog")

  const mapCourse = (c: CourseRow, progress = 0): Course => ({
    id: c.id,
    title: c.title ?? "Untitled",
    description: c.description ?? "",
    category: c.category ?? "Uncategorized",
    thumbnail: "",
    duration: c.duration ?? "Unknown",
    level: (c.level as Course["level"]) ?? "beginner",
    enrolledCount: c.enrolled_count ?? 0,
    progress,
    priceCents: c.price_cents ?? 0,
    requiresEnrollCode: c.requires_enroll_code ?? false,
    isEnrolled: c.is_enrolled ?? false,
    organizationName: c.organization_name ?? null,
    createdAt: new Date(c.created_at ?? new Date().toISOString()),
    updatedAt: new Date(c.updated_at ?? c.created_at ?? new Date().toISOString()),
  })

  const fetchCourses = async () => {
    if (!user) return
    setLoading(true)

    try {
      const [allData, enrolledData, completedData] = await Promise.all([
        apiGet<{ courses: CourseRow[] }>("/courses"),
        apiGet<{ enrollments: EnrollmentRow[] }>("/enrollments?completed=false&include=course"),
        apiGet<{ enrollments: EnrollmentRow[] }>("/enrollments?completed=true&include=course"),
      ])

      const enrolledIds = new Set(
        [
          ...(enrolledData.enrollments ?? []),
          ...(completedData.enrollments ?? []),
        ].map((e) => e.course_id),
      )

      setAllCourses(
        (allData.courses ?? []).map((c) => ({
          ...mapCourse(c),
          isEnrolled: enrolledIds.has(c.id),
        })),
      )

      setEnrolledCourses(
        (enrolledData.enrollments ?? [])
          .map((e) => (e.course ? mapCourse(e.course, e.progress_percent ?? 0) : null))
          .filter((c): c is Course => c !== null),
      )

      setCompletedCourses(
        (completedData.enrollments ?? [])
          .map((e) => (e.course ? mapCourse(e.course, e.progress_percent ?? 100) : null))
          .filter((c): c is Course => c !== null),
      )
    } catch (err) {
      console.error("Failed to load courses:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [user])

  const filterCourses = (courses: Course[]) => {
    const q = search.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.organizationName ?? "").toLowerCase().includes(q),
    )
  }

  const catalogCourses = useMemo(() => filterCourses(allCourses), [allCourses, search])
  const enrolledFiltered = useMemo(
    () => filterCourses(enrolledCourses),
    [enrolledCourses, search],
  )
  const completedFiltered = useMemo(
    () => filterCourses(completedCourses),
    [completedCourses, search],
  )

  const activeList =
    tab === "catalog"
      ? catalogCourses
      : tab === "enrolled"
        ? enrolledFiltered
        : completedFiltered

  const tabs: { id: TabKey; label: string; count: number }[] = [
    { id: "catalog", label: "All courses", count: catalogCourses.length },
    { id: "enrolled", label: "My enrolled", count: enrolledFiltered.length },
    { id: "completed", label: "Completed", count: completedFiltered.length },
  ]

  function openCourse(course: Course) {
    if (tab !== "catalog" && course.isEnrolled) {
      router.push(`/courses/${course.id}/learn`)
      return
    }
    setSelectedCourse(course)
    setModalOpen(true)
  }

  return (
    <MainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Learning workspace
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Courses
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Browse the catalog and enroll with payment or an admin enrollment code.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-lg border-[#e2e8f0] bg-white shadow-none"
            >
              <Link href="/dashboard">
                <GraduationCap className="mr-1.5 h-4 w-4 text-[#64748b]" strokeWidth={1.5} />
                Dashboard
              </Link>
            </Button>
          </header>

          <StudentJoinBanner />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={BookOpen}
              value={allCourses.length}
              label="Catalog"
              hint="Courses available"
            />
            <MetricCard
              icon={CircleDashed}
              value={enrolledCourses.length}
              label="Enrolled"
              hint="Active learning paths"
            />
            <MetricCard
              icon={CheckCircle2}
              value={completedCourses.length}
              label="Completed"
              hint="Courses finished"
            />
            <MetricCard
              icon={Award}
              value={
                enrolledCourses.length + completedCourses.length > 0
                  ? `${Math.round(
                      [...enrolledCourses, ...completedCourses].reduce(
                        (sum, c) => sum + (c.progress ?? 0),
                        0,
                      ) /
                        (enrolledCourses.length + completedCourses.length),
                    )}%`
                  : "—"
              }
              label="Avg. progress"
              hint="Across your enrollments"
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
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
                    <span className="ml-1 tabular-nums">{item.count}</span>
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  placeholder="Search courses"
                  className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[260px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-[#f1f5f9]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-5 w-5 animate-pulse rounded bg-[#f1f5f9]" />
                    <div className="h-4 w-56 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            ) : activeList.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <BookOpen className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {search ? "No courses match your search" : "Nothing here yet"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {search
                    ? "Try another search term or switch tabs."
                    : tab === "catalog"
                      ? "Courses will appear here when organizations publish them."
                      : tab === "enrolled"
                        ? "Enroll in a course from the catalog to start learning."
                        : "Completed courses will show up here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>Course</th>
                      <th className={thClass}>Organization</th>
                      <th className={thClass}>Level</th>
                      <th className={thClass}>Duration</th>
                      {(tab === "enrolled" || tab === "completed") && (
                        <th className={thClass}>Progress</th>
                      )}
                      <th className={thClass}>Price</th>
                      <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {activeList.map((course) => {
                      const Icon = courseIcon(course.category)
                      return (
                        <tr
                          key={course.id}
                          className="cursor-pointer transition-colors hover:bg-[#fafbfc]"
                          onClick={() => openCourse(course)}
                        >
                          <td className="py-3.5 pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <Icon
                                className="h-5 w-5 shrink-0 text-[#64748b]"
                                strokeWidth={1.5}
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-[#0f172a]">
                                    {course.title}
                                  </p>
                                  {course.isEnrolled ? (
                                    <span className="inline-flex rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                      Enrolled
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-0.5 line-clamp-1 text-xs text-[#94a3b8]">
                                  {course.category}
                                  {course.description ? ` · ${course.description}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2 text-sm text-[#64748b]">
                              <Building2
                                className="h-4 w-4 shrink-0 text-[#94a3b8]"
                                strokeWidth={1.5}
                              />
                              <span className="truncate">{course.organizationName || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#475569]">
                              {course.level}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {course.duration || "—"}
                          </td>
                          {(tab === "enrolled" || tab === "completed") && (
                            <td className="px-4 py-3.5">
                              <div className="flex min-w-[120px] items-center gap-3">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f1f5f9]">
                                  <div
                                    className="h-full rounded-full bg-[#0f172a]"
                                    style={{
                                      width: `${Math.min(100, course.progress ?? 0)}%`,
                                    }}
                                  />
                                </div>
                                <span className="w-10 text-right text-sm tabular-nums text-[#64748b]">
                                  {course.progress ?? 0}%
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3.5 text-sm font-medium tabular-nums text-[#0f172a]">
                            {formatCoursePrice(course.priceCents ?? 0)}
                          </td>
                          <td className="px-4 py-3.5 pr-4">
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                              {course.isEnrolled && tab !== "catalog" ? (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-8 gap-1 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
                                >
                                  <Link href={`/courses/${course.id}/learn`}>
                                    Continue
                                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                                  </Link>
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1 rounded-lg border-[#e2e8f0] shadow-none"
                                  onClick={() => openCourse(course)}
                                >
                                  {course.isEnrolled ? "Open" : "View"}
                                  <ChevronRight
                                    className="h-3.5 w-3.5 text-[#94a3b8]"
                                    strokeWidth={1.5}
                                  />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && activeList.length > 0 && (
              <div className="border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {activeList.length} course{activeList.length === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <CourseDetailsModal
        course={selectedCourse}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onEnroll={fetchCourses}
        isEnrolled={selectedCourse?.isEnrolled}
      />
    </MainLayout>
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
