"use client"

import { useCallback, useEffect, useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { Users, UserPlus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function OrgMembersPage() {
  const { selectedOrgId, selectedOrg, loadingOrgs } = useOrgAdmin()
  const [members, setMembers] = useState<OrgMember[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "teacher" | "student">("teacher")
  const [submitting, setSubmitting] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const maxMembers = selectedOrg?.max_members ?? null
  const atCapacity = maxMembers != null && members.length >= maxMembers

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader icon={Users} title="Members" description="Teachers, students, and admins in your organization">
          <div className="flex flex-wrap items-center gap-2">
            <OrgSelector />
            <Button
              onClick={() => setOpen(true)}
              className="gap-2 rounded-full"
              disabled={atCapacity}
            >
              <UserPlus className="h-4 w-4" />
              Add member
            </Button>
          </div>
        </PageHeader>

        {maxMembers != null && (
          <p className="text-sm text-muted-foreground">
            {members.length} of {maxMembers} member slots used
            {atCapacity && (
              <Badge variant="outline" className="ml-2 border-amber-500/40 text-amber-700">
                At capacity
              </Badge>
            )}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading members…</p>
        ) : members.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No members yet. Add teachers or students by email.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <Card key={m.id} className="premium-card border border-border shadow-none">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{m.full_name || m.name || m.email}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{m.platform_role}</Badge>
                    <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v)}>
                      <SelectTrigger className="h-8 w-[120px]">
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
                      <Button variant="outline" size="sm" onClick={() => setRemoveId(m.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>User must already have a SphereX account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Organization role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting || atCapacity}>
              {submitting ? "Adding…" : "Add member"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>They will lose access to this organization.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}
