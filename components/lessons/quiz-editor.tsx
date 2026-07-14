"use client"

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
import type { QuizQuestion } from "@/lib/lesson-types"
import { Plus, Trash2 } from "lucide-react"

export type QuizDraft = {
  title: string
  passing_score: number
  questions: QuizQuestion[]
}

export function emptyQuiz(title = "Lesson Quiz"): QuizDraft {
  return {
    title,
    passing_score: 70,
    questions: [newMultipleChoiceQuestion(0)],
  }
}

export function newMultipleChoiceQuestion(index: number): QuizQuestion {
  const suffix = index > 0 ? String(index) : ""
  return {
    prompt: "",
    question_type: "multiple_choice",
    options: [
      { id: `a${suffix}`, text: "" },
      { id: `b${suffix}`, text: "" },
    ],
    correct_option_id: `a${suffix}`,
  }
}

export function validateQuizDraft(quiz: QuizDraft): string | null {
  if (!quiz.title.trim()) return "Quiz title is required"
  if (quiz.questions.length === 0) return "Add at least one question"
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i]!
    if (!q.prompt.trim()) return `Question ${i + 1} needs a prompt`
    if (q.question_type === "multiple_choice") {
      const filled = q.options.filter((o) => o.text.trim())
      if (filled.length < 2) return `Question ${i + 1} needs at least two answer options`
      if (!q.correct_option_id || !q.options.some((o) => o.id === q.correct_option_id)) {
        return `Question ${i + 1} needs a correct answer selected`
      }
    }
  }
  return null
}

export function quizDraftToPayload(quiz: QuizDraft) {
  return {
    title: quiz.title.trim(),
    passing_score: quiz.passing_score,
    questions: quiz.questions.map((q, i) => ({
      prompt: q.prompt.trim(),
      question_type: q.question_type,
      options: q.options,
      correct_option_id: q.correct_option_id!,
      sort_order: i,
    })),
  }
}

type QuizEditorProps = {
  value: QuizDraft
  onChange: (quiz: QuizDraft) => void
  disabled?: boolean
}

export function QuizEditor({ value, onChange, disabled }: QuizEditorProps) {
  function updateQuestion(idx: number, patch: Partial<QuizQuestion>) {
    onChange({
      ...value,
      questions: value.questions.map((q, i) => {
        if (i !== idx) return q
        const next = { ...q, ...patch }
        if (patch.question_type === "true_false") {
          next.options = [
            { id: "true", text: "True" },
            { id: "false", text: "False" },
          ]
          next.correct_option_id = "true"
        }
        return next
      }),
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Quiz title</Label>
          <Input
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="e.g. Module 1 check-in"
            disabled={disabled}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Passing score (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={value.passing_score}
            onChange={(e) =>
              onChange({ ...value, passing_score: Number(e.target.value) || 0 })
            }
            disabled={disabled}
          />
        </div>
      </div>

      {value.questions.map((q, qIdx) => (
        <div
          key={qIdx}
          className="space-y-3 rounded-[1.25rem] border border-[#ebe4da] bg-[#faf8f5] p-4 dark:border-border dark:bg-muted/20"
        >
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-semibold">Question {qIdx + 1}</Label>
            {value.questions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...value,
                    questions: value.questions.filter((_, i) => i !== qIdx),
                  })
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <Input
            value={q.prompt}
            onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
            placeholder="Enter the question"
            disabled={disabled}
            required
          />

          <Select
            value={q.question_type}
            onValueChange={(v) =>
              updateQuestion(qIdx, {
                question_type: v as QuizQuestion["question_type"],
              })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple_choice">Multiple choice</SelectItem>
              <SelectItem value="true_false">True / False</SelectItem>
            </SelectContent>
          </Select>

          {q.question_type === "multiple_choice" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Select the radio button for the correct answer
              </p>
              {q.options.map((opt, oIdx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={q.correct_option_id === opt.id}
                    onChange={() => updateQuestion(qIdx, { correct_option_id: opt.id })}
                    disabled={disabled}
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => {
                      const options = q.options.map((o, i) =>
                        i === oIdx ? { ...o, text: e.target.value } : o,
                      )
                      updateQuestion(qIdx, { options })
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    disabled={disabled}
                    className="flex-1"
                  />
                  {q.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={disabled}
                      onClick={() => {
                        const options = q.options.filter((_, i) => i !== oIdx)
                        const correct =
                          q.correct_option_id === opt.id
                            ? options[0]?.id
                            : q.correct_option_id
                        updateQuestion(qIdx, { options, correct_option_id: correct })
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={disabled}
                  onClick={() => {
                    const id = `opt${qIdx}_${q.options.length}_${Date.now()}`
                    updateQuestion(qIdx, {
                      options: [...q.options, { id, text: "" }],
                    })
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </Button>
              )}
            </div>
          ) : (
            <Select
              value={q.correct_option_id}
              onValueChange={(v) => updateQuestion(qIdx, { correct_option_id: v })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True is correct</SelectItem>
                <SelectItem value="false">False is correct</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        disabled={disabled}
        onClick={() =>
          onChange({
            ...value,
            questions: [...value.questions, newMultipleChoiceQuestion(value.questions.length)],
          })
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add question
      </Button>
    </div>
  )
}
