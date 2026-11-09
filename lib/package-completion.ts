import { ispringSuspendIndicatesFinished } from "@/lib/ispring-completion"

const COMPLETION_PHRASES = [
  "thank you for completing this module",
  "thank you for completing this course",
  "thank you for completing the quiz",
  "you have successfully completed",
]

function isVisiblyOnScreen(el: Element, win: Window): boolean {
  const html = el as HTMLElement
  if (!html.getBoundingClientRect) return false
  try {
    const style = win.getComputedStyle(html)
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0" ||
      style.pointerEvents === "none"
    ) {
      return false
    }
  } catch {
    return false
  }

  const rect = html.getBoundingClientRect()
  if (rect.width < 24 || rect.height < 12) return false

  const viewH = win.innerHeight || win.document.documentElement.clientHeight || 0
  const viewW = win.innerWidth || win.document.documentElement.clientWidth || 0
  if (viewH <= 0 || viewW <= 0) return false

  const verticallyVisible = rect.bottom > 8 && rect.top < viewH - 8
  const horizontallyVisible = rect.right > 8 && rect.left < viewW - 8
  return verticallyVisible && horizontallyVisible
}

function collectVisibleFrameText(win: Window, depth: number): string {
  if (depth > 4) return ""
  let text = ""
  try {
    const root = win.document?.body
    if (!root) return ""

    const walker = win.document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const value = node.textContent?.replace(/\s+/g, " ").trim()
      const parent = node.parentElement
      if (value && parent && isVisiblyOnScreen(parent, win)) {
        text += ` ${value}`
      }
      node = walker.nextNode()
    }

    win.document.querySelectorAll("iframe, frame").forEach((frame) => {
      const child = (frame as HTMLIFrameElement).contentWindow
      if (child) text += ` ${collectVisibleFrameText(child, depth + 1)}`
    })
  } catch {
    /* nested frame is not readable */
  }
  return text
}

function looksLikeLastSlideCounter(text: string): boolean {
  const matches = text.matchAll(/(\d+)\s*\/\s*(\d+)/g)
  for (const match of matches) {
    const current = Number(match[1])
    const total = Number(match[2])
    if (
      Number.isFinite(current) &&
      Number.isFinite(total) &&
      total >= 2 &&
      current === total
    ) {
      return true
    }
  }
  return false
}

function nextControlLooksDisabled(win: Window, depth = 0): boolean {
  if (depth > 4) return false
  try {
    const candidates = Array.from(
      win.document.querySelectorAll("button, [role='button'], a, div, span"),
    )
    for (const el of candidates) {
      const label = (el.textContent || el.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
      if (!label) continue
      if (!(label === "next" || label.startsWith("next ") || label.includes("next"))) continue
      if (label.length > 24) continue
      const html = el as HTMLElement
      const ariaDisabled = el.getAttribute("aria-disabled") === "true"
      const disabled = "disabled" in html && Boolean((html as HTMLButtonElement).disabled)
      const cls = (el.className || "").toString().toLowerCase()
      const looksDisabled =
        disabled ||
        ariaDisabled ||
        cls.includes("disabled") ||
        cls.includes("inactive") ||
        cls.includes("is-disabled")
      if (looksDisabled && isVisiblyOnScreen(el, win)) return true
    }
    for (const frame of Array.from(win.document.querySelectorAll("iframe, frame"))) {
      const child = (frame as HTMLIFrameElement).contentWindow
      if (child && nextControlLooksDisabled(child, depth + 1)) return true
    }
  } catch {
    /* nested frame is not readable */
  }
  return false
}

/** True when the package UI is parked on the final slide with nowhere left to go. */
export function packageFrameLooksAtEnd(win: Window): boolean {
  const normalized = collectVisibleFrameText(win, 0).replace(/\s+/g, " ").toLowerCase()
  if (!normalized.trim()) return false
  if (!looksLikeLastSlideCounter(normalized)) return false
  return nextControlLooksDisabled(win)
}

/** iSpring Tin Can packages show an end screen without calling the SCORM API. */
export function packageFrameLooksComplete(win: Window): boolean {
  const normalized = collectVisibleFrameText(win, 0).replace(/\s+/g, " ").toLowerCase()
  if (!normalized.trim()) return false
  if (COMPLETION_PHRASES.some((phrase) => normalized.includes(phrase))) return true
  return packageFrameLooksAtEnd(win)
}

export function suspendDataLooksComplete(suspendData: string | null | undefined): boolean {
  return ispringSuspendIndicatesFinished(suspendData)
}
