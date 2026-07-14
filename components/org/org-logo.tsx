"use client"

import { Building2 } from "lucide-react"
import { assetUrl } from "@/lib/asset-url"
import { cn } from "@/lib/utils"

export type OrgLogoAppearance = {
  logo_padding?: number | null
  logo_position_x?: number | null
  logo_position_y?: number | null
}

type OrgLogoProps = OrgLogoAppearance & {
  logo?: string | null
  name?: string | null
  brandColor?: string | null
  className?: string
  imageClassName?: string
}

export const DEFAULT_LOGO_APPEARANCE = {
  logo_padding: 0,
  logo_position_x: 50,
  logo_position_y: 50,
} satisfies Required<OrgLogoAppearance>

export function normalizeLogoAppearance(appearance: OrgLogoAppearance): Required<OrgLogoAppearance> {
  return {
    logo_padding: clampNumber(appearance.logo_padding, 0, 24, DEFAULT_LOGO_APPEARANCE.logo_padding),
    logo_position_x: clampNumber(appearance.logo_position_x, 0, 100, DEFAULT_LOGO_APPEARANCE.logo_position_x),
    logo_position_y: clampNumber(appearance.logo_position_y, 0, 100, DEFAULT_LOGO_APPEARANCE.logo_position_y),
  }
}

function clampNumber(value: number | null | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

export function OrgLogo({
  logo,
  name,
  brandColor,
  className,
  imageClassName,
  logo_padding,
  logo_position_x,
  logo_position_y,
}: OrgLogoProps) {
  const logoSrc = assetUrl(logo)
  const appearance = normalizeLogoAppearance({
    logo_padding,
    logo_position_x,
    logo_position_y,
  })

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-border bg-muted/40",
        className,
      )}
      style={brandColor && !logoSrc ? { backgroundColor: `${brandColor}22`, color: brandColor } : undefined}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={name ? `${name} logo` : "Organization logo"}
          className={cn("h-full w-full object-contain", imageClassName)}
          style={{
            padding: appearance.logo_padding,
            objectPosition: `${appearance.logo_position_x}% ${appearance.logo_position_y}%`,
          }}
        />
      ) : (
        <Building2 className="h-1/2 w-1/2 text-current" />
      )}
    </div>
  )
}
