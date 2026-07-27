"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiGet, apiPatch, apiPost, apiUploadFile } from "@/lib/api"
import {
  LESSON_CONTENT_TYPES,
  type Lesson,
  type LessonContentType,
  type LessonQuiz,
} from "@/lib/lesson-types"
import { teacherApiPath } from "@/lib/teacher-api"
import { saveLessonQuiz } from "@/lib/lesson-quiz-api"
import {
  emptyQuiz,
  QuizEditor,
  validateQuizDraft,
  type QuizDraft,
} from "@/components/lessons/quiz-editor"
import { Upload } from "lucide-react"
import { toast } from "sonner"

export type LessonFormState = {
  course_id: string
  title: string
  description: string
  content: string
  content_type: LessonContentType
  video_url: string
  articulate_url: string
  articulate_launch_mode: "story" | "scorm"
  sort_order: number
  duration_minutes: number
  status: "draft" | "published"
}

function quizFromApi(quiz: LessonQuiz): QuizDraft {
  return {
    title: quiz.title,
    passing_score: quiz.passing_score,
    questions: quiz.questions.map((q) => ({
      prompt: q.prompt,
      question_type: q.question_type,
      options: q.options,
      correct_option_id: q.correct_option_id,
    })),
  }
}

type LessonEditorFormProps = {
  orgId: string
  courses: { id: string; title: string }[]
  editingLessonId: string | null
  initial: LessonFormState
  onSaved: () => void
  onCancel: () => void
}

