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
  slug?: string | null
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
  slug,
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
    <div className={compact ? "space-y-3" : "space-y-6"}>
      <div className="flex flex-wrap items-center gap-5">
        <OrgLogo
          slug={slug}
          logo={displayLogo}
          brandColor={brandColor}
          className="h-[4.5rem] w-[4.5rem] rounded-xl border border-[#e5e8ee]"
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
            className="h-10 gap-2 rounded-md border-[#dce0e6] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
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
          {!compact ? (
            <p className="text-xs text-[#94a3b8]">
              JPEG, PNG, WebP, GIF, or SVG · max 2 MB
            </p>
          ) : (
            <Label className="text-xs text-[#94a3b8]">Organization logo</Label>
          )}
        </div>
      </div>

      {onAppearanceChange ? (
        <div className="grid gap-5 sm:grid-cols-3">
          <LogoSlider
            label="Padding"
            value={appearance?.logo_padding ?? 0}
            max={24}
            suffix="px"
            onValueChange={(value) =>
              onAppearanceChange({
                logo_padding: value[0] ?? 0,
                logo_position_x: appearance?.logo_position_x ?? 50,
                logo_position_y: appearance?.logo_position_y ?? 50,
              })
            }
          />
          <LogoSlider
            label="Horizontal"
            value={appearance?.logo_position_x ?? 50}
            max={100}
            suffix="%"
            onValueChange={(value) =>
              onAppearanceChange({
                logo_padding: appearance?.logo_padding ?? 0,
                logo_position_x: value[0] ?? 50,
                logo_position_y: appearance?.logo_position_y ?? 50,
              })
            }
          />
          <LogoSlider
            label="Vertical"
            value={appearance?.logo_position_y ?? 50}
            max={100}
            suffix="%"
            onValueChange={(value) =>
              onAppearanceChange({
                logo_padding: appearance?.logo_padding ?? 0,
                logo_position_x: appearance?.logo_position_x ?? 50,
                logo_position_y: value[0] ?? 50,
              })
            }
          />
        </div>
      ) : null}
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium text-[#334155]">{label}</Label>
        <span className="font-mono text-xs tabular-nums text-[#94a3b8]">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={[value]}
        onValueChange={onValueChange}
        className="[&_[data-slot=slider-range]]:bg-[#0f172a] [&_[data-slot=slider-thumb]]:border-[#0f172a]"
      />
    </div>
  )
}
