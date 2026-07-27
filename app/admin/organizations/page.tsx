"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { apiGet, apiPatch, apiPost } from "@/lib/api"
import { resolveOrgLogoSrc } from "@/lib/org-brand-logos"
import { assetUrl } from "@/lib/asset-url"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Plus,
  Search,
  UserPlus,
} from "lucide-react"

type Organization = {
  id: string
  name: string
  slug: string
  description: string | null
  industry: string | null
  status: string
  teacher_join_code: string
  member_count: number
  course_count: number
  owner_email: string | null
  website?: string | null
  logo?: string | null
  max_members?: number | null
  brand_primary?: string | null
  logo_padding?: number | null
  logo_position_x?: number | null
  logo_position_y?: number | null
  created_at?: string
  updated_at?: string
}

type UserOption = {
  id: string
  email: string
  full_name: string | null
  name: string | null
}

type StatusFilter = "active" | "pending" | "suspended"
type SortKey = "members" | "courses"
type SortDir = "asc" | "desc"

const PAGE_SIZE = 10

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  industry: "",
  website: "",
  status: "pending" as "pending" | "active" | "suspended",
  addOrgAdmin: true,
  adminMode: "new" as "new" | "existing",
  adminEmail: "",
  adminPassword: "",
  adminName: "",
  existingUserId: "",
}

const HEX_FALLBACK = ["#64748b", "#0d9488", "#2563eb", "#7c3aed", "#ea580c", "#db2777"]

const thClass =
  "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]"

function hashSlug(slug: string) {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h + slug.charCodeAt(i) * (i + 1)) % HEX_FALLBACK.length
  return h
}

