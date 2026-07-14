"use client"

import { useCallback, useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { OrgLogo } from "@/components/org/org-logo"
import { Building2, Plus, Search, Copy, RefreshCw, Settings2 } from "lucide-react"
import Link from "next/link"

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
}

type UserOption = { id: string; email: string; full_name: string | null; name: string | null }

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

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
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

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()),
  )

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
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(org: Organization) {
    const next = org.status === "active" ? "suspended" : "active"
    await apiPatch(`/admin/organizations/${org.id}`, { status: next })
    await load()
  }

  async function regenerateCode(orgId: string) {
    try {
      const data = await apiPost<{ teacher_join_code: string }>(
        `/admin/organizations/${orgId}/regenerate-teacher-code`,
      )
      await load()
      toast.success("Teacher join code refreshed", {
        description: data.teacher_join_code,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not refresh code")
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

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Building2}
          title="Organizations"
          accent="grow together"
          description="Create partner organizations and assign organization admins"
        >
          <Button onClick={() => setOpen(true)} className="gap-2 rounded-full">
            <Plus className="h-4 w-4" />
            Create organization
          </Button>
        </PageHeader>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations…"
            className="sleek-input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No organizations yet. Create your first partner organization.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((org) => (
              <Card key={org.id} className="premium-card border border-border shadow-none overflow-hidden">
                {org.brand_primary && (
                  <div className="h-1 w-full" style={{ backgroundColor: org.brand_primary }} />
                )}
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
                  <div className="flex min-w-0 gap-3">
                    <OrgLogo
                      logo={org.logo}
                      name={org.name}
                      brandColor={org.brand_primary}
                      className="h-12 w-12 rounded-lg"
                      logo_padding={org.logo_padding}
                      logo_position_x={org.logo_position_x}
                      logo_position_y={org.logo_position_y}
                    />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{org.name}</h3>
                      <Badge variant={org.status === "active" ? "default" : "secondary"}>
                        {org.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">/{org.slug}</p>
                    {org.industry && (
                      <p className="mt-1 text-sm text-muted-foreground">{org.industry}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        {org.member_count}
                        {org.max_members != null ? ` / ${org.max_members}` : ""} members
                      </span>
                      <span>{org.course_count} courses</span>
                      {org.owner_email && <span>Owner: {org.owner_email}</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                        {org.teacher_join_code}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(org.teacher_join_code)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => regenerateCode(org.id)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button variant="outline" size="sm" className="gap-2 rounded-full" asChild>
                      <Link href={`/admin/organizations/${org.id}`}>
                        <Settings2 className="h-3.5 w-3.5" />
                        Setup
                      </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                    <Label htmlFor={`status-${org.id}`} className="text-xs text-muted-foreground">
                      Active
                    </Label>
                    <Switch
                      id={`status-${org.id}`}
                      checked={org.status === "active"}
                      onCheckedChange={() => toggleStatus(org)}
                    />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              Add a partner org and optionally assign the first organization admin (owner).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input
                id="org-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug (optional)</Label>
              <Input
                id="org-slug"
                placeholder="auto-generated from name"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as typeof form.status }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-industry">Industry</Label>
                <Input
                  id="org-industry"
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-desc">Description</Label>
              <textarea
                id="org-desc"
                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-admin">Assign organization admin</Label>
                <Switch
                  id="add-admin"
                  checked={form.addOrgAdmin}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, addOrgAdmin: v }))}
                />
              </div>
              {form.addOrgAdmin && (
                <div className="mt-4 space-y-3">
                  <Select
                    value={form.adminMode}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, adminMode: v as typeof form.adminMode }))
                    }
                  >
                    <SelectTrigger>
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
                        placeholder="Admin full name"
                        value={form.adminName}
                        onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                      />
                      <Input
                        type="email"
                        placeholder="Admin email"
                        required={form.addOrgAdmin}
                        value={form.adminEmail}
                        onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                      />
                      <Input
                        type="password"
                        placeholder="Password (min 8 chars)"
                        required={form.addOrgAdmin}
                        value={form.adminPassword}
                        onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                      />
                    </>
                  ) : (
                    <Select
                      value={form.existingUserId}
                      onValueChange={(v) => setForm((f) => ({ ...f, existingUserId: v }))}
                    >
                      <SelectTrigger>
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

            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? "Creating…" : "Create organization"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!createdCode} onOpenChange={() => setCreatedCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Organization created</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">{createdName}</strong> is ready. Share this
                  teacher join code with instructors:
                </p>
                <code className="block rounded-lg bg-muted px-4 py-3 text-center font-mono text-lg font-bold text-emerald-700">
                  {createdCode}
                </code>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => {
                if (createdCode) copyCode(createdCode)
              }}
              variant="outline"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy code
            </Button>
            <Button onClick={() => setCreatedCode(null)}>Done</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GrowMainLayout>
  )
}
