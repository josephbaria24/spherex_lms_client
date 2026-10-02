"use client"

import { useEffect, useRef, useState } from "react"
import { apiPatch, apiPost, apiUploadFile } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import {
  REVIEWER_ACCENTS,
  REVIEWER_ACCENT_STYLES,
  type ReviewerAccent,
} from "@/lib/reviewer-accents"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ImagePlus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const EXAM_TYPES = ["CSE", "NLE", "LET", "IELTS", "Other"] as const

export type AdminReviewerGroup = {
  id: string
  title: string
  description: string | null
  exam_type: string
  subject: string
  accent_color: string
  cover_url: string | null
  sort_order: number
  is_published: boolean
}

type GroupFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: AdminReviewerGroup | null
  onSaved: () => void
  defaultExamType?: string
  lockExamType?: boolean
}

export function GroupFormModal({
  open,
  onOpenChange,
  group,
  onSaved,
  defaultExamType = "CSE",
  lockExamType = false,
}: GroupFormModalProps) {
  const isEdit = Boolean(group)
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    exam_type: defaultExamType,
    subject: "",
    accent_color: "slate" as ReviewerAccent,
    sort_order: 0,
    is_published: true,
  })

  useEffect(() => {
    if (!open) return
    setForm({
      title: group?.title ?? "",
      description: group?.description ?? "",
      exam_type: group?.exam_type ?? defaultExamType,
      subject: group?.subject ?? "",
      accent_color: (group?.accent_color as ReviewerAccent) || "slate",
      sort_order: group?.sort_order ?? 0,
      is_published: group?.is_published ?? true,
    })
    setCoverUrl(group?.cover_url ?? null)
    setLocalPreview(null)
  }, [open, group, defaultExamType])

  const displayCover = localPreview ?? assetUrl(coverUrl)

  async function handleCover(file: File) {
    if (!group?.id) {
      alert("Save the subject first, then upload a cover photo.")
      return
    }
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file")
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      alert("Cover image must be 4 MB or smaller")
      return
    }
    setLocalPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const data = await apiUploadFile<{ group: AdminReviewerGroup }>(
        `/reviewers/groups/${group.id}/cover`,
        "cover",
        file,
      )
      setLocalPreview(null)
      setCoverUrl(data.group.cover_url)
    } catch (err) {
      setLocalPreview(null)
      alert(err instanceof Error ? err.message : "Cover upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      alert("Title is required")
      return
    }
    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        exam_type: form.exam_type,
        subject: form.subject.trim() || form.title.trim(),
        accent_color: form.accent_color,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      }
      if (isEdit && group) {
        await apiPatch(`/reviewers/groups/${group.id}`, payload)
      } else {
        await apiPost("/reviewers/groups", payload)
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save subject")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit subject card" : "New subject card"}</DialogTitle>
          <DialogDescription>
            Group practice parts under one subject (e.g. English). Pick a color and optional cover
            photo for the public Reviewers page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="English"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short blurb shown on the subject card"
              rows={3}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Exam</Label>
              <Select
                value={form.exam_type}
                onValueChange={(v) => setForm((f) => ({ ...f, exam_type: v }))}
                disabled={lockExamType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject key</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="English"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-end justify-between rounded-lg border px-3 py-2">
              <div>
                <Label>Published</Label>
                <p className="text-xs text-muted-foreground">Visible on public page</p>
              </div>
              <Switch
                checked={form.is_published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Accent color</Label>
            <div className="grid grid-cols-4 gap-2">
              {REVIEWER_ACCENTS.map((accent) => {
                const styles = REVIEWER_ACCENT_STYLES[accent]
                const selected = form.accent_color === accent
                return (
                  <button
                    key={accent}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, accent_color: accent }))}
                    className={cn(
                      "rounded-lg border p-2 text-left transition",
                      selected ? "border-foreground ring-2 ring-offset-1" : "border-border",
                    )}
                  >
                    <span className={cn("mb-1 block h-6 rounded-md", styles.swatch)} />
                    <span className="text-[11px] font-medium">{styles.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover photo</Label>
            <div className="overflow-hidden rounded-xl border">
              <div className="relative h-28 bg-muted">
                {displayCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayCover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className={cn(
                      "h-full w-full bg-gradient-to-br",
                      REVIEWER_ACCENT_STYLES[form.accent_color].header,
                    )}
                  />
                )}
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleCover(file)
                e.target.value = ""
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isEdit || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-2 h-4 w-4" />
              )}
              {isEdit ? "Upload cover" : "Save subject first to upload cover"}
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Create subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
