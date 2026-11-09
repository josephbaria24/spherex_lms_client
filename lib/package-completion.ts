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

  // Require the text to sit in the visible viewport (not an off-slide preload).
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

/** iSpring Tin Can packages show an end screen without calling the SCORM API. */
export function packageFrameLooksComplete(win: Window): boolean {
  const normalized = collectVisibleFrameText(win, 0).replace(/\s+/g, " ").toLowerCase()
  if (!normalized.trim()) return false
  return COMPLETION_PHRASES.some((phrase) => normalized.includes(phrase))
}
