"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { ListOrdered, Plus, Trash2, Pencil, FileQuestion, ChevronDown, CircleHelp } from "lucide-react"
import { toast } from "sonner"
import { apiDelete, apiGet } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import {
  LessonEditorForm,
  type LessonFormState,
} from "@/components/lessons/lesson-editor-form"
import { LessonPreviewDialog } from "@/components/lessons/lesson-preview-dialog"
import type { Lesson, LessonContentType, LessonQuiz } from "@/lib/lesson-types"
import { groupLessonOutline } from "@/lib/lesson-outline"

type Course = { id: string; title: string }

const emptyForm = (courseId = "", sortOrder = 1): LessonFormState => ({
  course_id: courseId,
  title: "",
  description: "",
  content: "",
  content_type: "text",
  video_url: "",
  articulate_url: "",
  articulate_launch_mode: "story",
  parent_lesson_id: null,
  sort_order: sortOrder,
  duration_minutes: 30,
  status: "draft",
})

function nextSortOrder(lessons: Lesson[], courseId: string): number {
  const matching = lessons.filter(
    (lesson) => !courseId || !lesson.course_id || lesson.course_id === courseId,
  )
  const pool = matching.length > 0 ? matching : lessons
  let max = 0
  for (const lesson of pool) {
    const n = Number(lesson.sort_order)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max + 1
}

const contentTypeLabel = (t?: string) => {
  const map: Record<string, string> = {
    text: "Text",
    video: "Video",
    articulate: "Articulate",
    quiz: "Quiz",
  }
  return map[t ?? "text"] ?? t
}

function articulateLaunchBadge(mode?: "story" | "scorm" | null) {
  if (mode === "scorm") {
    return (
      <Badge
        variant="outline"
        className="h-5 border-amber-500/50 bg-amber-500/10 px-1.5 text-[10px] font-normal text-amber-800 dark:text-amber-200"
      >
        SCORM LMS
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground">
      Story playback
    </Badge>
  )
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
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm(courseId))
  const [editorKey, setEditorKey] = useState(0)
  const [collapsedMenus, setCollapsedMenus] = useState<Record<string, boolean>>({})
  const [viewOpen, setViewOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewLesson, setViewLesson] = useState<Lesson | null>(null)
  const [viewQuiz, setViewQuiz] = useState<LessonQuiz | null>(null)

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

  const getNextSortOrder = useCallback(
    (id: string) => nextSortOrder(lessons, id),
    [lessons],
  )

  function openCreate(contentType: LessonContentType = "text", parent?: Lesson) {
    const courseForOrder =
      parent?.course_id ||
      courseId ||
      (filterCourse !== "all" ? filterCourse : courses[0]?.id) ||
      ""
    const next = emptyForm(
      courseForOrder,
      parent ? parent.sort_order : nextSortOrder(lessons, courseForOrder),
    )
    next.content_type = parent ? "quiz" : contentType
    next.parent_lesson_id = parent?.id ?? null
    if (next.content_type === "quiz") {
      next.title = parent ? "Course evaluation" : "Knowledge check"
      next.duration_minutes = 15
    }
    setEditing(null)
    setEditorKey((k) => k + 1)
    setForm(next)
    setOpen(true)
  }

  function openCreateQuiz() {
    openCreate("quiz")
  }

  async function openEdit(lesson: Lesson) {
    setEditing(lesson)
    setEditorKey((k) => k + 1)
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
        parent_lesson_id: full.parent_lesson_id ?? null,
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
        parent_lesson_id: lesson.parent_lesson_id ?? null,
        sort_order: lesson.sort_order,
        duration_minutes: lesson.duration_minutes,
        status: lesson.status,
      })
      setOpen(true)
    }
  }

  async function openView(lesson: Lesson) {
    setViewOpen(true)
    setViewLoading(true)
    setViewLesson(lesson)
    setViewQuiz(null)
    try {
      const res = await apiGet<{ lesson: Lesson; quiz: LessonQuiz | null }>(
        teacherApiPath(orgId, `/lessons/${lesson.id}`),
      )
      setViewLesson(res.lesson)
      setViewQuiz(res.quiz)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load this lesson")
      setViewOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    await apiDelete(teacherApiPath(orgId, `/lessons/${deleteId}`))
    setDeleteId(null)
    await load()
  }

  const lockedToCourse = !!courseId
  const { roots, childrenOf } = groupLessonOutline(lessons)

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        {!lockedToCourse && (
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm text-muted-foreground">Filter by course</Label>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[220px]">
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
          </div>
        )}
        {lockedToCourse && courseTitle && (
          <p className="text-sm text-muted-foreground">
            Course: <span className="font-medium text-foreground">{courseTitle}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={openCreateQuiz}
            className="gap-2"
            disabled={courses.length === 0 && !courseId}
          >
            <FileQuestion className="h-4 w-4" />
            Add Quiz
          </Button>
          <Button onClick={() => openCreate()} className="gap-2" disabled={courses.length === 0 && !courseId}>
            <Plus className="h-4 w-4" />
            Add Lesson
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading lessons…</p>
      ) : lessons.length === 0 ? (
        <Card className="premium-card border border-border shadow-none">
          <CardContent className="p-8 text-center">
            <ListOrdered className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No lessons yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add lessons to structure your course content.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-muted/20">
          <ul className="divide-y divide-border/70 pb-3">
            {roots.map((lesson) => {
              const quizzes = childrenOf.get(lesson.id) ?? []
              const menuOpen = quizzes.length > 0 && collapsedMenus[lesson.id] !== true
              return (
              <li key={lesson.id} className="px-1.5 py-1.5">
                <div className={quizzes.length > 0 ? "rounded-xl border border-[#312e81]/30 bg-background" : ""}>
                  <div
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-muted/70"
                    onClick={() => void openView(lesson)}
                  >
                    {quizzes.length > 0 ? (
                      <button
                        type="button"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                        aria-expanded={menuOpen}
                        aria-label={menuOpen ? "Hide quizzes" : "Show quizzes"}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCollapsedMenus((current) => ({
                            ...current,
                            [lesson.id]: menuOpen,
                          }))
                        }}
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition ${menuOpen ? "" : "-rotate-90"}`} />
                      </button>
                    ) : (
                      <span className="w-6 shrink-0 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {lesson.sort_order}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">{lesson.title}</p>
                      <p className="truncate text-[11px] leading-tight text-muted-foreground">
                        {!lockedToCourse && lesson.course_title ? `${lesson.course_title} · ` : ""}
                        {lesson.duration_minutes} min
                      </p>
                    </div>
                    {quizzes.length > 0 ? (
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {quizzes.length} Quiz{quizzes.length === 1 ? "" : "zes"}
                      </span>
                    ) : null}
                    <div className="hidden shrink-0 items-center gap-1 md:flex">
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                        {contentTypeLabel(lesson.content_type)}
                      </Badge>
                      <Badge
                        variant={lesson.status === "published" ? "default" : "secondary"}
                        className="h-5 px-1.5 text-[10px] font-normal"
                      >
                        {lesson.status}
                      </Badge>
                      {lesson.content_type === "articulate"
                        ? articulateLaunchBadge(lesson.articulate_launch_mode ?? "story")
                        : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {lesson.content_type !== "quiz" ? (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            openCreate("quiz", lesson)
                          }}
                          aria-label={`Add quiz under ${lesson.title}`}
                          title="Add quiz"
                        >
                          <FileQuestion className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          void openEdit(lesson)
                        }}
                        aria-label={`Edit ${lesson.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(lesson.id)
                        }}
                        aria-label={`Delete ${lesson.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {menuOpen ? (
                    <div className="space-y-1.5 border-t border-border/70 px-3 py-2">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.id}
                          className="flex cursor-pointer items-center gap-2 rounded-full border border-[#312e81]/25 bg-background px-3 py-1.5 hover:bg-[#312e81]/5"
                          onClick={() => void openView(quiz)}
                        >
                          <CircleHelp className="h-4 w-4 shrink-0 text-[#312e81]" />
                          <p className="min-w-0 flex-1 truncate text-sm text-[#312e81]">
                            {quiz.quiz_title || quiz.title}
                          </p>
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full border border-[#312e81] ${
                              quiz.status === "published" ? "bg-[#312e81]" : "bg-transparent"
                            }`}
                            aria-hidden
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              void openEdit(quiz)
                            }}
                            aria-label={`Edit ${quiz.title}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteId(quiz.id)
                            }}
                            aria-label={`Delete ${quiz.title}`}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
              )
            })}
          </ul>
        </div>
      )}
      </div>

      <LessonPreviewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        loading={viewLoading}
        lesson={viewLesson}
        quiz={viewQuiz}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? form.content_type === "quiz"
                  ? "Edit Quiz Lesson"
                  : "Edit Lesson"
                : form.content_type === "quiz"
                  ? "New Quiz Lesson"
                  : "New Lesson"}
            </DialogTitle>
            <DialogDescription>
              {form.content_type === "quiz"
                ? "Build multiple-choice or true/false questions with a passing score."
                : "Add text, video, Articulate, or quiz content for learners."}
            </DialogDescription>
          </DialogHeader>
          <LessonEditorForm
            key={editing ? `edit-${editing.id}-${editorKey}` : `new-${editorKey}`}
            orgId={orgId}
            courses={
              lockedToCourse && courseId && courseTitle
                ? [{ id: courseId, title: courseTitle }]
                : courses
            }
            editingLessonId={editing?.id ?? null}
            nextSortOrder={getNextSortOrder}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lesson?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
