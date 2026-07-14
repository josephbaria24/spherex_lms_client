import { assetUrl } from "@/lib/asset-url"

export function resolveVideoSrc(url: string): { kind: "youtube" | "file" | "external"; src: string } {
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  if (ytMatch?.[1]) {
    return { kind: "youtube", src: `https://www.youtube.com/embed/${ytMatch[1]}` }
  }
  if (url.startsWith("/uploads")) {
    return { kind: "file", src: assetUrl(url) }
  }
  return { kind: "external", src: url }
}

export function isEmbeddableArticulateUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith("/") ? `https://local.invalid${url}` : url)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return url.startsWith("/uploads/")
  }
}

/** Self-hosted packages under /uploads/scorm/ can use the LMS SCORM API (same origin). */
export function isScormTrackableUrl(url: string): boolean {
  return url.includes("/uploads/scorm/")
}

function packageBasePath(url: string): string {
  const trimmed = url.trim()
  if (/\.html?$/i.test(trimmed)) {
    return trimmed.replace(/\/[^/]+\.html?$/i, "")
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed
}

/** Storyline playback file — works without LMS API (new tab / preview). */
export function resolveArticulatePlaybackUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  if (trimmed.startsWith("/uploads")) {
    const base = packageBasePath(trimmed)
    return assetUrl(`${base}/story.html`)
  }

  try {
    const parsed = new URL(trimmed)
    if (/\.html?$/i.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/[^/]+\.html?$/i, "story.html")
      return parsed.toString()
    }
    const base = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`
    parsed.pathname = `${base}story.html`
    return parsed.toString()
  } catch {
    return trimmed
  }
}

/** SCORM launch file — requires parent window.API (in-app embed only). */
export function resolveArticulateScormLaunchUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  if (trimmed.startsWith("/uploads")) {
    const base = packageBasePath(trimmed)
    return assetUrl(`${base}/index_lms.html`)
  }

  try {
    const parsed = new URL(trimmed)
    if (/\.html?$/i.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/[^/]+\.html?$/i, "index_lms.html")
      return parsed.toString()
    }
    const base = parsed.pathname.endsWith("/") ? parsed.pathname : `${parsed.pathname}/`
    parsed.pathname = `${base}index_lms.html`
    return parsed.toString()
  } catch {
    return trimmed
  }
}

/** @deprecated use resolveArticulatePlaybackUrl or resolveArticulateScormLaunchUrl */
export function normalizeArticulateUrl(url: string): string {
  return resolveArticulatePlaybackUrl(url)
}

export function resolveArticulateLaunchUrl(url: string): {
  src: string
  playbackSrc: string
  trackable: boolean
}
export function resolveArticulateLaunchUrl(
  url: string,
  mode: "story" | "scorm",
): {
  src: string
  playbackSrc: string
  trackable: boolean
}
export function resolveArticulateLaunchUrl(
  url: string,
  mode: "story" | "scorm" = "story",
): {
  src: string
  playbackSrc: string
  trackable: boolean
} {
  const trackable = isScormTrackableUrl(url)
  const playbackSrc = resolveArticulatePlaybackUrl(url)
  const src = trackable && mode === "scorm" ? resolveArticulateScormLaunchUrl(url) : playbackSrc
  return { src, playbackSrc, trackable }
}
