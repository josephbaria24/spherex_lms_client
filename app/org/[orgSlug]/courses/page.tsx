"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OrgSelector } from "@/components/org/org-selector"
import { useOrgAdmin } from "@/components/org/org-provider"
import { CourseModuleIcon, CourseRowIcon } from "@/components/icons/workspace-icons"
import { apiGet } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { orgRoute } from "@/lib/org-routes"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderOpen,
  GraduationCap,
  Layers,
  ListOrdered,
  Search,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react"

const PAGE_SIZE = 10
const ICON_STROKE = 1.5
const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

type Course = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  duration?: string | null
  image?: string | null
  thumbnail?: string | null
  student_count?: number
  lesson_count?: number
  created_at?: string
}

type LevelFilter = "all" | "beginner" | "intermediate" | "advanced"
type SortKey = "title" | "level" | "enrolled" | "lessons"

export default function OrgCoursesPage() {
  const { selectedOrgId, selectedOrgSlug, selectedOrg, loadingOrgs } = useOrgAdmin()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("title")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const slug = selectedOrgSlug ?? selectedOrg?.slug ?? ""

  const load = useCallback(async () => {
    if (!selectedOrgId) return
    setLoading(true)
    try {
      const data = await apiGet<{ courses: Course[] }>(`/org-admin/${selectedOrgId}/courses`)
      setCourses(data.courses ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId])

  useEffect(() => {
    if (!loadingOrgs) load()
  }, [load, loadingOrgs])

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [levelFilter, categoryFilter, search, selectedOrgId])

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [courses])

  const counts = useMemo(
    () => ({
      all: courses.length,
      beginner: courses.filter((c) => c.level === "beginner").length,
      intermediate: courses.filter((c) => c.level === "intermediate").length,
      advanced: courses.filter((c) => c.level === "advanced").length,
      enrollments: courses.reduce((sum, c) => sum + (c.student_count ?? 0), 0),
      lessons: courses.reduce((sum, c) => sum + (c.lesson_count ?? 0), 0),
    }),
    [courses],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = courses

    if (levelFilter !== "all") {
      list = list.filter((c) => c.level === levelFilter)
    }

    if (categoryFilter !== "all") {
      list = list.filter((c) => c.category === categoryFilter)
    }

    if (q) {
      list = list.filter((c) => {
        const hay = [c.title, c.description, c.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return hay.includes(q)
      })
    }

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title)
      } else if (sortKey === "level") {
        cmp = (a.level ?? "").localeCompare(b.level ?? "")
      } else if (sortKey === "enrolled") {
        cmp = (a.student_count ?? 0) - (b.student_count ?? 0)
      } else {
        cmp = (a.lesson_count ?? 0) - (b.lesson_count ?? 0)
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [courses, levelFilter, categoryFilter, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allPageSelected = paged.length > 0 && paged.every((c) => selected.has(c.id))

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "title" ? "asc" : "desc")
    }
  }

  function toggleSelectAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const c of paged) {
        if (checked) next.add(c.id)
        else next.delete(c.id)
      }
      return next
    })
  }

  const levelTabs: { id: LevelFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
  ]

  return (
    <MainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Course catalog
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Courses
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Programs published under {selectedOrg?.name ?? "your organization"}. Preview any
                course as a student would see it, track enrollments, and monitor lesson coverage
                across your catalog.
              </p>
            </div>
            <OrgSelector />
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<CourseModuleIcon />}
              value={counts.all}
              label="Total courses"
              hint="Programs in your catalog"
            />
            <MetricCard
              icon={<Users className="h-[22px] w-[22px] shrink-0 text-[#64748b]" strokeWidth={ICON_STROKE} />}
              value={counts.enrollments}
              label="Enrollments"
              hint="Students across all courses"
            />
            <MetricCard
              icon={
                <ListOrdered className="h-[22px] w-[22px] shrink-0 text-[#64748b]" strokeWidth={ICON_STROKE} />
              }
              value={counts.lessons}
              label="Total lessons"
              hint="Content items published"
            />
            <MetricCard
              icon={<Tag className="h-[22px] w-[22px] shrink-0 text-[#64748b]" strokeWidth={ICON_STROKE} />}
              value={categories.length}
              label="Categories"
              hint="Subject areas covered"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,22%)]">
            <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {levelTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setLevelFilter(tab.id)}
                      className={cn(
                        "text-sm transition-colors",
                        levelFilter === tab.id
                          ? "font-semibold text-[#0f172a]"
                          : "font-medium text-[#94a3b8] hover:text-[#64748b]",
                      )}
                    >
                      {tab.label}
                      <span className="ml-1 tabular-nums">{counts[tab.id]}</span>
                    </button>
                  ))}
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white text-sm shadow-none sm:w-[150px]">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-auto">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                    <Input
                      placeholder="Search courses"
                      className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[200px]"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="divide-y divide-[#f1f5f9]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-4">
                      <div className="h-4 w-4 animate-pulse rounded bg-[#f1f5f9]" />
                      <div className="h-10 w-10 animate-pulse rounded-lg bg-[#f1f5f9]" />
                      <div className="h-4 w-56 animate-pulse rounded bg-[#f1f5f9]" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-20 text-center">
                  <p className="text-sm font-medium text-[#0f172a]">
                    {courses.length === 0 ? "No courses yet" : "No courses match your filters"}
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                    {courses.length === 0
                      ? "Courses are created by your platform administrator or assigned teachers. Once published, they will appear here."
                      : "Try a different level, category, or search term."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                        <th className="w-10 px-4 py-3">
                          <Checkbox
                            checked={allPageSelected}
                            onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                            aria-label="Select all on page"
                          />
                        </th>
                        <th className={thClass}>
                          <SortHeader
                            label="Course"
                            active={sortKey === "title"}
                            dir={sortDir}
                            onClick={() => toggleSort("title")}
                          />
                        </th>
                        <th className={thClass}>Category</th>
                        <th className={thClass}>
                          <SortHeader
                            label="Level"
                            active={sortKey === "level"}
                            dir={sortDir}
                            onClick={() => toggleSort("level")}
                          />
                        </th>
                        <th className={thClass}>
                          <SortHeader
                            label="Enrolled"
                            active={sortKey === "enrolled"}
                            dir={sortDir}
                            onClick={() => toggleSort("enrolled")}
                          />
                        </th>
                        <th className={thClass}>
                          <SortHeader
                            label="Lessons"
                            active={sortKey === "lessons"}
                            dir={sortDir}
                            onClick={() => toggleSort("lessons")}
                          />
                        </th>
                        <th className={cn(thClass, "pr-4 text-right")}>Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {paged.map((course) => {
                        const previewHref = slug
                          ? orgRoute(slug, `courses/${course.id}/preview`)
                          : "#"
                        return (
                          <tr key={course.id} className="group transition-colors hover:bg-[#fafbfc]">
                            <td className="px-4 py-3.5">
                              <Checkbox
                                checked={selected.has(course.id)}
                                onCheckedChange={(checked) => {
                                  setSelected((prev) => {
                                    const next = new Set(prev)
                                    if (checked) next.add(course.id)
                                    else next.delete(course.id)
                                    return next
                                  })
                                }}
                                aria-label={`Select ${course.title}`}
                              />
                            </td>
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-3">
                                <CourseThumb course={course} />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#0f172a]">
                                    {course.title}
                                  </p>
                                  {course.description ? (
                                    <p className="mt-0.5 line-clamp-1 text-xs text-[#94a3b8]">
                                      {course.description}
                                    </p>
                                  ) : null}
                                  {course.duration ? (
                                    <p className="mt-0.5 text-[11px] text-[#cbd5e1]">
                                      {course.duration}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {course.category ? (
                                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                                  {course.category}
                                </span>
                              ) : (
                                <span className="text-sm text-[#cbd5e1]">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {course.level ? (
                                <LevelPill level={course.level} />
                              ) : (
                                <span className="text-sm text-[#cbd5e1]">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-sm tabular-nums text-[#0f172a]">
                              {course.student_count ?? 0}
                            </td>
                            <td className="px-4 py-3.5 text-sm tabular-nums text-[#0f172a]">
                              {course.lesson_count ?? 0}
                            </td>
                            <td className="px-4 py-3.5 pr-4 text-right">
                              <Link
                                href={previewHref}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#334155] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                              >
                                <Eye className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                                Preview
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && filtered.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f4] px-4 py-3">
                  <p className="text-xs text-[#94a3b8]">
                    {filtered.length} course{filtered.length === 1 ? "" : "s"}
                    {selected.size > 0 ? ` · ${selected.size} selected` : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94a3b8]">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-[#e2e8f0] bg-white shadow-none"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-[#e2e8f0] bg-white shadow-none"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                  Catalog health
                </p>
                <dl className="mt-3 space-y-3">
                  <CatalogStat
                    icon={FolderOpen}
                    label="With lessons"
                    value={courses.filter((c) => (c.lesson_count ?? 0) > 0).length}
                    total={courses.length}
                  />
                  <CatalogStat
                    icon={GraduationCap}
                    label="With enrollments"
                    value={courses.filter((c) => (c.student_count ?? 0) > 0).length}
                    total={courses.length}
                  />
                  <CatalogStat
                    icon={Layers}
                    label="Uncategorized"
                    value={courses.filter((c) => !c.category).length}
                    total={courses.length}
                  />
                </dl>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                  Quick tips
                </p>
                <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#64748b]">
                  <li>
                    Use <strong className="font-medium text-[#334155]">Preview</strong> to walk through
                    a course exactly as your students experience it.
                  </li>
                  <li>
                    Courses with zero lessons are not ready for learners — coordinate with teachers to
                    publish content.
                  </li>
                  <li>
                    Share your student join code from{" "}
                    <Link
                      href={orgRoute(slug, "settings")}
                      className="font-medium text-[#2563eb] hover:underline"
                    >
                      Settings
                    </Link>{" "}
                    to drive enrollments.
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] bg-[#fafbfc] p-5">
                <p className="text-sm font-semibold text-[#0f172a]">Difficulty levels</p>
                <dl className="mt-3 space-y-2.5 text-xs text-[#64748b]">
                  <div>
                    <dt className="font-semibold text-emerald-700">Beginner</dt>
                    <dd className="mt-0.5">Foundational content for new learners.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-blue-700">Intermediate</dt>
                    <dd className="mt-0.5">Builds on core concepts with more depth.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-violet-700">Advanced</dt>
                    <dd className="mt-0.5">Specialized material for experienced professionals.</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function MetricCard({
  icon,
  value,
  label,
  hint,
}: {
  icon: ReactNode
  value: number
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
        {icon}
      </div>
    </div>
  )
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-[#64748b]",
        active && "text-[#64748b]",
      )}
    >
      {label}
      {active && <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  )
}

function CourseThumb({ course }: { course: Course }) {
  const imageSrc = assetUrl(course.image || course.thumbnail)

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-[#e2e8f0] object-cover"
      />
    )
  }

  return <CourseRowIcon category={course.category} />
}

function LevelPill({ level }: { level: string }) {
  const tone =
    level === "beginner"
      ? "bg-emerald-50 text-emerald-700"
      : level === "intermediate"
        ? "bg-blue-50 text-blue-700"
        : level === "advanced"
          ? "bg-violet-50 text-violet-700"
          : "bg-slate-100 text-slate-700"

  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize", tone)}>
      {level}
    </span>
  )
}

function CatalogStat({
  icon: Icon,
  label,
  value,
  total,
}: {
  icon: LucideIcon
  label: string
  value: number
  total: number
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-[#64748b]">
          <Icon className="h-4 w-4 text-[#94a3b8]" strokeWidth={ICON_STROKE} />
          {label}
        </div>
        <span className="text-sm font-semibold tabular-nums text-[#0f172a]">
          {value}
          <span className="font-normal text-[#94a3b8]">/{total}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#f1f5f9]">
        <div className="h-full rounded-full bg-[#0f172a]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
