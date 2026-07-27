/** Resolve stored logo/asset paths for display in the browser. */
export function assetUrl(stored: string | null | undefined): string {
  if (!stored) return ""
  if (stored.startsWith("http://") || stored.startsWith("https://")) return stored

  const [path, query] = stored.split("?", 2)
  if (path.startsWith("/api/lms/")) {
    return query ? `${path}?${query}` : path
  }

  const normalized = path.startsWith("/") ? path.slice(1) : path
  const resolved = `/api/lms/${normalized}`
  return query ? `${resolved}?${query}` : resolved
}
