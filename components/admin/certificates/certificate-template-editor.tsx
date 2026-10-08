"use client"

import { useEffect, useRef, useState } from "react"
import { Award, Eye, Loader2, Plus, Save, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiGet, apiPut, apiUploadFile } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"

type Align = "left" | "center" | "right"
type FontWeight = "normal" | "bold"
type FontStyle = "normal" | "italic"
type FontFamily = "Helvetica" | "Times"
type PageSize = "a4-landscape" | "a4-portrait" | "letter-landscape" | "letter-portrait"

export type CertificateField = {
  id: string
  label: string
  value: string
  x: number
  y: number
  fontSize: number
  boxWidth?: number
  boxHeight?: number
  fontWeight: FontWeight
  fontStyle: FontStyle
  fontFamily: FontFamily
  color: string
  align: Align
}

type Template = {
  image_path: string | null
  fields: CertificateField[]
  page_size: PageSize
  canvas_width: number
  canvas_height: number
}

const PAGE_SIZES: { value: PageSize; label: string; width: number; height: number }[] = [
  { value: "a4-landscape", label: "A4 landscape", width: 842, height: 595 },
  { value: "a4-portrait", label: "A4 portrait", width: 595, height: 842 },
  { value: "letter-landscape", label: "Letter landscape", width: 792, height: 612 },
  { value: "letter-portrait", label: "Letter portrait", width: 612, height: 792 },
]

const PLACEHOLDERS = [
  { token: "{{learner_name}}", label: "Learner name" },
  { token: "{{course_title}}", label: "Course title" },
  { token: "{{completion_date}}", label: "Completion date" },
  { token: "{{certificate_number}}", label: "Certificate number" },
  { token: "{{learner_picture}}", label: "Learner photo" },
]

function defaultFields(width: number, height: number): CertificateField[] {
  const cx = Math.round(width / 2)
  return [
    field("name", "Learner name", "{{learner_name}}", cx, Math.round(height * 0.42), 32, "bold"),
    field("course", "Course title", "{{course_title}}", cx, Math.round(height * 0.52), 16, "normal"),
    field(
      "date",
      "Completion date",
      "Completed on {{completion_date}}",
      cx,
      Math.round(height * 0.6),
      13,
      "normal",
    ),
    field(
      "serial",
      "Certificate number",
      "Certificate No. {{certificate_number}}",
      cx,
      Math.round(height * 0.68),
      12,
      "normal",
    ),
  ]
}

function field(
  id: string,
  label: string,
  value: string,
  x: number,
  y: number,
  fontSize: number,
  fontWeight: FontWeight,
): CertificateField {
  return {
    id,
    label,
    value,
    x,
    y,
    fontSize,
    fontWeight,
    fontStyle: "normal",
    fontFamily: "Helvetica",
    color: fontWeight === "bold" ? "#1a1f2e" : "#6b5c4f",
    align: "center",
  }
}

function previewText(value: string, courseTitle: string): string {
  if (value.trim() === "{{learner_picture}}") return ""
  return value
    .replaceAll("{{learner_name}}", "Jordan Reyes")
    .replaceAll("{{trainee_name}}", "Jordan Reyes")
    .replaceAll("{{course_title}}", courseTitle || "Course title")
    .replaceAll("{{course_name}}", courseTitle || "Course title")
    .replaceAll("{{completion_date}}", "October 8, 2026")
    .replaceAll("{{certificate_number}}", "SPX-CERT-2026-00001")
}

function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth || 842, height: img.naturalHeight || 595 })
    img.onerror = () => reject(new Error("Could not read the image size"))
    img.src = src
  })
}

