"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Copy, RefreshCw, Trash2, UserPlus } from "lucide-react"

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

type Panel = "identity" | "visual" | "team" | "keys"

const PANELS: {
  id: Panel
  title: string
  caption: string
  Icon: (props: { className?: string }) => React.ReactNode
}[] = [
  { id: "identity", title: "Identity", caption: "Name & profile", Icon: IconIdentity },
  { id: "visual", title: "Visual", caption: "Logo & colors", Icon: IconVisual },
  { id: "team", title: "Team", caption: "People & roles", Icon: IconTeam },
  { id: "keys", title: "Keys", caption: "Limits & codes", Icon: IconKeys },
]

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
  const [panel, setPanel] = useState<Panel>("identity")

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
  const activePanel = PANELS.find((p) => p.id === panel) ?? PANELS[0]

  const inputClass =
    "h-10 rounded-lg border-[#e2e8f0] bg-white text-sm shadow-none focus-visible:border-[#94a3b8] focus-visible:ring-1 focus-visible:ring-[#94a3b8]/30"
  const labelClass = "text-sm font-medium text-[#334155]"
  const btnPrimary =
    "h-10 rounded-lg bg-[#0f172a] px-4 text-sm font-medium text-white hover:bg-[#1e293b]"
  const btnOutline =
    "h-9 rounded-lg border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f8fafc]"

  const statusTone =
    org?.status === "active"
      ? "bg-emerald-50 text-emerald-700"
      : org?.status === "suspended"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700"

  return (
    <GrowMainLayout variant="ops">
      <div className="space-y-6">
        <Link
          href="/admin/organizations"
          className="inline-flex text-sm text-[#64748b] transition hover:text-[#0f172a]"
        >
          ← All organizations
        </Link>

        {loading ? (
          <p className="py-24 text-center text-sm text-[#94a3b8]">Loading workspace…</p>
        ) : !org ? (
          <p className="py-24 text-center text-sm text-rose-600">Organization not found.</p>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
            {/* Sidebar */}
            <aside className="space-y-3 xl:sticky xl:top-6 xl:self-start">
              <div className="overflow-hidden rounded-xl border border-[#e5e8ee] bg-white">
                <div
                  className="h-16"
                  style={{
                    background: `linear-gradient(135deg, ${branding.brand_primary}, ${branding.brand_accent})`,
                  }}
                />
                <div className="px-4 pb-4">
                  <div className="-mt-7 mb-3">
                    <OrgLogo
                      slug={org.slug}
                      logo={org.logo}
                      name={org.name}
                      brandColor={branding.brand_primary}
                      className="h-14 w-14 rounded-xl border-2 border-white"
                      {...logoAppearance}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-semibold tracking-tight text-[#0f172a]">
                      {org.name}
                    </h1>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize",
                        statusTone,
                      )}
                    >
                      {org.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-[#94a3b8]">/{org.slug}</p>

                  <div className="mt-4 space-y-1.5 border-t border-[#eef0f4] pt-3 text-sm text-[#64748b]">
                    <p>
                      <span className="text-[#94a3b8]">Members</span>
                      <span className="float-right font-medium text-[#0f172a]">
                        {memberCount}
                        {memberLimit != null ? ` / ${memberLimit}` : ""}
                      </span>
                    </p>
                    <p>
                      <span className="text-[#94a3b8]">Industry</span>
                      <span className="float-right max-w-[55%] truncate text-right font-medium text-[#0f172a]">
                        {org.industry || "—"}
                      </span>
                    </p>
                  </div>

                  {org.description ? (
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[#94a3b8]">
                      {org.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <nav className="overflow-hidden rounded-xl border border-[#e5e8ee] bg-white p-1">
                {PANELS.map((item) => {
                  const active = panel === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPanel(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                        active
                          ? "bg-[#0f172a] text-white"
                          : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]",
                      )}
                    >
                      <item.Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-none">{item.title}</span>
                        <span
                          className={cn(
                            "mt-1 block text-[11px] leading-none",
                            active ? "text-white/50" : "text-[#94a3b8]",
                          )}
                        >
                          {item.caption}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Editor */}
            <section className="min-w-0 rounded-xl border border-[#e5e8ee] bg-white">
              <header className="border-b border-[#eef0f4] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <activePanel.Icon className="h-4 w-4 text-[#64748b]" />
                  <div>
                    <h2 className="text-base font-semibold text-[#0f172a]">{activePanel.title}</h2>
                    <p className="text-sm text-[#94a3b8]">{activePanel.caption}</p>
                  </div>
                </div>
              </header>

              <div className="p-5 sm:p-6">
                {panel === "identity" && (
                  <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className={labelClass}>
                        Organization name
                      </Label>
                      <Input
                        id="name"
                        required
                        className={inputClass}
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="slug" className={labelClass}>
                          URL slug
                        </Label>
                        <Input
                          id="slug"
                          required
                          className={cn(inputClass, "font-mono")}
                          value={profile.slug}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelClass}>Status</Label>
                        <Select
                          value={profile.status}
                          onValueChange={(v) =>
                            setProfile((p) => ({ ...p, status: v as typeof profile.status }))
                          }
                        >
                          <SelectTrigger className={inputClass}>
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
                        <Label htmlFor="industry" className={labelClass}>
                          Industry
                        </Label>
                        <Input
                          id="industry"
                          className={inputClass}
                          value={profile.industry}
                          onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="website" className={labelClass}>
                          Website
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://"
                          className={inputClass}
                          value={profile.website}
                          onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description" className={labelClass}>
                        Description
                      </Label>
                      <textarea
                        id="description"
                        rows={4}
                        value={profile.description}
                        onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                        className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#94a3b8] focus:ring-1 focus:ring-[#94a3b8]/30"
                      />
                    </div>

                    <div className="flex justify-end border-t border-[#eef0f4] pt-5">
                      <Button type="submit" disabled={saving} className={btnPrimary}>
                        {saving ? "Saving…" : "Save changes"}
                      </Button>
                    </div>
                  </form>
                )}

                {panel === "visual" && (
                  <form onSubmit={handleSaveBranding} className="max-w-2xl space-y-6">
                    <OrgLogoUpload
                      organizationId={orgId}
                      slug={org.slug}
                      currentLogo={org.logo}
                      uploadPath={`/admin/organizations/${orgId}/logo`}
                      brandColor={branding.brand_primary}
                      appearance={logoAppearance}
                      onAppearanceChange={setLogoAppearance}
                      onUploaded={(logo) => setOrg((o) => (o ? { ...o, logo } : o))}
                    />

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className={labelClass}>Primary color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.brand_primary}
                            onChange={(e) =>
                              setBranding((b) => ({ ...b, brand_primary: e.target.value }))
                            }
                            className="h-10 w-10 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white p-1"
                          />
                          <Input
                            value={branding.brand_primary}
                            onChange={(e) =>
                              setBranding((b) => ({ ...b, brand_primary: e.target.value }))
                            }
                            className={cn(inputClass, "font-mono uppercase")}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className={labelClass}>Accent color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.brand_accent}
                            onChange={(e) =>
                              setBranding((b) => ({ ...b, brand_accent: e.target.value }))
                            }
                            className="h-10 w-10 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white p-1"
                          />
                          <Input
                            value={branding.brand_accent}
                            onChange={(e) =>
                              setBranding((b) => ({ ...b, brand_accent: e.target.value }))
                            }
                            className={cn(inputClass, "font-mono uppercase")}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex h-20 items-center rounded-lg px-5 text-white"
                      style={{
                        background: `linear-gradient(135deg, ${branding.brand_primary}, ${branding.brand_accent})`,
                      }}
                    >
                      <p className="text-sm font-medium">{profile.name || org.name}</p>
                    </div>

                    <div className="flex justify-end border-t border-[#eef0f4] pt-5">
                      <Button type="submit" disabled={saving} className={btnPrimary}>
                        {saving ? "Saving…" : "Save changes"}
                      </Button>
                    </div>
                  </form>
                )}

                {panel === "team" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-[#64748b]">
                        {memberCount} member{memberCount === 1 ? "" : "s"}
                        {atMemberLimit ? " · limit reached" : ""}
                      </p>
                      <Button
                        onClick={() => setAddOpen(true)}
                        disabled={atMemberLimit}
                        className={cn(btnPrimary, "gap-2")}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add member
                      </Button>
                    </div>

                    {members.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[#dce0e6] py-14 text-center">
                        <p className="text-sm font-medium text-[#0f172a]">No members yet</p>
                        <p className="mt-1 text-sm text-[#94a3b8]">
                          Add someone with an existing SphereX account.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#eef0f4] rounded-lg border border-[#e5e8ee]">
                        {members.map((m) => {
                          const display = m.full_name || m.name || m.email
                          return (
                            <li
                              key={m.id}
                              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-sm font-medium text-[#334155]">
                                  {display.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-[#0f172a]">
                                    {display}
                                  </p>
                                  <p className="truncate text-xs text-[#94a3b8]">{m.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="hidden text-xs capitalize text-[#94a3b8] sm:inline">
                                  {m.platform_role}
                                </span>
                                <Select
                                  value={m.role}
                                  onValueChange={(v) => handleRoleChange(m.id, v)}
                                >
                                  <SelectTrigger className="h-8 w-[110px] rounded-lg border-[#e2e8f0] text-xs shadow-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                  </SelectContent>
                                </Select>
                                {m.role !== "owner" ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#94a3b8] hover:bg-rose-50 hover:text-rose-600"
                                    onClick={() => setRemoveId(m.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {panel === "keys" && (
                  <div className="max-w-2xl space-y-8">
                    <form onSubmit={handleSaveAccess} className="space-y-4">
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-[#e5e8ee] px-4 py-3.5">
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">Unlimited members</p>
                          <p className="text-sm text-[#94a3b8]">
                            Turn off to set a maximum member count.
                          </p>
                        </div>
                        <Switch
                          checked={unlimitedMembers}
                          onCheckedChange={setUnlimitedMembers}
                        />
                      </div>
                      {!unlimitedMembers ? (
                        <div className="space-y-1.5">
                          <Label htmlFor="max-members" className={labelClass}>
                            Maximum members
                          </Label>
                          <Input
                            id="max-members"
                            type="number"
                            min={1}
                            required={!unlimitedMembers}
                            className={cn(inputClass, "max-w-[200px]")}
                            value={maxMembers}
                            onChange={(e) => setMaxMembers(e.target.value)}
                          />
                          <p className="text-xs text-[#94a3b8]">
                            Currently {memberCount} member{memberCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      ) : null}
                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving} className={btnPrimary}>
                          {saving ? "Saving…" : "Save changes"}
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-[#0f172a]">Join codes</h3>
                      <CodeRow
                        label="Teacher"
                        code={org.teacher_join_code}
                        onCopy={() => copyCode(org.teacher_join_code)}
                        onRefresh={regenerateCode}
                        btnOutline={btnOutline}
                      />
                      <CodeRow
                        label="Student"
                        code={org.student_join_code ?? null}
                        onCopy={() => org.student_join_code && copyCode(org.student_join_code)}
                        onRefresh={regenerateStudentCode}
                        btnOutline={btnOutline}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>User must already have a SphereX account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="member-email" className={labelClass}>
                Email
              </Label>
              <Input
                id="member-email"
                type="email"
                required
                className={inputClass}
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Role</Label>
              <Select value={addRole} onValueChange={(v) => setAddRole(v as typeof addRole)}>
                <SelectTrigger className={inputClass}>
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
            <Button type="submit" className={cn(btnPrimary, "w-full")} disabled={addSubmitting}>
              {addSubmitting ? "Adding…" : "Add member"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeId} onOpenChange={() => setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GrowMainLayout>
  )
}

function CodeRow({
  label,
  code,
  onCopy,
  onRefresh,
  btnOutline,
}: {
  label: string
  code: string | null
  onCopy: () => void
  onRefresh: () => void
  btnOutline: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e8ee] px-4 py-3">
      <div>
        <p className="text-xs text-[#94a3b8]">{label}</p>
        <p className="mt-0.5 font-mono text-sm font-semibold tracking-wide text-[#0f172a]">
          {code ?? "—"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn(btnOutline, "gap-1.5 px-3")}
          onClick={onCopy}
          disabled={!code}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(btnOutline, "gap-1.5 px-3")}
          onClick={onRefresh}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>
    </div>
  )
}

function IconIdentity({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M14 9.5h5M14 12.5h4M6.5 16.5c.8-1.4 2-2.1 3.5-2.1s2.7.7 3.5 2.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconVisual({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
      <path
        d="M12 3.8v2.4M12 17.8v2.4M3.8 12h2.4M17.8 12h2.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconTeam({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="9" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 17.5c1-2.2 2.7-3.3 4.5-3.3s3.5 1.1 4.5 3.3M13.2 17.5c.6-1.3 1.6-2 2.9-2 1.1 0 2 .5 2.7 1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconKeys({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="9" cy="10" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12.8 12.8 20 20M16.2 16.2l2.2-2.2M18.2 18.2l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
