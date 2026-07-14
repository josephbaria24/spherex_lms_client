"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { apiUploadFile } from "@/lib/api"
import { OrgLogo, type OrgLogoAppearance } from "@/components/org/org-logo"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

type OrgLogoUploadProps = {
  organizationId: string
  currentLogo: string | null
  uploadPath: string
  brandColor?: string | null
  onUploaded: (logoPath: string) => void
  appearance?: OrgLogoAppearance
  onAppearanceChange?: (appearance: Required<OrgLogoAppearance>) => void
  compact?: boolean
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml"

export function OrgLogoUpload({
  organizationId,
  currentLogo,
  uploadPath,
  brandColor,
  onUploaded,
  appearance,
  onAppearanceChange,
  compact = false,
}: OrgLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [cacheBust, setCacheBust] = useState(0)

  const displayLogo =
    preview || (currentLogo ? (cacheBust ? `${currentLogo}?v=${cacheBust}` : currentLogo) : null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be 2 MB or smaller")
      return
    }

    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const data = await apiUploadFile<{ logo: string }>(uploadPath, "logo", file)
      setCacheBust(Date.now())
      setPreview(null)
      onUploaded(data.logo)
      toast.success("Logo uploaded")
    } catch (err) {
      setPreview(null)
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <Label>{compact ? "Organization logo" : "Logo"}</Label>
      <div className="flex flex-wrap items-center gap-4">
        <OrgLogo
          logo={displayLogo}
          brandColor={brandColor}
          className="h-20 w-20 rounded-xl border-dashed"
          {...appearance}
        />
        <div className="space-y-2">
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
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-full"
            disabled={uploading}
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
                {displayLogo ? "Replace logo" : "Upload logo"}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Stored in <code className="rounded bg-muted px-1">uploads/organizations/{organizationId.slice(0, 8)}…/</code>
            <br />
            JPEG, PNG, WebP, GIF, or SVG · max 2 MB
          </p>
        </div>
      </div>
      {onAppearanceChange && (
        <LogoAppearanceSliders appearance={appearance} onChange={onAppearanceChange} />
      )}
    </div>
  )
}

function LogoAppearanceSliders({
  appearance,
  onChange,
}: {
  appearance?: OrgLogoAppearance
  onChange: (appearance: Required<OrgLogoAppearance>) => void
}) {
  const current = {
    logo_padding: appearance?.logo_padding ?? 0,
    logo_position_x: appearance?.logo_position_x ?? 50,
    logo_position_y: appearance?.logo_position_y ?? 50,
  }

  function update(key: keyof Required<OrgLogoAppearance>, value: number[]) {
    onChange({ ...current, [key]: value[0] ?? current[key] })
  }

  return (
    <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
      <LogoSlider
        label="Padding"
        value={current.logo_padding}
        max={24}
        suffix="px"
        onValueChange={(value) => update("logo_padding", value)}
      />
      <LogoSlider
        label="Horizontal position"
        value={current.logo_position_x}
        max={100}
        suffix="%"
        onValueChange={(value) => update("logo_position_x", value)}
      />
      <LogoSlider
        label="Vertical position"
        value={current.logo_position_y}
        max={100}
        suffix="%"
        onValueChange={(value) => update("logo_position_y", value)}
      />
    </div>
  )
}

function LogoSlider({
  label,
  value,
  max,
  suffix,
  onValueChange,
}: {
  label: string
  value: number
  max: number
  suffix: string
  onValueChange: (value: number[]) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-xs">{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Slider min={0} max={max} step={1} value={[value]} onValueChange={onValueChange} />
    </div>
  )
}
