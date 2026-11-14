"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ApiError, apiGet, apiPatch } from "@/lib/api"
import { IELTS_ACADEMIC_KEYS } from "@/lib/ielts-academic-materials"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function IeltsAnswerKeyToggle({ className }: { className?: string }) {
  const [show, setShow] = useState(false)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiGet<{ show_answer_keys?: boolean }>("/reviewers/ielts/answer-keys")
      .then((data) => {
        if (!cancelled) setShow(data.show_answer_keys === true)
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load the answer key setting")
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onChange(next: boolean) {
    const previous = show
    setShow(next)
    setSaving(true)
    try {
      const data = await apiPatch<{ show_answer_keys?: boolean }>("/reviewers/ielts/answer-keys", {
        show_answer_keys: next,
      })
      setShow(data.show_answer_keys === true)
    } catch (err) {
      setShow(previous)
      toast.error(err instanceof ApiError ? err.message : "Could not update answer keys")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Answer keys
          </p>
          <p className="mt-1 text-sm font-semibold leading-tight">Student visibility</p>
          <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1">
            {IELTS_ACADEMIC_KEYS.map((file) => (
              <a
                key={file.id}
                href={file.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-[#FF4B1A] hover:underline"
              >
                {file.title.replace(/ answers$/i, "").replace(/ examples$/i, "")}
              </a>
            ))}
          </div>
        </div>
        <label className="flex shrink-0 flex-col items-end gap-1.5">
          <Switch
            checked={show}
            disabled={!ready || saving}
            onCheckedChange={(checked) => void onChange(checked)}
            aria-label="Show answer keys to students"
          />
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide",
              show ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            {show ? "Shown" : "Hidden"}
          </span>
        </label>
      </div>
    </div>
  )
}
