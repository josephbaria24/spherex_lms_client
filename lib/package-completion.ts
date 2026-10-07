const COMPLETION_PHRASES = [
  "thank you for completing this module",
  "thank you for completing this course",
  "thank you for completing the quiz",
  "you have successfully completed",
]

function collectFrameText(win: Window, depth: number): string {
  if (depth > 4) return ""
  let text = ""
  try {
    text = win.document?.body?.innerText || ""
    win.document?.querySelectorAll("iframe, frame").forEach((frame) => {
      const child = (frame as HTMLIFrameElement).contentWindow
      if (child) text += ` ${collectFrameText(child, depth + 1)}`
    })
  } catch {
    /* nested frame is not readable */
  }
  return text
}

/** iSpring Tin Can packages show an end screen without calling the SCORM API. */
export function packageFrameLooksComplete(win: Window): boolean {
  const normalized = collectFrameText(win, 0).replace(/\s+/g, " ").toLowerCase()
  return COMPLETION_PHRASES.some((phrase) => normalized.includes(phrase))
}
