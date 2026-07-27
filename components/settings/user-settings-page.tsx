"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/app/provider"
import { JoinOrganizationForm } from "@/components/org/join-organization-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { apiGet, apiPatch } from "@/lib/api"
import type { AuthUser } from "@/lib/api"
import type { OrgMembership } from "@/lib/org-types"
import { hasAnyOrganization } from "@/lib/org-membership"
import { isAdmin, isStudent } from "@/lib/roles"
import { cn } from "@/lib/utils"
import {
  Bell,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Shield,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

type ProfileForm = {
  full_name: string
  phone: string
  notify_email: boolean
  notify_training: boolean
  notify_course_updates: boolean
}

type Section = "profile" | "notifications" | "organizations"

const SECTIONS: { id: Section; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "notifications", label: "Notifications" },
  { id: "organizations", label: "Organizations" },
]

const fieldInput =
  "h-10 w-full rounded-lg border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172a] shadow-none transition focus-visible:border-[#94a3b8] focus-visible:ring-0"

function profileFromUser(user: AuthUser): ProfileForm {
  return {
    full_name: user.full_name ?? user.name ?? "",
    phone: user.phone ?? "",
    notify_email: user.notify_email ?? true,
    notify_training: user.notify_training ?? true,
    notify_course_updates: user.notify_course_updates ?? false,
  }
}