export function CertificateTemplateEditor({
  courseId,
  courseTitle,
}: {
  courseId: string
  courseTitle: string
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(false)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<PageSize>("a4-landscape")
  const [canvas, setCanvas] = useState({ width: 842, height: 595 })
  const [fields, setFields] = useState<CertificateField[]>(() => defaultFields(842, 595))
  const [selectedId, setSelectedId] = useState<string | null>("name")
  const [displayWidth, setDisplayWidth] = useState(720)
  const stageRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    apiGet<{ template: Template | null }>(`/certificates/templates/${courseId}`)
      .then(async (data) => {
        if (cancelled) return
        const template = data.template
        if (!template) return
        setPageSize(template.page_size || "a4-landscape")
        setImagePath(template.image_path)
        setCanvas({
          width: template.canvas_width || 842,
          height: template.canvas_height || 595,
        })
        if (template.fields?.length) {
          setFields(template.fields)
          setSelectedId(template.fields[0]?.id ?? null)
        }
        if (template.image_path) {
          try {
            const size = await loadImageSize(assetUrl(template.image_path))
            if (!cancelled) setCanvas(size)
          } catch {
            // Keep the stored canvas size.
          }
        }
      })
      .catch(() => toast.error("Could not load the certificate template"))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [courseId])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const sync = () => setDisplayWidth(el.clientWidth)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  const scale = displayWidth / canvas.width
  const displayHeight = canvas.height * scale
  const selected = fields.find((item) => item.id === selectedId) ?? null

  const updateSelected = (patch: Partial<CertificateField>) => {
    if (!selectedId) return
    setFields((current) =>
      current.map((item) => (item.id === selectedId ? { ...item, ...patch } : item)),
    )
  }

  const addField = (picture = false) => {
    const id = `field-${Date.now()}`
    const next: CertificateField = picture
      ? {
          ...field(id, "Learner photo", "{{learner_picture}}", 48, 48, 14, "normal"),
          align: "left",
          boxWidth: 140,
          boxHeight: 140,
        }
      : field(id, "Text", "New text", Math.round(canvas.width / 2), Math.round(canvas.height / 2), 16, "normal")
    setFields((current) => [...current, next])
    setSelectedId(id)
  }

  const onUpload = async (file: File) => {
    setUploading(true)
    try {
      const res = await apiUploadFile<{ image_path: string }>(
        `/certificates/templates/${courseId}/image`,
        "image",
        file,
      )
      const size = await loadImageSize(assetUrl(res.image_path))
      setImagePath(res.image_path)
      setCanvas(size)
      toast.success("Background uploaded. Save the layout to keep field positions.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await apiPut(`/certificates/templates/${courseId}`, {
        fields,
        page_size: pageSize,
        canvas_width: canvas.width,
        canvas_height: canvas.height,
      })
      toast.success("Certificate template saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the template")
    } finally {
      setSaving(false)
    }
  }

  const startDrag = (event: React.PointerEvent, item: CertificateField) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedId(item.id)
    const startX = event.clientX
    const startY = event.clientY
    const originX = item.x
    const originY = item.y
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / scale
      const dy = (ev.clientY - startY) / scale
      setFields((current) =>
        current.map((fieldItem) =>
          fieldItem.id === item.id
            ? {
                ...fieldItem,
                x: Math.round(Math.min(canvas.width, Math.max(0, originX + dx))),
                y: Math.round(Math.min(canvas.height, Math.max(0, originY + dy))),
              }
            : fieldItem,
        ),
      )
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading certificate template…</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) void onUpload(file)
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload background
          </Button>
          <Button
            type="button"
            variant={preview ? "default" : "outline"}
            size="sm"
            onClick={() => setPreview((on) => !on)}
          >
            <Eye className="h-4 w-4" />
            {preview ? "Editing" : "Preview"}
          </Button>
          <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save template
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Drag a field to place it. Placeholders fill in with the learner, course, date, and serial
          number when the PDF is issued.
        </p>
        <div ref={stageRef} className="overflow-hidden rounded-xl border bg-[#f4f1ec] p-3 dark:bg-muted/30">
          <div
            className="relative mx-auto overflow-hidden bg-white shadow-sm"
            style={{ width: displayWidth, height: displayHeight }}
            onPointerDown={() => setSelectedId(null)}
          >
            {imagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assetUrl(imagePath)}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-fill"
              />
            ) : (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                <Award className="mr-2 h-4 w-4" />
                Upload a certificate background
              </div>
            )}
            {fields.map((item) => {
              const picture = item.value.trim() === "{{learner_picture}}"
              const text = preview ? previewText(item.value, courseTitle) : item.value
              const selectedField = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`absolute max-w-none cursor-grab touch-none select-none whitespace-nowrap border bg-transparent p-0 leading-none ${
                    selectedField ? "border-[#e85d4a]" : "border-transparent hover:border-[#e85d4a]/50"
                  }`}
                  style={{
                    left: item.x * scale,
                    top: item.y * scale,
                    transform:
                      item.align === "center"
                        ? "translateX(-50%)"
                        : item.align === "right"
                          ? "translateX(-100%)"
                          : undefined,
                    fontSize: Math.max(8, item.fontSize * scale),
                    fontWeight: item.fontWeight === "bold" ? 700 : 400,
                    fontStyle: item.fontStyle,
                    fontFamily: item.fontFamily === "Times" ? "Times New Roman, serif" : "Helvetica, Arial, sans-serif",
                    color: item.color,
                    width: picture ? (item.boxWidth ?? 140) * scale : undefined,
                    height: picture ? (item.boxHeight ?? 140) * scale : undefined,
                  }}
                  onPointerDown={(event) => startDrag(event, item)}
                >
                  {picture ? (
                    <span className="flex h-full w-full items-center justify-center border border-dashed border-current text-[10px]">
                      Photo
                    </span>
                  ) : (
                    text || " "
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <aside className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-2">
          <Label>Page size</Label>
          <Select
            value={pageSize}
            onValueChange={(value) => {
              const next = value as PageSize
              setPageSize(next)
              if (!imagePath) {
                const spec = PAGE_SIZES.find((item) => item.value === next)
                if (spec) setCanvas({ width: spec.width, height: spec.height })
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => addField(false)}>
            <Plus className="h-4 w-4" />
            Text
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => addField(true)}>
            <Plus className="h-4 w-4" />
            Photo
          </Button>
        </div>

        <div className="space-y-1">
          {fields.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${
                item.id === selectedId ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              }`}
              onClick={() => setSelectedId(item.id)}
            >
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="space-y-3 border-t pt-3">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={selected.label} onChange={(event) => updateSelected({ label: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Text</Label>
              <Textarea
                value={selected.value}
                rows={3}
                onChange={(event) => updateSelected({ value: event.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {PLACEHOLDERS.map((item) => (
                <Button
                  key={item.token}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => {
                    if (item.token === "{{learner_picture}}") {
                      updateSelected({
                        value: item.token,
                        boxWidth: selected.boxWidth ?? 140,
                        boxHeight: selected.boxHeight ?? 140,
                      })
                      return
                    }
                    updateSelected({ value: `${selected.value}${selected.value ? " " : ""}${item.token}` })
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            {selected.value.trim() === "{{learner_picture}}" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Width</Label>
                  <Input
                    type="number"
                    min={40}
                    value={selected.boxWidth ?? 140}
                    onChange={(event) => updateSelected({ boxWidth: Number(event.target.value) || 140 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Height</Label>
                  <Input
                    type="number"
                    min={40}
                    value={selected.boxHeight ?? 140}
                    onChange={(event) => updateSelected({ boxHeight: Number(event.target.value) || 140 })}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Size</Label>
                    <Input
                      type="number"
                      min={8}
                      max={120}
                      value={selected.fontSize}
                      onChange={(event) => updateSelected({ fontSize: Number(event.target.value) || 16 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Color</Label>
                    <Input
                      type="color"
                      value={selected.color}
                      onChange={(event) => updateSelected({ color: event.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Weight</Label>
                    <Select
                      value={selected.fontWeight}
                      onValueChange={(value) => updateSelected({ fontWeight: value as FontWeight })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Align</Label>
                    <Select
                      value={selected.align}
                      onValueChange={(value) => updateSelected({ align: value as Align })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Style</Label>
                    <Select
                      value={selected.fontStyle}
                      onValueChange={(value) => updateSelected({ fontStyle: value as FontStyle })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="italic">Italic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Font</Label>
                    <Select
                      value={selected.fontFamily}
                      onValueChange={(value) => updateSelected({ fontFamily: value as FontFamily })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times">Times</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-destructive"
              onClick={() => {
                setFields((current) => current.filter((item) => item.id !== selected.id))
                setSelectedId(null)
              }}
            >
              <Trash2 className="h-4 w-4" />
              Remove field
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Select a field to edit its text and style.</p>
        )}
      </aside>
    </div>
  )
}
