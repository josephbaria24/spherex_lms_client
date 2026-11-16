"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiGet, apiPost } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type CourseOutline = {
  course: {
    id: string
    title: string
    require_sequential_lessons: boolean
    progress_percent: number
    completed: boolean
  }
  lessons: Array<{
    id: string
    title: string
    content_type: string
    parent_lesson_id: string | null
    completed: boolean
  }>
  modules: Array<{
    id: string
    title: string
    lesson_ids: string[]
    completed_count: number
    total_count: number
    completed: boolean
  }>
}

export function AdjustCourseProgressDialog({
  open,
  onOpenChange,
  userId,
  courseId,
  courseTitle,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  courseId: string
  courseTitle: string
  onDone: () => void | Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [outline, setOutline] = useState<CourseOutline | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [includePrior, setIncludePrior] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGet<CourseOutline>(
        `/users/${userId}/courses/${courseId}/lessons`,
      )
      setOutline(data)
      setSelected(new Set())
      setIncludePrior(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load lessons")
      setOutline(null)
    } finally {
      setLoading(false)
    }
  }, [userId, courseId])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const selectedCount = selected.size
  const previewCount = useMemo(() => {
    if (!outline || selected.size === 0) return 0
    const ids = new Set<string>()
    for (const mod of outline.modules) {
      if (!selected.has(mod.id)) continue
      for (const lessonId of mod.lesson_ids) ids.add(lessonId)
    }
    if (!includePrior) return ids.size
    const sortById = new Map(
      outline.lessons.map((lesson, index) => [lesson.id, index]),
    )
    let maxIndex = -1
    for (const id of ids) {
      const idx = sortById.get(id)
      if (idx != null) maxIndex = Math.max(maxIndex, idx)
    }
    return outline.lessons.filter((_, index) => index <= maxIndex).length
  }, [outline, selected, includePrior])

  function toggleModule(moduleId: string, next: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev)
      if (next) copy.add(moduleId)
      else copy.delete(moduleId)
      return copy
    })
  }

  async function handleSave() {
    if (!outline || selected.size === 0) return
    setSaving(true)
    try {
      const lessonIds = [...selected]
      const result = await apiPost<{
        completed_lesson_ids: string[]
        progress: { progress: number; completed: boolean; done: number; total: number }
      }>(`/users/${userId}/progress/complete`, {
        course_id: courseId,
        lesson_ids: lessonIds,
        include_prior: includePrior,
      })
      toast.success(
        `Marked ${result.completed_lesson_ids.length} lesson${
          result.completed_lesson_ids.length === 1 ? "" : "s"
        } complete · ${result.progress.progress}%`,
      )
      onOpenChange(false)
      await onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update progress")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust course progress</DialogTitle>
          <DialogDescription>
            Mark modules complete for {courseTitle}. Progress % and unlocks update so the learner
            can continue afterward.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading modules…
          </div>
        ) : !outline ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No lessons found.</p>
        ) : (
          <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "50vh" }}>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {outline.course.progress_percent}% · {outline.modules.filter((m) => m.completed).length}/
                {outline.modules.length} modules done
              </span>
              {outline.course.require_sequential_lessons ? (
                <Badge variant="secondary">Sequential unlock</Badge>
              ) : null}
            </div>

            <div className="space-y-1.5">
              {outline.modules.map((mod, index) => {
                const checked = selected.has(mod.id)
                return (
                  <label
                    key={mod.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/70 px-3 py-2.5 transition-colors",
                      checked ? "border-foreground/30 bg-muted/40" : "hover:bg-muted/30",
                      mod.completed && "opacity-70",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggleModule(mod.id, value === true)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Module {index + 1}
                        </span>
                        {mod.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-medium">{mod.title}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {mod.completed_count}/{mod.total_count} lessons complete
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              <Checkbox
                id="include-prior"
                checked={includePrior}
                onCheckedChange={(value) => setIncludePrior(value === true)}
                className="mt-0.5"
              />
              <Label htmlFor="include-prior" className="text-xs leading-5 font-normal text-muted-foreground">
                Also complete earlier lessons (recommended). Keeps sequential courses unlockable so
                the learner is not stuck after the skip.
              </Label>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loading || selectedCount === 0}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              `Mark ${previewCount || selectedCount} complete`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
