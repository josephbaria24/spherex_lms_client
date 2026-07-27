"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { OrgSelector } from "@/components/org/org-selector"
import { useOrgAdmin } from "@/components/org/org-provider"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import type { OrgMember } from "@/lib/org-types"
import { orgRoute } from "@/lib/org-routes"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Plus,
  Presentation,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

const PAGE_SIZE = 10
const ICON_STROKE = 1.5
const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

type RoleFilter = "all" | "owner" | "admin" | "teacher" | "student"
type SortKey = "name" | "role" | "joined"

export default function OrgMembersPage() {
  const { selectedOrgId, selectedOrgSlug, selectedOrg, loadingOrgs } = useOrgAdmin()
  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "teacher" | "student">("teacher")
  const [submitting, setSubmitting] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const maxMembers = selectedOrg?.max_members ?? null
  const atCapacity = maxMembers != null && members.length >= maxMembers
  const capacityPct =
    maxMembers != null ? Math.min(100, Math.round((members.length / maxMembers) * 100)) : null
  const slug = selectedOrgSlug ?? selectedOrg?.slug ?? ""

  const load = useCallback(async () => {
    if (!selectedOrgId) return
    setLoading(true)
    try {
      const data = await apiGet<{ members: OrgMember[] }>(`/org-admin/${selectedOrgId}/members`)
      setMembers(data.members ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId])

  useEffect(() => {
    if (!loadingOrgs) load()
  }, [load, loadingOrgs])

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [roleFilter, search, selectedOrgId])

  const counts = useMemo(
    () => ({
      all: members.length,
      owner: members.filter((m) => m.role === "owner").length,
      admin: members.filter((m) => m.role === "admin").length,
      teacher: members.filter((m) => m.role === "teacher").length,
      student: members.filter((m) => m.role === "student").length,
    }),
    [members],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = members

    if (roleFilter !== "all") {
      list = list.filter((m) => m.role === roleFilter)
    }

    if (q) {
      list = list.filter((m) => {
        const name = (m.full_name || m.name || "").toLowerCase()
        return name.includes(q) || m.email.toLowerCase().includes(q)
      })
    }

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") {
        cmp = displayName(a).localeCompare(displayName(b))
      } else if (sortKey === "role") {
        cmp = a.role.localeCompare(b.role)
      } else {
        cmp = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [members, roleFilter, search, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const allPageSelected = paged.length > 0 && paged.every((m) => selected.has(m.id))

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function toggleSelectAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const m of paged) {
        if (checked) next.add(m.id)
        else next.delete(m.id)
      }
      return next
    })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrgId) return
    if (atCapacity) {
      toast.error("Member limit reached", {
        description: "Contact SphereX support to increase your organization capacity.",
      })
      return
    }
    setSubmitting(true)
    try {
      await apiPost(`/org-admin/${selectedOrgId}/members`, { email, role })
      setOpen(false)
      setEmail("")
      setRole("teacher")
      toast.success("Member added")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add member")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    if (!selectedOrgId) return
    try {
      await apiPatch(`/org-admin/${selectedOrgId}/members/${memberId}`, { role: newRole })
      toast.success("Role updated")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update role")
    }
  }

  async function handleRemove() {
    if (!selectedOrgId || !removeId) return
    try {
      await apiDelete(`/org-admin/${selectedOrgId}/members/${removeId}`)
      setRemoveId(null)
      toast.success("Member removed")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove member")
    }
  }

  const filterTabs: { id: RoleFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "owner", label: "Owners" },
    { id: "admin", label: "Admins" },
    { id: "teacher", label: "Teachers" },
    { id: "student", label: "Students" },
  ]

  return (
    <MainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Team directory
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Members
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Manage who has access to {selectedOrg?.name ?? "your organization"}. Assign
                organization roles, review platform accounts, and keep your roster up to date as
                teachers and students join.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OrgSelector />
              <Button
                onClick={() => setOpen(true)}
                disabled={atCapacity}
                className="h-9 gap-1.5 rounded-lg bg-[#0f172a] px-3.5 text-sm font-medium shadow-none hover:bg-[#1e293b]"
              >
                <Plus className="h-4 w-4" />
                Add member
              </Button>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Users} value={counts.all} label="Total members" hint="Everyone in this org" />
            <MetricCard
              icon={Presentation}
              value={counts.teacher}
              label="Teachers"
              hint="Can build and deliver courses"
            />
            <MetricCard
              icon={GraduationCap}
              value={counts.student}
              label="Students"
              hint="Learners with student access"
            />
            <MetricCard
              icon={Shield}
              value={counts.owner + counts.admin}
              label="Administrators"
              hint="Owners and org admins"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,22%)]">
            <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRoleFilter(tab.id)}
                      className={cn(
                        "text-sm transition-colors",
                        roleFilter === tab.id
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
                    placeholder="Search name or email"
                    className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[220px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="divide-y divide-[#f1f5f9]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-4">
                      <div className="h-4 w-4 animate-pulse rounded bg-[#f1f5f9]" />
                      <div className="h-9 w-9 animate-pulse rounded-full bg-[#f1f5f9]" />
                      <div className="h-4 w-48 animate-pulse rounded bg-[#f1f5f9]" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-20 text-center">
                  <p className="text-sm font-medium text-[#0f172a]">
                    {members.length === 0 ? "No members yet" : "No members match your filters"}
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                    {members.length === 0
                      ? "Add people by email or share your join codes from Settings so teachers and students can register."
                      : "Try a different role tab or search term."}
                  </p>
                  {members.length === 0 && (
                    <Button
                      onClick={() => setOpen(true)}
                      variant="outline"
                      className="mt-4 h-9 gap-1.5 rounded-lg border-[#e2e8f0]"
                      disabled={atCapacity}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add member
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                      <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                        <th className="w-10 px-4 py-3">
                          <Checkbox
                            checked={allPageSelected}
                            onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                            aria-label="Select all on page"
                          />
                        </th>
                        <th className={thClass}>
                          <SortHeader
                            label="Member"
                            active={sortKey === "name"}
                            dir={sortDir}
                            onClick={() => toggleSort("name")}
                          />
                        </th>
                        <th className={thClass}>
                          <SortHeader
                            label="Org role"
                            active={sortKey === "role"}
                            dir={sortDir}
                            onClick={() => toggleSort("role")}
                          />
                        </th>
                        <th className={thClass}>Platform</th>
                        <th className={thClass}>
                          <SortHeader
                            label="Joined"
                            active={sortKey === "joined"}
                            dir={sortDir}
                            onClick={() => toggleSort("joined")}
                          />
                        </th>
                        <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {paged.map((m) => (
                        <tr key={m.id} className="group transition-colors hover:bg-[#fafbfc]">
                          <td className="px-4 py-3.5">
                            <Checkbox
                              checked={selected.has(m.id)}
                              onCheckedChange={(checked) => {
                                setSelected((prev) => {
                                  const next = new Set(prev)
                                  if (checked) next.add(m.id)
                                  else next.delete(m.id)
                                  return next
                                })
                              }}
                              aria-label={`Select ${displayName(m)}`}
                            />
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <MemberAvatar member={m} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#0f172a]">
                                  {displayName(m)}
                                </p>
                                <p className="truncate text-xs text-[#94a3b8]">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <RolePill role={m.role} />
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm capitalize text-[#64748b]">{m.platform_role}</span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {formatJoined(m.joined_at)}
                          </td>
                          <td className="px-4 py-3.5 pr-4">
                            <div className="flex items-center justify-end gap-2">
                              <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v)}>
                                <SelectTrigger className="h-8 w-[118px] rounded-lg border-[#e2e8f0] text-xs shadow-none">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="owner">Owner</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="teacher">Teacher</SelectItem>
                                  <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                              </Select>
                              {m.role !== "owner" && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                                  onClick={() => setRemoveId(m.id)}
                                  aria-label={`Remove ${displayName(m)}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" strokeWidth={1.5} />
                                </Button>
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
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f4] px-4 py-3">
                  <p className="text-xs text-[#94a3b8]">
                    {filtered.length} member{filtered.length === 1 ? "" : "s"}
                    {selected.size > 0 ? ` · ${selected.size} selected` : ""}
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

            <aside className="space-y-4">
              {maxMembers != null && (
                <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                    Capacity
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-[#0f172a]">
                    {members.length}
                    <span className="text-base font-medium text-[#94a3b8]"> / {maxMembers}</span>
                  </p>
                  <p className="mt-1 text-xs text-[#64748b]">Member slots used</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        atCapacity ? "bg-amber-500" : "bg-[#0f172a]",
                      )}
                      style={{ width: `${capacityPct ?? 0}%` }}
                    />
                  </div>
                  {atCapacity && (
                    <p className="mt-3 text-xs leading-relaxed text-amber-700">
                      You have reached your member limit. Contact SphereX support to request more
                      capacity.
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-[#e2e8f0] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                  Quick tips
                </p>
                <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#64748b]">
                  <li>
                    Share join codes from{" "}
                    <Link
                      href={orgRoute(slug, "settings")}
                      className="font-medium text-[#2563eb] hover:underline"
                    >
                      Settings
                    </Link>{" "}
                    so people can self-register with the right role.
                  </li>
                  <li>Teachers can create courses; students can only enroll and learn.</li>
                  <li>Owners cannot be removed — transfer ownership before deleting an owner account.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] bg-[#fafbfc] p-5">
                <p className="text-sm font-semibold text-[#0f172a]">Role guide</p>
                <dl className="mt-3 space-y-2.5 text-xs text-[#64748b]">
                  <div>
                    <dt className="font-semibold text-[#334155]">Owner</dt>
                    <dd className="mt-0.5">Full control including billing and org deletion.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#334155]">Admin</dt>
                    <dd className="mt-0.5">Manage members, courses, and organization settings.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#334155]">Teacher</dt>
                    <dd className="mt-0.5">Build lessons and manage assigned learners.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#334155]">Student</dt>
                    <dd className="mt-0.5">Access enrolled courses and track progress.</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl border-[#e2e8f0] sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add member</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">
              The person must already have a SphereX account. They will receive access to this
              organization immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="member-email" className="text-[13px]">
                Email address
              </Label>
              <Input
                id="member-email"
                type="email"
                required
                className="h-9 rounded-lg border-[#e2e8f0] shadow-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Organization role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger className="h-9 rounded-lg border-[#e2e8f0] shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="h-9 w-full rounded-lg bg-[#0f172a] shadow-none hover:bg-[#1e293b]"
              disabled={submitting || atCapacity}
            >
              {submitting ? "Adding…" : "Add member"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent className="rounded-xl border-[#e2e8f0]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this organization and any courses tied to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="rounded-lg bg-[#ef4444] hover:bg-[#dc2626]"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        <Icon className="h-[22px] w-[22px] shrink-0 text-[#64748b]" strokeWidth={ICON_STROKE} />
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

function MemberAvatar({ member }: { member: OrgMember }) {
  const initials = getInitials(member)
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] text-[11px] font-semibold tracking-tight text-[#64748b]"
      aria-hidden
    >
      {initials}
    </div>
  )
}

function RolePill({ role }: { role: string }) {
  const tone =
    role === "owner"
      ? "bg-violet-50 text-violet-700"
      : role === "admin"
        ? "bg-blue-50 text-blue-700"
        : role === "teacher"
          ? "bg-slate-100 text-slate-700"
          : "bg-emerald-50 text-emerald-700"

  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize", tone)}>
      {role}
    </span>
  )
}

function displayName(m: OrgMember) {
  return m.full_name || m.name || m.email.split("@")[0] || m.email
}

function getInitials(m: OrgMember) {
  const name = m.full_name || m.name
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return m.email.slice(0, 2).toUpperCase()
}

function formatJoined(iso: string) {
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
