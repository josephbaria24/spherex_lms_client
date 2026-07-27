"use client"

import { useEffect } from "react"
import { ReactLenis, useLenis } from "lenis/react"
import {
  landingScrollEase,
  LANDING_SCROLL_DURATION,
  registerLandingLenis,
} from "@/lib/landing-smooth-scroll"
import "lenis/dist/lenis.css"

function LenisRegistrar({ children }: { children: React.ReactNode }) {
  const lenis = useLenis()

  useEffect(() => {
    registerLandingLenis(lenis ?? null)
    return () => registerLandingLenis(null)
  }, [lenis])

  return <>{children}</>
}

/** Lenis smooth scrolling scoped to the marketing landing page */
export function LandingSmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: LANDING_SCROLL_DURATION,
        easing: landingScrollEase,
        smoothWheel: true,
        wheelMultiplier: 0.85,
        touchMultiplier: 1.4,
        syncTouch: false,
      }}
    >
      <LenisRegistrar>{children}</LenisRegistrar>
    </ReactLenis>
  )
}
