"use client"

import { QuizTaker } from "@/components/lessons/quiz-taker"
import { ArticulateLessonEmbed } from "@/components/lessons/articulate-lesson-embed"
import { isEmbeddableArticulateUrl, resolveVideoSrc } from "@/lib/lesson-media"
import type { ScormProgressPayload } from "@/lib/scorm-api"
import type { Lesson, LessonQuiz } from "@/lib/lesson-types"

type LessonContentViewerProps = {
  courseId: string
  lesson: Lesson
  quiz?: LessonQuiz | null
  onLessonComplete?: (progress?: ScormProgressPayload) => void
  onProgressChange?: (progress: ScormProgressPayload) => void
  previewMode?: boolean
  scormPlayerHref?: string
}

export function LessonContentViewer({
  courseId,
  lesson,
  quiz,
  onLessonComplete,
  onProgressChange,
  previewMode,
  scormPlayerHref,
}: LessonContentViewerProps) {
  const type = lesson.content_type ?? "text"

  if (type === "quiz" && quiz) {
    return (
      <QuizTaker
        courseId={courseId}
        lessonId={lesson.id}
        quiz={quiz}
        previewMode={previewMode}
        onPassed={(progress) => onLessonComplete?.(progress)}
      />
    )
  }

  if (type === "video" && lesson.video_url) {
    const video = resolveVideoSrc(lesson.video_url)
    if (video.kind === "youtube") {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
          <iframe
            src={video.src}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
    return (
      <video
        controls
        className="w-full rounded-xl border border-border bg-black"
        src={video.src}
      >
        Your browser does not support video playback.
      </video>
    )
  }

  if (type === "articulate" && lesson.articulate_url && isEmbeddableArticulateUrl(lesson.articulate_url)) {
    return (
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
    )
  }

  if (lesson.content) {
    return (
      <article
        className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-border bg-card p-6"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />
    )
  }

  return (
    <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
      No content available for this lesson yet.
    </p>
  )
}
