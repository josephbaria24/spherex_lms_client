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
import { ListOrdered, Plus, Trash2, Pencil, FileQuestion } from "lucide-react"
import { apiDelete, apiGet } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import {
  LessonEditorForm,
  type LessonFormState,
} from "@/components/lessons/lesson-editor-form"
import type { Lesson, LessonContentType } from "@/lib/lesson-types"

type Course = { id: string; title: string }

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
  return map[t ?? "text"] ?? t
}

function articulateLaunchBadge(mode?: "story" | "scorm" | null) {
  if (mode === "scorm") {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200"
      >
        SCORM LMS
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
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

  function openCreate(contentType: LessonContentType = "text") {
    setEditing(null)
    const defaultCourse = courseId ?? courses[0]?.id ?? ""
    const next = emptyForm(defaultCourse)
    next.content_type = contentType
    if (contentType === "quiz") {
      next.title = "Knowledge check"
      next.duration_minutes = 15
    }
    setForm(next)
    setOpen(true)
  }

  function openCreateQuiz() {
    openCreate("quiz")
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
    await apiDelete(teacherApiPath(orgId, `/lessons/${deleteId}`))
    setDeleteId(null)
    await load()
  }

  const lockedToCourse = !!courseId

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="premium-card border border-border shadow-none">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{lesson.title}</h3>
                    <Badge variant="outline">{contentTypeLabel(lesson.content_type)}</Badge>
                    {lesson.content_type === "quiz" && (lesson.quiz_question_count ?? 0) > 0 ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {lesson.quiz_question_count} question
                        {lesson.quiz_question_count === 1 ? "" : "s"}
                        {lesson.quiz_passing_score != null
                          ? ` · pass ${lesson.quiz_passing_score}%`
                          : ""}
                      </Badge>
                    ) : null}
                    <Badge variant={lesson.status === "published" ? "default" : "secondary"}>
                      {lesson.status}
                    </Badge>
                    {lesson.content_type === "articulate" &&
                      articulateLaunchBadge(lesson.articulate_launch_mode ?? "story")}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lesson.course_title} · {lesson.duration_minutes} min · Order {lesson.sort_order}
                  </p>
                  {lesson.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{lesson.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(lesson)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(lesson.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
