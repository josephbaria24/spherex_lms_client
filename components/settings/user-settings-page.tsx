"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/provider"
import { JoinOrgSection } from "@/components/settings/join-org-section"
import { GrowHeader } from "@/components/grow-shell"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { apiGet, apiPatch } from "@/lib/api"
import type { AuthUser } from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

type ProfileForm = {
  full_name: string
  phone: string
  notify_email: boolean
  notify_training: boolean
  notify_course_updates: boolean
}

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
  const [profile, setProfile] = useState<ProfileForm | null>(null)
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
      <>
        <GrowHeader
          title="Settings"
          accent="your account"
          description="Manage your profile and notification preferences"
          showDate={false}
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your account…
        </div>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <GrowHeader
          title="Settings"
          accent="your account"
          description="Manage your profile and notification preferences"
          showDate={false}
        />
        <p className="text-sm text-muted-foreground">Could not load profile.</p>
      </>
    )
  }

  return (
    <>
      <GrowHeader
        title="Settings"
        accent="your account"
        description="Manage your profile and notification preferences"
        showDate={false}
      />

      <JoinOrgSection variant="grow" />

      <section className="grow-card p-6">
        <h2 className="text-xl font-semibold text-[#1c1917] dark:text-foreground">
          Profile information
        </h2>
        <form onSubmit={saveProfile} className="mt-5 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={profile.full_name}
              onChange={(e) => setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))}
              className="grow-input rounded-xl"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              readOnly
              disabled
              className="grow-input rounded-xl bg-muted/40"
            />
            <p className="text-xs text-muted-foreground">Contact an admin to change your email.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile((p) => (p ? { ...p, phone: e.target.value } : p))}
              placeholder="+63 912 345 6789"
              className="grow-input rounded-xl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="grow-badge capitalize">{user.role}</span>
            <span className="text-xs text-muted-foreground capitalize">Status: {user.status}</span>
          </div>
          <Button type="submit" className="grow-btn-primary mt-2" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>

      <section className="grow-card-muted p-6">
        <h2 className="text-xl font-semibold text-[#1c1917] dark:text-foreground">
          Notifications
        </h2>
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Email notifications</Label>
              <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                Receive email updates about your courses
              </p>
            </div>
            <Switch
              checked={profile.notify_email}
              onCheckedChange={(checked) =>
                setProfile((p) => (p ? { ...p, notify_email: checked } : p))
              }
            />
          </div>
          <Separator className="bg-[#ebe4da] dark:bg-border" />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Training reminders</Label>
              <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                Get notified before training sessions
              </p>
            </div>
            <Switch
              checked={profile.notify_training}
              onCheckedChange={(checked) =>
                setProfile((p) => (p ? { ...p, notify_training: checked } : p))
              }
            />
          </div>
          <Separator className="bg-[#ebe4da] dark:bg-border" />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Course updates</Label>
              <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                Notifications about new course content
              </p>
            </div>
            <Switch
              checked={profile.notify_course_updates}
              onCheckedChange={(checked) =>
                setProfile((p) => (p ? { ...p, notify_course_updates: checked } : p))
              }
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="grow-btn-outline"
            disabled={savingNotifications}
            onClick={saveNotifications}
          >
            {savingNotifications ? "Saving…" : "Save notification preferences"}
          </Button>
        </div>
      </section>
    </>
  )
}
