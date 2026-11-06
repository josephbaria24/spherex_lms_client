"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ApiError, apiGet, apiPatch } from "@/lib/api"
import { Switch } from "@/components/ui/switch"

export function IeltsMockSessionToggle() {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiGet<{ mock_session_open?: boolean }>("/reviewers/ielts/answer-keys")
      .then((data) => {
        if (!cancelled) setOpen(data.mock_session_open === true)
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load the mock exam session")
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onChange(next: boolean) {
    const previous = open
    setOpen(next)
    setSaving(true)
    try {
      const data = await apiPatch<{ mock_session_open?: boolean }>("/reviewers/ielts/mock-session", {
        mock_session_open: next,
      })
      setOpen(data.mock_session_open === true)
    } catch (err) {
      setOpen(previous)
      toast.error(err instanceof ApiError ? err.message : "Could not update the mock exam session")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grow-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Mock exam session</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          Students see the academic mock exams as locked until you start the session. Practice sets
          stay available.
        </p>
      </div>
      <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
        <Switch
          checked={open}
          disabled={!ready || saving}
          onCheckedChange={(checked) => void onChange(checked)}
          aria-label="Start the IELTS mock exam session"
        />
        {open ? "Session started" : "Waiting for trainer"}
      </label>
    </div>
  )
}
