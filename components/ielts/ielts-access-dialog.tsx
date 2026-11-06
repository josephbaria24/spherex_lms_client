"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { KeyRound, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/app/provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#FF4B1A]" />
            {training}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-6 text-muted-foreground">
          Request access and wait for an admin to accept it. A code from the admin also unlocks every
          IELTS practice set, mock exam, and answer key.
        </p>

        <form onSubmit={requestAccess} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ielts-access-name">Full name</Label>
            <Input
              id="ielts-access-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={requesting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ielts-access-email">Email</Label>
            <Input
              id="ielts-access-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={requesting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ielts-access-phone">Phone / mobile</Label>
            <Input
              id="ielts-access-phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={requesting}
            />
          </div>
          <Button type="submit" className="w-full gap-2 bg-[#FF4B1A] hover:bg-[#e84314]" disabled={requesting}>
            <Mail className="h-4 w-4" />
            {requesting ? "Sending…" : "Request access"}
          </Button>
        </form>

        <form onSubmit={unlockWithCode} className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <Label htmlFor="ielts-access-code" className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
            Access code
          </Label>
          <Input
            id="ielts-access-code"
            className="bg-white font-mono uppercase dark:bg-background"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={unlocking}
            placeholder="Enter code"
          />
          {user ? (
            <Button type="submit" className="w-full gap-2" disabled={unlocking}>
              <KeyRound className="h-4 w-4" />
              {unlocking ? "Checking…" : "Unlock with code"}
            </Button>
          ) : (
            <Button type="button" className="w-full" asChild>
              <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in to enter a code</Link>
            </Button>
          )}
        </form>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  )
}
