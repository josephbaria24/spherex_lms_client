"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Share, X } from "lucide-react"

const DISMISS_KEY = "spherex-pwa-install-dismissed"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
}

function isIos() {
  const ua = navigator.userAgent
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  return /iphone|ipad|ipod/i.test(ua) || iPadOs
}

function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

function isDismissed() {
  const until = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
  return Number.isFinite(until) && until > Date.now()
}

function rememberDismiss() {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000))
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [visible, setVisible] = useState(false)
  const [showIosSteps, setShowIosSteps] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Install stays unavailable if registration fails. */
    })
  }, [])

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    const iphone = isIos()
    if (iphone) {
      setIos(true)
      setVisible(true)
    }

    const onPrompt = (event: Event) => {
      if (!isAndroid()) return
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setIos(false)
      setVisible(true)
    }

    const onInstalled = () => {
      setVisible(false)
      setDeferred(null)
    }

    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  useEffect(() => {
    const banner = bannerRef.current
    if (!visible || !banner) return
    const apply = () => {
      document.documentElement.style.setProperty("--pwa-banner-h", `${banner.offsetHeight}px`)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(banner)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty("--pwa-banner-h")
    }
  }, [visible, showIosSteps])

  async function install() {
    if (deferred) {
      await deferred.prompt()
      const choice = await deferred.userChoice
      setDeferred(null)
      if (choice.outcome === "accepted") setVisible(false)
      return
    }
    if (ios) setShowIosSteps(true)
  }

  function dismiss() {
    rememberDismiss()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      ref={bannerRef}
      className="pwa-install-banner fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#1a1f2e] text-white"
    >
      <div className="flex items-center gap-2 px-3 py-2 pl-14 md:pl-3">
        <p className="min-w-0 flex-1 text-sm leading-tight">
          Install SphereX on this phone
        </p>
        <button
          type="button"
          onClick={() => void install()}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-[#1a1f2e]"
        >
          <Download className="h-3.5 w-3.5" />
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {showIosSteps ? (
        <p className="flex items-center gap-1.5 px-3 pb-2 pl-14 text-xs text-white/80 md:pl-3">
          <Share className="h-3.5 w-3.5 shrink-0" />
          Tap Share, then Add to Home Screen.
        </p>
      ) : null}
    </div>
  )
}
