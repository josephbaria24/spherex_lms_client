"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { UploadMaterialModal } from "@/components/admin/materials/upload-material-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiDelete, apiGet } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  Search,
  Tags,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

interface Material {
  id: string
  title: string
  description: string
  type: string
  category: string
  tags: string[]
  file_url: string
  updated_at: string
}

type TypeFilter = "all" | "IELTS" | "TOEFL" | "Technical" | "Soft Skills"
type SortKey = "title" | "updated"

const PAGE_SIZE = 10
const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("updated")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGet<{ materials: Material[] }>("/materials")
      setMaterials(data.materials ?? [])
    } catch {
      toast.error("Failed to load materials")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, typeFilter])

  const counts = useMemo(() => {
    const tags = new Set(materials.flatMap((m) => m.tags ?? []))
    return {
      all: materials.length,
      IELTS: materials.filter((m) => m.type === "IELTS").length,
      TOEFL: materials.filter((m) => m.type === "TOEFL").length,
      Technical: materials.filter((m) => m.type === "Technical").length,
      "Soft Skills": materials.filter((m) => m.type === "Soft Skills").length,
      categories: new Set(materials.map((m) => m.category).filter(Boolean)).size,
      tags: tags.size,
    }
  }, [materials])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    let list = materials.filter((m) => {
      const matchesType = typeFilter === "all" || m.type === typeFilter
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        (m.category ?? "").toLowerCase().includes(q) ||
        (m.tags ?? []).some((t) => t.toLowerCase().includes(q))
      return matchesType && matchesSearch
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") cmp = a.title.localeCompare(b.title)
      else
        cmp =
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [materials, searchTerm, typeFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "title" ? "asc" : "desc")
    }
  }

  async function handleDownload(material: Material) {
    try {
      const response = await fetch("/api/bunny/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: material.file_url,
          materialId: material.id,
        }),
      })
      const { url, error } = await response.json()
      if (error || !url) {
        toast.error("Failed to generate download link")
        return
      }
      window.open(url, "_blank")
    } catch {
      toast.error("Failed to download file")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await apiDelete(`/materials/${deleteId}`)
      toast.success("Material deleted")
      setDeleteId(null)
      await fetchMaterials()
    } catch {
      toast.error("Failed to delete material")
    } finally {
      setDeleting(false)
    }
  }

  const typeTabs: { id: TypeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "IELTS", label: "IELTS" },
    { id: "TOEFL", label: "TOEFL" },
    { id: "Technical", label: "Technical" },
    { id: "Soft Skills", label: "Soft Skills" },
  ]

  return (
    <GrowMainLayout variant="ops">
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Resource library
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Materials
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Upload and organize IELTS, TOEFL, technical, and soft-skills resources for learners
                across the platform.
              </p>
            </div>
            <UploadMaterialModal onUploaded={fetchMaterials} />
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={FileText}
              value={counts.all}
              label="Total materials"
              hint="Files in the library"
            />
            <MetricCard
              icon={GraduationCap}
              value={counts.IELTS + counts.TOEFL}
              label="Exam prep"
              hint="IELTS and TOEFL combined"
            />
            <MetricCard
              icon={FolderOpen}
              value={counts.categories}
              label="Categories"
              hint="Subject groupings"
            />
            <MetricCard
              icon={Tags}
              value={counts.tags}
              label="Tags"
              hint="Unique labels in use"
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {typeTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTypeFilter(tab.id)}
                    className={cn(
                      "text-sm transition-colors",
                      typeFilter === tab.id
                        ? "font-semibold text-[#0f172a]"
                        : "font-medium text-[#94a3b8] hover:text-[#64748b]",
                    )}
                  >
                    {tab.label}
                    <span className="ml-1 tabular-nums">{counts[tab.id]}</span>
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  placeholder="Search title, category, tags"
                  className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[260px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-[#f1f5f9]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-[#f1f5f9]" />
                    <div className="h-4 w-56 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <Layers className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {materials.length === 0 ? "No materials yet" : "No materials match your filters"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {materials.length === 0
                    ? "Upload PDF, DOC, or PPT files to build your e-learning library."
                    : "Try another type tab or search term."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>
                        <SortHeader
                          label="Material"
                          active={sortKey === "title"}
                          dir={sortDir}
                          onClick={() => toggleSort("title")}
                        />
                      </th>
                      <th className={thClass}>Type</th>
                      <th className={thClass}>Category</th>
                      <th className={thClass}>Tags</th>
                      <th className={thClass}>
                        <SortHeader
                          label="Updated"
                          active={sortKey === "updated"}
                          dir={sortDir}
                          onClick={() => toggleSort("updated")}
                        />
                      </th>
                      <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {paged.map((material) => {
                      const Icon = materialTypeIcon(material.type)
                      const tags = material.tags ?? []
                      return (
                        <tr
                          key={material.id}
                          className="group transition-colors hover:bg-[#fafbfc]"
                        >
                          <td className="py-3.5 pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <Icon
                                className="h-5 w-5 shrink-0 text-[#64748b]"
                                strokeWidth={1.5}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#0f172a]">
                                  {material.title}
                                </p>
                                {material.description ? (
                                  <p className="mt-0.5 line-clamp-1 text-xs text-[#94a3b8]">
                                    {material.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <TypePill type={material.type} />
                          </td>
                          <td className="px-4 py-3.5">
                            {material.category ? (
                              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                                {material.category}
                              </span>
                            ) : (
                              <span className="text-sm text-[#cbd5e1]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-1.5 py-0.5 text-[11px] text-[#64748b]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {tags.length > 2 ? (
                                  <span className="text-[11px] text-[#94a3b8]">
                                    +{tags.length - 2}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-sm text-[#cbd5e1]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {formatUpdated(material.updated_at)}
                          </td>
                          <td className="px-4 py-3.5 pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                                onClick={() => handleDownload(material)}
                                aria-label={`Download ${material.title}`}
                              >
                                <Download
                                  className="h-3.5 w-3.5 text-[#64748b]"
                                  strokeWidth={1.5}
                                />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                                onClick={() => setDeleteId(material.id)}
                                aria-label={`Delete ${material.title}`}
                              >
                                <Trash2
                                  className="h-3.5 w-3.5 text-[#ef4444]"
                                  strokeWidth={1.5}
                                />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {filtered.length} material{filtered.length === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#94a3b8]">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-[#e2e8f0] bg-white shadow-none"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-[#e2e8f0] bg-white shadow-none"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-xl border-[#e2e8f0]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this material?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the file from the library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="rounded-lg bg-[#ef4444] hover:bg-[#dc2626]"
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GrowMainLayout>
  )
}

function MetricCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: LucideIcon
  value: number
  label: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tabular-nums text-[#0f172a]">{value}</p>
          <p className="mt-0.5 text-sm font-medium text-[#334155]">{label}</p>
          <p className="mt-1 text-xs text-[#94a3b8]">{hint}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
      </div>
    </div>
  )
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-[#64748b]",
        active && "text-[#64748b]",
      )}
    >
      {label}
      {active && <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  )
}

function TypePill({ type }: { type: string }) {
  const tone =
    type === "IELTS"
      ? "bg-blue-50 text-blue-700"
      : type === "TOEFL"
        ? "bg-violet-50 text-violet-700"
        : type === "Technical"
          ? "bg-slate-100 text-slate-700"
          : type === "Soft Skills"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-700"
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
        tone,
      )}
    >
      {type}
    </span>
  )
}

function materialTypeIcon(type: string): LucideIcon {
  if (type === "IELTS" || type === "TOEFL") return GraduationCap
  if (type === "Technical") return BookOpen
  if (type === "Soft Skills") return Layers
  return FileText
}

function formatUpdated(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return "—"
  }
}
