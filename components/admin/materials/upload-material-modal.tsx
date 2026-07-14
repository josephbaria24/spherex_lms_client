// components/admin/materials/upload-material-modal.tsx
'use client'

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
import { Plus, Upload, X } from "lucide-react"

interface UploadMaterialModalProps {
  onUploaded: () => void
}

export function UploadMaterialModal({ onUploaded }: UploadMaterialModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "",
    category: "",
    tags: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB")
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !user) {
      alert("Please select a file")
      return
    }

    setLoading(true)

    try {
      // 1. Create material record first to get ID
      const { material } = await apiPost<{ material: { id: string } }>("/materials", {
        title: form.title,
        description: form.description,
        type: form.type,
        category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        file_url: "",
      })

      const fileExtension = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExtension}`
      const filePath = `materials/${material.id}/${fileName}`

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

      await apiPatch(`/materials/${material.id}`, { file_url: filePath })

      // Success!
      alert("Material uploaded successfully!")
      setOpen(false)
      setForm({ title: "", description: "", type: "", category: "", tags: "" })
      setFile(null)
      onUploaded()
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload material. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Material
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Learning Material</DialogTitle>
          <DialogDescription>
            Upload PDF, DOC, DOCX, PPT, or PPTX files (max 50MB)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, PPT, PPTX (max. 50MB)
                  </p>
                  <input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., IELTS Speaking Practice Guide"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the material..."
              rows={3}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IELTS">IELTS</SelectItem>
                <SelectItem value="TOEFL">TOEFL</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Soft Skills">Soft Skills</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g., Speaking, Writing, Listening"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="Comma-separated tags (e.g., beginner, practice, speaking)"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || !file}>
              {loading ? "Uploading..." : "Upload Material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}