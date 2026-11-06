"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { KeyRound, Lock, Mail, Phone, UserRound } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/app/provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiGet, apiPost, ApiError } from "@/lib/api"

export function useIeltsAccess() {
  const { user, loading: authLoading } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [training, setTraining] = useState("IELTS Preparation")

  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    setLoading(true)
    apiGet<{ unlocked: boolean }>("/reviewers/ielts/access")
      .then((data) => {
        if (!cancelled) setUnlocked(Boolean(data.unlocked))
      })
      .catch(() => {
        if (!cancelled) setUnlocked(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, authLoading])

  function ask(nextTraining = "IELTS Preparation") {
    setTraining(nextTraining)
    setOpen(true)
  }

  return {
    unlocked,
    loading: loading || authLoading,
    open,
    setOpen,
    training,
    ask,
    markUnlocked: () => setUnlocked(true),
  }
}

export function IeltsAccessDialog({
  open,
  onOpenChange,
  training,
  onUnlocked,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  training: string
  onUnlocked?: () => void
}) {
  const { user } = useAuth()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [requesting, setRequesting] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    if (!open) return
    setFullName(user?.full_name || user?.name || "")
    setEmail(user?.email ?? "")
    setPhone(user?.phone ?? "")
  }, [open, user])

  async function requestAccess(e: React.FormEvent) {
    e.preventDefault()
    setRequesting(true)
    try {
      const res = await apiPost<{ message: string; unlocked?: boolean }>("/reviewers/ielts/access-request", {
        training,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      })
      toast.success(res.message || "Request sent. An admin still needs to accept it.")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send the access request")
    } finally {
      setRequesting(false)
    }
  }

  async function unlockWithCode(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      toast.error("Sign in before entering an access code")
      return
    }
    if (!code.trim()) {
      toast.error("Enter an access code")
      return
    }
    setUnlocking(true)
    try {
      await apiPost("/reviewers/ielts/access", { code: code.trim() })
      toast.success("All IELTS materials are unlocked")
      setCode("")
      onUnlocked?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not unlock this training")
    } finally {
      setUnlocking(false)
    }
  }

  const next = typeof window === "undefined" ? "/ielts" : window.location.pathname

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-[1.75rem] border-[#FFE0D4] p-5 shadow-[0_24px_60px_-32px_rgba(255,75,26,0.45)] sm:max-w-[26rem] sm:p-6 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:flex [&_[data-slot=dialog-close]]:size-9 [&_[data-slot=dialog-close]]:items-center [&_[data-slot=dialog-close]]:justify-center [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-[#FFF1EC] [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:hover:bg-[#FFE0D4]">
        <div className="flex items-start gap-3 pr-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1EC] text-[#FF4B1A]">
            <Lock className="size-5" />
          </span>
          <div>
            <DialogTitle className="text-lg font-semibold tracking-tight">{training}</DialogTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ask an admin to open the practice sets, or enter the code they send you. Mock exams
              open when your trainer starts the session.
            </p>
          </div>
        </div>

        <form onSubmit={requestAccess} className="mt-5 space-y-3">
          <Field icon={UserRound} label="Full name" id="ielts-access-name">
            <Input
              id="ielts-access-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={requesting}
              className="h-11 rounded-2xl pl-10"
            />
          </Field>
          <Field icon={Mail} label="Email" id="ielts-access-email">
            <Input
              id="ielts-access-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={requesting}
              className="h-11 rounded-2xl pl-10"
            />
          </Field>
          <Field icon={Phone} label="Phone / mobile" id="ielts-access-phone">
            <Input
              id="ielts-access-phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={requesting}
              className="h-11 rounded-2xl pl-10"
            />
          </Field>
          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-[#FF4B1A] hover:bg-[#e84314]"
            disabled={requesting}
          >
            <Mail className="size-4" />
            {requesting ? "Sending…" : "Request access"}
          </Button>
        </form>

        <form
          onSubmit={unlockWithCode}
          className="mt-4 space-y-3 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            <KeyRound className="size-4" />
            Have a code?
          </div>
          <Input
            id="ielts-access-code"
            className="h-11 rounded-2xl bg-white font-mono uppercase dark:bg-background"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={unlocking}
            placeholder="Enter code"
            aria-label="Access code"
          />
          {user ? (
            <Button type="submit" className="h-11 w-full rounded-full" disabled={unlocking}>
              <KeyRound className="size-4" />
              {unlocking ? "Checking…" : "Unlock with code"}
            </Button>
          ) : (
            <Button type="button" className="h-11 w-full rounded-full" asChild>
              <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in to enter a code</Link>
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  icon: Icon,
  label,
  id,
  children,
}: {
  icon: typeof UserRound
  label: string
  id: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  )
}
