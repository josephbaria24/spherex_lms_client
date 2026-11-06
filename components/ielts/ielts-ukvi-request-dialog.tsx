"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookmarkPlus, Check, Headphones, LogIn } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/app/provider"
import { ApiError, apiGet, apiPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

const dialogClass =
  "gap-0 rounded-[1.75rem] border-[#FFE0D4] p-5 shadow-[0_24px_60px_-32px_rgba(255,75,26,0.45)] sm:max-w-[26rem] sm:p-6 [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:flex [&_[data-slot=dialog-close]]:size-9 [&_[data-slot=dialog-close]]:items-center [&_[data-slot=dialog-close]]:justify-center [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-[#FFF1EC] [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:hover:bg-[#FFE0D4]"

export function IeltsUkviRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user } = useAuth()
  const [requested, setRequested] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    let cancelled = false
    setLoading(true)
    apiGet<{ requested?: boolean }>("/reviewers/ielts/track-interest/mine")
      .then((data) => {
        if (!cancelled) setRequested(data.requested === true)
      })
      .catch(() => {
        if (!cancelled) setRequested(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, user])

  async function requestTrack() {
    setSaving(true)
    try {
      await apiPost("/reviewers/ielts/track-interest", { track: "ukvi" })
      setRequested(true)
      toast.success("Request sent. An admin can see it.")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send that request")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogClass}>
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[#FFF1EC] text-[#FF4B1A]">
            <Headphones className="size-7" />
          </span>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF4B1A]">
            Not available yet
          </p>
          <DialogTitle className="mt-1 text-xl font-semibold tracking-tight">
            IELTS for UKVI Life Skills
          </DialogTitle>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Speaking and listening practice for UK visa routes is still being prepared. Request it
            and an admin will see your name.
          </p>
        </div>
        <div className="mt-5">
          {user ? (
            <Button
              type="button"
              className="h-11 w-full rounded-full bg-[#FF4B1A] text-sm hover:bg-[#e84314]"
              disabled={loading || saving || requested}
              onClick={() => void requestTrack()}
            >
              {requested ? <Check className="size-4" /> : <BookmarkPlus className="size-4" />}
              {requested ? "You’re on the list" : saving ? "Sending…" : "Request this track"}
            </Button>
          ) : (
            <Button
              type="button"
              className="h-11 w-full rounded-full bg-[#FF4B1A] text-sm hover:bg-[#e84314]"
              asChild
            >
              <Link href="/login">
                <LogIn className="size-4" />
                Sign in to request this track
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
