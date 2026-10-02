"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MathText } from "@/components/reviewers/math-text"
import type { QuizQuestion } from "@/lib/lesson-types"
import { Bold, Download, FileUp, FunctionSquare, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { downloadQuizTemplate, importQuizFile } from "@/lib/quiz-import"

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
    if (q.question_type === "fill_blank") {
      if (!q.correct_option_id?.trim()) return `Question ${i + 1} needs a correct answer`
      continue
    }
    if (q.question_type === "multi_select") {
      const filled = q.options.filter((o) => o.text.trim())
      if (filled.length < 2) return `Question ${i + 1} needs at least two answer options`
      const selected = (q.correct_option_id ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      if (selected.length === 0) return `Question ${i + 1} needs at least one correct option`
      continue
    }
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
      options:
        q.question_type === "fill_blank"
          ? (q.options ?? []).filter((o) => o.text.trim())
          : q.options,
      correct_option_id: q.correct_option_id!,
      sort_order: i,
    })),
  }
}

type QuizEditorProps = {
  value: QuizDraft
  onChange: (quiz: QuizDraft) => void
  disabled?: boolean
  /** Show math/emphasis helpers + live preview (reviewer questionnaires) */
  enableReviewerMarkup?: boolean
}

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  fallback = "text",
) {
  const selected = value.slice(start, end) || fallback
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
  const cursor = start + before.length + selected.length + after.length
  return { next, cursor }
}

function MarkupField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  multiline,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
  multiline?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)

  function applyWrap(before: string, after: string, fallback: string) {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const { next, cursor } = wrapSelection(value, start, end, before, after, fallback)
    onChange(next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(cursor, cursor)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs"
            disabled={disabled}
            onClick={() => applyWrap("[[EMPH]]", "[[/EMPH]]", "word")}
          >
            <Bold className="h-3 w-3" />
            Emphasize
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-xs"
            disabled={disabled}
            onClick={() => applyWrap("[[MATH]]", "[[/MATH]]", "\\dfrac{1}{2}")}
          >
            <FunctionSquare className="h-3 w-3" />
            Math
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={disabled}
            onClick={() => applyWrap("[[MATH]]\\dfrac{", "}{2}[[/MATH]]", "1")}
          >
            Fraction
          </Button>
        </div>
      </div>

      {multiline ? (
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="font-mono text-sm"
        />
      ) : (
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="font-mono text-sm"
        />
      )}

      {value.trim() ? (
        <div className="rounded-lg border bg-white px-3 py-2 text-sm dark:bg-background">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <MathText
            text={value}
            asMathBlock={/\[\[MATH\]\]|\\dfrac|\\left/.test(value)}
          />
        </div>
      ) : null}
    </div>
  )
}

