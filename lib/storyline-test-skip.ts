const skippedVideos = new WeakSet<HTMLMediaElement>()

function eachFrame(win: Window, visit: (frame: Window) => void, depth = 0) {
  if (depth > 6) return
  try {
    visit(win)
    win.document.querySelectorAll("iframe, frame").forEach((frame) => {
      const child = (frame as HTMLIFrameElement).contentWindow
      if (child) eachFrame(child, visit, depth + 1)
    })
  } catch {
    /* frame not readable yet */
  }
}

function finishVideo(media: HTMLMediaElement) {
  if (media.tagName !== "VIDEO" || skippedVideos.has(media) || media.ended) return
  if (!Number.isFinite(media.duration) || media.duration <= 0) return
  if (media.paused && media.currentTime <= 0) return
  skippedVideos.add(media)
  try {
    media.currentTime = Math.max(0, media.duration - 0.05)
  } catch {
    /* not seekable yet */
  }
  media.dispatchEvent(new Event("timeupdate"))
  media.dispatchEvent(new Event("ended"))
}

function markVisible(el: HTMLElement, display: string) {
  el.dataset.testSkip = "1"
  el.hidden = false
  el.style.setProperty("display", display, "important")
  el.style.setProperty("visibility", "visible", "important")
  el.style.setProperty("opacity", "1", "important")
}

function revealNextButton(win: Window) {
  const next = win.document.getElementById("next")
  if (!next) return
  next.setAttribute("aria-hidden", "false")
  markVisible(next, "inline-flex")
  next.style.setProperty("outline", "3px solid #facc15", "important")
  next.style.setProperty("z-index", "99999", "important")
}

function restoreNextButton(win: Window) {
  win.document.querySelectorAll<HTMLElement>("[data-test-skip]").forEach((el) => {
    delete el.dataset.testSkip
    for (const prop of ["display", "visibility", "opacity", "outline", "z-index"]) {
      el.style.removeProperty(prop)
    }
  })
}

/** End the current video and keep Storyline's Next control on screen. */
export function skipStorylineClip(win: Window) {
  eachFrame(win, (frame) => {
    frame.document.querySelectorAll("video").forEach((node) => {
      finishVideo(node as HTMLMediaElement)
    })
    revealNextButton(frame)
  })
}

export function clearStorylineTestSkip(win: Window) {
  eachFrame(win, restoreNextButton)
}
