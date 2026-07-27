"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  FileQuestion,
  FileText,
  Layers,
  ListOrdered,
  MonitorPlay,
  Pencil,
  Plus,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { apiDelete, apiGet } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import {
  LessonEditorForm,
  type LessonFormState,
} from "@/components/lessons/lesson-editor-form"
import type { Lesson, LessonContentType } from "@/lib/lesson-types"
import { cn } from "@/lib/utils"

type Course = { id: string; title: string }

type ContentFilter = "all" | LessonContentType
type SortKey = "title" | "order" | "duration"

const PAGE_SIZE = 10
const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

const emptyForm = (courseId = ""): LessonFormState => ({
  course_id: courseId,
  title: "",
  description: "",
  content: "",
  content_type: "text",
  video_url: "",
  articulate_url: "",
  articulate_launch_mode: "story",
  sort_order: 0,
  duration_minutes: 30,
  status: "draft",
})

const contentTypeLabel = (t?: string) => {
  const map: Record<string, string> = {
    text: "Text",
    video: "Video",
    articulate: "Articulate",
    quiz: "Quiz",
  }
  return map[t ?? "text"] ?? t ?? "Text"
}

function contentTypeIcon(t?: string): LucideIcon {
  if (t === "video") return Clapperboard
  if (t === "articulate") return MonitorPlay
  if (t === "quiz") return FileQuestion
  return FileText
}

type CourseLessonsManagerProps = {
  orgId: string
  /** Lock to a single course (hides course filter). */
  courseId?: string
  courseTitle?: string
}

