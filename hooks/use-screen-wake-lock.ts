"use client"

import { useEffect } from "react"

/**
 * Keeps the phone screen awake while a learner is in a course / SCORM lesson.
 * Uses the Screen Wake Lock API; no-ops where unsupported.
 */
export function useScreenWakeLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (typeof navigator === "undefined") return
    const wakeLockApi = navigator.wakeLock
    if (!wakeLockApi?.request) return

    let lock: WakeLockSentinel | null = null
    let cancelled = false

    async function acquire() {
      if (cancelled || document.visibilityState !== "visible") return
      try {
        // Release any stale handle before requesting again
        if (lock) {
          try {
            await lock.release()
          } catch {
            // ignore
          }
          lock = null
        }
        lock = await wakeLockApi.request("screen")
        lock.addEventListener("release", () => {
          lock = null
        })
      } catch {
        // Browser denied (battery saver, permissions policy, etc.)
      }
    }

    void acquire()

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire()
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisibility)
      if (lock) {
        void lock.release().catch(() => {})
        lock = null
      }
    }
  }, [enabled])
}