function formatLastActive(org: Organization) {
  const raw = org.updated_at || org.created_at
  if (!raw) return "—"
  const diff = Date.now() - new Date(raw).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} wk ago`
  return `${Math.floor(days / 30)} mo ago`
}

function exportCsv(rows: Organization[]) {
  const header = ["Name", "Slug", "Owner", "Industry", "Members", "Courses", "Join Code", "Status"]
  const lines = rows.map((o) =>
    [
      o.name,
      o.slug,
      o.owner_email ?? "",
      o.industry ?? "",
      o.member_count,
      o.course_count,
      o.teacher_join_code,
      o.status,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  )
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "organizations.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [industryFilter, setIndustryFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("members")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [createdName, setCreatedName] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [orgsRes, usersRes] = await Promise.all([
        apiGet<{ organizations: Organization[] }>("/admin/organizations"),
        apiGet<{ users: UserOption[] }>("/users"),
      ])
      setOrganizations(orgsRes.organizations ?? [])
      setUsers(usersRes.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [search, statusFilter, industryFilter, sortKey, sortDir])

  const counts = useMemo(() => {
    const by = (s: string) => organizations.filter((o) => o.status === s).length
    return {
      all: organizations.length,
      active: by("active"),
      pending: by("pending"),
      suspended: by("suspended"),
      totalMembers: organizations.reduce((s, o) => s + o.member_count, 0),
      totalCourses: organizations.reduce((s, o) => s + o.course_count, 0),
    }
  }, [organizations])

  const industries = useMemo(() => {
    const set = new Set<string>()
    organizations.forEach((o) => {
      if (o.industry?.trim()) set.add(o.industry.trim())
    })
    return Array.from(set).sort()
  }, [organizations])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    let rows = organizations.filter((org) => {
      const matchesStatus = org.status === statusFilter
      const matchesIndustry =
        industryFilter === "all" || (org.industry?.trim() ?? "") === industryFilter
      const matchesSearch =
        !query ||
        org.name.toLowerCase().includes(query) ||
        org.slug.toLowerCase().includes(query) ||
        (org.industry?.toLowerCase().includes(query) ?? false) ||
        (org.owner_email?.toLowerCase().includes(query) ?? false) ||
        org.teacher_join_code.toLowerCase().includes(query)
      return matchesStatus && matchesIndustry && matchesSearch
    })

    rows = [...rows].sort((a, b) => {
      const av = sortKey === "members" ? a.member_count : a.course_count
      const bv = sortKey === "members" ? b.member_count : b.course_count
      return sortDir === "asc" ? av - bv : bv - av
    })

    return rows
  }, [organizations, search, statusFilter, industryFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allPageSelected =
    paged.length > 0 && paged.every((o) => selected.has(o.id))

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        paged.forEach((o) => next.delete(o.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        paged.forEach((o) => next.add(o.id))
        return next
      })
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        industry: form.industry || undefined,
        website: form.website || undefined,
        status: form.status,
      }
      if (form.slug.trim()) payload.slug = form.slug.trim()

      if (form.addOrgAdmin) {
        if (form.adminMode === "existing" && form.existingUserId) {
          payload.org_admin = { existing_user_id: form.existingUserId, role: "owner" }
        } else if (form.adminEmail && form.adminPassword) {
          payload.org_admin = {
            email: form.adminEmail,
            password: form.adminPassword,
            full_name: form.adminName || undefined,
            role: "owner",
          }
        }
      }

      const res = await apiPost<{
        organization: Organization
        teacher_join_code: string
      }>("/admin/organizations", payload)

      setOpen(false)
      setForm(emptyForm)
      setCreatedCode(res.teacher_join_code)
      setCreatedName(res.organization.name)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create organization")
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Could not copy code")
    }
  }

  const filterTabs: { id: StatusFilter; label: string }[] = [
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" },
    { id: "suspended", label: "Suspended" },
  ]

  return (
    <GrowMainLayout variant="ops" bento={false}>
      <div className="min-h-full w-full bg-[#f8fafc] px-5 py-6 md:px-8 md:py-8">
        {/* Registry header */}
        <header className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#059669]">
            <IconRegistry className="h-3.5 w-3.5" />
            Partner network registry
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[2rem] font-bold tracking-tight text-[#0f172a]">Organizations</h1>
              <p className="mt-1 text-sm text-[#64748b]">
                {counts.all} partner organization{counts.all === 1 ? "" : "s"} · {counts.active}{" "}
                active
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 gap-2 rounded-lg border-[#e2e8f0] bg-white px-3.5 text-sm font-medium text-[#0f172a] shadow-none hover:bg-[#f8fafc]"
                onClick={() => exportCsv(filtered)}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => setOpen(true)}
                className="h-9 gap-1.5 rounded-lg bg-[#0f172a] px-3.5 text-sm font-medium shadow-none hover:bg-[#1e293b]"
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
          </div>
        </header>

        {/* Metric cards */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={<IconOrganizations />} value={counts.all} label="Organizations" />
          <MetricCard icon={<IconActive />} value={counts.active} label="Active" />
          <MetricCard icon={<IconMembers />} value={counts.totalMembers} label="Total members" />
          <MetricCard icon={<IconCourses />} value={counts.totalCourses} label="Total courses" />
        </div>

        {/* Table card */}
        <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
            <div className="flex items-center gap-5">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "text-sm transition-colors",
                    statusFilter === tab.id
                      ? "font-semibold text-[#0f172a]"
                      : "font-medium text-[#94a3b8] hover:text-[#64748b]",
                  )}
                >
                  {tab.label}
                  <span className="ml-1 tabular-nums">{counts[tab.id]}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="h-9 w-[150px] rounded-lg border-[#e2e8f0] bg-white text-sm shadow-none">
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  placeholder="Search name, owner, join code"
                  className="h-9 w-[240px] rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-[#f1f5f9]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4">
                  <div className="h-4 w-4 animate-pulse rounded bg-[#f1f5f9]" />
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-[#f1f5f9]" />
                  <div className="h-4 w-48 animate-pulse rounded bg-[#f1f5f9]" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-20 text-center">
              <p className="text-sm font-medium text-[#0f172a]">No organizations found</p>
              <p className="mt-1 text-sm text-[#94a3b8]">
                Try another filter or create a new partner organization.
              </p>
              <Button
                onClick={() => setOpen(true)}
                variant="outline"
                className="mt-4 h-9 rounded-lg border-[#e2e8f0]"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New organization
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                    <th className="w-10 px-4 py-3">
                      <Checkbox
                        checked={allPageSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th className={thClass}>Organization</th>
                    <th className={thClass}>Owner</th>
                    <th className={thClass}>Industry</th>
                    <th className={thClass}>
                      <SortHeader
                        label="Members"
                        active={sortKey === "members"}
                        dir={sortDir}
                        onClick={() => toggleSort("members")}
                      />
                    </th>
                    <th className={thClass}>
                      <SortHeader
                        label="Courses"
                        active={sortKey === "courses"}
                        dir={sortDir}
                        onClick={() => toggleSort("courses")}
                      />
                    </th>
                    <th className={thClass}>Join code</th>
                    <th className={thClass}>Last active</th>
                    <th className={cn(thClass, "pr-4")}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {paged.map((org) => (
                    <tr key={org.id} className="group transition-colors hover:bg-[#fafbfc]">
                      <td className="px-4 py-3.5">
                        <Checkbox
                          checked={selected.has(org.id)}
                          onCheckedChange={(checked) => {
                            setSelected((prev) => {
                              const next = new Set(prev)
                              if (checked) next.add(org.id)
                              else next.delete(org.id)
                              return next
                            })
                          }}
                          aria-label={`Select ${org.name}`}
                        />
                      </td>
                      <td className="py-3.5 pr-4">
                        <Link
                          href={`/admin/organizations/${org.id}`}
                          className="flex items-center gap-3"
                        >
                          <HexOrgAvatar org={org} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#0f172a] group-hover:underline">
                              {org.name}
                            </span>
                            <span className="block truncate text-xs text-[#94a3b8]">/{org.slug}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="max-w-[200px] px-4 py-3.5">
                        {org.owner_email ? (
                          <span className="truncate text-sm text-[#64748b]">{org.owner_email}</span>
                        ) : (
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563eb] hover:underline"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Invite owner
                          </Link>
                        )}
                      </td>
                      <td className="max-w-[160px] px-4 py-3.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#64748b]">
                          {org.industry || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-[#0f172a]">
                        {org.member_count}
                      </td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-[#0f172a]">
                        {org.course_count}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => copyCode(org.teacher_join_code)}
                          className="inline-flex items-center gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 font-mono text-xs font-medium text-[#334155] transition hover:bg-white"
                        >
                          {org.teacher_join_code}
                          <Copy className="h-3 w-3 text-[#94a3b8]" />
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#64748b]">
                          <Clock className="h-3.5 w-3.5 text-[#94a3b8]" />
                          {formatLastActive(org)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 pr-4">
                        <StatusBadge status={org.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f4] px-4 py-3">
              <p className="text-xs text-[#94a3b8]">
                {counts.totalMembers} members · {counts.totalCourses} courses across network
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]">
          <SheetHeader className="border-b border-[#e5e7eb] px-6 py-5 text-left">
            <SheetTitle className="text-base font-semibold">New organization</SheetTitle>
            <SheetDescription className="text-[13px]">
              Set up a partner tenant. You can assign an owner now or later.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleCreate} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="space-y-1.5">
                <Label htmlFor="org-name" className="text-[13px]">
                  Name
                </Label>
                <Input
                  id="org-name"
                  required
                  autoFocus
                  className="h-9 rounded-md border-[#e5e7eb] shadow-none"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-slug" className="text-[13px]">
                  Slug <span className="font-normal text-muted-foreground">— optional</span>
                </Label>
                <Input
                  id="org-slug"
                  placeholder="auto-generated from name"
                  className="h-9 rounded-md border-[#e5e7eb] font-mono text-[13px] shadow-none"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as typeof form.status }))
                    }
                  >
                    <SelectTrigger className="h-9 rounded-md border-[#e5e7eb] shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-industry" className="text-[13px]">
                    Industry
                  </Label>
                  <Input
                    id="org-industry"
                    className="h-9 rounded-md border-[#e5e7eb] shadow-none"
                    value={form.industry}
                    onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org-desc" className="text-[13px]">
                  Description
                </Label>
                <textarea
                  id="org-desc"
                  rows={3}
                  className="w-full rounded-md border border-[#e5e7eb] bg-background px-3 py-2 text-sm shadow-none outline-none"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-4 border-t border-[#e5e7eb] pt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor="add-admin" className="text-[13px]">
                      Assign owner
                    </Label>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      First organization admin account
                    </p>
                  </div>
                  <Switch
                    id="add-admin"
                    checked={form.addOrgAdmin}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, addOrgAdmin: v }))}
                  />
                </div>
                {form.addOrgAdmin && (
                  <div className="space-y-3">
                    <Select
                      value={form.adminMode}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, adminMode: v as typeof form.adminMode }))
                      }
                    >
                      <SelectTrigger className="h-9 rounded-md border-[#e5e7eb] shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Create new user</SelectItem>
                        <SelectItem value="existing">Use existing user</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.adminMode === "new" ? (
                      <>
                        <Input
                          placeholder="Full name"
                          className="h-9 rounded-md border-[#e5e7eb] shadow-none"
                          value={form.adminName}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, adminName: e.target.value }))
                          }
                        />
                        <Input
                          type="email"
                          placeholder="Email"
                          required={form.addOrgAdmin}
                          className="h-9 rounded-md border-[#e5e7eb] shadow-none"
                          value={form.adminEmail}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, adminEmail: e.target.value }))
                          }
                        />
                        <Input
                          type="password"
                          placeholder="Password (min 8 characters)"
                          required={form.addOrgAdmin}
                          className="h-9 rounded-md border-[#e5e7eb] shadow-none"
                          value={form.adminPassword}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, adminPassword: e.target.value }))
                          }
                        />
                      </>
                    ) : (
                      <Select
                        value={form.existingUserId}
                        onValueChange={(v) => setForm((f) => ({ ...f, existingUserId: v }))}
                      >
                        <SelectTrigger className="h-9 rounded-md border-[#e5e7eb] shadow-none">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.full_name || u.name || u.email} ({u.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>
            <SheetFooter className="flex-row gap-2 border-t border-[#e5e7eb] px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="h-9 flex-1 rounded-md border-[#e5e7eb] text-[13px] font-medium shadow-none"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 flex-1 rounded-md text-[13px] font-medium shadow-none"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create organization"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!createdCode} onOpenChange={() => setCreatedCode(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Organization created</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-[13px] text-muted-foreground">
                <p>
                  <strong className="font-medium text-foreground">{createdName}</strong> is ready.
                  Share this teacher join code:
                </p>
                <div className="rounded-md border border-[#e5e7eb] bg-[#fafbfc] px-4 py-3 text-center">
                  <code className="font-mono text-base font-semibold tracking-wide text-foreground">
                    {createdCode}
                  </code>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => createdCode && copyCode(createdCode)}
              variant="outline"
              className="h-9 rounded-md border-[#e5e7eb] text-[13px] font-medium shadow-none"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy code
            </Button>
            <Button
              onClick={() => setCreatedCode(null)}
              className="h-9 rounded-md text-[13px] font-medium shadow-none"
            >
              Done
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GrowMainLayout>
  )
}

const METRIC_ICON_CLASS = "h-8 w-8 shrink-0 text-[#64748b]"

function MetricCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {icon}
      <div>
        <p className="text-2xl font-bold tabular-nums leading-none text-[#0f172a]">{value}</p>
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
          {label}
        </p>
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
  dir: SortDir
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 hover:text-[#64748b]"
    >
      {label}
      <span className="flex flex-col text-[8px] leading-none text-[#cbd5e1]">
        <span className={cn(active && dir === "asc" && "text-[#64748b]")}>▲</span>
        <span className={cn(active && dir === "desc" && "text-[#64748b]")}>▼</span>
      </span>
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#059669]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
        Active
      </span>
    )
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#ea580c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
        Pending
        <AlertCircle className="h-3 w-3 opacity-70" />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef2f2] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#dc2626]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
      Suspended
    </span>
  )
}

function HexOrgAvatar({ org }: { org: Organization }) {
  const color = org.brand_primary || HEX_FALLBACK[hashSlug(org.slug)]
  const logoSrc = resolveOrgLogoSrc(org.slug, org.logo, assetUrl)
  const clipId = `hex-${org.id}`

  return (
    <div className="relative h-10 w-10 shrink-0">
      <svg viewBox="0 0 40 44" className="h-full w-full" aria-hidden>
        <defs>
          <clipPath id={clipId}>
            <path d="M20 2 L36 11.5 V32.5 L20 42 L4 32.5 V11.5 Z" />
          </clipPath>
        </defs>
        <path d="M20 2 L36 11.5 V32.5 L20 42 L4 32.5 V11.5 Z" fill={color} />
        {logoSrc ? (
          <image
            href={logoSrc}
            width="40"
            height="44"
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <g clipPath={`url(#${clipId})`} fill="white" opacity="0.95">
            <circle cx="20" cy="16" r="3.2" />
            <circle cx="13" cy="28" r="2.8" />
            <circle cx="27" cy="28" r="2.8" />
            <path
              d="M20 19.5v5M20 24.5l-5 2.5M20 24.5l5 2.5"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}
      </svg>
    </div>
  )
}

