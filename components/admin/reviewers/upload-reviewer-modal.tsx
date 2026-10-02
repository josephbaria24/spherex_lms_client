// components/admin/reviewers/upload-reviewer-modal.tsx
"use client"

import { useState } from "react"
import { useAuth } from "@/app/provider"
import { apiPatch, apiPost } from "@/lib/api"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Upload, X, Link2 } from "lucide-react"

const EXAM_TYPES = ["CSE", "NLE", "LET", "IELTS", "Other"] as const

interface UploadReviewerModalProps {
  onUploaded: () => void
  defaultExamType?: string
  lockExamType?: boolean
}

export function UploadReviewerModal({
  onUploaded,
  defaultExamType = "",
  lockExamType = false,
}: UploadReviewerModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    exam_type: defaultExamType,
    category: "",
    tags: "",
    external_url: "",
    is_published: true,
  })

  const reset = () => {
    setForm({
      title: "",
      description: "",
      exam_type: defaultExamType,
      category: "",
      tags: "",
      external_url: "",
      is_published: true,
    })
    setFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    if (selectedFile.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB")
      return
    }
    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return
    if (!form.exam_type) {
      alert("Please select an exam type")
      return
    }
    if (!file && !form.external_url.trim()) {
      alert("Upload a file or provide an external URL")
      return
    }

    setLoading(true)

    try {
      const { material } = await apiPost<{ material: { id: string } }>("/reviewers", {
        title: form.title,
        description: form.description || undefined,
        exam_type: form.exam_type,
        category: form.category || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        file_url: "",
        external_url: form.external_url.trim() || null,
        is_published: form.is_published,
      })

      if (file) {
        const fileExtension = file.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExtension}`
        const filePath = `reviewers/${material.id}/${fileName}`

        const formData = new FormData()
        formData.append("file", file)
        formData.append("path", filePath)

        const uploadResponse = await fetch("/api/lms/bunny/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        })
        const uploadResult = await uploadResponse.json()
        if (!uploadResult.success) {
          throw new Error("Upload to Bunny failed")
        }

        await apiPatch(`/reviewers/${material.id}`, { file_url: filePath })
      }

      alert("Reviewer material saved successfully!")
      setOpen(false)
      reset()
      onUploaded()
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to save reviewer material. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Reviewer Material
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Reviewer Material</DialogTitle>
          <DialogDescription>
            Upload a file or link to a public resource (CSE, NLE, LET, IELTS, etc.). Published items appear
            on the landing page Reviewers section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reviewer-file">File (optional if URL provided)</Label>
            <div className="rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary">
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="reviewer-file" className="cursor-pointer">
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, DOC, DOCX, PPT, PPTX (max. 50MB)
                  </p>
                  <input
                    id="reviewer-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="external_url">External URL (optional if file uploaded)</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="external_url"
                type="url"
                className="pl-9"
                value={form.external_url}
                onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                placeholder="https://… free online reviewer resource"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., CSE Professional Level Practice Set"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this reviewer…"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Exam type *</Label>
              <Select
                value={form.exam_type}
                onValueChange={(value) => setForm({ ...form, exam_type: value })}
                disabled={lockExamType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g., Professional, Sub-Professional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Comma-separated (e.g., free, practice, numerical)"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Publish on landing page</p>
              <p className="text-xs text-muted-foreground">
                Visible on /reviewers when enabled
              </p>
            </div>
            <Switch
              checked={form.is_published}
              onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving…" : "Save Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
