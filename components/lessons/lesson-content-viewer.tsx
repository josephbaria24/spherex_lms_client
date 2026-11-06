"use client"

import { Spinner } from "@/components/ui/spinner"
import { useState } from "react"
import { QuizTaker } from "@/components/lessons/quiz-taker"
import { ArticulateLessonEmbed } from "@/components/lessons/articulate-lesson-embed"
import { Button } from "@/components/ui/button"
import { apiPost } from "@/lib/api"
import { isEmbeddableArticulateUrl, resolveVideoSrc } from "@/lib/lesson-media"
import type { ScormProgressPayload } from "@/lib/scorm-api"
import type { Lesson, LessonQuiz } from "@/lib/lesson-types"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

type LessonContentViewerProps = {
  courseId: string
  lesson: Lesson
  quiz?: LessonQuiz | null
  completed?: boolean
  allowSkip?: boolean
  onLessonComplete?: (progress?: ScormProgressPayload) => void
  onProgressChange?: (progress: ScormProgressPayload) => void
  previewMode?: boolean
  scormPlayerHref?: string
}

function MarkCompleteControl({
  courseId,
  lessonId,
  completed,
  previewMode,
  onLessonComplete,
}: {
  courseId: string
  lessonId: string
  completed?: boolean
  previewMode?: boolean
  onLessonComplete?: (progress?: ScormProgressPayload) => void
}) {
  const [saving, setSaving] = useState(false)

  if (previewMode) return null
  if (completed) {
    return (
      <p className="flex items-center gap-2 text-sm text-[#e85d4a]">
        <CheckCircle2 className="h-4 w-4" />
        Completed
      </p>
    )
  }

  async function markComplete() {
    setSaving(true)
    try {
      const res = await apiPost<{ progress?: ScormProgressPayload }>(
        `/learn/courses/${courseId}/lessons/${lessonId}/complete`,
      )
      toast.success("Lesson marked complete")
      onLessonComplete?.(res.progress)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not mark lesson complete")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      className="grow-btn-primary gap-1"
      onClick={() => void markComplete()}
      disabled={saving}
    >
      {saving ? <Spinner size={16} /> : <CheckCircle2 className="h-4 w-4" />}
      Mark complete or skip
    </Button>
  )
}

export function LessonContentViewer({
  courseId,
  lesson,
  quiz,
  completed,
  allowSkip = false,
  onLessonComplete,
  onProgressChange,
  previewMode,
  scormPlayerHref,
}: LessonContentViewerProps) {
  const type = lesson.content_type ?? "text"
  const completeControl = allowSkip ? (
    <MarkCompleteControl
      courseId={courseId}
      lessonId={lesson.id}
      completed={completed || lesson.completed}
      previewMode={previewMode}
      onLessonComplete={onLessonComplete}
    />
  ) : null

  if (type === "quiz" && quiz) {
    return (
      <div className="space-y-4">
        <QuizTaker
          courseId={courseId}
          lessonId={lesson.id}
          quiz={quiz}
          previewMode={previewMode}
          onPassed={(progress) => onLessonComplete?.(progress)}
        />
        {completeControl}
      </div>
    )
  }

  if (type === "video" && lesson.video_url) {
    const video = resolveVideoSrc(lesson.video_url)
    if (video.kind === "youtube") {
      return (
        <div className="space-y-4">
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
            <iframe
              src={video.src}
              title={lesson.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {completeControl}
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <video
          controls
          className="w-full rounded-xl border border-border bg-black"
          src={video.src}
          onEnded={() => {
            if (!previewMode && !completed && !lesson.completed) {
              void apiPost<{ progress?: ScormProgressPayload }>(
                `/learn/courses/${courseId}/lessons/${lesson.id}/complete`,
              )
                .then((res) => {
                  toast.success("Lesson marked complete")
                  onLessonComplete?.(res.progress)
                })
                .catch((err: unknown) => {
                  toast.error(err instanceof Error ? err.message : "Could not mark lesson complete")
                })
            }
          }}
        >
          Your browser does not support video playback.
        </video>
        {completeControl}
      </div>
    )
  }

  if (type === "articulate" && lesson.articulate_url && isEmbeddableArticulateUrl(lesson.articulate_url)) {
    return (
      <div className="space-y-4">
        <ArticulateLessonEmbed
          title={lesson.title}
          url={lesson.articulate_url}
          launchMode={lesson.articulate_launch_mode ?? "story"}
          durationMinutes={lesson.duration_minutes}
          courseId={courseId}
          lessonId={lesson.id}
          previewMode={previewMode}
          onLessonCompleted={onLessonComplete}
          onProgressChange={onProgressChange}
          scormPlayerHref={scormPlayerHref}
        />
        {completeControl}
      </div>
    )
  }

  if (lesson.content) {
    return (
      <div className="space-y-4">
        <article
          className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-border bg-card p-6"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
        {type !== "quiz" && type !== "articulate" ? completeControl : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        No content available for this lesson yet.
      </p>
      {type === "text" || type === "video" ? completeControl : null}
    </div>
  )
}
