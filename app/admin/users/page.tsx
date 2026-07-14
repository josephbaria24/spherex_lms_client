"use client"

import { useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { UserActivitySheet } from "@/components/admin/users/user-activity-sheet"
import { GrowHeader } from "@/components/grow-shell"
import {
  Search,
  MoreVertical,
  Mail,
  Activity,
  BarChart3,
  Pencil,
  Trash2,
  Users as UsersIcon,
} from "lucide-react"
import { apiDelete, apiGet, apiPatch } from "@/lib/api"
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [activityUser, setActivityUser] = useState<User | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "student",
    status: "active",
  })

  useEffect(() => {
    void fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await apiGet<{ users: User[] }>("/users")
      setUsers(data.users ?? [])
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (editUser) {
      setEditForm({
        full_name: editUser.full_name ?? editUser.name ?? "",
        role: editUser.role,
        status: editUser.status,
      })
    }
  }, [editUser])

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
    <GrowMainLayout>
      <div className="space-y-6">
        <GrowHeader
          icon={UsersIcon}
          title="Users"
          accent="guide learners"
          description="Manage users, view learning progress, and reset student activity"
          showDate={false}
        />

        <div className="grow-toolbar flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="sleek-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
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
          <p className="text-sm text-muted-foreground">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users match your filters.</p>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="premium-card border border-border p-4 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="setup-type-module-title">
                      {user.full_name ?? user.name ?? user.email}
                    </p>
                    <p className="setup-type-module-sub flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                      <Badge variant="outline">{user.status}</Badge>
                      <Badge variant="outline">{user.enrollment_count} enrollments</Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="hidden gap-1.5 sm:inline-flex"
                      onClick={() => setActivityUser(user)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Progress
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
                          Edit
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
              </Card>
            ))}
          </div>
        )}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
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
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={editLoading} className="w-full">
              {editLoading ? "Saving…" : "Save Changes"}
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
