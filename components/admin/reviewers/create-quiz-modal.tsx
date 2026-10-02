"use client"

import { useEffect, useState } from "react"
import { apiPost } from "@/lib/api"
import {
  emptyQuiz,
  QuizEditor,
  quizDraftToPayload,
  validateQuizDraft,
  type QuizDraft,
} from "@/components/lessons/quiz-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const EXAM_TYPES = ["CSE", "NLE", "LET", "IELTS", "Other"] as const

type CreateQuizModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string | null
  groupTitle?: string
  examType?: string
  lockExamType?: boolean
  onCreated: () => void
}

export function CreateQuizModal({
  open,
  onOpenChange,
  groupId,
  groupTitle,
  examType = "CSE",
  lockExamType = false,
  onCreated,
}: CreateQuizModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState({
    description: "",
    exam_type: examType,
    category: "",
    is_published: true,
  })
  const [quiz, setQuiz] = useState<QuizDraft>(emptyQuiz("Part 1"))

  useEffect(() => {
    if (!open) return
    setMeta({
      description: "",
      exam_type: examType,
      category: groupTitle ? `${groupTitle} - Part 1` : "",
      is_published: true,
    })
    setQuiz(emptyQuiz(groupTitle ? `${groupTitle} — Part 1` : "Part 1"))
  }, [open, examType, groupTitle])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const error = validateQuizDraft(quiz)
    if (error) {
      alert(error)
      return
    }
    setLoading(true)
    try {
      const draft = quizDraftToPayload(quiz)
      const data = await apiPost<{ quiz: { id: string } }>("/reviewers/quizzes", {
        ...draft,
        description: meta.description.trim() || null,
        exam_type: meta.exam_type,
        category: meta.category.trim() || null,
        is_published: meta.is_published,
        group_id: groupId,
        sort_order: 0,
      })
      onCreated()
      onOpenChange(false)
      router.push(`/admin/reviewers/quizzes/${data.quiz.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not create quiz")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New practice part</DialogTitle>
          <DialogDescription>
            {groupTitle
              ? `Add a questionnaire under ${groupTitle}. You can keep editing questions after create.`
              : "Create a practice questionnaire."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Exam</Label>
              <Select
                value={meta.exam_type}
                onValueChange={(v) => setMeta((m) => ({ ...m, exam_type: v }))}
                disabled={lockExamType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category label</Label>
              <Input
                value={meta.category}
                onChange={(e) => setMeta((m) => ({ ...m, category: e.target.value }))}
                placeholder="English - Vocabulary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={meta.description}
              onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <Label>Published</Label>
              <p className="text-xs text-muted-foreground">Show on public Reviewers page</p>
            </div>
            <Switch
              checked={meta.is_published}
              onCheckedChange={(v) => setMeta((m) => ({ ...m, is_published: v }))}
            />
          </div>

          <QuizEditor value={quiz} onChange={setQuiz} disabled={loading} enableReviewerMarkup />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create & edit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
