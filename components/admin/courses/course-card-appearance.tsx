"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { apiUploadFile } from "@/lib/api"
import {
  COURSE_CARD_THEMES,
  type CourseCardTheme,
} from "@/lib/course-card-themes"
import { CourseCardHero, CourseCardThemeSwatch } from "@/components/admin/courses/course-card-hero"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif"

type CourseCardAppearanceFieldsProps = {
  courseId?: string
  cardTheme: CourseCardTheme
  image: string | null
  previewTitle?: string
  onCardThemeChange: (theme: CourseCardTheme) => void
  onImageChange: (image: string | null) => void
}

export function CourseCardAppearanceFields({
  courseId,
  cardTheme,
  image,
  previewTitle = "Course preview",
  onCardThemeChange,
  onImageChange,
}: CourseCardAppearanceFieldsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const displayImage = localPreview ?? image

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Cover image must be 4 MB or smaller")
      return
    }
    if (!courseId) {
      toast.error("Save the course first before uploading a cover image")
      return
    }

    setLocalPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const data = await apiUploadFile<{ image: string }>(
        `/courses/${courseId}/cover`,
        "cover",
        file,
      )
      setLocalPreview(null)
      onImageChange(data.image)
      toast.success("Cover image uploaded")
    } catch (err) {
      setLocalPreview(null)
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-3">
      <div className="space-y-1">
        <Label>Card appearance</Label>
        <p className="text-xs text-muted-foreground">
          Pick a color theme or upload a background image. Uploaded images are blurred and darkened
          so card text stays readable.
        </p>
      </div>

      <CourseCardHero image={displayImage} cardTheme={cardTheme} compact>
        <div className="flex h-full flex-col justify-end p-3">
          <p className="text-sm font-semibold text-foreground drop-shadow-sm">{previewTitle}</p>
        </div>
      </CourseCardHero>

      <div className="space-y-2">
        <Label className="text-xs">Color themes</Label>
        <div className="grid grid-cols-3 gap-2">
          {COURSE_CARD_THEMES.map((theme) => (
            <CourseCardThemeSwatch
              key={theme}
              theme={theme}
              selected={cardTheme === theme && !displayImage}
              onClick={() => {
                onImageChange(null)
                onCardThemeChange(theme)
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Background image</Label>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ""
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={uploading || !courseId}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                {displayImage ? "Replace image" : "Upload image"}
              </>
            )}
          </Button>
          {displayImage ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              disabled={uploading}
              onClick={() => {
                setLocalPreview(null)
                onImageChange(null)
              }}
            >
              <X className="h-4 w-4" />
              Remove image
            </Button>
          ) : null}
        </div>
        {!courseId ? (
          <p className="text-xs text-muted-foreground">
            Cover upload is available when editing an existing course.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF · max 4 MB</p>
        )}
      </div>
    </div>
  )
}
