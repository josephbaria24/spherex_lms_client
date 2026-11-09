"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Loader2, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

const PULL_THRESHOLD = 64
const MAX_PULL = 96

type PullToRefreshProps = {
  onRefresh: () => void | Promise<void>
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const refreshingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  onRefreshRef.current = onRefresh
  refreshingRef.current = refreshing

  const setPull = useCallback((value: number) => {
    pullDistanceRef.current = value
    setPullDistance(value)
  }, [])

  const resetPull = useCallback(() => {
    pulling.current = false
    setPull(0)
  }, [setPull])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || disabled) return

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return
      if (scroller.scrollTop > 0) return
      startY.current = e.touches[0]?.clientY ?? 0
      pulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshingRef.current) return
      if (scroller.scrollTop > 0) {
        pulling.current = false
        setPull(0)
        return
      }
      const currentY = e.touches[0]?.clientY ?? 0
      const delta = currentY - startY.current
      if (delta <= 0) {
        setPull(0)
        return
      }
      const resisted = Math.min(MAX_PULL, delta * 0.45)
      setPull(resisted)
      if (resisted > 8) e.preventDefault()
    }

    const onTouchEnd = () => {
      if (!pulling.current) {
        setPull(0)
        return
      }
      const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD && !refreshingRef.current
      if (!shouldRefresh) {
        resetPull()
        return
      }
      setRefreshing(true)
      setPull(PULL_THRESHOLD * 0.7)
      void Promise.resolve(onRefreshRef.current())
        .catch(() => {})
        .finally(() => {
          setRefreshing(false)
          resetPull()
        })
    }

    scroller.addEventListener("touchstart", onTouchStart, { passive: true })
    scroller.addEventListener("touchmove", onTouchMove, { passive: false })
    scroller.addEventListener("touchend", onTouchEnd)
    scroller.addEventListener("touchcancel", resetPull)

    return () => {
      scroller.removeEventListener("touchstart", onTouchStart)
      scroller.removeEventListener("touchmove", onTouchMove)
      scroller.removeEventListener("touchend", onTouchEnd)
      scroller.removeEventListener("touchcancel", resetPull)
    }
  }, [disabled, resetPull, setPull])

  const ready = pullDistance >= PULL_THRESHOLD
  const indicatorHeight = refreshing || pullDistance > 0 ? Math.max(pullDistance, refreshing ? 44 : 0) : 0

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none sticky top-0 z-10 flex justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: indicatorHeight }}
      >
        <div
          className={cn(
            "mt-2 flex h-8 items-center gap-1.5 rounded-full bg-background/95 px-3 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border/70",
            ready && !refreshing && "text-[#FF4B1A]",
          )}
        >
          {refreshing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing…
            </>
          ) : (
            <>
              <ArrowDown className={cn("h-3.5 w-3.5 transition-transform", ready && "rotate-180")} />
              {ready ? "Release to refresh" : "Pull to refresh"}
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