export function LessonEditorForm({
  orgId,
  courses,
  editingLessonId,
  initial,
  onSaved,
  onCancel,
}: LessonEditorFormProps) {
  const [form, setForm] = useState(initial)
  const [quiz, setQuiz] = useState<QuizDraft>(() => emptyQuiz())
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [scormFile, setScormFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(false)

  useEffect(() => {
    setForm(initial)
    setVideoFile(null)
    setScormFile(null)
  }, [initial, editingLessonId])

  useEffect(() => {
    if (form.content_type !== "quiz") {
      return
    }
    if (!editingLessonId) {
      setQuiz((prev) =>
        prev.questions.some((q) => q.prompt.trim())
          ? prev
          : emptyQuiz(form.title ? `${form.title} Quiz` : undefined),
      )
      return
    }

    setLoadingQuiz(true)
    apiGet<{ lesson: Lesson; quiz: LessonQuiz | null }>(
      teacherApiPath(orgId, `/lessons/${editingLessonId}`),
    )
      .then((res) => {
        if (res.quiz) {
          setQuiz(quizFromApi(res.quiz))
        } else {
          setQuiz(emptyQuiz(form.title ? `${form.title} Quiz` : undefined))
        }
      })
      .catch(() => setQuiz(emptyQuiz()))
      .finally(() => setLoadingQuiz(false))
  }, [editingLessonId, orgId, form.content_type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.content_type === "articulate" && !scormFile && !form.articulate_url.trim()) {
      toast.error("Enter an articulate URL or upload a SCORM zip package")
      return
    }

    if (form.content_type === "quiz") {
      const quizError = validateQuizDraft(quiz)
      if (quizError) {
        toast.error(quizError)
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        content: form.content_type === "text" ? form.content || undefined : undefined,
        content_type: form.content_type,
        video_url:
          form.content_type === "video" && !videoFile ? form.video_url || undefined : undefined,
        articulate_url:
          form.content_type === "articulate" && !scormFile
            ? form.articulate_url || undefined
            : undefined,
        articulate_launch_mode:
          form.content_type === "articulate" ? form.articulate_launch_mode : undefined,
        sort_order: form.sort_order,
        duration_minutes: form.duration_minutes,
        status: form.status,
      }

      let lessonId = editingLessonId

      if (editingLessonId) {
        await apiPatch(teacherApiPath(orgId, `/lessons/${editingLessonId}`), payload)
      } else {
        const created = await apiPost<{ lesson: { id: string } }>(
          teacherApiPath(orgId, "/lessons"),
          { ...payload, course_id: form.course_id },
        )
        lessonId = created.lesson.id
      }

      if (!lessonId) throw new Error("Lesson not saved")

      if (form.content_type === "quiz") {
        await saveLessonQuiz(orgId, lessonId, quiz)
      }

      if (form.content_type === "video" && videoFile) {
        await apiUploadFile(teacherApiPath(orgId, `/lessons/${lessonId}/video`), "video", videoFile)
      }

      if (form.content_type === "articulate" && scormFile) {
        const upload = await apiUploadFile<{
          sanitization?: {
            packageFormat?: "scorm12" | "xapi" | "unknown"
            patchedUserJs?: string[]
            patchedLmsLaunch?: string[]
            patchedPlayerScale?: string[]
            patchedFrameStrings?: string[]
            patchedFrameUpscale?: string[]
            warnings?: string[]
          }
        }>(teacherApiPath(orgId, `/lessons/${lessonId}/scorm`), "scorm", scormFile)

        const userJsCount = upload.sanitization?.patchedUserJs?.length ?? 0
        const lmsCount = upload.sanitization?.patchedLmsLaunch?.length ?? 0
        const scaleCount = upload.sanitization?.patchedPlayerScale?.length ?? 0
        const frameCount = upload.sanitization?.patchedFrameStrings?.length ?? 0
        const upscaleCount = upload.sanitization?.patchedFrameUpscale?.length ?? 0
        if (userJsCount > 0 || lmsCount > 0 || scaleCount > 0 || frameCount > 0 || upscaleCount > 0) {
          const parts: string[] = []
          if (userJsCount > 0) {
            parts.push(
              `removed LearnDash hooks from story_content/user.js (${userJsCount} file${userJsCount === 1 ? "" : "s"})`,
            )
          }
          if (lmsCount > 0) {
            parts.push(`adjusted index_lms.html for LMS playback (disabled Tin Can)`)
          }
          if (scaleCount > 0) {
            parts.push(`enabled fill-browser scaling (${scaleCount} launch file${scaleCount === 1 ? "" : "s"})`)
          }
          if (frameCount > 0) {
            parts.push(`patched Storyline unified player strings (${frameCount} file${frameCount === 1 ? "" : "s"})`)
          }
          if (upscaleCount > 0) {
            parts.push(`allowed fullscreen upscaling for unified theme`)
          }
          toast.info(`Package auto-fixed on upload: ${parts.join("; ")}.`)
        }
        for (const warning of upload.sanitization?.warnings ?? []) {
          toast.warning(warning)
        }
      }

      toast.success(editingLessonId ? "Lesson updated" : "Lesson created")
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save lesson")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!editingLessonId && (
        <div className="space-y-2">
          <Label>Course</Label>
          <Select
            value={form.course_id}
            onValueChange={(v) => setForm((f) => ({ ...f, course_id: v }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="lesson-title">Title</Label>
        <Input
          id="lesson-title"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lesson-desc">Description</Label>
        <Input
          id="lesson-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Content type</Label>
        <Select
          value={form.content_type}
          onValueChange={(v) => setForm((f) => ({ ...f, content_type: v as LessonContentType }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LESSON_CONTENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.content_type === "text" && (
        <div className="space-y-2">
          <Label htmlFor="lesson-content">Content (HTML supported)</Label>
          <textarea
            id="lesson-content"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="<p>Lesson body...</p>"
          />
        </div>
      )}

      {form.content_type === "video" && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL (YouTube or direct link)</Label>
            <Input
              id="video-url"
              value={form.video_url}
              onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">— or upload a file —</p>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
            {videoFile && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Upload className="h-3 w-3" />
                {videoFile.name}
              </span>
            )}
          </div>
          {form.video_url && !videoFile && (
            <p className="text-xs text-muted-foreground">Current: {form.video_url}</p>
          )}
        </div>
      )}

      {form.content_type === "articulate" && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="space-y-2">
            <Label htmlFor="articulate-url">Articulate publish URL</Label>
            <Input
              id="articulate-url"
              type="url"
              value={form.articulate_url}
              onChange={(e) => setForm((f) => ({ ...f, articulate_url: e.target.value }))}
              placeholder="https://petrosphere.com.ph/spherex_lms/scorm/127/story.html"
              disabled={!!scormFile}
            />
            <p className="text-xs text-muted-foreground">
              Hostinger / CDN URL to <strong>story.html</strong>, or upload a SCORM zip below.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Launch mode</Label>
            <Select
              value={form.articulate_launch_mode}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, articulate_launch_mode: v as "story" | "scorm" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="story">Story playback (recommended)</SelectItem>
                <SelectItem value="scorm">SCORM LMS mode (index_lms, compatibility only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-center text-xs text-muted-foreground">— or upload SCORM zip —</p>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setScormFile(e.target.files?.[0] ?? null)}
            />
            {scormFile && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Upload className="h-3 w-3" />
                {scormFile.name}
              </span>
            )}
          </div>
          {form.articulate_url && !scormFile && (
            <p className="text-xs text-muted-foreground">Current: {form.articulate_url}</p>
          )}
        </div>
      )}

      {form.content_type === "quiz" && (
        <div className="rounded-[1.25rem] border border-[#ebe4da] bg-white/80 p-4 dark:border-border dark:bg-card">
          {loadingQuiz ? (
            <p className="text-sm text-muted-foreground">Loading quiz…</p>
          ) : (
            <QuizEditor value={quiz} onChange={setQuiz} disabled={submitting} />
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sort">Order</Label>
          <Input
            id="sort"
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Minutes</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            value={form.duration_minutes}
            onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof form.status }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting || loadingQuiz}>
          {submitting ? "Saving…" : editingLessonId ? "Save Changes" : "Create Lesson"}
        </Button>
      </div>
    </form>
  )
}
