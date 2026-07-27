import { useEffect } from "react"

/** Nudge Storyline to recalculate player scale after iframe load / viewport resize. */
export function notifyStorylineResize(iframe: HTMLIFrameElement | null) {
  if (!iframe) return
  try {
    const win = iframe.contentWindow
    if (!win) return
    win.dispatchEvent(new Event("resize"))
    const ds = (win as Window & { DS?: { pubSub?: { publish: (topic: string) => void } } }).DS
    ds?.pubSub?.publish?.("resize")
  } catch {
    /* same-origin only */
  }
}

export function useStorylineIframeFill(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return
    const iframe = iframeRef.current
    if (!iframe) return

    const timers: ReturnType<typeof setTimeout>[] = []

    const scheduleNotify = () => {
      notifyStorylineResize(iframe)
      for (const ms of [300, 800, 2000]) {
        timers.push(setTimeout(() => notifyStorylineResize(iframe), ms))
      }
    }

    const onLoad = () => scheduleNotify()
    const onResize = () => notifyStorylineResize(iframe)

    iframe.addEventListener("load", onLoad)
    window.addEventListener("resize", onResize)

    return () => {
      iframe.removeEventListener("load", onLoad)
      window.removeEventListener("resize", onResize)
      for (const id of timers) clearTimeout(id)
    }
  }, [enabled, iframeRef])
}
