"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { apiPost } from "@/lib/api"
import type { LessonQuiz } from "@/lib/lesson-types"
import { toast } from "sonner"
import { CheckCircle2, XCircle } from "lucide-react"

type QuizTakerProps = {
  courseId: string
  lessonId: string
  quiz: LessonQuiz
  onPassed: (progress?: {
    progress: number
    completed: boolean
    total: number
    done: number
    started?: number
  }) => void
  previewMode?: boolean
}

export function QuizTaker({ courseId, lessonId, quiz, onPassed, previewMode }: QuizTakerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    passing_score: number
    correct: number
    total: number
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (previewMode) {
      toast.message("Preview mode", { description: "Quiz answers are not submitted in preview." })
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
        progress?: {
          progress: number
          completed: boolean
          total: number
          done: number
          started?: number
        }
      }>(`/learn/courses/${courseId}/lessons/${lessonId}/quiz/submit`, { answers })

      setResult(res)
      if (res.passed) {
        toast.success("Quiz passed!")
        onPassed(res.progress)
      } else {
        toast.error(`Score ${res.score}% — need ${res.passing_score}% to pass`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit quiz")
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
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
        {!result.passed && (
          <Button className="mt-4" variant="outline" onClick={() => setResult(null)}>
            Try again
          </Button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{quiz.title}</h3>
        <p className="text-sm text-muted-foreground">Passing score: {quiz.passing_score}%</p>
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
