"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { apiDelete, apiGet, apiPatch } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { getReviewerAccent } from "@/lib/reviewer-accents"
import { UploadReviewerModal } from "@/components/admin/reviewers/upload-reviewer-modal"
import { ImportReviewerPdfModal } from "@/components/admin/reviewers/import-reviewer-pdf-modal"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GrowHeader } from "@/components/grow-shell"
import {
  BookOpenCheck,
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

const EXAM_TABS = ["all", "CSE", "NLE", "LET", "IELTS", "Other"] as const
const PREVIEW_PARTS = 3

export default function AdminReviewersPage() {
  const [view, setView] = useState<"groups" | "materials">("groups")
  const [materials, setMaterials] = useState<ReviewerMaterial[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<AdminReviewerGroup | null>(null)
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [quizTargetGroup, setQuizTargetGroup] = useState<AdminGroup | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const fetchMaterials = useCallback(async () => {
    try {
      const data = await apiGet<{ materials: ReviewerMaterial[] }>("/reviewers")
      setMaterials(data.materials ?? [])
    } catch (error) {
      console.error("Failed to load reviewer materials:", error)
    }
  }, [])

  const fetchGroups = useCallback(async () => {
    try {
      const data = await apiGet<{ groups: AdminGroup[] }>("/reviewers/groups")
      setGroups(data.groups ?? [])
    } catch (error) {
      console.error("Failed to load reviewer groups:", error)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchMaterials(), fetchGroups()])
    setLoading(false)
  }, [fetchMaterials, fetchGroups])

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
        credentials: "include",
        body: JSON.stringify({ filePath: material.file_url }),
      })
      const { url, error } = await response.json()
      if (error || !url) {
        alert("Failed to generate download link")
        return
      }
      window.open(url, "_blank")
    } catch (err) {
      console.error("Download error:", err)
      alert("Failed to download file")
    }
  }

  const handleTogglePublish = async (material: ReviewerMaterial) => {
    try {
      await apiPatch(`/reviewers/${material.id}`, {
        is_published: !material.is_published,
      })
      void fetchMaterials()
    } catch (error) {
      console.error("Publish toggle failed:", error)
      alert("Failed to update publish status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this reviewer material?")) return
    try {
      await apiDelete(`/reviewers/${id}`)
      void fetchMaterials()
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const handleToggleQuizPublish = async (quiz: AdminQuiz) => {
    try {
      await apiPatch(`/reviewers/quizzes/${quiz.id}`, {
        is_published: !quiz.is_published,
      })
      void fetchGroups()
    } catch (error) {
      console.error("Publish toggle failed:", error)
      alert("Failed to update quiz publish status")
    }
  }

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Delete this practice quiz and all its questions?")) return
    try {
      await apiDelete(`/reviewers/quizzes/${id}`)
      void fetchGroups()
    } catch (error) {
      console.error("Delete quiz failed:", error)
    }
  }

  const handleToggleGroupPublish = async (group: AdminGroup) => {
    try {
      await apiPatch(`/reviewers/groups/${group.id}`, {
        is_published: !group.is_published,
      })
      void fetchGroups()
    } catch (error) {
      alert("Failed to update subject publish status")
    }
  }

  const handleDeleteGroup = async (group: AdminGroup) => {
    if (
      !confirm(
        `Delete subject “${group.title}”? Quizzes will be ungrouped (not deleted).`,
      )
    ) {
      return
    }
    try {
      await apiDelete(`/reviewers/groups/${group.id}`)
      void fetchGroups()
    } catch (error) {
      alert("Failed to delete subject")
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return materials
    return materials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        (m.category ?? "").toLowerCase().includes(q) ||
        m.exam_type.toLowerCase().includes(q),
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

  const renderMaterialsTable = (rows: ReviewerMaterial[]) => (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Material</th>
              <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Exam</th>
              <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Category</th>
              <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Source</th>
              <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
              <th className="p-4 text-left text-sm font-semibold text-muted-foreground">Updated</th>
              <th className="p-4 text-right text-sm font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {loading ? "Loading…" : "No reviewer materials yet"}
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((material) => (
                <tr
                  key={material.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-accent/50"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-foreground">{material.title}</p>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {material.description || "—"}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant="default">{material.exam_type}</Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-foreground">{material.category || "—"}</span>
                  </td>
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
                      {!material.file_url && !material.external_url ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={material.is_published ? "default" : "secondary"}>
                      {material.is_published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(material.updated_at).toLocaleDateString()}
                    </span>
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
                              <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open link
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublish(material)}>
                            {material.is_published ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Publish
                              </>
                            )}
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
  )

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <GrowHeader
          icon={BookOpenCheck}
          title="Reviewers"
          accent="exam prep"
          description="Manage subject cards, questionnaires, cover photos, and downloadable materials"
          showDate={false}
        >
          {view === "groups" ? (
            <div className="flex flex-wrap gap-2">
              <ImportReviewerPdfModal onImported={fetchGroups} />
              <Button
                onClick={() => {
                  setEditingGroup(null)
                  setGroupModalOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New subject
              </Button>
            </div>
          ) : (
            <UploadReviewerModal onUploaded={fetchMaterials} />
          )}
        </GrowHeader>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "groups" ? "default" : "outline"}
            onClick={() => setView("groups")}
          >
            <Layers3 className="mr-2 h-4 w-4" />
            Subjects ({groups.length})
          </Button>
          <Button
            variant={view === "materials" ? "default" : "outline"}
            onClick={() => setView("materials")}
          >
            Files & links ({materials.length})
          </Button>
        </div>

        <div className="grow-toolbar relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={view === "groups" ? "Search subjects or parts…" : "Search materials…"}
            className="grow-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {view === "groups" ? (
          loading ? (
            <Card className="p-12 text-center text-muted-foreground">Loading subjects…</Card>
          ) : filteredGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <Layers3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No subject cards yet</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingGroup(null)
                  setGroupModalOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create first subject
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
                const hiddenCount = extraQuizzes.length

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
                      <span className="sm:hidden">Questions: </span>
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
                    className={cn(
                      "overflow-hidden border transition-shadow duration-300",
                      accent.card,
                    )}
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

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <Badge className={accent.badge}>{group.exam_type}</Badge>
                              <Badge variant={group.is_published ? "default" : "secondary"}>
                                {group.is_published ? "Published" : "Draft"}
                              </Badge>
                              <span className={cn("text-xs font-medium", accent.soft)}>
                                {group.quizzes.length} parts
                              </span>
                            </div>
                            <h2 className="text-xl font-bold text-foreground">{group.title}</h2>
                            {group.description ? (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {group.description}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingGroup(group)
                                setGroupModalOpen(true)
                              }}
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Edit card
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setQuizTargetGroup(group)
                                setQuizModalOpen(true)
                              }}
                            >
                              <Plus className="mr-1.5 h-3.5 w-3.5" />
                              Add part
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleToggleGroupPublish(group)}>
                                  {group.is_published ? (
                                    <>
                                      <EyeOff className="mr-2 h-4 w-4" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Publish
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteGroup(group)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete subject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border bg-background/80">
                          <div className="hidden border-b bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_72px_88px_auto] sm:gap-3">
                            <span>Practice part</span>
                            <span>Questions</span>
                            <span>Status</span>
                            <span className="text-right">Actions</span>
                          </div>

                          {group.quizzes.length === 0 ? (
                            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                              No questionnaires in this subject yet
                            </p>
                          ) : (
                            <>
                              {previewQuizzes.map(renderQuizRow)}
                              {hiddenCount > 0 ? (
                                <div
                                  className={cn(
                                    "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                                    expanded
                                      ? "grid-rows-[1fr] opacity-100"
                                      : "pointer-events-none grid-rows-[0fr] opacity-0",
                                  )}
                                >
                                  <div className="overflow-hidden">
                                    {extraQuizzes.map(renderQuizRow)}
                                  </div>
                                </div>
                              ) : null}
                            </>
                          )}

                          {hiddenCount > 0 ? (
                            <div className="border-t bg-muted/20 px-3 py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  setExpandedGroups((prev) => ({
                                    ...prev,
                                    [group.id]: !prev[group.id],
                                  }))
                                }
                              >
                                <ChevronDown
                                  className={cn(
                                    "mr-1.5 h-4 w-4 transition-transform duration-300",
                                    expanded && "rotate-180",
                                  )}
                                />
                                {expanded ? "Show less" : `Expand (${hiddenCount} more)`}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )
        ) : (
          <Tabs defaultValue="all" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <TabsList>
              {EXAM_TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab === "all" ? "All" : tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {EXAM_TABS.map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-6">
                {renderMaterialsTable(
                  tab === "all" ? filtered : filtered.filter((m) => m.exam_type === tab),
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      <GroupFormModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        group={editingGroup}
        onSaved={fetchGroups}
      />
      <CreateQuizModal
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        groupId={quizTargetGroup?.id ?? null}
        groupTitle={quizTargetGroup?.title}
        examType={quizTargetGroup?.exam_type}
        onCreated={fetchGroups}
      />
    </GrowMainLayout>
  )
}
