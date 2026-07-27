"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserActivitySheet } from "@/components/admin/users/user-activity-sheet"
import { apiDelete, apiGet, apiPatch } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Pencil,
  Presentation,
  Search,
  Shield,
  Trash2,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  full_name: string | null
  name: string | null
  email: string
  role: string
  status: string
  enrollment_count: number
  created_at?: string
}

type RoleFilter = "all" | "student" | "teacher" | "admin" | "user"
type SortKey = "name" | "enrollments" | "role"

const PAGE_SIZE = 10
const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [activityUser, setActivityUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "student",
    status: "active",
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGet<{ users: User[] }>("/users")
      setUsers(data.users ?? [])
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  useEffect(() => {
    if (editUser) {
      setEditForm({
        full_name: editUser.full_name ?? editUser.name ?? "",
        role: editUser.role,
        status: editUser.status,
      })
    }
  }, [editUser])

  const counts = useMemo(
    () => ({
      all: users.length,
      student: users.filter((u) => u.role === "student").length,
      teacher: users.filter((u) => u.role === "teacher").length,
      admin: users.filter((u) => u.role === "admin").length,
      user: users.filter((u) => u.role === "user").length,
      active: users.filter((u) => u.status === "active").length,
      enrollments: users.reduce((sum, u) => sum + (u.enrollment_count ?? 0), 0),
    }),
    [users],
  )

  const filteredUsers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    let list = users.filter((user) => {
      const matchesSearch =
        !q ||
        user.email.toLowerCase().includes(q) ||
        (user.full_name ?? user.name ?? "").toLowerCase().includes(q)
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })

    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = displayName(a).localeCompare(displayName(b))
      else if (sortKey === "role") cmp = a.role.localeCompare(b.role)
      else cmp = (a.enrollment_count ?? 0) - (b.enrollment_count ?? 0)
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [users, searchTerm, roleFilter, statusFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const paged = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "enrollments" ? "desc" : "asc")
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setEditLoading(true)
    try {
      await apiPatch(`/users/${editUser.id}`, {
        full_name: editForm.full_name.trim() || undefined,
        role: editForm.role,
        status: editForm.status,
      })
      toast.success("User updated")
      setEditUser(null)
      await fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteUserId) return
    setDeleting(true)
    try {
      await apiDelete(`/users/${deleteUserId}`)
      toast.success("User deleted")
      setDeleteUserId(null)
      if (activityUser?.id === deleteUserId) setActivityUser(null)
      await fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  const roleTabs: { id: RoleFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "student", label: "Students" },
    { id: "teacher", label: "Teachers" },
    { id: "admin", label: "Admins" },
    { id: "user", label: "Users" },
  ]

  return (
    <GrowMainLayout variant="ops">
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
              People directory
            </p>
            <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
              Users
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
              Manage platform accounts, review learning progress, and update roles or account
              status across the network.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Users}
              value={counts.all}
              label="Total users"
              hint="Everyone on the platform"
            />
            <MetricCard
              icon={GraduationCap}
              value={counts.student}
              label="Students"
              hint="Learner accounts"
            />
            <MetricCard
              icon={Presentation}
              value={counts.teacher}
              label="Teachers"
              hint="Instructor accounts"
            />
            <MetricCard
              icon={Shield}
              value={counts.admin}
              label="Admins"
              hint={`${counts.active} active overall`}
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {roleTabs.map((tab) => (
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
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white text-sm shadow-none sm:w-[140px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-auto">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <Input
                    placeholder="Search name or email"
                    className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[240px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-[#f1f5f9]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-[#f1f5f9]" />
                    <div className="h-4 w-48 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <UserRound className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {users.length === 0 ? "No users yet" : "No users match your filters"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {users.length === 0
                    ? "Accounts appear here once people register or are invited."
                    : "Try another role tab, status, or search term."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>
                        <SortHeader
                          label="User"
                          active={sortKey === "name"}
                          dir={sortDir}
                          onClick={() => toggleSort("name")}
                        />
                      </th>
                      <th className={thClass}>
                        <SortHeader
                          label="Role"
                          active={sortKey === "role"}
                          dir={sortDir}
                          onClick={() => toggleSort("role")}
                        />
                      </th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>
                        <SortHeader
                          label="Enrollments"
                          active={sortKey === "enrollments"}
                          dir={sortDir}
                          onClick={() => toggleSort("enrollments")}
                        />
                      </th>
                      <th className={cn(thClass, "pr-4 text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {paged.map((user) => (
                      <tr
                        key={user.id}
                        className="group transition-colors hover:bg-[#fafbfc]"
                      >
                        <td className="py-3.5 pl-4 pr-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#0f172a]">
                                {displayName(user)}
                              </p>
                              <p className="truncate text-xs text-[#94a3b8]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <RolePill role={user.role} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusPill status={user.status} />
                        </td>
                        <td className="px-4 py-3.5 text-sm tabular-nums text-[#0f172a]">
                          {user.enrollment_count ?? 0}
                        </td>
                        <td className="px-4 py-3.5 pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 rounded-lg border-[#e2e8f0] px-2.5 text-xs font-medium shadow-none"
                              onClick={() => setActivityUser(user)}
                            >
                              <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                              Progress
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                              onClick={() => setEditUser(user)}
                              aria-label={`Edit ${displayName(user)}`}
                            >
                              <Pencil className="h-3.5 w-3.5 text-[#64748b]" strokeWidth={1.5} />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-[#e2e8f0] shadow-none"
                              onClick={() => setDeleteUserId(user.id)}
                              aria-label={`Delete ${displayName(user)}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredUsers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
                  {counts.enrollments > 0
                    ? ` · ${counts.enrollments} enrollments total`
                    : ""}
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

      <UserActivitySheet
        userId={activityUser?.id ?? null}
        userLabel={activityUser?.full_name ?? activityUser?.name ?? activityUser?.email}
        open={!!activityUser}
        onOpenChange={(open) => {
          if (!open) setActivityUser(null)
        }}
      />

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md rounded-xl border-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Edit user</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-email" className="text-[13px]">
                Email
              </Label>
              <Input
                id="edit-user-email"
                className="h-9 rounded-lg border-[#e2e8f0] shadow-none"
                value={editUser?.email ?? ""}
                disabled
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-name" className="text-[13px]">
                Display name
              </Label>
              <Input
                id="edit-user-name"
                className="h-9 rounded-lg border-[#e2e8f0] shadow-none"
                value={editForm.full_name}
                onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger className="h-9 rounded-lg border-[#e2e8f0] shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger className="h-9 rounded-lg border-[#e2e8f0] shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={editLoading}
              className="h-9 w-full rounded-lg bg-[#0f172a] shadow-none hover:bg-[#1e293b]"
            >
              {editLoading ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent className="rounded-xl border-[#e2e8f0]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user account and all associated data. This cannot be
              undone.
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

function UserAvatar({ user }: { user: User }) {
  const initials = getInitials(user)
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
    role === "admin"
      ? "bg-violet-50 text-violet-700"
      : role === "teacher"
        ? "bg-blue-50 text-blue-700"
        : role === "student"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-700"
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        tone,
      )}
    >
      {role}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : status === "suspended"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700"
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        tone,
      )}
    >
      {status}
    </span>
  )
}

function displayName(user: User) {
  return user.full_name || user.name || user.email.split("@")[0] || user.email
}

function getInitials(user: User) {
  const name = user.full_name || user.name
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return user.email.slice(0, 2).toUpperCase()
}
