"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ApiError, apiGet, apiPatch } from "@/lib/api"
import { IELTS_ACADEMIC_KEYS } from "@/lib/ielts-academic-materials"
import { Switch } from "@/components/ui/switch"

export function IeltsAnswerKeyToggle() {
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
    <div className="grow-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Answer keys</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          Listening answers, reading answers, and writing examples stay hidden from students until
          this is on.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {IELTS_ACADEMIC_KEYS.map((file) => (
            <a
              key={file.id}
              href={file.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[#FF4B1A] hover:underline"
            >
              {file.title}
            </a>
          ))}
        </div>
      </div>
      <label className="flex shrink-0 items-center gap-2 text-sm font-medium">
        <Switch
          checked={show}
          disabled={!ready || saving}
          onCheckedChange={(checked) => void onChange(checked)}
          aria-label="Show answer keys to students"
        />
        {show ? "Shown to students" : "Hidden from students"}
      </label>
    </div>
  )
}
