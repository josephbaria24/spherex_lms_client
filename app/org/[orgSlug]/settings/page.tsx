"use client"

import { useCallback, useEffect, useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrgSelector } from "@/components/org/org-selector"
import { useOrgAdmin } from "@/components/org/org-provider"
import { apiGet, apiPatch, apiPost } from "@/lib/api"
import { OrgLogoUpload } from "@/components/org/org-logo-upload"
import { type OrgLogoAppearance } from "@/components/org/org-logo"
import { Settings, Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

type OrgSettings = {
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
  brand_primary?: string | null
  brand_accent?: string | null
  logo_padding?: number | null
  logo_position_x?: number | null
  logo_position_y?: number | null
  max_members?: number | null
}

export default function OrgSettingsPage() {
  const { selectedOrgId, loadingOrgs, refreshOrgs } = useOrgAdmin()
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
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
  const [logo, setLogo] = useState<string | null>(null)
  const [teacherCode, setTeacherCode] = useState("")
  const [studentCode, setStudentCode] = useState("")
  const [maxMembers, setMaxMembers] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regeneratingStudent, setRegeneratingStudent] = useState(false)

  const load = useCallback(async () => {
    if (!selectedOrgId) return
    setLoading(true)
    try {
      const data = await apiGet<{ organization: OrgSettings }>(
        `/org-admin/${selectedOrgId}/settings`,
      )
      const org = data.organization
      setForm({
        name: org.name ?? "",
        description: org.description ?? "",
        website: org.website ?? "",
        industry: org.industry ?? "",
      })
      setBranding({
        brand_primary: org.brand_primary || "#0d9488",
        brand_accent: org.brand_accent || "#14b8a6",
      })
      setLogoAppearance({
        logo_padding: org.logo_padding ?? 0,
        logo_position_x: org.logo_position_x ?? 50,
        logo_position_y: org.logo_position_y ?? 50,
      })
      setLogo(org.logo)
      setTeacherCode(org.teacher_join_code)
      setStudentCode(org.student_join_code ?? "")
      setMaxMembers(org.max_members ?? null)
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId])

  useEffect(() => {
    if (!loadingOrgs) load()
  }, [load, loadingOrgs])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrgId) return
    setSaving(true)
    try {
      await apiPatch(`/org-admin/${selectedOrgId}/settings`, {
        name: form.name,
        description: form.description || undefined,
        website: form.website || "",
        industry: form.industry || undefined,
        ...logoAppearance,
      })
      toast.success("Profile saved")
      await load()
      await refreshOrgs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrgId) return
    setSavingBranding(true)
    try {
      await apiPatch(`/org-admin/${selectedOrgId}/settings`, {
        brand_primary: branding.brand_primary,
        brand_accent: branding.brand_accent,
        ...logoAppearance,
      })
      toast.success("Branding saved")
      await load()
      await refreshOrgs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save branding")
    } finally {
      setSavingBranding(false)
    }
  }

  async function handleRegenerateCode() {
    if (!selectedOrgId) return
    setRegenerating(true)
    try {
      const data = await apiPost<{ teacher_join_code: string }>(
        `/org-admin/${selectedOrgId}/regenerate-teacher-code`,
      )
      setTeacherCode(data.teacher_join_code)
      toast.success("Teacher join code refreshed", {
        description: data.teacher_join_code,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not refresh code")
    } finally {
      setRegenerating(false)
    }
  }

  async function handleRegenerateStudentCode() {
    if (!selectedOrgId) return
    setRegeneratingStudent(true)
    try {
      const data = await apiPost<{ student_join_code: string }>(
        `/org-admin/${selectedOrgId}/regenerate-student-code`,
      )
      setStudentCode(data.student_join_code)
      toast.success("Student join code refreshed", {
        description: data.student_join_code,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not refresh code")
    } finally {
      setRegeneratingStudent(false)
    }
  }

  async function copyStudentCode() {
    try {
      await navigator.clipboard.writeText(studentCode)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Could not copy code")
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(teacherCode)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Could not copy code")
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader icon={Settings} title="Organization Settings" description="Profile, branding, and teacher access">
          <OrgSelector />
        </PageHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="access">Teacher access</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="premium-card border border-border shadow-none">
                <CardContent className="p-6">
                  <form onSubmit={handleSaveProfile} className="space-y-4">
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
                      <Label htmlFor="org-industry">Industry</Label>
                      <Input
                        id="org-industry"
                        value={form.industry}
                        onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-desc">Description</Label>
                      <textarea
                        id="org-desc"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-website">Website</Label>
                      <Input
                        id="org-website"
                        type="url"
                        value={form.website}
                        onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      />
                    </div>
                    {selectedOrgId && (
                      <OrgLogoUpload
                        organizationId={selectedOrgId}
                        currentLogo={logo}
                        uploadPath={`/org-admin/${selectedOrgId}/logo`}
                        brandColor={branding.brand_primary}
                        appearance={logoAppearance}
                        onAppearanceChange={setLogoAppearance}
                        onUploaded={(next) => {
                          setLogo(next)
                          refreshOrgs()
                        }}
                        compact
                      />
                    )}
                    {maxMembers != null && (
                      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
                        <p className="font-medium">Member limit</p>
                        <p className="mt-1 text-muted-foreground">
                          Your organization can have up to {maxMembers} members. Contact SphereX support to
                          request an increase.
                        </p>
                      </div>
                    )}
                    <Button type="submit" disabled={saving} className="rounded-full">
                      {saving ? "Saving…" : "Save changes"}
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
                      Brand colors appear on your organization dashboard and teacher workspace.
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
                      className="h-12 rounded-xl"
                      style={{
                        background: `linear-gradient(90deg, ${branding.brand_primary}, ${branding.brand_accent})`,
                      }}
                    />
                    <Button type="submit" disabled={savingBranding} className="rounded-full">
                      {savingBranding ? "Saving…" : "Save branding"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="access">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="premium-card border border-border shadow-none">
                  <CardContent className="p-6">
                    <h3 className="font-semibold">Teacher join code</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Teachers enter this code to join your organization.
                    </p>
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <code className="flex-1 font-mono text-lg font-bold tracking-wider">{teacherCode}</code>
                      <Button type="button" variant="outline" size="sm" onClick={copyCode}>
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 gap-2 rounded-full"
                      onClick={handleRegenerateCode}
                      disabled={regenerating}
                    >
                      <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
                      Regenerate teacher code
                    </Button>
                  </CardContent>
                </Card>

                <Card className="premium-card border border-border shadow-none">
                  <CardContent className="p-6">
                    <h3 className="font-semibold">Student join code</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Students use this code to join and access your organization&apos;s courses.
                    </p>
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <code className="flex-1 font-mono text-lg font-bold tracking-wider">{studentCode || "—"}</code>
                      <Button type="button" variant="outline" size="sm" onClick={copyStudentCode} disabled={!studentCode}>
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 gap-2 rounded-full"
                      onClick={handleRegenerateStudentCode}
                      disabled={regeneratingStudent}
                    >
                      <RefreshCw className={`h-4 w-4 ${regeneratingStudent ? "animate-spin" : ""}`} />
                      Regenerate student code
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  )
}