function IconRegistry({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.45" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.45" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity="0.2" />
    </svg>
  )
}

function IconOrganizations({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(METRIC_ICON_CLASS, className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M12 3.5 18.5 7.25v7.5L12 18.5 5.5 14.75v-7.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12 8 15.5 10v4L12 16 8.5 14v-4L12 8Z" fill="currentColor" opacity="0.35" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  )
}

function IconActive({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(METRIC_ICON_CLASS, className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M12 5.5a6.5 6.5 0 0 1 0 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M12 8a4 4 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.2" opacity="0.25" />
    </svg>
  )
}

function IconMembers({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(METRIC_ICON_CLASS, className)}
      fill="none"
      aria-hidden
    >
      <circle cx="9" cy="10" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="9" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="16"
        cy="11"
        r="2.2"
        fill="currentColor"
        opacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 17.5c.9-2 2.4-3 4.5-3s3.6 1 4.5 3M13 17.5c.5-1.2 1.4-1.8 2.8-1.8 1.1 0 2 .4 2.7 1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  )
}

function IconCourses({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(METRIC_ICON_CLASS, className)}
      fill="none"
      aria-hidden
    >
      <path
        d="M5 7.5 12 4.5l7 3v9l-7 3-7-3v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <path
        d="M8 9.5 12 7.5l4 2v6l-4 2-4-2v-6Z"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.5v11M8 9.5l4 2 4-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