export function UserSettingsPage() {
  const { user, loading, refresh } = useAuth()
  const [section, setSection] = useState<Section>("profile")
  const [profile, setProfile] = useState<ProfileForm | null>(null)
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [loadingMemberships, setLoadingMemberships] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    let cancelled = false
    apiGet<{ user: AuthUser }>(`/users/${user.id}`)
      .then((res) => {
        if (!cancelled) setProfile(profileFromUser(res.user))
      })
      .catch(() => {
        if (!cancelled) setProfile(profileFromUser(user))
      })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    setLoadingMemberships(true)
    apiGet<{ memberships: OrgMembership[] }>("/organizations/me")
      .then((data) => setMemberships(data.memberships ?? []))
      .finally(() => setLoadingMemberships(false))
  }, [])

  const notifyOnCount = useMemo(() => {
    if (!profile) return 0
    return [profile.notify_email, profile.notify_training, profile.notify_course_updates].filter(
      Boolean,
    ).length
  }, [profile])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile) return
    const name = profile.full_name.trim()
    if (!name) {
      toast.error("Full name is required")
      return
    }

    setSavingProfile(true)
    try {
      await apiPatch(`/users/${user.id}`, {
        full_name: name,
        name,
        phone: profile.phone.trim() || null,
      })
      await refresh()
      toast.success("Profile updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile")
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveNotifications() {
    if (!user || !profile) return
    setSavingNotifications(true)
    try {
      await apiPatch(`/users/${user.id}`, {
        notify_email: profile.notify_email,
        notify_training: profile.notify_training,
        notify_course_updates: profile.notify_course_updates,
      })
      await refresh()
      toast.success("Notification preferences saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save preferences")
    } finally {
      setSavingNotifications(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="flex items-center gap-2 px-4 py-16 text-sm text-[#64748b] md:px-5 lg:px-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your account…
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="px-4 py-16 md:px-5 lg:px-6">
          <p className="text-sm text-[#64748b]">Could not load profile.</p>
        </div>
      </div>
    )
  }

  const showStudentJoin = isStudent(user.role)
  const showTeacherJoin = !showStudentJoin && !isAdmin(user.role)
  const showJoinForm =
    !hasAnyOrganization(memberships) && (showStudentJoin || showTeacherJoin)
  const hideOrgSectionForAdmin =
    isAdmin(user.role) && !hasAnyOrganization(memberships) && !loadingMemberships

  const visibleSections = SECTIONS.filter(
    (item) => !(item.id === "organizations" && hideOrgSectionForAdmin),
  )

  return (
    <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
      <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
              Account settings
            </p>
            <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
              Manage your profile, notification preferences, and organization memberships.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#475569]">
              <Shield className="h-3 w-3" strokeWidth={1.75} />
              {user.role}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize",
                user.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-[#f1f5f9] text-[#64748b]",
              )}
            >
              <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
              {user.status}
            </span>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={UserRound} value={profile.full_name.split(" ")[0] || "—"} label="Display name" hint={user.email} />
          <MetricCard icon={Building2} value={memberships.length} label="Organizations" hint="Connected workspaces" />
          <MetricCard icon={Bell} value={`${notifyOnCount}/3`} label="Alerts on" hint="Notification channels" />
          <MetricCard icon={Mail} value={user.status} label="Account status" hint="Login access" />
        </div>

        <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-4 border-b border-[#eef0f4] px-4 py-3 sm:gap-5">
            {visibleSections.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id)}
                className={cn(
                  "text-sm transition-colors",
                  section === tab.id
                    ? "font-semibold text-[#0f172a]"
                    : "font-medium text-[#94a3b8] hover:text-[#64748b]",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-6">
            {section === "profile" && (
              <form onSubmit={saveProfile} className="max-w-2xl space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Profile information</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    Your name and contact details appear across teaching and organization workspaces.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-[#334155]">
                      Full name
                    </label>
                    <Input
                      id="name"
                      required
                      className={fieldInput}
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-[#334155]">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      readOnly
                      disabled
                      className={cn(fieldInput, "cursor-not-allowed bg-[#f8fafc] opacity-80")}
                    />
                    <p className="text-xs text-[#94a3b8]">Contact an admin to change your email.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-[#334155]">
                      Phone number
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+63 912 345 6789"
                      className={fieldInput}
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((p) => (p ? { ...p, phone: e.target.value } : p))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-[#f1f5f9] pt-4">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="h-9 rounded-lg bg-[#0f172a] px-4 text-white shadow-none hover:bg-[#1e293b]"
                  >
                    {savingProfile ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            )}

            {section === "notifications" && (
              <div className="max-w-2xl space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Notification preferences</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    Choose which updates reach you while you teach and manage courses.
                  </p>
                </div>

                <div className="divide-y divide-[#f1f5f9] overflow-hidden rounded-lg border border-[#e2e8f0]">
                  <NotifyRow
                    title="Email notifications"
                    description="Receive email updates about your courses."
                    checked={profile.notify_email}
                    onCheckedChange={(checked) =>
                      setProfile((p) => (p ? { ...p, notify_email: checked } : p))
                    }
                  />
                  <NotifyRow
                    title="Training reminders"
                    description="Get notified before training sessions."
                    checked={profile.notify_training}
                    onCheckedChange={(checked) =>
                      setProfile((p) => (p ? { ...p, notify_training: checked } : p))
                    }
                  />
                  <NotifyRow
                    title="Course updates"
                    description="Notifications about new course content."
                    checked={profile.notify_course_updates}
                    onCheckedChange={(checked) =>
                      setProfile((p) => (p ? { ...p, notify_course_updates: checked } : p))
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={savingNotifications}
                    onClick={saveNotifications}
                    className="h-9 rounded-lg bg-[#0f172a] px-4 text-white shadow-none hover:bg-[#1e293b]"
                  >
                    {savingNotifications ? "Saving…" : "Save preferences"}
                  </Button>
                </div>
              </div>
            )}

            {section === "organizations" && !hideOrgSectionForAdmin && (
              <div className="max-w-3xl space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Your organizations</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    Memberships connected to this account, including teaching and admin roles.
                  </p>
                </div>

                {loadingMemberships ? (
                  <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading organizations…
                  </div>
                ) : hasAnyOrganization(memberships) ? (
                  <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
                            Organization
                          </th>
                          <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {memberships.map((m) => (
                          <tr key={m.id}>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <Building2
                                  className="h-5 w-5 shrink-0 text-[#64748b]"
                                  strokeWidth={1.5}
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#0f172a]">
                                    {m.organization.name}
                                  </p>
                                  {m.organization.slug ? (
                                    <p className="mt-0.5 font-mono text-xs text-[#94a3b8]">
                                      /{m.organization.slug}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#475569]">
                                {m.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : showJoinForm ? (
                  <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#fafbfc] px-5 py-6">
                    <h3 className="text-sm font-semibold text-[#0f172a]">Join an organization</h3>
                    <p className="mt-1 max-w-lg text-sm text-[#64748b]">
                      {showStudentJoin
                        ? "Enter the student code from your training provider to access their courses."
                        : "Have a teacher code from your organization? Enter it below to join as an instructor."}
                    </p>
                    <div className="mt-4 max-w-sm">
                      <JoinOrganizationForm
                        mode={showStudentJoin ? "student" : "teacher"}
                        compact
                        redirectTo={showStudentJoin ? "/courses" : "/teacher"}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#e2e8f0] px-6 py-14 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-medium text-[#0f172a]">No organizations yet</p>
                    <p className="mt-1 text-sm text-[#94a3b8]">
                      Organization memberships will appear here once you join one.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: LucideIcon
  value: number | string
  label: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold capitalize tabular-nums text-[#0f172a]">
            {value}
          </p>
          <p className="mt-0.5 text-sm font-medium text-[#334155]">{label}</p>
          <p className="mt-1 truncate text-xs text-[#94a3b8]">{hint}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
      </div>
    </div>
  )
}

function NotifyRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
        <p className="mt-0.5 text-sm text-[#64748b]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