export function QuizEditor({
  value,
  onChange,
  disabled,
  enableReviewerMarkup = false,
}: QuizEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)

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
        if (patch.question_type === "fill_blank") {
          next.options = []
          next.correct_option_id = next.correct_option_id?.trim() ? next.correct_option_id : ""
        }
        if (patch.question_type === "multi_select" && q.question_type !== "multi_select") {
          if (next.options.length < 2) {
            next.options = [
              { id: `a${idx}`, text: "" },
              { id: `b${idx}`, text: "" },
            ]
          }
          next.correct_option_id = next.options[0]?.id ?? ""
        }
        if (patch.question_type === "multiple_choice" && q.question_type !== "multiple_choice") {
          if (next.options.length < 2) {
            next.options = [
              { id: `a${idx}`, text: "" },
              { id: `b${idx}`, text: "" },
            ]
          }
          next.correct_option_id = next.options[0]?.id ?? ""
        }
        return next
      }),
    })
  }

  async function onImportFile(file: File) {
    const result = await importQuizFile(file)
    if (result.questions.length === 0) {
      toast.error(result.errors[0] ?? "Could not import questions")
      return
    }
    const existing = value.questions.filter((question) => question.prompt.trim())
    onChange({
      ...value,
      questions: [...existing, ...result.questions],
    })
    if (result.errors.length > 0) {
      toast.warning(`Imported ${result.questions.length} questions. ${result.errors[0]}`)
    } else {
      toast.success(`Imported ${result.questions.length} questions`)
    }
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

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (file) void onImportFile(file)
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp className="h-3.5 w-3.5" />
          Import CSV or Excel
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1"
          disabled={disabled}
          onClick={downloadQuizTemplate}
        >
          <Download className="h-3.5 w-3.5" />
          Download template
        </Button>
        <p className="text-xs text-muted-foreground">
          Columns: question type, questions, choices, correct answers. Separate choices with |.
        </p>
      </div>

      {enableReviewerMarkup ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Use markup for the same layout as CSE Math:
          <code className="mx-1 rounded bg-muted px-1">[[MATH]]\dfrac{"{3}{8}"}[[/MATH]]</code>
          for stacked fractions, and
          <code className="mx-1 rounded bg-muted px-1">[[EMPH]]word[[/EMPH]]</code>
          for bold-italic emphasis. Select text, then tap Emphasize / Math / Fraction.
        </div>
      ) : null}

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

          {enableReviewerMarkup ? (
            <MarkupField
              label="Question prompt"
              value={q.prompt}
              onChange={(prompt) => updateQuestion(qIdx, { prompt })}
              disabled={disabled}
              placeholder='e.g. Find x: [[MATH]]x:\left[\dfrac{3}{8}(72)\right][[/MATH]]'
              multiline
            />
          ) : (
            <Input
              value={q.prompt}
              onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
              placeholder="Enter the question"
              disabled={disabled}
              required
            />
          )}

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
              {enableReviewerMarkup ? (
                <>
                  <SelectItem value="fill_blank">Fill in the blank</SelectItem>
                  <SelectItem value="multi_select">Multi-select</SelectItem>
                </>
              ) : null}
            </SelectContent>
          </Select>

          {q.question_type === "fill_blank" ? (
            <div className="space-y-2">
              <Label>Correct answer</Label>
              <Input
                value={q.correct_option_id ?? ""}
                onChange={(e) => updateQuestion(qIdx, { correct_option_id: e.target.value })}
                placeholder="Exact answer (case-insensitive)"
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Learners type a short answer. Matching is case-insensitive.
              </p>
            </div>
          ) : q.question_type === "multi_select" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Check all correct options
              </p>
              {q.options.map((opt, oIdx) => {
                const selected = (q.correct_option_id ?? "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                const checked = selected.includes(opt.id)
                return (
                  <div key={opt.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-3"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? selected.filter((id) => id !== opt.id)
                          : [...selected, opt.id]
                        updateQuestion(qIdx, { correct_option_id: next.join(",") })
                      }}
                      disabled={disabled}
                    />
                    <div className="min-w-0 flex-1">
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
                      />
                    </div>
                    {q.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-1 h-8 w-8 shrink-0"
                        disabled={disabled}
                        onClick={() => {
                          const options = q.options.filter((_, i) => i !== oIdx)
                          const nextSelected = selected.filter((id) => id !== opt.id)
                          updateQuestion(qIdx, {
                            options,
                            correct_option_id: nextSelected.join(",") || options[0]?.id,
                          })
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )
              })}
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
          ) : q.question_type === "multiple_choice" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Select the radio button for the correct answer
              </p>
              {q.options.map((opt, oIdx) => (
                <div key={opt.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      className="mt-3"
                      checked={q.correct_option_id === opt.id}
                      onChange={() => updateQuestion(qIdx, { correct_option_id: opt.id })}
                      disabled={disabled}
                    />
                    <div className="min-w-0 flex-1">
                      {enableReviewerMarkup ? (
                        <MarkupField
                          label={`Option ${String.fromCharCode(65 + oIdx)}`}
                          value={opt.text}
                          onChange={(text) => {
                            const options = q.options.map((o, i) =>
                              i === oIdx ? { ...o, text } : o,
                            )
                            updateQuestion(qIdx, { options })
                          }}
                          disabled={disabled}
                          placeholder='e.g. [[MATH]]\dfrac{8}{(6^{2})(8^{2})}[[/MATH]]'
                        />
                      ) : (
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
                        />
                      )}
                    </div>
                    {q.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 h-8 w-8 shrink-0"
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
