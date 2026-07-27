"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TeacherOrgSelector } from "@/components/teacher/teacher-org-selector"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { apiGet } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  ExternalLink,
  FileText,
  FolderOpen,
  Layers,
  Search,
  type LucideIcon,
} from "lucide-react"

type Material = {
  id: string
  title: string
  description?: string | null
  file_url?: string | null
  file_type?: string | null
  course_title?: string | null
  updated_at: string
}

type SortKey = "title" | "updated"

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

export default function TeacherMaterialsPage() {
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const [materials, setMaterials] = useState<Material[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("updated")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setMaterials([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<{ materials: Material[] }>(
        teacherApiPath(selectedOrgId, "/materials"),
      )
      setMaterials(data.materials ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of materials) {
      const key = (m.file_type || "other").toLowerCase()
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [materials])

  const typeTabs = useMemo(() => {
    const tabs = [{ id: "all", label: "All", count: materials.length }]
    for (const [id, count] of [...typeCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      tabs.push({ id, label: id.toUpperCase(), count })
    }
    return tabs
  }, [materials.length, typeCounts])

  const counts = useMemo(() => {
    return {
      all: materials.length,
      withFiles: materials.filter((m) => !!m.file_url).length,
      courses: new Set(materials.map((m) => m.course_title).filter(Boolean)).size,
      types: typeCounts.size,
    }
  }, [materials, typeCounts])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    let list = materials.filter((m) => {
      const type = (m.file_type || "other").toLowerCase()
      const matchesType = typeFilter === "all" || type === typeFilter
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        (m.course_title ?? "").toLowerCase().includes(q)
      return matchesType && matchesSearch
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "title") cmp = a.title.localeCompare(b.title)
      else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [materials, searchTerm, typeFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "title" ? "asc" : "desc")
    }
  }

  return (
    <GrowMainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Teaching workspace
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Materials
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Learning resources linked to your courses.
              </p>
            </div>
            <TeacherOrgSelector />
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={FileText} value={counts.all} label="Total materials" hint="Linked resources" />
            <MetricCard
              icon={FolderOpen}
              value={counts.withFiles}
              label="With files"
              hint="Openable links"
            />
            <MetricCard
              icon={BookOpen}
              value={counts.courses}
              label="Courses"
              hint="With attached materials"
            />
            <MetricCard icon={Layers} value={counts.types} label="File types" hint="Distinct formats" />
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
                    <span className="ml-1 tabular-nums">{tab.count}</span>
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  placeholder="Search materials"
                  className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[240px]"
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
                  {materials.length === 0 ? "No materials yet" : "No materials match your filters"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {materials.length === 0
                    ? "Materials uploaded for your courses will appear here."
                    : "Try another type tab or search term."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] border-collapse">
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
                      <th className={thClass}>Course</th>
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
                    {filtered.map((m) => (
                      <tr key={m.id} className="transition-colors hover:bg-[#fafbfc]">
                        <td className="py-3.5 pl-4 pr-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#0f172a]">{m.title}</p>
                              {m.description ? (
                                <p className="mt-0.5 line-clamp-1 text-xs text-[#94a3b8]">
                                  {m.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {m.file_type ? (
                            <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold uppercase text-[#475569]">
                              {m.file_type}
                            </span>
                          ) : (
                            <span className="text-sm text-[#cbd5e1]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#64748b]">
                          {m.course_title || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[#64748b]">
                          {formatDate(m.updated_at)}
                        </td>
                        <td className="px-4 py-3.5 pr-4">
                          <div className="flex justify-end">
                            {m.file_url ? (
                              <Button
                                asChild
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg border-[#e2e8f0] shadow-none"
                              >
                                <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink
                                    className="h-3.5 w-3.5 text-[#64748b]"
                                    strokeWidth={1.5}
                                  />
                                  Open
                                </a>
                              </Button>
                            ) : (
                              <span className="text-sm text-[#cbd5e1]">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

function formatDate(iso: string) {
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