export function CourseLessonsManager({ orgId, courseId, courseTitle }: CourseLessonsManagerProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filterCourse, setFilterCourse] = useState<string>(courseId ?? "all")
  const [contentFilter, setContentFilter] = useState<ContentFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("order")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(emptyForm(courseId))

  useEffect(() => {
    if (courseId) setFilterCourse(courseId)
  }, [courseId])

  const load = useCallback(async () => {
    if (!orgId) {
      setCourses([])
      setLessons([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const activeFilter = courseId ?? filterCourse
      const lessonsPath =
        activeFilter !== "all"
          ? teacherApiPath(orgId, `/lessons?course_id=${activeFilter}`)
          : teacherApiPath(orgId, "/lessons")
      const [coursesRes, lessonsRes] = await Promise.all([
        apiGet<{ courses: Course[] }>(teacherApiPath(orgId, "/courses")),
        apiGet<{ lessons: Lesson[] }>(lessonsPath),
      ])
      setCourses(coursesRes.courses ?? [])
      setLessons(lessonsRes.lessons ?? [])
    } finally {
      setLoading(false)
    }
  }, [filterCourse, orgId, courseId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, contentFilter, filterCourse])

  const counts = useMemo(() => {
    return {
      all: lessons.length,
      text: lessons.filter((l) => (l.content_type ?? "text") === "text").length,
      video: lessons.filter((l) => l.content_type === "video").length,
      articulate: lessons.filter((l) => l.content_type === "articulate").length,
      quiz: lessons.filter((l) => l.content_type === "quiz").length,
      published: lessons.filter((l) => l.status === "published").length,
      draft: lessons.filter((l) => l.status === "draft").length,
      courses: new Set(lessons.map((l) => l.course_id).filter(Boolean)).size,
    }
  }, [lessons])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    let list = lessons.filter((l) => {
      const type = (l.content_type ?? "text") as LessonContentType
      const matchesType = contentFilter === "all" || type === contentFilter
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        (l.description ?? "").toLowerCase().includes(q) ||
        (l.course_title ?? "").toLowerCase().includes(q)
      return matchesType && matchesSearch
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") cmp = a.title.localeCompare(b.title)
      else if (sortKey === "duration") cmp = a.duration_minutes - b.duration_minutes
      else cmp = a.sort_order - b.sort_order
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [lessons, searchTerm, contentFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "title" ? "asc" : "asc")
    }
  }

  function openCreate(contentType: LessonContentType = "text") {
    setEditing(null)
    const defaultCourse = courseId ?? (filterCourse !== "all" ? filterCourse : courses[0]?.id) ?? ""
    const next = emptyForm(defaultCourse)
    next.content_type = contentType
    if (contentType === "quiz") {
      next.title = "Knowledge check"
      next.duration_minutes = 15
    }
    setForm(next)
    setOpen(true)
  }

  async function openEdit(lesson: Lesson) {
    setEditing(lesson)
    try {
      const res = await apiGet<{ lesson: Lesson }>(teacherApiPath(orgId, `/lessons/${lesson.id}`))
      const full = res.lesson
      setForm({
        course_id: full.course_id,
        title: full.title,
        description: full.description ?? "",
        content: full.content ?? "",
        content_type: (full.content_type ?? "text") as LessonContentType,
        video_url: full.video_url ?? "",
        articulate_url: full.articulate_url ?? "",
        articulate_launch_mode: full.articulate_launch_mode ?? "story",
        sort_order: full.sort_order,
        duration_minutes: full.duration_minutes,
        status: full.status,
      })
      setOpen(true)
    } catch {
      setForm({
        course_id: lesson.course_id,
        title: lesson.title,
        description: lesson.description ?? "",
        content: lesson.content ?? "",
        content_type: (lesson.content_type ?? "text") as LessonContentType,
        video_url: lesson.video_url ?? "",
        articulate_url: lesson.articulate_url ?? "",
        articulate_launch_mode: lesson.articulate_launch_mode ?? "story",
        sort_order: lesson.sort_order,
        duration_minutes: lesson.duration_minutes,
        status: lesson.status,
      })
      setOpen(true)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await apiDelete(teacherApiPath(orgId, `/lessons/${deleteId}`))
      setDeleteId(null)
      await load()
    } finally {
      setDeleting(false)
    }
  }

  const lockedToCourse = !!courseId
  const canCreate = courses.length > 0 || !!courseId

  const typeTabs: { id: ContentFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "text", label: "Text" },
    { id: "video", label: "Video" },
    { id: "articulate", label: "Articulate" },
    { id: "quiz", label: "Quiz" },
  ]

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ListOrdered}
          value={counts.all}
          label="Total lessons"
          hint="Across filtered courses"
        />
        <MetricCard
          icon={BookOpen}
          value={counts.published}
          label="Published"
          hint={`${counts.draft} still in draft`}
        />
        <MetricCard
          icon={FileQuestion}
          value={counts.quiz}
          label="Quizzes"
          hint="Knowledge checks"
        />
        <MetricCard
          icon={Layers}
          value={lockedToCourse ? 1 : counts.courses || courses.length}
          label={lockedToCourse ? "Course" : "Courses covered"}
          hint={lockedToCourse ? courseTitle ?? "Locked course" : "With lesson content"}
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            {typeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setContentFilter(tab.id)}
                className={cn(
                  "text-sm transition-colors",
                  contentFilter === tab.id
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
            {!lockedToCourse && (
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white shadow-none sm:w-[200px]">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="relative min-w-[180px] flex-1 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <Input
                placeholder="Search lessons"
                className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[220px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 rounded-lg border-[#e2e8f0] bg-white shadow-none"
              onClick={() => openCreate("quiz")}
              disabled={!canCreate}
            >
              <FileQuestion className="h-4 w-4 text-[#64748b]" strokeWidth={1.5} />
              Add quiz
            </Button>
            <Button
              type="button"
              className="h-9 gap-1.5 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
              onClick={() => openCreate()}
              disabled={!canCreate}
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              Add lesson
            </Button>
          </div>
        </div>

        {lockedToCourse && courseTitle ? (
          <div className="border-b border-[#eef0f4] px-4 py-2.5">
            <p className="text-xs text-[#94a3b8]">
              Showing lessons for{" "}
              <span className="font-medium text-[#334155]">{courseTitle}</span>
            </p>
          </div>
        ) : null}

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
            <ListOrdered className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-[#0f172a]">
              {lessons.length === 0 ? "No lessons yet" : "No lessons match your filters"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
              {lessons.length === 0
                ? "Add lessons to structure your course content for learners."
                : "Try another type tab, course, or search term."}
            </p>
            {lessons.length === 0 && canCreate ? (
              <Button
                type="button"
                className="mt-5 h-9 gap-1.5 rounded-lg bg-[#0f172a] text-white shadow-none hover:bg-[#1e293b]"
                onClick={() => openCreate()}
              >
                <Plus className="h-4 w-4" strokeWidth={1.5} />
                Add lesson
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
                      label="Lesson"
                      active={sortKey === "title"}
                      dir={sortDir}
                      onClick={() => toggleSort("title")}
                    />
                  </th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Course</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>
                    <SortHeader
                      label="Duration"
                      active={sortKey === "duration"}
                      dir={sortDir}
                      onClick={() => toggleSort("duration")}
                    />
                  </th>
                  <th className={thClass}>
                    <SortHeader
                      label="Order"
                      active={sortKey === "order"}
                      dir={sortDir}
                      onClick={() => toggleSort("order")}
                    />
                  </th>
                  <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {paged.map((lesson) => {
                  const Icon = contentTypeIcon(lesson.content_type)
                  const type = lesson.content_type ?? "text"
                  return (
                    <tr key={lesson.id} className="group transition-colors hover:bg-[#fafbfc]">
                      <td className="py-3.5 pl-4 pr-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#0f172a]">
                              {lesson.title}
                            </p>
                            {lesson.description ? (
                              <p className="mt-0.5 line-clamp-1 text-xs text-[#94a3b8]">
                                {lesson.description}
                              </p>
                            ) : type === "quiz" && (lesson.quiz_question_count ?? 0) > 0 ? (
                              <p className="mt-0.5 text-xs text-[#94a3b8]">
                                {lesson.quiz_question_count} question
                                {lesson.quiz_question_count === 1 ? "" : "s"}
                                {lesson.quiz_passing_score != null
                                  ? ` · pass ${lesson.quiz_passing_score}%`
                                  : ""}
                              </p>
                            ) : type === "articulate" ? (
                              <p className="mt-0.5 text-xs text-[#94a3b8]">
                                {lesson.articulate_launch_mode === "scorm"
                                  ? "SCORM LMS"
                                  : "Story playback"}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <TypePill type={type} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[#64748b]">
                        {lesson.course_title || courseTitle || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusPill status={lesson.status} />
                      </td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                        {lesson.duration_minutes} min
                      </td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-[#64748b]">
                        {lesson.sort_order}
                      </td>
                      <td className="px-4 py-3.5 pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                            onClick={() => openEdit(lesson)}
                            aria-label={`Edit ${lesson.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#64748b]" strokeWidth={1.5} />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                            onClick={() => setDeleteId(lesson.id)}
                            aria-label={`Delete ${lesson.title}`}
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

        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f4] px-4 py-3">
            <p className="text-xs text-[#94a3b8]">
              {filtered.length} lesson{filtered.length === 1 ? "" : "s"}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-xl border-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? form.content_type === "quiz"
                  ? "Edit quiz lesson"
                  : "Edit lesson"
                : form.content_type === "quiz"
                  ? "New quiz lesson"
                  : "New lesson"}
            </DialogTitle>
            <DialogDescription>
              {form.content_type === "quiz"
                ? "Build multiple-choice or true/false questions with a passing score."
                : "Add text, video, Articulate, or quiz content for learners."}
            </DialogDescription>
          </DialogHeader>
          <LessonEditorForm
            orgId={orgId}
            courses={
              lockedToCourse && courseId && courseTitle
                ? [{ id: courseId, title: courseTitle }]
                : courses
            }
            editingLessonId={editing?.id ?? null}
            initial={form}
            onSaved={() => {
              setOpen(false)
              void load()
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl border-[#e2e8f0]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lesson?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="rounded-lg bg-[#ef4444] hover:bg-[#dc2626]"
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

function TypePill({ type }: { type: string }) {
  return (
    <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#475569]">
      {contentTypeLabel(type)}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const published = status === "published"
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        published ? "bg-emerald-50 text-emerald-700" : "bg-[#f1f5f9] text-[#64748b]",
      )}
    >
      {status}
    </span>
  )
}
