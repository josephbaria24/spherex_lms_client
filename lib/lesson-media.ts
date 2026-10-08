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

function htmlFileName(url: string): string | null {
  const path = url.split("?")[0] ?? ""
  const name = path.split("/").pop() ?? ""
  return /\.html?$/i.test(name) ? name : null
}

/** Storyline keeps story.html / index_lms.html as siblings. iSpring uses res/index.html — do not rewrite that. */
function isStorylineSwapFile(name: string | null): boolean {
  if (!name) return false
  const lower = name.toLowerCase()
  return lower === "story.html" || lower === "index_lms.html"
}

function withHtmlFile(url: string, nextFile: string): string {
  if (/\.html?$/i.test(url.split("?")[0] ?? "")) {
    return url.replace(/\/[^/]+\.html?(?=$|\?)/i, `/${nextFile}`)
  }
  const base = url.endsWith("/") ? url.slice(0, -1) : url
  return `${base}/${nextFile}`
}

function resolveUploadedHtml(url: string, storylineFile: "story.html" | "index_lms.html"): string {
  const name = htmlFileName(url)
  if (name && !isStorylineSwapFile(name)) {
    return assetUrl(url)
  }
  if (isStorylineSwapFile(name)) {
    return assetUrl(withHtmlFile(url, storylineFile))
  }
  return assetUrl(`${packageBasePath(url)}/${storylineFile}`)
}

/** Playback file — Storyline story.html, or the package's own launch HTML (iSpring, etc.). */
export function resolveArticulatePlaybackUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  if (trimmed.startsWith("/uploads")) {
    return resolveUploadedHtml(trimmed, "story.html")
  }

  try {
    const parsed = new URL(trimmed)
    const name = htmlFileName(parsed.pathname)
    if (name && !isStorylineSwapFile(name)) return parsed.toString()
    parsed.pathname = withHtmlFile(parsed.pathname, "story.html")
    return parsed.toString()
  } catch {
    return trimmed
  }
}

/** iSpring Tin Can packages report quiz choices only when the launch URL names a record store. */
export function withIspringQuizCapture(launchUrl: string, courseId: string, lessonId: string): string {
  const trimmed = launchUrl.trim()
  if (!/\/res\/index\.html(?:$|\?)/i.test(trimmed)) return trimmed

  const url = new URL(trimmed, "http://spherex.local")
  const origin = typeof window === "undefined" ? "" : window.location.origin
  if (!origin) return trimmed

  url.searchParams.set("endpoint", `${origin}/api/lms/learn/courses/${courseId}/lessons/${lessonId}/xapi/`)
  url.searchParams.set(
    "actor",
    JSON.stringify({ name: "Learner", mbox: "mailto:learner@spherex.local" }),
  )
  url.searchParams.set("auth", `Basic ${btoa("spherex:xapi")}`)
  url.searchParams.set("activity_id", `urn:spherex:lesson:${lessonId}`)
  return `${url.pathname}${url.search}`
}

/** SCORM launch file — Storyline index_lms.html, or the stored launch HTML for other packages. */
export function resolveArticulateScormLaunchUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  if (trimmed.startsWith("/uploads")) {
    return resolveUploadedHtml(trimmed, "index_lms.html")
  }

  try {
    const parsed = new URL(trimmed)
    const name = htmlFileName(parsed.pathname)
    if (name && !isStorylineSwapFile(name)) return parsed.toString()
    parsed.pathname = withHtmlFile(parsed.pathname, "index_lms.html")
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
