"use client"

import { useCallback, useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ClipboardCheck, Pencil } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api"
import { TeacherPageHeader } from "@/components/teacher/teacher-page-header"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { teacherApiPath } from "@/lib/teacher-api"

type Evaluation = {
  id: string
  enrollment_id: string
  score: number | null
  feedback: string | null
  status: "pending" | "graded" | "returned"
  full_name: string | null
  name: string | null
  email: string
  course_title: string
  progress_percent: number
}

export default function TeacherEvaluationsPage() {
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState<Evaluation | null>(null)
  const [score, setScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setEvaluations([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const path =
        statusFilter !== "all"
          ? teacherApiPath(selectedOrgId, `/evaluations?status=${statusFilter}`)
          : teacherApiPath(selectedOrgId, "/evaluations")
      const data = await apiGet<{ evaluations: Evaluation[] }>(path)
      setEvaluations(data.evaluations ?? [])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  function openGrade(ev: Evaluation) {
    setGrading(ev)
    setScore(ev.score != null ? String(ev.score) : "")
    setFeedback(ev.feedback ?? "")
  }

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault()
    if (!grading || !selectedOrgId) return
    setSubmitting(true)
    try {
      await apiPost(teacherApiPath(selectedOrgId, "/evaluations"), {
        enrollment_id: grading.enrollment_id,
        score: Number(score),
        feedback: feedback || undefined,
        status: "graded",
      })
      setGrading(null)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={ClipboardCheck}
          title="Evaluations"
          accent="grade growth"
          description="Review submissions and assign grades to your students"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Label className="text-sm text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading evaluations…</p>
        ) : evaluations.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No evaluations</p>
              <p className="mt-1 text-sm text-muted-foreground">Evaluations appear when students are enrolled in your courses.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {evaluations.map((ev) => (
              <Card key={ev.id} className="premium-card border border-border shadow-none">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{ev.full_name || ev.name || ev.email}</p>
                      <Badge variant={ev.status === "graded" ? "default" : "secondary"}>{ev.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{ev.course_title}</p>
                    {ev.score != null && (
                      <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Score: {ev.score}%</p>
                    )}
                    {ev.feedback && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ev.feedback}</p>}
                  </div>
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openGrade(ev)}>
                    <Pencil className="h-3.5 w-3.5" />
                    {ev.status === "graded" ? "Update" : "Grade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!grading} onOpenChange={() => setGrading(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Student</DialogTitle>
            <DialogDescription>
              {grading && `${grading.full_name || grading.email} — ${grading.course_title}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGrade} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="score">Score (0–100)</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={100}
                required
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <textarea
                id="feedback"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : "Submit Grade"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </GrowMainLayout>
  )
}
