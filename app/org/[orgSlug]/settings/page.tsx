"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { OrgSelector } from "@/components/org/org-selector"
import { OrgLogo } from "@/components/org/org-logo"
import { useOrgAdmin } from "@/components/org/org-provider"
import { apiGet, apiPatch, apiPost, apiUploadFile } from "@/lib/api"
import { type OrgLogoAppearance } from "@/components/org/org-logo"
import { cn } from "@/lib/utils"
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

type Section = "profile" | "visual" | "codes"

const SECTIONS: { id: Section; label: string }[] = [
  { id: "profile", label: "Public profile" },
  { id: "visual", label: "Visual identity" },
  { id: "codes", label: "Join codes" },
]

const fieldInput =
  "h-11 w-full rounded-md border-neutral-200 bg-neutral-50/80 px-3.5 text-[15px] text-neutral-900 shadow-none transition focus-visible:border-neutral-400 focus-visible:bg-white focus-visible:ring-0"
const pageX = "w-full px-4 md:px-5 lg:px-8 xl:px-10"

export default function OrgSettingsPage() {
  const { selectedOrgId, selectedOrgSlug, loadingOrgs, refreshOrgs } = useOrgAdmin()
  const [section, setSection] = useState<Section>("profile")
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    industry: "",
  })
  const [orgMeta, setOrgMeta] = useState({ slug: "", status: "" })
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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regeneratingStudent, setRegeneratingStudent] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const slug = selectedOrgSlug ?? orgMeta.slug

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
      setOrgMeta({ slug: org.slug, status: org.status })
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
      toast.success("Profile updated")
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
      toast.success("Visual identity updated")
      await load()
      await refreshOrgs()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save branding")
    } finally {
      setSavingBranding(false)
    }
  }

  async function handleLogoFile(file: File) {
    if (!selectedOrgId) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be 2 MB or smaller")
      return
    }
    setUploadingLogo(true)
    try {
      const data = await apiUploadFile<{ logo: string }>(
        `/org-admin/${selectedOrgId}/logo`,
        "logo",
        file,
      )
      setLogo(data.logo)
      await refreshOrgs()
      toast.success("Logo updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleRegenerateCode(kind: "teacher" | "student") {
    if (!selectedOrgId) return
    if (kind === "teacher") setRegenerating(true)
    else setRegeneratingStudent(true)
    try {
      const path =
        kind === "teacher"
          ? `/org-admin/${selectedOrgId}/regenerate-teacher-code`
          : `/org-admin/${selectedOrgId}/regenerate-student-code`
      const data = await apiPost<{ teacher_join_code?: string; student_join_code?: string }>(path)
      if (kind === "teacher" && data.teacher_join_code) setTeacherCode(data.teacher_join_code)
      if (kind === "student" && data.student_join_code) setStudentCode(data.student_join_code)
      toast.success(`${kind === "teacher" ? "Teacher" : "Student"} code regenerated`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not regenerate code")
    } finally {
      setRegenerating(false)
      setRegeneratingStudent(false)
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied")
    } catch {
      toast.error("Could not copy")
    }
  }

  const statusLabel =
    orgMeta.status === "active"
      ? "Live"
      : orgMeta.status === "suspended"
        ? "Suspended"
        : "Pending"

  return (
    <MainLayout>
      <div className="-m-4 min-h-full bg-white font-[family-name:var(--font-outfit)] md:-m-6">
        {loading ? (
          <div className={cn(pageX, "space-y-4 py-16")}>
            <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
            <div className="h-12 animate-pulse rounded-lg bg-neutral-100" />
            <div className="h-64 animate-pulse rounded-lg bg-neutral-100" />
          </div>
        ) : (
          <>
            <header className={cn("border-b border-neutral-200 bg-white py-8 md:py-10", pageX)}>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="flex min-w-0 flex-wrap items-end gap-5">
                  <OrgLogo
                    slug={slug}
                    logo={logo}
                    name={form.name}
                    brandColor={branding.brand_primary}
                    className="h-[4.5rem] w-[4.5rem] rounded-2xl border border-neutral-200 bg-white"
                    {...logoAppearance}
                  />
                  <div className="min-w-0 pb-0.5">
                    <p className="text-[13px] font-medium text-neutral-500">
                      Organization settings
                    </p>
                    <h1 className="mt-1 truncate text-[2rem] font-semibold leading-tight tracking-tight text-neutral-900 md:text-[2.35rem]">
                      {form.name || "Your organization"}
                    </h1>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-neutral-500">
                      <span className="font-mono text-neutral-600">/{slug}</span>
                      <span>·</span>
                      <span>{statusLabel}</span>
                      {form.industry ? (
                        <>
                          <span>·</span>
                          <span>{form.industry}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <OrgSelector />
              </div>
            </header>

            <div className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
              <div className={cn("flex gap-1 overflow-x-auto md:gap-2", pageX)}>
                {SECTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={cn(
                      "shrink-0 border-b-2 px-1 py-4 text-[15px] transition md:px-2",
                      section === item.id
                        ? "border-neutral-900 font-semibold text-neutral-900"
                        : "border-transparent font-medium text-neutral-500 hover:text-neutral-800",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn(pageX, "py-10 md:py-12")}>
              {section === "profile" && (
                <form onSubmit={handleSaveProfile}>
                  <SectionIntro
                    title="How your organization appears publicly"
                    body="This information is shown on your organization profile and helps members understand who you are before they join."
                  />

                  <div className="mt-8 divide-y divide-neutral-100">
                    <FieldRow label="Organization name" hint="Displayed across the workspace and member apps.">
                      <Input
                        required
                        className={fieldInput}
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </FieldRow>
                    <FieldRow label="Industry" hint="Helps categorize your programs on the platform.">
                      <Input
                        className={fieldInput}
                        value={form.industry}
                        onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                        placeholder="HSE & Safety Training"
                      />
                    </FieldRow>
                    <FieldRow label="Website" hint="Optional link to your company site.">
                      <Input
                        type="url"
                        className={fieldInput}
                        value={form.website}
                        onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                        placeholder="https://"
                      />
                    </FieldRow>
                    <FieldRow
                      label="About"
                      hint="A short paragraph describing your training programs and audience."
                    >
                      <textarea
                        className={cn(fieldInput, "min-h-[120px] resize-y py-3 leading-relaxed")}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </FieldRow>

                    <FieldRow
                      label="Logo"
                      hint="JPEG, PNG, WebP, GIF, or SVG up to 2 MB. Adjust framing below."
                    >
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-4">
                          <OrgLogo
                            slug={slug}
                            logo={logo}
                            name={form.name}
                            brandColor={branding.brand_primary}
                            className="h-20 w-20 rounded-xl border border-neutral-200 bg-white"
                            {...logoAppearance}
                          />
                          <div className="space-y-2">
                            <input
                              ref={fileRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) void handleLogoFile(file)
                                e.target.value = ""
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => fileRef.current?.click()}
                              disabled={uploadingLogo}
                              className="text-[14px] font-semibold text-neutral-900 underline-offset-4 hover:underline disabled:opacity-50"
                            >
                              {uploadingLogo ? "Uploading…" : logo ? "Replace image" : "Upload image"}
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-3">
                          <AppearanceSlider
                            label="Inset"
                            value={logoAppearance.logo_padding}
                            max={24}
                            suffix="px"
                            onChange={(v) =>
                              setLogoAppearance((a) => ({ ...a, logo_padding: v }))
                            }
                          />
                          <AppearanceSlider
                            label="Horizontal"
                            value={logoAppearance.logo_position_x}
                            max={100}
                            suffix="%"
                            onChange={(v) =>
                              setLogoAppearance((a) => ({ ...a, logo_position_x: v }))
                            }
                          />
                          <AppearanceSlider
                            label="Vertical"
                            value={logoAppearance.logo_position_y}
                            max={100}
                            suffix="%"
                            onChange={(v) =>
                              setLogoAppearance((a) => ({ ...a, logo_position_y: v }))
                            }
                          />
                        </div>
                      </div>
                    </FieldRow>

                    {maxMembers != null && (
                      <FieldRow
                        label="Member capacity"
                        hint="Contact SphereX support if you need to increase your limit."
                      >
                        <p className="text-[15px] text-neutral-700">
                          Up to <span className="font-semibold text-neutral-900">{maxMembers}</span>{" "}
                          members on your current plan.
                        </p>
                      </FieldRow>
                    )}
                  </div>

                  <div className="mt-10 flex justify-end">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="h-11 rounded-full bg-neutral-900 px-8 text-[15px] font-semibold hover:bg-neutral-800"
                    >
                      {saving ? "Saving…" : "Save profile"}
                    </Button>
                  </div>
                </form>
              )}

              {section === "visual" && (
                <form onSubmit={handleSaveBranding}>
                  <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div>
                      <SectionIntro
                        title="Colors & presentation"
                        body="Primary and accent colors shape headers, buttons, and branded surfaces across your workspace."
                      />

                      <div className="mt-8 divide-y divide-neutral-100">
                        <FieldRow label="Primary" hint="Main brand color for headers and emphasis.">
                          <ColorControl
                            value={branding.brand_primary}
                            onChange={(v) => setBranding((b) => ({ ...b, brand_primary: v }))}
                          />
                        </FieldRow>
                        <FieldRow label="Accent" hint="Secondary tone for gradients and highlights.">
                          <ColorControl
                            value={branding.brand_accent}
                            onChange={(v) => setBranding((b) => ({ ...b, brand_accent: v }))}
                          />
                        </FieldRow>
                      </div>

                      <div className="mt-10 flex justify-end">
                        <Button
                          type="submit"
                          disabled={savingBranding}
                          className="h-11 rounded-full bg-neutral-900 px-8 text-[15px] font-semibold hover:bg-neutral-800"
                        >
                          {savingBranding ? "Saving…" : "Save visual identity"}
                        </Button>
                      </div>
                    </div>

                    <aside className="lg:pt-14">
                      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
                        Preview
                      </p>
                      <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
                        <div
                          className="h-24"
                          style={{
                            background: `linear-gradient(135deg, ${branding.brand_primary}, ${branding.brand_accent})`,
                          }}
                        />
                        <div className="relative bg-white px-5 pb-5 pt-0">
                          <OrgLogo
                            slug={slug}
                            logo={logo}
                            name={form.name}
                            brandColor={branding.brand_primary}
                            className="absolute -top-8 h-16 w-16 rounded-xl border-4 border-white shadow-md"
                            {...logoAppearance}
                          />
                          <div className="pt-10">
                            <p className="text-[17px] font-semibold text-neutral-900">{form.name}</p>
                            <p className="mt-1 text-[13px] text-neutral-500">
                              {form.industry || "Training organization"}
                            </p>
                            <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-neutral-600">
                              {form.description || "Your public description will appear here."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                </form>
              )}

              {section === "codes" && (
                <div>
                  <SectionIntro
                    title="Invite teachers and students"
                    body="Share the right code with each audience. Regenerating a code immediately invalidates the previous one."
                  />

                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <CodePanel
                      title="Teachers"
                      description="For instructors who will build and deliver course content."
                      code={teacherCode}
                      onCopy={() => copyText(teacherCode)}
                      onRegenerate={() => handleRegenerateCode("teacher")}
                      regenerating={regenerating}
                    />
                    <CodePanel
                      title="Students"
                      description="For learners enrolling in your organization's programs."
                      code={studentCode}
                      onCopy={() => copyText(studentCode)}
                      onRegenerate={() => handleRegenerateCode("student")}
                      regenerating={regeneratingStudent}
                      disabled={!studentCode}
                    />
                  </div>

                  <div className="mt-10 rounded-2xl bg-neutral-50 px-6 py-5 text-[14px] leading-relaxed text-neutral-600">
                    <p className="font-semibold text-neutral-900">Before you share</p>
                    <ul className="mt-2 list-decimal space-y-1.5 pl-5">
                      <li>Teacher codes grant content creation access — share only with staff.</li>
                      <li>Student codes are safe for bulk onboarding emails and welcome pages.</li>
                      <li>Regenerate if a code was posted publicly or shared with the wrong group.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

function SectionIntro({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-[1.35rem] font-semibold tracking-tight text-neutral-900">{title}</h2>
      <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-neutral-500">{body}</p>
    </div>
  )
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-3 py-7 md:grid-cols-[minmax(200px,280px)_minmax(0,1fr)] md:gap-12 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
      <div>
        <p className="text-[15px] font-semibold text-neutral-900">{label}</p>
        {hint ? <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{hint}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  )
}

function ColorControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative block h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-full border border-neutral-200 shadow-inner">
        <span className="sr-only">Pick color</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
        />
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldInput, "max-w-[160px] font-mono text-[14px]")}
      />
      <div
        className="h-12 min-w-[120px] flex-1 rounded-lg border border-neutral-200"
        style={{ background: value }}
      />
    </div>
  )
}

function AppearanceSlider({
  label,
  value,
  max,
  suffix,
  onChange,
}: {
  label: string
  value: number
  max: number
  suffix: string
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-neutral-700">{label}</span>
        <span className="font-mono text-[12px] text-neutral-400">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
        className="mt-2 [&_[data-slot=slider-range]]:bg-neutral-800 [&_[data-slot=slider-thumb]]:border-neutral-800"
      />
    </div>
  )
}

function CodePanel({
  title,
  description,
  code,
  onCopy,
  onRegenerate,
  regenerating,
  disabled = false,
}: {
  title: string
  description: string
  code: string
  onCopy: () => void
  onRegenerate: () => void
  regenerating: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6">
      <h3 className="text-[17px] font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-500">{description}</p>
      <div className="mt-5 rounded-xl border border-neutral-200 bg-white px-4 py-5">
        <p className="font-mono text-[1.35rem] font-semibold tracking-[0.12em] text-neutral-900 md:text-[1.5rem]">
          {code || "—"}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-[14px] font-semibold">
        <button
          type="button"
          onClick={onCopy}
          disabled={disabled || !code}
          className="text-neutral-900 underline-offset-4 hover:underline disabled:opacity-40"
        >
          Copy code
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline disabled:opacity-40"
        >
          {regenerating ? "Generating…" : "Generate new code"}
        </button>
      </div>
    </div>
  )
}
