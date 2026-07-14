"use client"

import { OrgLogo, type OrgLogoAppearance } from "@/components/org/org-logo"

type OrgBrandedBannerProps = OrgLogoAppearance & {
  name: string
  logo?: string | null
  industry?: string | null
  status?: string
}

export function OrgBrandedBanner({
  name,
  logo,
  industry,
  status,
  logo_padding,
  logo_position_x,
  logo_position_y,
}: OrgBrandedBannerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-none">
      <div
        className="h-2 w-full"
        style={{
          background: `linear-gradient(90deg, var(--org-primary, #0d9488), var(--org-accent, #14b8a6))`,
        }}
      />
      <div className="flex flex-wrap items-center gap-4 p-5">
        <OrgLogo
          logo={logo}
          name={name}
          className="h-14 w-14 rounded-xl"
          logo_padding={logo_padding}
          logo_position_x={logo_position_x}
          logo_position_y={logo_position_y}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {[industry, status ? status.charAt(0).toUpperCase() + status.slice(1) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
    </div>
  )
}
