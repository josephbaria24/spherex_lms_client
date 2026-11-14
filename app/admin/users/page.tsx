"use client"

import { PageLoader } from "@/components/ui/spinner"
import { useCallback, useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { UserActivitySheet } from "@/components/admin/users/user-activity-sheet"
import { GrowHeader } from "@/components/grow-shell"
import { PullToRefresh } from "@/components/ui/pull-to-refresh"
import {
  Search,
  MoreVertical,
  Activity,
  BarChart3,
  BookOpen,
  Clock,
  KeyRound,
  Pencil,
  Plus,
  Trash2,
  Users as UsersIcon,
} from "lucide-react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface User {
  id: string
  full_name: string | null
  name: string | null
  email: string
  role: string
  status: string
  enrollment_count: number
  created_at?: string
  last_login_at?: string | null
  last_seen_at?: string | null
  is_online?: boolean
  active_course?: { id: string; title: string | null } | null
}

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
] as const

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
] as const

function formatLastLogin(value: string | null | undefined) {
  if (!value) return "Never"
  const then = new Date(value).getTime()
  if (!Number.isFinite(then)) return "—"
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 60) return "Just now"
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%"
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [activityUser, setActivityUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "student",
    status: "active",
  })
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "student",
    status: "active",
    must_change_password: true,
  })
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    must_change_password: true,
  })

  const fetchUsers = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!silent) setLoading(true)
    try {
      const data = await apiGet<{ users: User[] }>("/users")
      setUsers(data.users ?? [])
    } catch {
      if (!silent) toast.error("Failed to load users")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchUsers({ silent: true })
    }, 30_000)
    return () => window.clearInterval(id)
  }, [fetchUsers])

  useEffect(() => {
    if (editUser) {
      setEditForm({
        full_name: editUser.full_name ?? editUser.name ?? "",
        role: editUser.role,
        status: editUser.status,
      })
    }
  }, [editUser])

  useEffect(() => {
    if (passwordUser) {
      setPasswordForm({ password: "", must_change_password: true })
    }
  }, [passwordUser])

  function resetCreateForm() {
    setCreateForm({
      email: "",
      full_name: "",
      password: "",
      role: "student",
      status: "active",
      must_change_password: true,
    })
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.email.trim() || createForm.password.length < 8) {
      toast.error("Email and a password of at least 8 characters are required")
      return
    }
    setCreateLoading(true)
    try {
      await apiPost("/users", {
        email: createForm.email.trim(),
        password: createForm.password,
        full_name: createForm.full_name.trim() || undefined,
        role: createForm.role,
        status: createForm.status,
        must_change_password: createForm.must_change_password,
      })
      toast.success("User created")
      setCreateOpen(false)
      resetCreateForm()
      await fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setCreateLoading(false)
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

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passwordUser) return
    if (passwordForm.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setPasswordLoading(true)
    try {
      await apiPatch(`/users/${passwordUser.id}/password`, {
        password: passwordForm.password,
        must_change_password: passwordForm.must_change_password,
      })
      toast.success("Password updated")
      setPasswordUser(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set password")
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteUserId) return
    try {
      await apiDelete(`/users/${deleteUserId}`)
      toast.success("User deleted")
      setDeleteUserId(null)
      if (activityUser?.id === deleteUserId) setActivityUser(null)
      await fetchUsers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    }
  }

  const filteredUsers = users.filter((user) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      !q ||
      user.email.toLowerCase().includes(q) ||
      (user.full_name ?? user.name ?? "").toLowerCase().includes(q)
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <GrowMainLayout fill>
      <PullToRefresh
        className="-mx-1 px-1"
        onRefresh={async () => {
          await fetchUsers({ silent: true })
        }}
      >
        <div className="space-y-5 pb-4">
          <GrowHeader
            icon={UsersIcon}
            title="Users"
            accent="guide learners"
            description="Add accounts, set roles and passwords, and review learner progress"
            showDate={false}
          >
            <Button
              onClick={() => {
                resetCreateForm()
                setCreateOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add user
            </Button>
          </GrowHeader>

          <div className="grow-toolbar flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="sleek-input h-9 pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[150px]">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <PageLoader label="Loading users..." className="min-h-[20vh] py-6" />
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users match your filters.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              {filteredUsers.map((user, index) => {
                const displayName = user.full_name ?? user.name ?? user.email
                const online = user.is_online === true
                const taking = online && user.active_course?.title
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5",
                      index > 0 && "border-t border-border/70",
                      online && "bg-emerald-50/40 dark:bg-emerald-950/15",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-5 px-1.5 text-[10px] capitalize",
                            online
                              ? "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                              : "text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "mr-1 inline-block h-1.5 w-1.5 rounded-full",
                              online ? "bg-emerald-500" : "bg-muted-foreground/50",
                            )}
                          />
                          {online ? "Online" : "Offline"}
                        </Badge>
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] capitalize">
                          {user.role}
                        </Badge>
                        {user.status !== "active" ? (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] capitalize">
                            {user.status}
                          </Badge>
                        ) : null}
                        {taking ? (
                          <Badge
                            variant="outline"
                            className="h-5 max-w-[220px] gap-1 truncate px-1.5 text-[10px] text-[#FF4B1A]"
                            title={user.active_course?.title ?? undefined}
                          >
                            <BookOpen className="h-3 w-3 shrink-0" />
                            <span className="truncate">{user.active_course?.title}</span>
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="truncate">{user.email}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last login {formatLastLogin(user.last_login_at)}
                        </span>
                        <span>
                          {user.enrollment_count} enrollment
                          {user.enrollment_count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="hidden h-8 gap-1.5 px-2 sm:inline-flex"
                        onClick={() => setActivityUser(user)}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Progress
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setActivityUser(user)}>
                            <Activity className="mr-2 h-4 w-4" />
                            View progress & activity
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit role & profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPasswordUser(user)}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Set password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteUserId(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      <UserActivitySheet
        userId={activityUser?.id ?? null}
        userLabel={activityUser?.full_name ?? activityUser?.name ?? activityUser?.email}
        open={!!activityUser}
        onOpenChange={(open) => {
          if (!open) setActivityUser(null)
        }}
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Create an account with a role and password. They can sign in right away.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-user-email">Email</Label>
              <Input
                id="create-user-email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="learner@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-user-name">Display name</Label>
              <Input
                id="create-user-name"
                value={createForm.full_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm((f) => ({ ...f, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(value) => setCreateForm((f) => ({ ...f, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="create-user-password">Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    setCreateForm((f) => ({ ...f, password: generatePassword() }))
                  }
                >
                  Generate
                </Button>
              </div>
              <Input
                id="create-user-password"
                type="text"
                required
                minLength={8}
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={createForm.must_change_password}
                onCheckedChange={(checked) =>
                  setCreateForm((f) => ({ ...f, must_change_password: checked === true }))
                }
              />
              Require password change on first login
            </label>
            <Button type="submit" disabled={createLoading} className="w-full">
              {createLoading ? "Creating…" : "Create user"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update display name, role, or account status.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-user-email">Email</Label>
              <Input id="edit-user-email" value={editUser?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-user-name">Display name</Label>
              <Input
                id="edit-user-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm((f) => ({ ...f, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={editLoading} className="w-full">
              {editLoading ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordUser} onOpenChange={() => setPasswordUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordUser?.full_name ?? passwordUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="set-user-password">New password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() =>
                    setPasswordForm((f) => ({ ...f, password: generatePassword() }))
                  }
                >
                  Generate
                </Button>
              </div>
              <Input
                id="set-user-password"
                type="text"
                required
                minLength={8}
                value={passwordForm.password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={passwordForm.must_change_password}
                onCheckedChange={(checked) =>
                  setPasswordForm((f) => ({ ...f, must_change_password: checked === true }))
                }
              />
              Require password change on next login
            </label>
            <Button type="submit" disabled={passwordLoading} className="w-full">
              {passwordLoading ? "Saving…" : "Update password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the user account and all associated data. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GrowMainLayout>
  )
}
