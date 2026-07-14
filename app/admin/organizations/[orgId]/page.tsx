"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import { OrgLogoUpload } from "@/components/org/org-logo-upload"
import { OrgLogo, type OrgLogoAppearance } from "@/components/org/org-logo"
import { toast } from "sonner"
import {
  ArrowLeft,
  Building2,
  Copy,
  Palette,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"

type OrgDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  website: string | null
  industry: string | null
  status: string
  teacher_join_code: string
  student_join_code?: string | null
  max_members: number | null
  brand_primary: string | null
  brand_accent: string | null
  logo_padding?: number | null
  logo_position_x?: number | null
  logo_position_y?: number | null
}

type OrgMember = {
  id: string
  role: string
  joined_at: string
  user_id: string
  email: string
  full_name: string | null
  name: string | null
  platform_role: string
  status: string
}

export default function AdminOrganizationSetupPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = use(params)

  const [org, setOrg] = useState<OrgDetail | null>(null)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    name: "",
    slug: "",
    description: "",
    industry: "",
    website: "",
    status: "pending" as "pending" | "active" | "suspended",
  })
  const [branding, setBranding] = useState({
    brand_primary: "#0d9488",
    brand_accent: "#14b8a6",
  })
  const [logoAppearance, setLogoAppearance] = useState<Required<OrgLogoAppearance>>({
    logo_padding: 0,
    logo_position_x: 50,
    logo_position_y: 50,
  })
  const [maxMembers, setMaxMembers] = useState("")
  const [unlimitedMembers, setUnlimitedMembers] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [addEmail, setAddEmail] = useState("")
  const [addRole, setAddRole] = useState<"owner" | "admin" | "teacher" | "student">("teacher")
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const data = await apiGet<{
        organization: OrgDetail
        members: OrgMember[]
        member_count: number
      }>(`/admin/organizations/${orgId}`)
      const o = data.organization
      setOrg(o)
      setMembers(data.members ?? [])
      setMemberCount(data.member_count ?? 0)
      setProfile({
        name: o.name ?? "",
        slug: o.slug ?? "",
        description: o.description ?? "",
        industry: o.industry ?? "",
        website: o.website ?? "",
        status: (o.status as typeof profile.status) ?? "pending",
      })
      setBranding({
        brand_primary: o.brand_primary ?? "#0d9488",
        brand_accent: o.brand_accent ?? "#14b8a6",
      })
      setLogoAppearance({
        logo_padding: o.logo_padding ?? 0,
        logo_position_x: o.logo_position_x ?? 50,
        logo_position_y: o.logo_position_y ?? 50,
      })
      setUnlimitedMembers(o.max_members == null)
      setMaxMembers(o.max_members != null ? String(o.max_members) : "")
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    load()
  }, [load])

  async function saveOrganization(fields: Record<string, unknown>) {
    if (!orgId) return
    setSaving(true)
    try {
      const data = await apiPatch<{ organization: OrgDetail }>(`/admin/organizations/${orgId}`, fields)
      setOrg(data.organization)
      toast.success("Organization saved")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    await saveOrganization({
      name: profile.name,
      slug: profile.slug,
      description: profile.description || null,
      industry: profile.industry || null,
      website: profile.website || "",
      status: profile.status,
      ...logoAppearance,
    })
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault()
    await saveOrganization({
      brand_primary: branding.brand_primary || "",
      brand_accent: branding.brand_accent || "",
      ...logoAppearance,
    })
  }

  async function handleSaveAccess(e: React.FormEvent) {
    e.preventDefault()
    await saveOrganization({
      max_members: unlimitedMembers ? null : Number(maxMembers) || null,
    })
  }

  async function regenerateCode() {
    if (!orgId) return
    try {
      const data = await apiPost<{ teacher_join_code: string }>(
        `/admin/organizations/${orgId}/regenerate-teacher-code`,
      )
      toast.success("Teacher join code refreshed", { description: data.teacher_join_code })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not refresh code")
    }
  }

  async function regenerateStudentCode() {
    if (!orgId) return
    try {
      const data = await apiPost<{ student_join_code: string }>(
        `/admin/organizations/${orgId}/regenerate-student-code`,
      )
      toast.success("Student join code refreshed", { description: data.student_join_code })
      await load()
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

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setAddSubmitting(true)
    try {
      await apiPost(`/admin/organizations/${orgId}/members`, { email: addEmail, role: addRole })
      toast.success("Member added")
      setAddOpen(false)
      setAddEmail("")
      setAddRole("teacher")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add member")
    } finally {
      setAddSubmitting(false)
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    if (!orgId) return
    try {
      await apiPatch(`/admin/organizations/${orgId}/members/${memberId}`, { role })
      toast.success("Member role updated")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update role")
    }
  }

  async function handleRemoveMember() {
    if (!orgId || !removeId) return
    try {
      await apiDelete(`/admin/organizations/${orgId}/members/${removeId}`)
      toast.success("Member removed")
      setRemoveId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove member")
    }
  }

  const memberLimit = org?.max_members
  const atMemberLimit = memberLimit != null && memberCount >= memberLimit

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Settings}
          title={org?.name ?? "Organization setup"}
          accent="build community"
          description="Configure profile, branding, members, and access controls"
        >
          <Button variant="outline" asChild className="gap-2 rounded-full">
            <Link href="/admin/organizations">
              <ArrowLeft className="h-4 w-4" />
              All organizations
            </Link>
          </Button>
        </PageHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading organization…</p>
        ) : !org ? (
          <p className="text-sm text-destructive">Organization not found.</p>
        ) : (
          <>
            <Card className="premium-card overflow-hidden border border-border shadow-none">
              <div
                className="h-2 w-full"
                style={{
                  background: `linear-gradient(90deg, ${branding.brand_primary}, ${branding.brand_accent})`,
                }}
              />
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <OrgLogo
                  logo={org.logo}
                  name={org.name}
                  brandColor={branding.brand_primary}
                  className="h-14 w-14 rounded-xl"
                  {...logoAppearance}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{org.name}</h2>
                    <Badge variant={org.status === "active" ? "default" : "secondary"}>{org.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">/{org.slug}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {memberCount}
                    {memberLimit != null ? ` / ${memberLimit}` : ""} members · {org.teacher_join_code}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="flex h-auto flex-wrap gap-1">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="premium-card border border-border shadow-none">
                  <CardContent className="p-6">
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Organization name</Label>
                          <Input
                            id="name"
                            required
                            value={profile.name}
                            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slug">URL slug</Label>
                          <Input
                            id="slug"
                            required
                            value={profile.slug}
                            onChange={(e) =>
                              setProfile((p) => ({
                                ...p,
                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={profile.status}
                            onValueChange={(v) =>
                              setProfile((p) => ({ ...p, status: v as typeof profile.status }))
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
                          <Label htmlFor="industry">Industry</Label>
                          <Input
                            id="industry"
                            value={profile.industry}
                            onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://"
                          value={profile.website}
                          onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                        />
                      </div>
                      <OrgLogoUpload
                        organizationId={orgId}
                        currentLogo={org.logo}
                        uploadPath={`/admin/organizations/${orgId}/logo`}
                        brandColor={branding.brand_primary}
                        appearance={logoAppearance}
                        onAppearanceChange={setLogoAppearance}
                        onUploaded={(logo) => setOrg((o) => (o ? { ...o, logo } : o))}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                          id="description"
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={profile.description}
                          onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                        />
                      </div>
                      <Button type="submit" disabled={saving} className="rounded-full">
                        {saving ? "Saving…" : "Save profile"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branding">
                <Card className="premium-card border border-border shadow-none">
                  <CardContent className="space-y-6 p-6">
                    <form onSubmit={handleSaveBranding} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Brand colors appear on organization cards, teacher portals, and public org pages.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="brand-primary">Primary color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="brand-primary"
                              type="color"
                              className="h-10 w-14 cursor-pointer p-1"
                              value={branding.brand_primary}
                              onChange={(e) =>
                                setBranding((b) => ({ ...b, brand_primary: e.target.value }))
                              }
                            />
                            <Input
                              value={branding.brand_primary}
                              onChange={(e) =>
                                setBranding((b) => ({ ...b, brand_primary: e.target.value }))
                              }
                              className="font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brand-accent">Accent color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="brand-accent"
                              type="color"
                              className="h-10 w-14 cursor-pointer p-1"
                              value={branding.brand_accent}
                              onChange={(e) =>
                                setBranding((b) => ({ ...b, brand_accent: e.target.value }))
                              }
                            />
                            <Input
                              value={branding.brand_accent}
                              onChange={(e) =>
                                setBranding((b) => ({ ...b, brand_accent: e.target.value }))
                              }
                              className="font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        className="rounded-xl border border-border p-6 text-white"
                        style={{
                          background: `linear-gradient(135deg, ${branding.brand_primary}, ${branding.brand_accent})`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Palette className="h-8 w-8 opacity-90" />
                          <div>
                            <p className="font-semibold">{profile.name || org.name}</p>
                            <p className="text-sm opacity-90">Branding preview</p>
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={saving} className="rounded-full">
                        {saving ? "Saving…" : "Save branding"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members">
                <Card className="premium-card border border-border shadow-none">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold">
                          <Users className="h-4 w-4" />
                          Members
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Control organization roles and platform access.
                          {atMemberLimit && (
                            <span className="ml-1 text-amber-600">Member limit reached.</span>
                          )}
                        </p>
                      </div>
                      <Button
                        onClick={() => setAddOpen(true)}
                        className="gap-2 rounded-full"
                        disabled={atMemberLimit}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add member
                      </Button>
                    </div>

                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
                          >
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
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="access">
                <Card className="premium-card border border-border shadow-none">
                  <CardContent className="space-y-6 p-6">
                    <form onSubmit={handleSaveAccess} className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                        <div>
                          <p className="font-medium">Unlimited members</p>
                          <p className="text-sm text-muted-foreground">
                            Turn off to set a maximum member count.
                          </p>
                        </div>
                        <Switch
                          checked={unlimitedMembers}
                          onCheckedChange={setUnlimitedMembers}
                        />
                      </div>
                      {!unlimitedMembers && (
                        <div className="space-y-2">
                          <Label htmlFor="max-members">Maximum members</Label>
                          <Input
                            id="max-members"
                            type="number"
                            min={1}
                            required={!unlimitedMembers}
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Current: {memberCount} member{memberCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      )}
                      <Button type="submit" disabled={saving} className="gap-2 rounded-full">
                        <Shield className="h-4 w-4" />
                        {saving ? "Saving…" : "Save access limits"}
                      </Button>
                    </form>

                    <div className="border-t border-border/60 pt-6">
                      <h3 className="font-semibold">Teacher join code</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Instructors use this code to join the organization.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <code className="rounded-lg bg-muted px-4 py-2 font-mono text-sm font-bold">
                          {org.teacher_join_code}
                        </code>
                        <Button type="button" variant="outline" size="sm" onClick={() => copyCode(org.teacher_join_code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={regenerateCode}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-border/60 pt-6">
                      <h3 className="font-semibold">Student join code</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Learners use this code to join and enroll in organization courses.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <code className="rounded-lg bg-muted px-4 py-2 font-mono text-sm font-bold">
                          {org.student_join_code ?? "—"}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => org.student_join_code && copyCode(org.student_join_code)}
                          disabled={!org.student_join_code}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={regenerateStudentCode}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>User must already have a SphereX account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Organization role</Label>
              <Select value={addRole} onValueChange={(v) => setAddRole(v as typeof addRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={addSubmitting}>
              {addSubmitting ? "Adding…" : "Add member"}
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
            <AlertDialogAction onClick={handleRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GrowMainLayout>
  )
}
