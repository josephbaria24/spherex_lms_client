"use client"

import { assetUrl } from "@/lib/asset-url"
import { getOrgBrandLogoPadding, resolveOrgLogoSrc } from "@/lib/org-brand-logos"
import { cn } from "@/lib/utils"

export type OrgLogoAppearance = {
  logo_padding?: number | null
  logo_position_x?: number | null
  logo_position_y?: number | null
}

type OrgLogoProps = OrgLogoAppearance & {
  logo?: string | null
  slug?: string | null
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

/** Network-node mark — replaces the old building icon */
function OrgNetworkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <circle cx="24" cy="14" r="5" fill="currentColor" />
      <circle cx="14" cy="32" r="4.5" fill="currentColor" />
      <circle cx="34" cy="32" r="4.5" fill="currentColor" />
      <path
        d="M24 19v8M24 27l-7 3.5M24 27l7 3.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function OrgLogo({
  logo,
  slug,
  name,
  brandColor,
  className,
  imageClassName,
  logo_padding,
  logo_position_x,
  logo_position_y,
}: OrgLogoProps) {
  const logoSrc = resolveOrgLogoSrc(slug, logo, assetUrl)
  const brandPadding = getOrgBrandLogoPadding(slug)
  const appearance = normalizeLogoAppearance({
    logo_padding: logo_padding ?? brandPadding ?? undefined,
    logo_position_x,
    logo_position_y,
  })

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-border bg-white",
        !logoSrc && "bg-muted/40",
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
        <OrgNetworkMark className="h-[52%] w-[52%] text-current" />
      )}
    </div>
  )
}
