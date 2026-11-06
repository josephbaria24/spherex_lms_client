"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { apiPatch } from "@/lib/api"
import { Lock } from "lucide-react"
import { toast } from "sonner"

type CourseLessonAccessSettingsProps = {
  courseId: string
  initialRequireSequential?: boolean
  initialAllowSkip?: boolean
}

export function CourseLessonAccessSettings({
  courseId,
  initialRequireSequential = false,
  initialAllowSkip = false,
}: CourseLessonAccessSettingsProps) {
  const [requireSequential, setRequireSequential] = useState(initialRequireSequential)
  const [allowSkip, setAllowSkip] = useState(initialAllowSkip)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setRequireSequential(initialRequireSequential)
  }, [initialRequireSequential])

  useEffect(() => {
    setAllowSkip(initialAllowSkip)
  }, [initialAllowSkip])

  async function handleToggle(checked: boolean) {
    const previous = requireSequential
    setRequireSequential(checked)
    setSaving(true)
    try {
      await apiPatch(`/courses/${courseId}`, { require_sequential_lessons: checked })
      toast.success(
        checked
          ? "Sequential lesson access enabled"
          : "Learners can open lessons in any order",
      )
    } catch (err) {
      setRequireSequential(previous)
      toast.error(err instanceof Error ? err.message : "Could not update lesson access")
    } finally {
      setSaving(false)
    }
  }

  async function handleSkipToggle(checked: boolean) {
    const previous = allowSkip
    setAllowSkip(checked)
    setSaving(true)
    try {
      await apiPatch(`/courses/${courseId}`, { allow_lesson_skip: checked })
      toast.success(
        checked
          ? "Students can mark lessons complete or skip them"
          : "Students must finish each lesson",
      )
    } catch (err) {
      setAllowSkip(previous)
      toast.error(err instanceof Error ? err.message : "Could not update lesson access")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Lesson access</CardTitle>
        </div>
        <CardDescription>
          Choose whether learners must follow the lesson order, and whether they can mark a lesson complete or skip it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="require-sequential-lessons" className="text-sm font-medium">
              Require lessons in order
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, lesson 2 stays locked until lesson 1 is completed, and so on.
            </p>
          </div>
          <Switch
            id="require-sequential-lessons"
            checked={requireSequential}
            disabled={saving}
            onCheckedChange={(checked) => void handleToggle(checked)}
          />
        </div>
        <div className="flex items-start justify-between gap-4 border-t border-border pt-5">
          <div className="space-y-1">
            <Label htmlFor="allow-lesson-skip" className="text-sm font-medium">
              Allow mark complete or skip
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, students can mark any lesson complete or skip it and move on. When off, a lesson finishes only after its content or quiz is done.
            </p>
          </div>
          <Switch
            id="allow-lesson-skip"
            checked={allowSkip}
            disabled={saving}
            onCheckedChange={(checked) => void handleSkipToggle(checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
