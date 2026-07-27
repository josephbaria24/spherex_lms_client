"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TeacherOrgSelector } from "@/components/teacher/teacher-org-selector"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { apiGet, apiPost } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers,
  ListOrdered,
  Plus,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react"

type Course = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  duration?: string | null
  student_count?: number
  lesson_count?: number
}

type LevelFilter = "all" | "beginner" | "intermediate" | "advanced"
type SortKey = "title" | "students" | "lessons"

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

export default function TeacherCoursesPage() {
  const router = useRouter()
  const { selectedOrgId, selectedOrgSlug, loadingOrgs } = useTeacherOrg()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("title")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    duration: "",
  })

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setCourses([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<{ courses: Course[] }>(teacherApiPath(selectedOrgId, "/courses"))
      setCourses(data.courses ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const students = courses.reduce((sum, c) => sum + (c.student_count ?? 0), 0)
    const lessons = courses.reduce((sum, c) => sum + (c.lesson_count ?? 0), 0)
    const categories = new Set(courses.map((c) => c.category).filter(Boolean)).size
    return {
      all: courses.length,
      beginner: courses.filter((c) => (c.level ?? "").toLowerCase() === "beginner").length,
      intermediate: courses.filter((c) => (c.level ?? "").toLowerCase() === "intermediate").length,
      advanced: courses.filter((c) => (c.level ?? "").toLowerCase() === "advanced").length,
      students,
      lessons,
      categories,
    }
  }, [courses])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    let list = courses.filter((c) => {
      const level = (c.level ?? "").toLowerCase()
      const matchesLevel = levelFilter === "all" || level === levelFilter
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        (c.category ?? "").toLowerCase().includes(q)
      return matchesLevel && matchesSearch
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") cmp = a.title.localeCompare(b.title)
      else if (sortKey === "students") cmp = (a.student_count ?? 0) - (b.student_count ?? 0)
      else cmp = (a.lesson_count ?? 0) - (b.lesson_count ?? 0)
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [courses, searchTerm, levelFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "title" ? "asc" : "desc")
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrgId) return
    setSubmitting(true)
    try {
      await apiPost(teacherApiPath(selectedOrgId, "/courses"), {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        level: form.level,
        duration: form.duration || undefined,
      })
      setOpen(false)
      setForm({ title: "", description: "", category: "", level: "beginner", duration: "" })
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  function openCourse(courseId: string) {
    if (!selectedOrgSlug) return
    router.push(`/teacher/${selectedOrgSlug}/courses/${courseId}`)
  }

  const levelTabs: { id: LevelFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
  ]

  return (
    <GrowMainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Teaching workspace
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                My courses
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Courses you instruct — create new courses and manage content.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TeacherOrgSelector />
              <Button
                type="button"
                className="h-9 gap-1.5 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
                onClick={() => setOpen(true)}
                disabled={!selectedOrgId}
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                New course
              </Button>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={BookOpen}
              value={counts.all}
              label="Total courses"
              hint="In your portfolio"
            />
            <MetricCard
              icon={Users}
              value={counts.students}
              label="Students"
              hint="Across all courses"
            />
            <MetricCard
              icon={ListOrdered}
              value={counts.lessons}
              label="Lessons"
              hint="Published content"
            />
            <MetricCard
              icon={Layers}
              value={counts.categories}
              label="Categories"
              hint="Subject groupings"
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
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  placeholder="Search courses"
                  className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[240px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <BookOpen className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {courses.length === 0 ? "No courses assigned yet" : "No courses match your filters"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {courses.length === 0
                    ? "Create your first course to start building lessons."
                    : "Try another level tab or search term."}
                </p>
                {courses.length === 0 ? (
                  <Button
                    type="button"
                    className="mt-5 h-9 gap-1.5 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
                    onClick={() => setOpen(true)}
                    disabled={!selectedOrgId}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                    Create course
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-collapse">
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
                      <th className={thClass}>Level</th>
                      <th className={thClass}>Category</th>
                      <th className={thClass}>
                        <SortHeader
                          label="Students"
                          active={sortKey === "students"}
                          dir={sortDir}
                          onClick={() => toggleSort("students")}
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
                      <th className={thClass}>Duration</th>
                      <th className={cn(thClass, "pr-4 text-right")}>Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filtered.map((course) => (
                      <tr
                        key={course.id}
                        className="cursor-pointer transition-colors hover:bg-[#fafbfc]"
                        onClick={() => openCourse(course.id)}
                      >
                        <td className="py-3.5 pl-4 pr-4">
                          <div className="flex items-center gap-3">
                            <GraduationCap
                              className="h-5 w-5 shrink-0 text-[#64748b]"
                              strokeWidth={1.5}
                            />
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
                        <td className="px-4 py-3.5">
                          {course.level ? (
                            <LevelPill level={course.level} />
                          ) : (
                            <span className="text-sm text-[#cbd5e1]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#64748b]">
                          {course.category || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                          {course.student_count ?? 0}
                        </td>
                        <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                          {course.lesson_count ?? 0}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#64748b]">
                          {course.duration || "—"}
                        </td>
                        <td className="px-4 py-3.5 pr-4">
                          <div className="flex justify-end">
                            <ChevronRight className="h-4 w-4 text-[#94a3b8]" strokeWidth={1.5} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {filtered.length} course{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl border-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle>Create course</DialogTitle>
            <DialogDescription>Add a new course to your teaching portfolio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="rounded-lg border-[#e2e8f0] shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-lg border-[#e2e8f0] shadow-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="rounded-lg border-[#e2e8f0] shadow-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, level: v as typeof form.level }))
                  }
                >
                  <SelectTrigger className="rounded-lg border-[#e2e8f0] shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g. 8 hours"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className="rounded-lg border-[#e2e8f0] shadow-none"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-lg bg-[#0f172a] hover:bg-[#1e293b]"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create course"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
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

function LevelPill({ level }: { level: string }) {
  return (
    <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold capitalize text-[#475569]">
      {level}
    </span>
  )
}
