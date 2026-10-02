"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { apiGet, apiPut } from "@/lib/api"
import {
  QuizEditor,
  quizDraftToPayload,
  validateQuizDraft,
  type QuizDraft,
} from "@/components/lessons/quiz-editor"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { GrowHeader } from "@/components/grow-shell"
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
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { ArrowLeft, ClipboardList, Loader2, Save } from "lucide-react"

const EXAM_TYPES = ["CSE", "NLE", "LET", "IELTS", "Other"] as const

type AdminQuizDetail = {
  id: string
  title: string
  description: string | null
  exam_type: string
  category: string | null
  passing_score: number
  is_published: boolean
  group_id: string | null
  sort_order: number
  passage_html: string | null
  audio_url: string | null
  time_limit_seconds: number | null
  questions: {
    id: string
    sort_order: number
    prompt: string
    question_type: string
    options: { id: string; text: string }[]
    correct_option_id?: string
  }[]
}

type GroupOption = { id: string; title: string }

export default function AdminReviewerQuizEditPage() {
  const params = useParams<{ quizId: string }>()
  const quizId = params.quizId
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [meta, setMeta] = useState({
    description: "",
    exam_type: "CSE",
    category: "",
    is_published: true,
    group_id: "" as string,
    sort_order: 0,
    passage_html: "",
    audio_url: "",
    time_limit_minutes: "" as string,
  })
  const [quiz, setQuiz] = useState<QuizDraft | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [quizRes, groupsRes] = await Promise.all([
        apiGet<{ quiz: AdminQuizDetail }>(`/reviewers/quizzes/${quizId}`),
        apiGet<{ groups: GroupOption[] }>("/reviewers/groups"),
      ])
      const q = quizRes.quiz
      setGroups((groupsRes.groups ?? []).map((g) => ({ id: g.id, title: g.title })))
      setMeta({
        description: q.description ?? "",
        exam_type: q.exam_type,
        category: q.category ?? "",
        is_published: q.is_published,
        group_id: q.group_id ?? "",
        sort_order: q.sort_order ?? 0,
        passage_html: q.passage_html ?? "",
        audio_url: q.audio_url ?? "",
        time_limit_minutes: q.time_limit_seconds
          ? String(Math.round(q.time_limit_seconds / 60))
          : "",
      })
      setQuiz({
        title: q.title,
        passing_score: q.passing_score,
        questions: q.questions.map((question) => ({
          prompt: question.prompt,
          question_type: question.question_type as QuizDraft["questions"][number]["question_type"],
          options: question.options,
          correct_option_id: question.correct_option_id ?? question.options[0]?.id ?? "",
        })),
      })
    } catch (err) {
      console.error(err)
      alert("Could not load quiz")
      router.push("/admin/reviewers")
    } finally {
      setLoading(false)
    }
  }, [quizId, router])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    if (!quiz) return
    const error = validateQuizDraft(quiz)
    if (error) {
      alert(error)
      return
    }
    setSaving(true)
    try {
      const draft = quizDraftToPayload(quiz)
      const minutes = Number(meta.time_limit_minutes)
      await apiPut(`/reviewers/quizzes/${quizId}`, {
        ...draft,
        description: meta.description.trim() || null,
        exam_type: meta.exam_type,
        category: meta.category.trim() || null,
        is_published: meta.is_published,
        group_id: meta.group_id || null,
        sort_order: Number(meta.sort_order) || 0,
        passage_html: meta.passage_html.trim() || null,
        audio_url: meta.audio_url.trim() || null,
        time_limit_seconds:
          Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null,
      })
      alert("Questionnaire saved")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <GrowHeader
          icon={ClipboardList}
          title={quiz?.title || "Edit questionnaire"}
          accent="reviewer quiz"
          description="Edit questions, answers, subject group, and publish status"
          showDate={false}
        >
          <Button variant="outline" asChild>
            <Link href={meta.exam_type === "IELTS" ? "/admin/ielts" : "/admin/reviewers"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !quiz}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </GrowHeader>

        {loading || !quiz ? (
          <div className="flex min-h-[240px] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading questionnaire…
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Exam</Label>
                  <Select
                    value={meta.exam_type}
                    onValueChange={(v) => setMeta((m) => ({ ...m, exam_type: v }))}
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
                  <Label>Subject group</Label>
                  <Select
                    value={meta.group_id || "none"}
                    onValueChange={(v) =>
                      setMeta((m) => ({ ...m, group_id: v === "none" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ungrouped" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ungrouped</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={meta.category}
                    onChange={(e) => setMeta((m) => ({ ...m, category: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort order in group</Label>
                  <Input
                    type="number"
                    value={meta.sort_order}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, sort_order: Number(e.target.value) || 0 }))
                    }
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Time limit (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    value={meta.time_limit_minutes}
                    onChange={(e) =>
                      setMeta((m) => ({ ...m, time_limit_minutes: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">Leave blank for untimed practice</p>
                </div>
                <div className="space-y-2">
                  <Label>Audio URL (Listening)</Label>
                  <Input
                    value={meta.audio_url}
                    onChange={(e) => setMeta((m) => ({ ...m, audio_url: e.target.value }))}
                    placeholder="https://… or /api/uploads/…"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Shared reading passage</Label>
                <Textarea
                  value={meta.passage_html}
                  onChange={(e) => setMeta((m) => ({ ...m, passage_html: e.target.value }))}
                  rows={6}
                  placeholder="Shown beside questions for Reading practice (plain text OK)"
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <Label>Published</Label>
                  <p className="text-xs text-muted-foreground">Visible inside the subject card</p>
                </div>
                <Switch
                  checked={meta.is_published}
                  onCheckedChange={(v) => setMeta((m) => ({ ...m, is_published: v }))}
                />
              </div>
            </Card>

            <Card className="p-5">
              <QuizEditor value={quiz} onChange={setQuiz} disabled={saving} enableReviewerMarkup />
            </Card>
          </div>
        )}
      </div>
    </GrowMainLayout>
  )
}
