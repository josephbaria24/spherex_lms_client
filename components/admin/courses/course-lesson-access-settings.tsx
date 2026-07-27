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
}

export function CourseLessonAccessSettings({
  courseId,
  initialRequireSequential = false,
}: CourseLessonAccessSettingsProps) {
  const [requireSequential, setRequireSequential] = useState(initialRequireSequential)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setRequireSequential(initialRequireSequential)
  }, [initialRequireSequential])

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

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Lesson access</CardTitle>
        </div>
        <CardDescription>
          Control whether learners must finish each lesson before the next one unlocks.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
