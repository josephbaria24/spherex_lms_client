"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreateCourseModal } from "@/components/admin/courses/create-course-modal"
import { CourseCardAppearanceFields } from "@/components/admin/courses/course-card-appearance"
import { CourseDurationFields } from "@/components/admin/courses/course-duration-fields"
import { CoursePriceFields } from "@/components/admin/courses/course-price-fields"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { formatCoursePrice } from "@/lib/course-pricing"
import { type CourseCardTheme, DEFAULT_COURSE_CARD_THEME } from "@/lib/course-card-themes"
import { cn } from "@/lib/utils"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Layers,
  ListOrdered,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

type Organization = { id: string; name: string; slug: string }

type Course = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  enrolled_count?: number
  duration?: string | null
  lessons?: number
  lesson_count?: number
  organization_id?: string | null
  organization_name?: string | null
  organization_slug?: string | null
  require_sequential_lessons?: boolean
  image?: string | null
  card_theme?: string | null
  price_cents?: number
  enroll_code?: string | null
}

type LevelFilter = "all" | "beginner" | "intermediate" | "advanced"
type SortKey = "title" | "enrolled" | "lessons" | "price"

const PAGE_SIZE = 10
const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

export default function AdminCoursesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrg, setSelectedOrg] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("title")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "" as "beginner" | "intermediate" | "advanced" | "",
    duration: "",
    organization_id: "",
    require_sequential_lessons: false,
    card_theme: DEFAULT_COURSE_CARD_THEME as CourseCardTheme,
    image: null as string | null,
    price_cents: 0,
    enroll_code: "" as string,
  })
  const [regeneratingCode, setRegeneratingCode] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [orgsRes, coursesRes] = await Promise.all([
        apiGet<{ organizations: Organization[] }>("/admin/organizations"),
        apiGet<{ courses: Course[] }>("/courses"),
      ])
      setOrganizations(orgsRes.organizations ?? [])
      setCourses(coursesRes.courses ?? [])
    } catch {
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedOrg, selectedCategory, levelFilter])

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [courses])

  const counts = useMemo(() => {
    const enrollments = courses.reduce((sum, c) => sum + (c.enrolled_count ?? 0), 0)
    const lessons = courses.reduce(
      (sum, c) => sum + (c.lesson_count ?? c.lessons ?? 0),
      0,
    )
    return {
      all: courses.length,
      beginner: courses.filter((c) => c.level === "beginner").length,
      intermediate: courses.filter((c) => c.level === "intermediate").length,
      advanced: courses.filter((c) => c.level === "advanced").length,
      assigned: courses.filter((c) => c.organization_id).length,
      unassigned: courses.filter((c) => !c.organization_id).length,
      enrollments,
      lessons,
      orgs: new Set(courses.map((c) => c.organization_id).filter(Boolean)).size,
    }
  }, [courses])

  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    let list = courses.filter((course) => {
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q) ||
        course.organization_name?.toLowerCase().includes(q) ||
        course.category?.toLowerCase().includes(q)
      const matchesOrg =
        selectedOrg === "all" ||
        (selectedOrg === "unassigned"
          ? !course.organization_id
          : course.organization_id === selectedOrg)
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory
      const matchesLevel = levelFilter === "all" || course.level === levelFilter
      return matchesSearch && matchesOrg && matchesCategory && matchesLevel
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") cmp = a.title.localeCompare(b.title)
      else if (sortKey === "enrolled")
        cmp = (a.enrolled_count ?? 0) - (b.enrolled_count ?? 0)
      else if (sortKey === "lessons")
        cmp = (a.lesson_count ?? a.lessons ?? 0) - (b.lesson_count ?? b.lessons ?? 0)
      else cmp = (a.price_cents ?? 0) - (b.price_cents ?? 0)
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [courses, searchQuery, selectedOrg, selectedCategory, levelFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE))
  const paged = filteredCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const defaultOrgId =
    selectedOrg !== "all" && selectedOrg !== "unassigned" ? selectedOrg : undefined

  useEffect(() => {
    if (editCourse) {
      setEditForm({
        title: editCourse.title || "",
        description: editCourse.description || "",
        category: editCourse.category || "",
        level: (editCourse.level as typeof editForm.level) || "",
        duration: editCourse.duration || "",
        organization_id: editCourse.organization_id || "",
        require_sequential_lessons: editCourse.require_sequential_lessons ?? false,
        card_theme: (editCourse.card_theme as CourseCardTheme) || DEFAULT_COURSE_CARD_THEME,
        image: editCourse.image ?? null,
        price_cents: editCourse.price_cents ?? 0,
        enroll_code: editCourse.enroll_code ?? "",
      })
    }
  }, [editCourse])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "title" ? "asc" : "desc")
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editCourse) return
    if (!editForm.organization_id) {
      toast.error("Select an organization")
      return
    }
    setEditLoading(true)
    try {
      await apiPatch(`/courses/${editCourse.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        category: editForm.category || undefined,
        level: editForm.level || undefined,
        duration: editForm.duration || undefined,
        organization_id: editForm.organization_id,
        require_sequential_lessons: editForm.require_sequential_lessons,
        card_theme: editForm.card_theme,
        image: editForm.image || "",
        price_cents: editForm.price_cents,
        enroll_code: editForm.enroll_code.trim() || null,
      })
      toast.success("Course updated")
      setEditCourse(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course")
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteCourseId || !deletePassword.trim()) return
    setDeleteLoading(true)
    try {
      await apiDelete(`/courses/${deleteCourseId}`, { password: deletePassword })
      toast.success("Course deleted")
      setDeleteCourseId(null)
      setDeletePassword("")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete course")
    } finally {
      setDeleteLoading(false)
    }
  }

  const levelTabs: { id: LevelFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
  ]

  return (
    <GrowMainLayout variant="ops">
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Course registry
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Courses
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Platform catalog across all partner organizations. Create programs, assign
                ownership, and manage lessons from one registry.
              </p>
            </div>
            <CreateCourseModal onCreated={load} defaultOrganizationId={defaultOrgId} />
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Layers}
              value={counts.all}
              label="Total courses"
              hint="Published across the network"
            />
            <MetricCard
              icon={Users}
              value={counts.enrollments}
              label="Enrollments"
              hint="Learners across all courses"
            />
            <MetricCard
              icon={ListOrdered}
              value={counts.lessons}
              label="Lessons"
              hint="Content items in the catalog"
            />
            <MetricCard
              icon={Building2}
              value={counts.orgs}
              label="Organizations"
              hint={`${counts.unassigned} unassigned`}
            />
          </div>

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
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white text-sm shadow-none sm:w-[180px]">
                    <SelectValue placeholder="All organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All organizations</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                    placeholder="Search title, org, category"
                    className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[240px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-[#f1f5f9]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-[#f1f5f9]" />
                    <div className="h-4 w-56 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <Layers className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {courses.length === 0 ? "No courses yet" : "No courses match your filters"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {courses.length === 0
                    ? "Create a course and assign it to a partner organization to start building the catalog."
                    : "Try another level, organization, category, or search term."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>
                        <SortHeader
                          label="Course"
                          active={sortKey === "title"}
                          dir={sortDir}
                          onClick={() => toggleSort("title")}
                        />
                      </th>
                      <th className={thClass}>Organization</th>
                      <th className={thClass}>Category</th>
                      <th className={thClass}>Level</th>
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
                      <th className={thClass}>
                        <SortHeader
                          label="Price"
                          active={sortKey === "price"}
                          dir={sortDir}
                          onClick={() => toggleSort("price")}
                        />
                      </th>
                      <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {paged.map((course) => {
                      const lessonCount = course.lesson_count ?? course.lessons ?? 0
                      return (
                        <tr
                          key={course.id}
                          className="group transition-colors hover:bg-[#fafbfc]"
                        >
                          <td className="py-3.5 pl-4 pr-4">
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
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[180px] px-4 py-3.5">
                            {course.organization_name ? (
                              <span className="block truncate text-sm text-[#64748b]">
                                {course.organization_name}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                Unassigned
                              </span>
                            )}
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
                            {course.enrolled_count ?? 0}
                          </td>
                          <td className="px-4 py-3.5 text-sm tabular-nums text-[#0f172a]">
                            {lessonCount}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {formatCoursePrice(course.price_cents ?? 0)}
                          </td>
                          <td className="px-4 py-3.5 pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {course.organization_id ? (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg border-[#e2e8f0] px-2.5 text-xs font-medium shadow-none"
                                >
                                  <Link href={`/admin/courses/${course.id}/lessons`}>
                                    Lessons
                                  </Link>
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                                onClick={() => setEditCourse(course)}
                                aria-label={`Edit ${course.title}`}
                              >
                                <Pencil className="h-3.5 w-3.5 text-[#64748b]" strokeWidth={1.5} />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                                onClick={() => setDeleteCourseId(course.id)}
                                aria-label={`Delete ${course.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" strokeWidth={1.5} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredCourses.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {filteredCourses.length} course
                  {filteredCourses.length === 1 ? "" : "s"}
                  {counts.unassigned > 0
                    ? ` · ${counts.unassigned} unassigned`
                    : ""}
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
        </div>
      </div>

      <Dialog open={!!editCourse} onOpenChange={() => setEditCourse(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-xl border-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Organization</Label>
              <Select
                value={editForm.organization_id}
                onValueChange={(v) => setEditForm((f) => ({ ...f, organization_id: v }))}
                required
              >
                <SelectTrigger className="h-9 rounded-lg border-[#e2e8f0] shadow-none">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-[13px]">
                Title
              </Label>
              <Input
                id="edit-title"
                required
                className="h-9 rounded-lg border-[#e2e8f0] shadow-none"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-[13px]">
                Description
              </Label>
              <Input
                id="edit-description"
                className="h-9 rounded-lg border-[#e2e8f0] shadow-none"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-category" className="text-[13px]">
                Category
              </Label>
              <Input
                id="edit-category"
                className="h-9 rounded-lg border-[#e2e8f0] shadow-none"
                value={editForm.category}
                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Level</Label>
              <Select
                value={editForm.level}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, level: v as typeof editForm.level }))
                }
              >
                <SelectTrigger className="h-9 rounded-lg border-[#e2e8f0] shadow-none">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CourseDurationFields
              idPrefix="edit-duration"
              resetKey={editCourse?.id}
              value={editForm.duration}
              onChange={(duration) => setEditForm((f) => ({ ...f, duration }))}
            />
            <CoursePriceFields
              idPrefix="edit-course"
              resetKey={editCourse?.id}
              priceCents={editForm.price_cents}
              onPriceCentsChange={(price_cents) => setEditForm((f) => ({ ...f, price_cents }))}
            />
            <div className="space-y-1.5 rounded-lg border border-[#e2e8f0] p-3">
              <Label htmlFor="edit-enroll-code" className="text-[13px]">
                Enrollment code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="edit-enroll-code"
                  className="h-9 rounded-lg border-[#e2e8f0] font-mono uppercase shadow-none"
                  placeholder="ENR-XXXXXXXX"
                  value={editForm.enroll_code}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, enroll_code: e.target.value.toUpperCase() }))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg border-[#e2e8f0] shadow-none"
                  disabled={regeneratingCode || !editCourse}
                  onClick={async () => {
                    if (!editCourse) return
                    setRegeneratingCode(true)
                    try {
                      const res = await apiPost<{ enroll_code: string }>(
                        `/courses/${editCourse.id}/regenerate-enroll-code`,
                      )
                      setEditForm((f) => ({ ...f, enroll_code: res.enroll_code }))
                      toast.success("Enrollment code generated")
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not generate code")
                    } finally {
                      setRegeneratingCode(false)
                    }
                  }}
                >
                  {regeneratingCode ? "…" : "Generate"}
                </Button>
              </div>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-[#e2e8f0] p-3">
              <div className="space-y-1">
                <Label htmlFor="edit-sequential" className="text-[13px]">
                  Require lessons in order
                </Label>
                <p className="text-xs text-[#94a3b8]">
                  Learners must complete each lesson before the next unlocks.
                </p>
              </div>
              <Switch
                id="edit-sequential"
                checked={editForm.require_sequential_lessons}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, require_sequential_lessons: checked }))
                }
              />
            </div>

            <CourseCardAppearanceFields
              courseId={editCourse?.id}
              cardTheme={editForm.card_theme}
              image={editForm.image}
              previewTitle={editForm.title || "Course preview"}
              onCardThemeChange={(card_theme) => setEditForm((f) => ({ ...f, card_theme }))}
              onImageChange={(image) => setEditForm((f) => ({ ...f, image }))}
            />

            <Button
              type="submit"
              disabled={editLoading}
              className="h-9 w-full rounded-lg bg-[#0f172a] shadow-none hover:bg-[#1e293b]"
            >
              {editLoading ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteCourseId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCourseId(null)
            setDeletePassword("")
          }
        }}
      >
        <AlertDialogContent className="rounded-xl border-[#e2e8f0]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the course, its lessons, and enrollments. This cannot be undone. Enter
              your account password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="delete-course-password" className="text-[13px]">
              Your password
            </Label>
            <Input
              id="delete-course-password"
              type="password"
              autoComplete="current-password"
              className="h-9 rounded-lg border-[#e2e8f0] shadow-none"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              disabled={deleteLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!deletePassword.trim() || deleteLoading}
              className="rounded-lg bg-[#ef4444] hover:bg-[#dc2626]"
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GrowMainLayout>
  )
}

function MetricCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: LucideIcon
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
        <Icon className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
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
  const imageSrc = assetUrl(course.image)
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-[#e2e8f0] object-cover"
      />
    )
  }

  const Icon = courseCategoryIcon(course.category)
  return <Icon className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} aria-hidden />
}

function courseCategoryIcon(category?: string | null): LucideIcon {
  const key = (category ?? "").toLowerCase()
  if (key.includes("safety") || key.includes("hse")) return ShieldCheck
  if (
    key.includes("oil") ||
    key.includes("gas") ||
    key.includes("industrial") ||
    key.includes("operations")
  ) {
    return Wrench
  }
  if (key.includes("leadership") || key.includes("management") || key.includes("soft")) {
    return UsersRound
  }
  return Layers
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
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        tone,
      )}
    >
      {level}
    </span>
  )
}
