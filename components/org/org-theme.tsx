"use client"

import { useOrgAdmin } from "@/components/org/org-provider"

const DEFAULT_PRIMARY = "#0d9488"
const DEFAULT_ACCENT = "#14b8a6"

export function OrgTheme({ children }: { children: React.ReactNode }) {
  const { selectedOrg } = useOrgAdmin()
  const primary = selectedOrg?.brand_primary || DEFAULT_PRIMARY
  const accent = selectedOrg?.brand_accent || DEFAULT_ACCENT

  return (
    <div
      style={
        {
          "--org-primary": primary,
          "--org-accent": accent,
        } as React.CSSProperties
      }
      className="org-themed"
    >
      {children}
    </div>
  )
}
