/** Shared easing — soft ease-out expo for long, silky section jumps */
export function landingScrollEase(t: number) {
  return Math.min(1, 1.001 - Math.pow(2, -10 * t))
}

export const LANDING_SCROLL_DURATION = 1.65
export const LANDING_SCROLL_OFFSET = -72

type ScrollTarget = string | number | HTMLElement

type LenisLike = {
  scrollTo: (
    target: ScrollTarget,
    options?: {
      offset?: number
      duration?: number
      easing?: (t: number) => number
    },
  ) => void
}

let landingLenis: LenisLike | null = null

export function registerLandingLenis(instance: LenisLike | null) {
  landingLenis = instance
}

/** Smooth-scroll to a section id (or element). Prefers Lenis when active. */
export function smoothScrollToSection(
  id: string,
  options?: { offset?: number; duration?: number },
) {
  if (typeof window === "undefined") return

  const el = document.getElementById(id)
  if (!el) return

  const offset = options?.offset ?? LANDING_SCROLL_OFFSET
  const duration = options?.duration ?? LANDING_SCROLL_DURATION

  if (landingLenis) {
    landingLenis.scrollTo(el, {
      offset,
      duration,
      easing: landingScrollEase,
    })
    return
  }

  const start = window.scrollY
  const end = el.getBoundingClientRect().top + window.scrollY + offset
  const distance = end - start
  const startTime = performance.now()
  const ms = duration * 1000

  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / ms)
    window.scrollTo(0, start + distance * landingScrollEase(t))
    if (t < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}
