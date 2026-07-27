"use client"

import { useEffect, useMemo, useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiGet } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  Search,
  Tags,
  type LucideIcon,
} from "lucide-react"

interface Material {
  id: string
  title: string
  description?: string
  type?: string
  category?: string
  tags?: string[]
  file_url?: string
  updated_at?: string
}

type TypeFilter = "all" | "IELTS" | "TOEFL" | "Technical" | "Soft Skills"

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

function materialIcon(type?: string): LucideIcon {
  if (type === "IELTS" || type === "TOEFL") return GraduationCap
  if (type === "Technical") return BookOpen
  if (type === "Soft Skills") return Layers
  return FileText
}

function formatUpdated(iso?: string) {
  if (!iso) return "—"
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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await apiGet<{ materials: Material[] }>("/materials")
        setMaterials(data.materials ?? [])
      } catch (error) {
        console.error("Failed to load materials:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  const counts = useMemo(() => {
    const tags = new Set(materials.flatMap((m) => m.tags ?? []))
    return {
      all: materials.length,
      IELTS: materials.filter((m) => m.type === "IELTS").length,
      TOEFL: materials.filter((m) => m.type === "TOEFL").length,
      Technical: materials.filter((m) => m.type === "Technical").length,
      "Soft Skills": materials.filter((m) => m.type === "Soft Skills").length,
      withFiles: materials.filter((m) => !!m.file_url).length,
      tags: tags.size,
      categories: new Set(materials.map((m) => m.category).filter(Boolean)).size,
    }
  }, [materials])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return materials.filter((m) => {
      const matchesType = typeFilter === "all" || m.type === typeFilter
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        (m.category ?? "").toLowerCase().includes(q) ||
        (m.tags ?? []).some((t) => t.toLowerCase().includes(q))
      return matchesType && matchesSearch
    })
  }, [materials, searchTerm, typeFilter])

  const typeTabs: { id: TypeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "IELTS", label: "IELTS" },
    { id: "TOEFL", label: "TOEFL" },
    { id: "Technical", label: "Technical" },
    { id: "Soft Skills", label: "Soft Skills" },
  ]

  return (
    <MainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
              Learning workspace
            </p>
            <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
              Study materials
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
              Access guides, resources, and reference documents.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={FileText}
              value={counts.all}
              label="Total resources"
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
              value={counts.withFiles}
              label="Downloadable"
              hint="Files with links"
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
                  placeholder="Search materials"
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
                    <div className="h-5 w-5 animate-pulse rounded bg-[#f1f5f9]" />
                    <div className="h-4 w-56 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <FileText className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {materials.length === 0 ? "No materials yet" : "No materials found"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {materials.length === 0
                    ? "Guides and reference documents will appear here when available."
                    : "Try another type tab or search term."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>Material</th>
                      <th className={thClass}>Type</th>
                      <th className={thClass}>Category</th>
                      <th className={thClass}>Tags</th>
                      <th className={thClass}>Updated</th>
                      <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filtered.map((material) => {
                      const Icon = materialIcon(material.type)
                      const tags = material.tags ?? []
                      return (
                        <tr
                          key={material.id}
                          className="transition-colors hover:bg-[#fafbfc]"
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
                            <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#475569]">
                              {material.type || "Other"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {material.category || "—"}
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
                            <div className="flex justify-end">
                              {material.file_url ? (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 rounded-lg border-[#e2e8f0] shadow-none"
                                >
                                  <a
                                    href={material.file_url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download
                                      className="h-3.5 w-3.5 text-[#64748b]"
                                      strokeWidth={1.5}
                                    />
                                    Download
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-sm text-[#cbd5e1]">—</span>
                              )}
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
              <div className="border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {filtered.length} material{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  )
}

function MetricCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: LucideIcon
  value: number | string
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
