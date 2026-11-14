"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { apiDelete, apiGet, apiPatch } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { getReviewerAccent } from "@/lib/reviewer-accents"
import { UploadReviewerModal } from "@/components/admin/reviewers/upload-reviewer-modal"
import {
  GroupFormModal,
  type AdminReviewerGroup,
} from "@/components/admin/reviewers/group-form-modal"
import { CreateQuizModal } from "@/components/admin/reviewers/create-quiz-modal"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GrowHeader } from "@/components/grow-shell"
import { IeltsAccessRequests } from "@/components/admin/ielts/ielts-access-requests"
import { IeltsAnswerKeyToggle } from "@/components/admin/ielts/ielts-answer-key-toggle"
import { IeltsMockSessionToggle } from "@/components/admin/ielts/ielts-mock-session-toggle"
import { IeltsUkviRequests } from "@/components/admin/ielts/ielts-ukvi-requests"
import {
  Search,
  MoreVertical,
  Trash2,
  Download,
  Upload,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Layers3,
  ClipboardList,
  ChevronDown,
  Languages,
  BarChart3,
  FileText,
  Users,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ReviewerMaterial {
  id: string
  title: string
  description: string | null
  exam_type: string
  category: string | null
  tags: string[]
  file_url: string
  external_url: string | null
  is_published: boolean
  updated_at: string
}

type AdminQuiz = {
  id: string
  title: string
  exam_type: string
  category: string | null
  passing_score: number
  is_published: boolean
  sort_order: number
  updated_at: string
  question_count: number
  group_id?: string | null
}

type AdminGroup = AdminReviewerGroup & {
  quiz_count: number
  quizzes: AdminQuiz[]
}

type AttemptRow = {
  id: string
  score: number
  passed: boolean
  band_score: number | string | null
  created_at: string
  quiz_id: string
  quiz_title: string
  category: string | null
  exam_type: string
  group_id: string | null
  group_title: string | null
  skill?: string | null
  pending_review?: boolean
  user_id: string | null
  user_email: string | null
  user_name: string
}

type AttemptSummary = {
  total: number
  passed: number
  avg_score: string | null
  avg_band: string | null
}

type AttemptAnswerItem = {
  id: string
  number: number
  prompt: string
  question_type: string
  learner_answer: string
  correct_answer: string
  raw_answer: string | null
  audio_url: string | null
  audio_seconds: number | null
  is_correct: boolean
}

type AttemptDetail = {
  summary: { correct: number; total: number; score: number }
  items: AttemptAnswerItem[]
}

type LearnerSkillProgress = {
  skill: string
  total_sets: number
  passed_sets: number
  attempted_sets: number
  best_band: number | null
  pending_review: number
}

type LearnerProgress = {
  user_id: string
  user_name: string
  user_email: string
  attempts: number
  passed_sets: number
  total_sets: number
  completion_pct: number
  avg_band: number | null
  last_activity: string | null
  certificate_serial: string | null
  certificate_issued_at: string | null
  pending_speaking: number
  skills: LearnerSkillProgress[]
}

const PREVIEW_PARTS = 3

export default function AdminIeltsPage() {
  const [view, setView] = useState<"skills" | "materials" | "progress" | "results" | "requests">(
    "skills",
  )
  const [materials, setMaterials] = useState<ReviewerMaterial[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [learners, setLearners] = useState<LearnerProgress[]>([])
  const [publishedSetCount, setPublishedSetCount] = useState(0)
  const [ieltsUserCount, setIeltsUserCount] = useState(0)
  const [expandedLearners, setExpandedLearners] = useState<Record<string, boolean>>({})
  const [expandedAttempts, setExpandedAttempts] = useState<Record<string, boolean>>({})
  const [attemptDetails, setAttemptDetails] = useState<Record<string, AttemptDetail>>({})
  const [attemptDetailLoading, setAttemptDetailLoading] = useState<Record<string, boolean>>({})
  const [attemptDetailError, setAttemptDetailError] = useState<Record<string, string>>({})
  const [summary, setSummary] = useState<AttemptSummary>({
    total: 0,
    passed: 0,
    avg_score: null,
    avg_band: null,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AdminReviewerGroup | null>(null)
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [quizTargetGroup, setQuizTargetGroup] = useState<AdminGroup | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const fetchMaterials = useCallback(async () => {
    const data = await apiGet<{ materials: ReviewerMaterial[] }>("/reviewers?exam_type=IELTS")
    setMaterials(data.materials ?? [])
  }, [])

  const fetchGroups = useCallback(async () => {
    const data = await apiGet<{ groups: AdminGroup[] }>("/reviewers/groups?exam_type=IELTS")
    setGroups(data.groups ?? [])
  }, [])

  const fetchAttempts = useCallback(async () => {
    const data = await apiGet<{ summary: AttemptSummary; attempts: AttemptRow[] }>(
      "/reviewers/quizzes/attempts?exam_type=IELTS",
    )
    setSummary(data.summary ?? { total: 0, passed: 0, avg_score: null, avg_band: null })
    setAttempts(data.attempts ?? [])
  }, [])

  const fetchLearners = useCallback(async () => {
    const data = await apiGet<{
      total_sets: number
      total_users?: number
      learners: LearnerProgress[]
    }>("/reviewers/ielts/learners")
    setPublishedSetCount(data.total_sets ?? 0)
    setIeltsUserCount(data.total_users ?? 0)
    setLearners(data.learners ?? [])
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchMaterials(), fetchGroups(), fetchAttempts(), fetchLearners()])
    } catch (error) {
      console.error("Failed to load IELTS admin data:", error)
    } finally {
      setLoading(false)
    }
  }, [fetchMaterials, fetchGroups, fetchAttempts, fetchLearners])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleAttemptAnswers = useCallback(
    async (attemptId: string) => {
      const nextOpen = !(expandedAttempts[attemptId] ?? false)
      setExpandedAttempts((prev) => ({ ...prev, [attemptId]: nextOpen }))
      if (!nextOpen || attemptDetails[attemptId] || attemptDetailLoading[attemptId]) return

      setAttemptDetailLoading((prev) => ({ ...prev, [attemptId]: true }))
      setAttemptDetailError((prev) => {
        const copy = { ...prev }
        delete copy[attemptId]
        return copy
      })
      try {
        const data = await apiGet<AttemptDetail>(`/reviewers/quizzes/attempts/${attemptId}`)
        setAttemptDetails((prev) => ({ ...prev, [attemptId]: data }))
      } catch (error) {
        setAttemptDetailError((prev) => ({
          ...prev,
          [attemptId]:
            error instanceof Error ? error.message : "Could not load answers for this attempt",
        }))
      } finally {
        setAttemptDetailLoading((prev) => ({ ...prev, [attemptId]: false }))
      }
    },
    [attemptDetailLoading, attemptDetails, expandedAttempts],
  )

  const handleDownload = async (material: ReviewerMaterial) => {
    if (material.external_url && !material.file_url) {
      window.open(material.external_url, "_blank", "noopener,noreferrer")
      return
    }
    if (!material.file_url) {
      alert("No file attached to this material")
      return
    }
    try {
      const response = await fetch("/api/bunny/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: material.file_url }),
      })
      const { url, error } = await response.json()
      if (error || !url) {
        alert("Failed to generate download link")
        return
      }
      window.open(url, "_blank")
    } catch {
      alert("Failed to download file")
    }
  }

  const handleTogglePublish = async (material: ReviewerMaterial) => {
    try {
      await apiPatch(`/reviewers/${material.id}`, { is_published: !material.is_published })
      void fetchMaterials()
    } catch {
      alert("Failed to update publish status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this IELTS material?")) return
    try {
      await apiDelete(`/reviewers/${id}`)
      void fetchMaterials()
    } catch {
      alert("Failed to delete material")
    }
  }

  const handleToggleQuizPublish = async (quiz: AdminQuiz) => {
    try {
      await apiPatch(`/reviewers/quizzes/${quiz.id}`, { is_published: !quiz.is_published })
      void fetchGroups()
    } catch {
      alert("Failed to update quiz")
    }
  }

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Delete this practice set?")) return
    try {
      await apiDelete(`/reviewers/quizzes/${id}`)
      void fetchGroups()
    } catch {
      alert("Failed to delete practice set")
    }
  }

  const handleDeleteGroup = async (group: AdminGroup) => {
    if (
      !confirm(
        group.quiz_count > 0
          ? `Delete ${group.title} and its ${group.quiz_count} practice sets?`
          : `Delete ${group.title}?`,
      )
    ) {
      return
    }
    try {
      await apiDelete(`/reviewers/groups/${group.id}`)
      void fetchGroups()
    } catch {
      alert("Failed to delete skill")
    }
  }

  const filteredMaterials = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return materials
    return materials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        (m.category ?? "").toLowerCase().includes(q),
    )
  }, [materials, searchTerm])

  const filteredGroups = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((group) => {
      if (
        group.title.toLowerCase().includes(q) ||
        group.subject.toLowerCase().includes(q) ||
        (group.description ?? "").toLowerCase().includes(q)
      ) {
        return true
      }
      return group.quizzes.some(
        (quiz) =>
          quiz.title.toLowerCase().includes(q) ||
          (quiz.category ?? "").toLowerCase().includes(q),
      )
    })
  }, [groups, searchTerm])

  const filteredAttempts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return attempts
    return attempts.filter(
      (row) =>
        row.quiz_title.toLowerCase().includes(q) ||
        (row.group_title ?? "").toLowerCase().includes(q) ||
        (row.skill ?? "").toLowerCase().includes(q) ||
        (row.category ?? "").toLowerCase().includes(q) ||
        row.user_name.toLowerCase().includes(q) ||
        (row.user_email ?? "").toLowerCase().includes(q),
    )
  }, [attempts, searchTerm])

  const filteredLearners = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return learners
    return learners.filter(
      (row) =>
        row.user_name.toLowerCase().includes(q) ||
        row.user_email.toLowerCase().includes(q) ||
        (row.certificate_serial ?? "").toLowerCase().includes(q) ||
        row.skills.some((skill) => skill.skill.toLowerCase().includes(q)),
    )
  }, [learners, searchTerm])

  const progressSummary = useMemo(() => {
    const withActivity = learners.length
    const certified = learners.filter((l) => l.certificate_serial).length
    const pendingSpeaking = learners.reduce((sum, l) => sum + l.pending_speaking, 0)
    const avgCompletion =
      withActivity > 0
        ? Math.round(learners.reduce((sum, l) => sum + l.completion_pct, 0) / withActivity)
        : 0
    return { withActivity, certified, pendingSpeaking, avgCompletion }
  }, [learners])

  const searchPlaceholder =
    view === "skills"
      ? "Search skills or practice sets…"
      : view === "materials"
        ? "Search IELTS materials…"
        : view === "progress"
          ? "Search learners by name, email, or certificate…"
          : view === "requests"
            ? "Access requests"
            : "Search results by learner or set…"

  return (
    <GrowMainLayout>
      <div className="space-y-4">
        <GrowHeader
          icon={Languages}
          title="IELTS"
          accent="skills & scores"
          description="Manage practice skills, mock sessions, answer keys, and learner progress"
          showDate={false}
        >
          {view === "skills" ? (
            <Button
              onClick={() => {
                setEditingGroup(null)
                setGroupModalOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New skill
            </Button>
          ) : view === "materials" ? (
            <UploadReviewerModal
              onUploaded={() => void fetchMaterials()}
              defaultExamType="IELTS"
              lockExamType
            />
          ) : null}
        </GrowHeader>

        <div className="grow-card overflow-hidden p-0">
          <div className="grid divide-y divide-border/70 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="p-3.5 md:p-4">
              <IeltsUkviRequests />
            </div>
            <div className="p-3.5 md:p-4">
              <IeltsMockSessionToggle />
            </div>
            <div className="p-3.5 md:p-4">
              <IeltsAnswerKeyToggle />
            </div>
          </div>
        </div>

        <div className="grow-toolbar !gap-2 !p-2 md:!items-center">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {(
              [
                { id: "skills" as const, label: "Skills", count: groups.length, icon: Layers3 },
                {
                  id: "materials" as const,
                  label: "Materials",
                  count: materials.length,
                  icon: FileText,
                },
                {
                  id: "progress" as const,
                  label: "Progress",
                  count: ieltsUserCount,
                  icon: Users,
                },
                {
                  id: "results" as const,
                  label: "Results",
                  count: summary.total,
                  icon: BarChart3,
                },
                { id: "requests" as const, label: "Access", count: null, icon: null },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon
              const active = view === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active
                      ? "bg-[#1a1f2e] text-white shadow-sm dark:bg-foreground dark:text-background"
                      : "bg-[#f3ede4] text-muted-foreground hover:text-foreground dark:bg-muted",
                  )}
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                  {tab.label}
                  {tab.count != null ? (
                    <span className={cn("tabular-nums", active ? "opacity-80" : "opacity-70")}>
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2 md:border-t-0 md:pt-0">
            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="rounded-full bg-[#f3ede4] px-2 py-1 dark:bg-muted">
                {progressSummary.pendingSpeaking} speaking
              </span>
              <span className="rounded-full bg-[#f3ede4] px-2 py-1 dark:bg-muted">
                {summary.avg_band ? `band ${summary.avg_band}` : "no band yet"}
              </span>
            </div>
            {view !== "requests" ? (
              <div className="relative min-w-[12rem] flex-1 md:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="grow-input h-8 pl-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div key={view} className="admin-panel-in">
        {view === "requests" ? (
          <IeltsAccessRequests />
        ) : view === "skills" ? (
          loading ? (
            <Card className="p-12 text-center text-muted-foreground">Loading IELTS skills…</Card>
          ) : filteredGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <Layers3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No IELTS skills yet</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingGroup(null)
                  setGroupModalOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create first skill
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredGroups.map((group, groupIndex) => {
                const accent = getReviewerAccent(group.accent_color)
                const cover = assetUrl(group.cover_url)
                const expanded = Boolean(expandedGroups[group.id])
                const previewQuizzes = group.quizzes.slice(0, PREVIEW_PARTS)
                const extraQuizzes = group.quizzes.slice(PREVIEW_PARTS)

                const renderQuizRow = (quiz: AdminQuiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-start justify-between gap-2 border-b px-3 py-2.5 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{quiz.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {quiz.category || "—"} · Pass {quiz.passing_score}% · {quiz.question_count}{" "}
                        Q
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={quiz.is_published ? "default" : "secondary"}>
                        {quiz.is_published ? "Live" : "Draft"}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-8 px-2" asChild>
                        <Link href={`/admin/reviewers/quizzes/${quiz.id}`}>
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span className="sr-only">Questions</span>
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 px-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleQuizPublish(quiz)}>
                            {quiz.is_published ? "Unpublish" : "Publish"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )

                return (
                  <Card
                    key={group.id}
                    className={cn(
                      "admin-soft-rise flex h-full flex-col overflow-hidden border transition-shadow duration-300",
                      accent.card,
                    )}
                    style={{ animationDelay: `${Math.min(groupIndex, 8) * 45}ms` }}
                  >
                    <div className="flex flex-col gap-3 p-3.5 sm:p-4">
                      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={cn("h-full w-full bg-gradient-to-br", accent.header)} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="truncate text-base font-bold sm:text-lg">{group.title}</h2>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                              {group.quiz_count} set{group.quiz_count === 1 ? "" : "s"}
                              {group.description ? ` · ${group.description}` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-0.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => {
                                setQuizTargetGroup(group)
                                setQuizModalOpen(true)
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Add</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => {
                                setEditingGroup(group)
                                setGroupModalOpen(true)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-destructive"
                              onClick={() => handleDeleteGroup(group)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto border-t">
                      {previewQuizzes.map(renderQuizRow)}
                      {extraQuizzes.length > 0 ? (
                        <>
                          <div className="admin-expand" data-open={expanded ? "true" : "false"}>
                            <div className="admin-expand-panel">
                              <div className="admin-expand-inner">
                                {extraQuizzes.map(renderQuizRow)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="flex w-full items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
                            onClick={() =>
                              setExpandedGroups((prev) => ({ ...prev, [group.id]: !expanded }))
                            }
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                expanded && "rotate-180",
                              )}
                            />
                            {expanded ? "Show fewer" : `Show ${extraQuizzes.length} more`}
                          </button>
                        </>
                      ) : null}
                      {group.quizzes.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No practice sets in this skill yet.
                        </p>
                      ) : null}
                    </div>
                  </Card>
                )
              })}
            </div>
          )
        ) : null}

        {view === "materials" ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Material</th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Category</th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Source</th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Updated</th>
                    <th className="p-4 text-right text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {loading ? "Loading…" : "No IELTS materials yet"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((material) => (
                      <tr
                        key={material.id}
                        className="border-b border-border transition-colors last:border-0 hover:bg-accent/50"
                      >
                        <td className="p-4">
                          <p className="font-medium text-foreground">{material.title}</p>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {material.description || "—"}
                          </p>
                        </td>
                        <td className="p-4 text-sm">{material.category || "—"}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {material.file_url ? (
                              <Badge variant="outline" className="text-xs">
                                File
                              </Badge>
                            ) : null}
                            {material.external_url ? (
                              <Badge variant="outline" className="text-xs">
                                Link
                              </Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={material.is_published ? "default" : "secondary"}>
                            {material.is_published ? "Published" : "Draft"}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(material.updated_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(material)}>
                                  {material.external_url && !material.file_url ? (
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                  ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                  )}
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTogglePublish(material)}>
                                  {material.is_published ? (
                                    <EyeOff className="mr-2 h-4 w-4" />
                                  ) : (
                                    <Eye className="mr-2 h-4 w-4" />
                                  )}
                                  {material.is_published ? "Unpublish" : "Publish"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(material.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {view === "progress" ? (
          <div className="space-y-4">
            <div className="grow-card overflow-hidden p-0">
              <div className="grid divide-y divide-border/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
                <div className="p-3.5 md:px-4 md:py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    IELTS users
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="text-2xl font-bold tabular-nums leading-none">{ieltsUserCount}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {progressSummary.withActivity} active
                    </p>
                  </div>
                </div>
                <div className="p-3.5 md:px-4 md:py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Avg completion
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="text-2xl font-bold tabular-nums leading-none">
                      {progressSummary.withActivity ? `${progressSummary.avgCompletion}%` : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {publishedSetCount} sets
                    </p>
                  </div>
                </div>
                <div className="p-3.5 md:px-4 md:py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Certificates
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="text-2xl font-bold tabular-nums leading-none">
                      {progressSummary.certified}
                    </p>
                    <p className="text-[11px] text-muted-foreground">issued</p>
                  </div>
                </div>
                <div className="p-3.5 md:px-4 md:py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Speaking review
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="text-2xl font-bold tabular-nums leading-none">
                      {progressSummary.pendingSpeaking}
                    </p>
                    <p className="text-[11px] text-muted-foreground">awaiting</p>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <Card className="p-12 text-center text-muted-foreground">Loading learner progress…</Card>
            ) : filteredLearners.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                No IELTS learner activity yet
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredLearners.map((learner, learnerIndex) => {
                  const open = expandedLearners[learner.user_id] ?? false
                  return (
                    <Card
                      key={learner.user_id}
                      className="admin-soft-rise overflow-hidden transition-shadow duration-300 hover:shadow-md"
                      style={{ animationDelay: `${Math.min(learnerIndex, 8) * 45}ms` }}
                    >
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 p-4 text-left transition-colors duration-200 hover:bg-accent/40"
                        aria-expanded={open}
                        onClick={() =>
                          setExpandedLearners((prev) => ({
                            ...prev,
                            [learner.user_id]: !open,
                          }))
                        }
                      >
                        <ChevronDown
                          className={cn(
                            "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            open && "rotate-180",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{learner.user_name}</p>
                            {learner.certificate_serial ? (
                              <Badge variant="default">{learner.certificate_serial}</Badge>
                            ) : null}
                            {learner.pending_speaking > 0 ? (
                              <Badge variant="secondary">
                                {learner.pending_speaking} speaking to review
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">{learner.user_email}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span>
                              <span className="font-semibold">{learner.completion_pct}%</span>
                              <span className="text-muted-foreground">
                                {" "}
                                · {learner.passed_sets}/{learner.total_sets} sets
                              </span>
                            </span>
                            <span className="text-muted-foreground">
                              {learner.attempts} attempts
                              {learner.avg_band != null ? ` · avg band ${learner.avg_band}` : ""}
                            </span>
                            <span className="text-muted-foreground">
                              {learner.last_activity
                                ? `Last ${new Date(learner.last_activity).toLocaleString()}`
                                : "No activity"}
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-[#FF4B1A] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                              style={{ width: `${Math.min(100, learner.completion_pct)}%` }}
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {learner.skills.map((skill) => (
                              <span
                                key={skill.skill}
                                className="rounded-md border border-border px-2 py-1 text-xs transition-colors duration-200 hover:bg-muted/50"
                              >
                                <span className="font-medium">{skill.skill}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  {skill.passed_sets}/{skill.total_sets}
                                  {skill.best_band != null ? ` · ${skill.best_band}` : ""}
                                  {skill.pending_review > 0
                                    ? ` · ${skill.pending_review} pending`
                                    : ""}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                      <div className="admin-expand" data-open={open ? "true" : "false"}>
                        <div className="admin-expand-panel">
                          <div className="admin-expand-inner border-t border-border bg-muted/20 px-4 py-3">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-muted-foreground">
                                    <th className="pb-2 pr-3 font-medium">Skill</th>
                                    <th className="pb-2 pr-3 font-medium">Passed</th>
                                    <th className="pb-2 pr-3 font-medium">Attempted</th>
                                    <th className="pb-2 pr-3 font-medium">Best band</th>
                                    <th className="pb-2 font-medium">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {learner.skills.map((skill) => (
                                    <tr key={skill.skill} className="border-t border-border/60">
                                      <td className="py-2 pr-3 font-medium">{skill.skill}</td>
                                      <td className="py-2 pr-3">
                                        {skill.passed_sets}/{skill.total_sets}
                                      </td>
                                      <td className="py-2 pr-3">{skill.attempted_sets}</td>
                                      <td className="py-2 pr-3">
                                        {skill.best_band != null
                                          ? skill.best_band.toFixed(1)
                                          : "—"}
                                      </td>
                                      <td className="py-2">
                                        {skill.pending_review > 0 ? (
                                          <Badge variant="secondary">Pending trainer review</Badge>
                                        ) : skill.passed_sets >= skill.total_sets &&
                                          skill.total_sets > 0 ? (
                                          <Badge variant="default">Complete</Badge>
                                        ) : skill.attempted_sets > 0 ? (
                                          <Badge variant="outline">In progress</Badge>
                                        ) : (
                                          <Badge variant="outline">Not started</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}

        {view === "results" ? (
          <div className="space-y-4">
            <div className="grow-card overflow-hidden p-0">
              <div className="grid divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="p-3.5 md:px-4 md:py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Pass rate
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums leading-none">
                    {summary.total
                      ? `${Math.round((summary.passed / summary.total) * 100)}%`
                      : "—"}
                  </p>
                </div>
                <div className="p-3.5 md:px-4 md:py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Avg score
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums leading-none">
                    {summary.avg_score ? `${summary.avg_score}%` : "—"}
                  </p>
                </div>
                <div className="p-3.5 md:px-4 md:py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Avg band
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums leading-none">
                    {summary.avg_band ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <Card className="overflow-hidden py-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-10 p-4" />
                      <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Learner</th>
                      <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Skill / set</th>
                      <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Score</th>
                      <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Band</th>
                      <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Result</th>
                      <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-muted-foreground">
                          {loading ? "Loading results…" : "No IELTS attempts yet"}
                        </td>
                      </tr>
                    ) : (
                      filteredAttempts.map((row) => {
                        const open = expandedAttempts[row.id] ?? false
                        const detail = attemptDetails[row.id]
                        const detailLoading = attemptDetailLoading[row.id]
                        const detailError = attemptDetailError[row.id]
                        return (
                          <Fragment key={row.id}>
                            <tr
                              className="border-b border-border transition-colors duration-200 last:border-0 hover:bg-accent/50"
                            >
                              <td className="p-4">
                                <button
                                  type="button"
                                  className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                  aria-expanded={open}
                                  aria-label={open ? "Hide answers" : "Show answers"}
                                  onClick={() => void toggleAttemptAnswers(row.id)}
                                >
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                      open && "rotate-180",
                                    )}
                                  />
                                </button>
                              </td>
                              <td className="p-4">
                                <button
                                  type="button"
                                  className="text-left"
                                  onClick={() => void toggleAttemptAnswers(row.id)}
                                >
                                  <p className="font-medium">{row.user_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {row.user_email || "—"}
                                  </p>
                                </button>
                              </td>
                              <td className="p-4">
                                <p className="font-medium">{row.quiz_title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {row.skill || row.group_title || row.category || "—"}
                                </p>
                              </td>
                              <td className="p-4 font-semibold">
                                {row.pending_review ? "—" : `${row.score}%`}
                              </td>
                              <td className="p-4">
                                {row.band_score != null ? Number(row.band_score).toFixed(1) : "—"}
                              </td>
                              <td className="p-4">
                                {row.pending_review ? (
                                  <Badge variant="secondary">Pending review</Badge>
                                ) : (
                                  <Badge variant={row.passed ? "default" : "secondary"}>
                                    {row.passed ? "Passed" : "Failed"}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {new Date(row.created_at).toLocaleString()}
                              </td>
                            </tr>
                            <tr className="border-b border-border last:border-0">
                              <td colSpan={7} className="p-0">
                                <div className="admin-expand" data-open={open ? "true" : "false"}>
                                  <div className="admin-expand-panel">
                                    <div className="admin-expand-inner bg-muted/20 px-4 py-3">
                                      {detailLoading ? (
                                        <p className="text-sm text-muted-foreground">
                                          Loading answers…
                                        </p>
                                      ) : detailError ? (
                                        <p className="text-sm text-destructive">{detailError}</p>
                                      ) : detail ? (
                                        <div className="space-y-3">
                                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span className="font-semibold text-foreground">
                                              {detail.summary.correct}/{detail.summary.total} correct
                                            </span>
                                            <span>·</span>
                                            <span>Click a row to review each response</span>
                                          </div>
                                          <div className="overflow-x-auto rounded-xl border border-border/70 bg-background">
                                            <table className="w-full text-sm">
                                              <thead>
                                                <tr className="border-b border-border text-left text-muted-foreground">
                                                  <th className="px-3 py-2 font-medium">#</th>
                                                  <th className="px-3 py-2 font-medium">Question</th>
                                                  <th className="px-3 py-2 font-medium">Their answer</th>
                                                  <th className="px-3 py-2 font-medium">Correct</th>
                                                  <th className="px-3 py-2 font-medium">Mark</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {detail.items.map((item) => (
                                                  <tr
                                                    key={item.id}
                                                    className="border-b border-border/60 last:border-0"
                                                  >
                                                    <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">
                                                      {item.number}
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                      <p className="font-medium leading-snug">
                                                        {item.prompt}
                                                      </p>
                                                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                        {item.question_type.replaceAll("_", " ")}
                                                      </p>
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                      {item.audio_url ? (
                                                        <div className="space-y-1.5">
                                                          <audio
                                                            controls
                                                            preload="none"
                                                            className="h-8 w-full max-w-[16rem]"
                                                            src={assetUrl(item.audio_url)}
                                                          />
                                                          <p className="text-xs text-muted-foreground">
                                                            {item.learner_answer}
                                                          </p>
                                                        </div>
                                                      ) : (
                                                        <p className="whitespace-pre-wrap break-words">
                                                          {item.learner_answer}
                                                        </p>
                                                      )}
                                                    </td>
                                                    <td className="px-3 py-2 align-top text-muted-foreground">
                                                      {item.correct_answer || "—"}
                                                    </td>
                                                    <td className="px-3 py-2 align-top">
                                                      <Badge
                                                        variant={
                                                          item.is_correct ? "default" : "secondary"
                                                        }
                                                      >
                                                        {item.is_correct ? "Correct" : "Wrong"}
                                                      </Badge>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          Expand to load answers.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : null}
        </div>

        <GroupFormModal
          open={groupModalOpen}
          onOpenChange={setGroupModalOpen}
          group={editingGroup}
          onSaved={() => void fetchGroups()}
          defaultExamType="IELTS"
          lockExamType
        />
        <CreateQuizModal
          open={quizModalOpen}
          onOpenChange={setQuizModalOpen}
          groupId={quizTargetGroup?.id ?? null}
          groupTitle={quizTargetGroup?.title}
          examType="IELTS"
          lockExamType
          onCreated={() => void fetchGroups()}
        />
      </div>
    </GrowMainLayout>
  )
}
