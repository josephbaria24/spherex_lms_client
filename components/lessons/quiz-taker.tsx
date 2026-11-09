"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { apiPost, ApiError } from "@/lib/api"
import type { LessonQuiz, QuizAttemptResult, QuizAttemptState } from "@/lib/lesson-types"
import { toast } from "sonner"
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react"

type ProgressPayload = {
  progress: number
  completed: boolean
  total: number
  done: number
  started?: number
}

type QuizTakerProps = {
  courseId: string
  lessonId: string
  quiz: LessonQuiz
  completed?: boolean
  initialAttemptState?: QuizAttemptState | null
  initialResult?: QuizAttemptResult | null
  onPassed: (progress?: ProgressPayload) => void
  onModulesReset?: (payload: {
    firstLessonId: string | null
    progress?: ProgressPayload
    attemptState: QuizAttemptState
  }) => void
  previewMode?: boolean
}

function emptyAttemptState(max = 2): QuizAttemptState {
  return {
    max_attempts: max,
    attempts_used: 0,
    attempts_remaining: max,
    module_retake_required: false,
    already_passed: false,
  }
}

export function QuizTaker({
  courseId,
  lessonId,
  quiz,
  completed = false,
  initialAttemptState,
  initialResult,
  onPassed,
  onModulesReset,
  previewMode,
}: QuizTakerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [attemptState, setAttemptState] = useState<QuizAttemptState>(
    () => initialAttemptState ?? emptyAttemptState(),
  )
  const [result, setResult] = useState<QuizAttemptResult | null>(() => {
    if (initialResult) return initialResult
    if (completed || initialAttemptState?.already_passed) {
      return {
        score: 100,
        passed: true,
        passing_score: quiz.passing_score,
        correct: quiz.questions.length,
        total: quiz.questions.length,
      }
    }
    return null
  })

  useEffect(() => {
    if (initialAttemptState) setAttemptState(initialAttemptState)
  }, [initialAttemptState])

  useEffect(() => {
    if (initialResult) {
      setResult(initialResult)
      return
    }
    if (completed || initialAttemptState?.already_passed) {
      setResult((prev) =>
        prev?.passed
          ? prev
          : {
              score: 100,
              passed: true,
              passing_score: quiz.passing_score,
              correct: quiz.questions.length,
              total: quiz.questions.length,
            },
      )
    }
  }, [completed, initialAttemptState?.already_passed, initialResult, quiz.passing_score, quiz.questions.length])

  const alreadyPassed =
    completed || attemptState.already_passed === true || result?.passed === true

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (previewMode) {
      toast.message("Preview mode", { description: "Quiz answers are not submitted in preview." })
      return
    }
    if (alreadyPassed) {
      toast.message("Quiz already passed")
      return
    }
    if (attemptState.module_retake_required) {
      toast.error("Retake the modules before trying the quiz again")
      return
    }
    const unanswered = quiz.questions.filter((q) => q.id && !answers[q.id])
    if (unanswered.length > 0) {
      toast.error("Please answer all questions")
      return
    }

    setSubmitting(true)
    try {
      const res = await apiPost<{
        score: number
        passed: boolean
        passing_score: number
        correct: number
        total: number
        progress?: ProgressPayload
        attempt_state?: QuizAttemptState
      }>(`/learn/courses/${courseId}/lessons/${lessonId}/quiz/submit`, { answers })

      setResult(res)
      if (res.attempt_state) setAttemptState(res.attempt_state)
      if (res.passed) {
        toast.success(res.progress?.completed ? "Course completed!" : "Quiz passed!")
        onPassed(res.progress)
      } else if (res.attempt_state?.module_retake_required) {
        toast.error(
          `Score ${res.score}% — both attempts used. Retake the modules to try again.`,
        )
      } else {
        const left = res.attempt_state?.attempts_remaining ?? 0
        toast.error(
          `Score ${res.score}% — need ${res.passing_score}% to pass · ${left} attempt${left === 1 ? "" : "s"} left`,
        )
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.details as {
          details?: QuizAttemptState & { code?: string }
        }
        if (body?.details?.code === "ALREADY_PASSED") {
          setAttemptState((prev) => ({
            ...prev,
            ...body.details,
            already_passed: true,
            attempts_remaining: 0,
            module_retake_required: false,
          }))
          setResult(
            (prev) =>
              prev ?? {
                score: 100,
                passed: true,
                passing_score: quiz.passing_score,
                correct: quiz.questions.length,
                total: quiz.questions.length,
              },
          )
          toast.message("Quiz already passed")
          return
        }
        if (body?.details?.code === "MODULE_RETAKE_REQUIRED" && body.details) {
          setAttemptState({
            max_attempts: body.details.max_attempts,
            attempts_used: body.details.attempts_used,
            attempts_remaining: body.details.attempts_remaining,
            module_retake_required: true,
            already_passed: false,
          })
          setResult(null)
        }
      }
      toast.error(err instanceof Error ? err.message : "Could not submit quiz")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRetakeModules() {
    if (previewMode) return
    setResetting(true)
    try {
      const res = await apiPost<{
        ok: boolean
        first_lesson_id: string | null
        progress?: ProgressPayload
        attempt_state: QuizAttemptState
      }>(`/learn/courses/${courseId}/lessons/${lessonId}/quiz/retake-modules`)

      setAttemptState(res.attempt_state)
      setAnswers({})
      setResult(null)
      toast.message("Modules reset", {
        description: "Complete the modules again, then you get 2 fresh quiz attempts.",
      })
      onModulesReset?.({
        firstLessonId: res.first_lesson_id,
        progress: res.progress,
        attemptState: res.attempt_state,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset modules")
    } finally {
      setResetting(false)
    }
  }

  const attemptLabel = `Attempt ${Math.min(attemptState.attempts_used + 1, attemptState.max_attempts)} of ${attemptState.max_attempts}`

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/20 p-6 text-center">
          {result.passed ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          ) : (
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
          )}
          <p className="mt-3 text-2xl font-bold">{result.score}%</p>
          <p className="text-sm text-muted-foreground">
            {result.correct} of {result.total} correct · Pass mark {result.passing_score}%
          </p>
          {result.passed ? (
            <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Quiz passed — no need to retake
            </p>
          ) : attemptState.module_retake_required ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Both attempts used. Retake the course modules, then you can try the quiz again.
              </p>
              <Button className="gap-1.5" onClick={() => void handleRetakeModules()} disabled={resetting}>
                <RotateCcw className="h-4 w-4" />
                {resetting ? "Resetting…" : "Retake modules"}
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                {attemptState.attempts_remaining} attempt
                {attemptState.attempts_remaining === 1 ? "" : "s"} remaining
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setAnswers({})
                  setResult(null)
                }}
              >
                Retake quiz
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (attemptState.module_retake_required) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-6 text-center">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <div>
          <p className="text-lg font-semibold">Quiz locked</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You used both attempts. Retake the modules to unlock 2 new attempts.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => void handleRetakeModules()} disabled={resetting || previewMode}>
          <RotateCcw className="h-4 w-4" />
          {resetting ? "Resetting…" : "Retake modules"}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{quiz.title}</h3>
        <p className="text-sm text-muted-foreground">
          Passing score: {quiz.passing_score}% · {attemptLabel}
        </p>
      </div>

      {quiz.questions.map((q, idx) => (
        <div key={q.id ?? idx} className="rounded-xl border border-border p-4">
          <p className="font-medium">
            {idx + 1}. {q.prompt}
          </p>
          <RadioGroup
            className="mt-3 space-y-2"
            value={q.id ? answers[q.id] : undefined}
            onValueChange={(v) => q.id && setAnswers((a) => ({ ...a, [q.id!]: v }))}
          >
            {q.options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <RadioGroupItem value={opt.id} id={`${q.id}-${opt.id}`} />
                <Label htmlFor={`${q.id}-${opt.id}`} className="font-normal">
                  {opt.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}

      <Button type="submit" disabled={submitting || previewMode} className="w-full rounded-xl">
        {previewMode ? "Preview only" : submitting ? "Submitting…" : "Submit quiz"}
      </Button>
    </form>
  )
}
