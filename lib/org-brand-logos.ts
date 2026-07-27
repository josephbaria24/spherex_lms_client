/** Static brand logos for known partner organizations. */
const ORG_BRAND_LOGOS: Record<string, string> = {
  petrosphere: "/logos/petrosphere.png",
  tesda: "/logos/tesda.png",
}

const ORG_BRAND_LOGO_PADDING: Record<string, number> = {
  petrosphere: 6,
  tesda: 4,
}

function normalizeSlug(slug: string | null | undefined): string {
  return (slug ?? "").trim().toLowerCase()
}

export function getOrgBrandLogo(slug: string | null | undefined): string | null {
  const key = normalizeSlug(slug)
  return key ? (ORG_BRAND_LOGOS[key] ?? null) : null
}

export function getOrgBrandLogoPadding(slug: string | null | undefined): number | null {
  const key = normalizeSlug(slug)
  return key ? (ORG_BRAND_LOGO_PADDING[key] ?? null) : null
}

/** Prefer curated brand assets for known slugs, then uploaded logo. */
export function resolveOrgLogoSrc(
  slug: string | null | undefined,
  uploaded: string | null | undefined,
  assetUrl: (stored: string | null | undefined) => string,
): string {
  const brand = getOrgBrandLogo(slug)
  if (brand) return brand
  return assetUrl(uploaded)
}
