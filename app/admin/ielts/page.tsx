"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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

const PREVIEW_PARTS = 3

export default function AdminIeltsPage() {
  const [view, setView] = useState<"skills" | "materials" | "results">("skills")
  const [materials, setMaterials] = useState<ReviewerMaterial[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
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

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchMaterials(), fetchGroups(), fetchAttempts()])
    } catch (error) {
      console.error("Failed to load IELTS admin data:", error)
    } finally {
      setLoading(false)
    }
  }, [fetchMaterials, fetchGroups, fetchAttempts])

  useEffect(() => {
    void refresh()
  }, [refresh])

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
        (row.category ?? "").toLowerCase().includes(q) ||
        row.user_name.toLowerCase().includes(q) ||
        (row.user_email ?? "").toLowerCase().includes(q),
    )
  }, [attempts, searchTerm])

  const searchPlaceholder =
    view === "skills"
      ? "Search skills or practice sets…"
      : view === "materials"
        ? "Search IELTS materials…"
        : "Search results by learner or set…"

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <GrowHeader
          icon={Languages}
          title="IELTS"
          accent="skills & scores"
          description="Manage Listening, Reading, Writing, and Speaking practice, downloadable materials, and learner results"
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

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grow-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</p>
            <p className="mt-1 text-2xl font-bold">{groups.length}</p>
          </div>
          <div className="grow-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Materials</p>
            <p className="mt-1 text-2xl font-bold">{materials.length}</p>
          </div>
          <div className="grow-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Attempts · avg band
            </p>
            <p className="mt-1 text-2xl font-bold">
              {summary.total}
              <span className="ml-2 text-base font-semibold text-muted-foreground">
                {summary.avg_band ? `band ${summary.avg_band}` : "—"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "skills" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setView("skills")}
          >
            <Layers3 className="mr-2 h-4 w-4" />
            Skills ({groups.length})
          </Button>
          <Button
            variant={view === "materials" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setView("materials")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Materials ({materials.length})
          </Button>
          <Button
            variant={view === "results" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setView("results")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Results ({summary.total})
          </Button>
        </div>

        <div className="grow-toolbar">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="grow-input pl-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {view === "skills" ? (
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
            <div className="space-y-5">
              {filteredGroups.map((group) => {
                const accent = getReviewerAccent(group.accent_color)
                const cover = assetUrl(group.cover_url)
                const expanded = Boolean(expandedGroups[group.id])
                const previewQuizzes = group.quizzes.slice(0, PREVIEW_PARTS)
                const extraQuizzes = group.quizzes.slice(PREVIEW_PARTS)

                const renderQuizRow = (quiz: AdminQuiz) => (
                  <div
                    key={quiz.id}
                    className="grid grid-cols-1 gap-2 border-b px-3 py-2.5 last:border-0 sm:grid-cols-[minmax(0,1fr)_72px_88px_auto] sm:items-center sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{quiz.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {quiz.category || "—"} · Pass {quiz.passing_score}%
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground sm:text-foreground">
                      {quiz.question_count}
                    </p>
                    <div>
                      <Badge variant={quiz.is_published ? "default" : "secondary"}>
                        {quiz.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div className="flex justify-start gap-1 sm:justify-end">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/reviewers/quizzes/${quiz.id}`}>
                          <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                          Questions
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
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
                    className={cn("overflow-hidden border transition-shadow duration-300", accent.card)}
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:w-44">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={cn("h-full w-full bg-gradient-to-br", accent.header)} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h2 className="text-lg font-bold">{group.title}</h2>
                            <p className="text-sm text-muted-foreground">
                              {group.quiz_count} set{group.quiz_count === 1 ? "" : "s"}
                              {group.description ? ` · ${group.description}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setQuizTargetGroup(group)
                                setQuizModalOpen(true)
                              }}
                            >
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Add set
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
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
                              className="text-destructive"
                              onClick={() => handleDeleteGroup(group)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t">
                      {previewQuizzes.map(renderQuizRow)}
                      {extraQuizzes.length > 0 ? (
                        <>
                          {expanded ? extraQuizzes.map(renderQuizRow) : null}
                          <button
                            type="button"
                            className="flex w-full items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40"
                            onClick={() =>
                              setExpandedGroups((prev) => ({ ...prev, [group.id]: !expanded }))
                            }
                          >
                            <ChevronDown className={cn("h-3.5 w-3.5 transition", expanded && "rotate-180")} />
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

        {view === "results" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grow-card-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pass rate</p>
                <p className="mt-1 text-2xl font-bold">
                  {summary.total
                    ? `${Math.round((summary.passed / summary.total) * 100)}%`
                    : "—"}
                </p>
              </div>
              <div className="grow-card-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg score</p>
                <p className="mt-1 text-2xl font-bold">
                  {summary.avg_score ? `${summary.avg_score}%` : "—"}
                </p>
              </div>
              <div className="grow-card-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg band</p>
                <p className="mt-1 text-2xl font-bold">{summary.avg_band ?? "—"}</p>
              </div>
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
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
                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                          {loading ? "Loading results…" : "No IELTS attempts yet"}
                        </td>
                      </tr>
                    ) : (
                      filteredAttempts.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-border last:border-0 hover:bg-accent/50"
                        >
                          <td className="p-4">
                            <p className="font-medium">{row.user_name}</p>
                            <p className="text-xs text-muted-foreground">{row.user_email || "—"}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{row.quiz_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.group_title || row.category || "—"}
                            </p>
                          </td>
                          <td className="p-4 font-semibold">{row.score}%</td>
                          <td className="p-4">
                            {row.band_score != null ? Number(row.band_score).toFixed(1) : "—"}
                          </td>
                          <td className="p-4">
                            <Badge variant={row.passed ? "default" : "secondary"}>
                              {row.passed ? "Passed" : "Failed"}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(row.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : null}

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
