"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { resolveArticulateLaunchUrl, resolveVideoSrc } from "@/lib/lesson-media"
import type { Lesson, LessonQuiz, QuizQuestion } from "@/lib/lesson-types"
import { CheckCircle2, Loader2 } from "lucide-react"

type LessonPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  lesson: Lesson | null
  quiz: LessonQuiz | null
}

function correctIds(question: QuizQuestion): Set<string> {
  return new Set(
    (question.correct_option_id ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  )
}

function QuizPreview({ quiz }: { quiz: LessonQuiz }) {
  if (quiz.questions.length === 0) {
    return <p className="text-sm text-muted-foreground">This quiz has no questions yet.</p>
  }

  return (
    <ol className="space-y-4">
      {quiz.questions.map((question, index) => {
        const answers = correctIds(question)
        return (
          <li key={question.id ?? index} className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium">
              {index + 1}. {question.prompt}
            </p>
            {question.question_type === "fill_blank" ? (
              <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                Answer: {question.correct_option_id}
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {question.options.map((option) => {
                  const correct = answers.has(option.id)
                  return (
                    <li
                      key={option.id}
                      className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                        correct ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : ""
                      }`}
                    >
                      {correct ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <span className="w-3.5" />}
                      <span>{option.text}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function LessonPreviewBody({ lesson, quiz }: { lesson: Lesson; quiz: LessonQuiz | null }) {
  const type = lesson.content_type ?? "text"

  if (type === "quiz") {
    if (!quiz) return <p className="text-sm text-muted-foreground">This quiz has no questions yet.</p>
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Passing score {quiz.passing_score}%</p>
        <QuizPreview quiz={quiz} />
      </div>
    )
  }

  if (type === "articulate" && lesson.articulate_url) {
    const { playbackSrc } = resolveArticulateLaunchUrl(
      lesson.articulate_url,
      lesson.articulate_launch_mode ?? "story",
    )
    return (
      <iframe
        src={playbackSrc}
        title={lesson.title}
        className="h-[min(70vh,720px)] w-full rounded-lg border border-border bg-black"
        allow="fullscreen; autoplay; clipboard-write"
      />
    )
  }

  if (type === "video" && lesson.video_url) {
    const video = resolveVideoSrc(lesson.video_url)
    if (video.kind === "youtube") {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
          <iframe src={video.src} title={lesson.title} className="h-full w-full" allowFullScreen />
        </div>
      )
    }
    return (
      <video controls className="w-full rounded-lg border border-border bg-black" src={video.src}>
        Your browser does not support video playback.
      </video>
    )
  }

  if (lesson.content) {
    return (
      <article
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: lesson.content }}
      />
    )
  }

  return <p className="text-sm text-muted-foreground">No content available for this lesson yet.</p>
}

export function LessonPreviewDialog({
  open,
  onOpenChange,
  loading,
  lesson,
  quiz,
}: LessonPreviewDialogProps) {
  const wide = lesson?.content_type === "articulate" || lesson?.content_type === "video"
  const title = lesson?.content_type === "quiz" ? lesson.quiz_title || quiz?.title || lesson.title : lesson?.title

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${wide ? "sm:max-w-5xl" : "sm:max-w-2xl"}`}>
        <DialogHeader>
          <DialogTitle>{title || "Lesson"}</DialogTitle>
          <DialogDescription>
            {lesson?.description?.trim() || "Lesson content"}
          </DialogDescription>
        </DialogHeader>
        {loading || !lesson ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading content…
          </p>
        ) : (
          <LessonPreviewBody lesson={lesson} quiz={quiz} />
        )}
      </DialogContent>
    </Dialog>
  )
}
