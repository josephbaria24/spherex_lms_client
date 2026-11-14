"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ApiError, apiGet, apiPatch } from "@/lib/api"
import { IELTS_ACADEMIC_MOCKS } from "@/lib/ielts-academic-materials"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type CatalogFlags = {
  mock_session_open?: boolean
  open_mock_ids?: string[]
}

export function IeltsMockSessionToggle({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [openMockIds, setOpenMockIds] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftIds, setDraftIds] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    apiGet<CatalogFlags>("/reviewers/ielts/answer-keys")
      .then((data) => {
        if (cancelled) return
        setOpen(data.mock_session_open === true)
        setOpenMockIds(Array.isArray(data.open_mock_ids) ? data.open_mock_ids : [])
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

  const selectedMocks = useMemo(
    () => IELTS_ACADEMIC_MOCKS.filter((mock) => openMockIds.includes(mock.id)),
    [openMockIds],
  )

  function openPicker(preselected?: string[]) {
    const next =
      preselected && preselected.length > 0
        ? preselected
        : openMockIds.length > 0
          ? openMockIds
          : IELTS_ACADEMIC_MOCKS.map((mock) => mock.id)
    setDraftIds(next)
    setPickerOpen(true)
  }

  async function persist(nextOpen: boolean, ids: string[]) {
    setSaving(true)
    try {
      const data = await apiPatch<CatalogFlags>("/reviewers/ielts/mock-session", {
        mock_session_open: nextOpen,
        open_mock_ids: nextOpen ? ids : [],
      })
      setOpen(data.mock_session_open === true)
      setOpenMockIds(Array.isArray(data.open_mock_ids) ? data.open_mock_ids : [])
      if (data.mock_session_open) {
        const count = data.open_mock_ids?.length ?? 0
        toast.success(
          count === 1 ? "1 mock test is now open" : `${count} mock tests are now open`,
        )
      } else {
        toast.success("Mock exam session closed")
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update the mock exam session")
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function onSwitchChange(next: boolean) {
    if (next) {
      openPicker()
      return
    }
    try {
      await persist(false, [])
    } catch {
      // toast already shown
    }
  }

  async function confirmStart() {
    if (draftIds.length === 0) {
      toast.error("Choose at least one mock test")
      return
    }
    try {
      await persist(true, draftIds)
      setPickerOpen(false)
    } catch {
      // toast already shown
    }
  }

  function toggleDraft(id: string, checked: boolean) {
    setDraftIds((current) =>
      checked ? Array.from(new Set([...current, id])) : current.filter((value) => value !== id),
    )
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Mock exam
          </p>
          <p className="mt-1 text-sm font-semibold leading-tight">Session lock</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {open
              ? selectedMocks.length > 0
                ? `Open: ${selectedMocks.map((mock) => mock.day).join(", ")}`
                : "Session is live"
              : "Pick which academic mocks to unlock before starting."}
          </p>
          {open ? (
            <button
              type="button"
              className="mt-1 text-[11px] font-semibold text-[#FF4B1A] hover:underline"
              onClick={() => openPicker(openMockIds)}
              disabled={!ready || saving}
            >
              Change open tests
            </button>
          ) : null}
        </div>
        <label className="flex shrink-0 flex-col items-end gap-1.5">
          <Switch
            checked={open}
            disabled={!ready || saving}
            onCheckedChange={(checked) => void onSwitchChange(checked)}
            aria-label="Start the IELTS mock exam session"
          />
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide",
              open ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
            )}
          >
            {open ? "Live" : "Waiting"}
          </span>
        </label>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{open ? "Change open mock tests" : "Start mock exam session"}</DialogTitle>
            <DialogDescription>
              Choose which academic mock tests students can open. Practice sets stay available either
              way.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {draftIds.length} of {IELTS_ACADEMIC_MOCKS.length} selected
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDraftIds(IELTS_ACADEMIC_MOCKS.map((mock) => mock.id))}
              >
                Select all
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setDraftIds([])}>
                Clear
              </Button>
            </div>
          </div>

          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {IELTS_ACADEMIC_MOCKS.map((mock) => {
              const checked = draftIds.includes(mock.id)
              const fileLabels = mock.files.map((file) => file.title).join(" · ")
              return (
                <label
                  key={mock.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                    checked
                      ? "border-[#FF4B1A]/40 bg-[#FFF1EC] dark:border-[#FF4B1A]/30 dark:bg-[#FF4B1A]/10"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggleDraft(mock.id, value === true)}
                    className="mt-0.5"
                    aria-label={`Open ${mock.title}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF4B1A]">
                      {mock.day}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold leading-tight">
                      {mock.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{fileLabels}</span>
                    {mock.note ? (
                      <span className="mt-1 block text-[11px] text-muted-foreground">{mock.note}</span>
                    ) : null}
                  </span>
                </label>
              )
            })}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void confirmStart()}
              disabled={saving || draftIds.length === 0}
            >
              {saving ? "Saving…" : open ? "Update open tests" : "Start session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
