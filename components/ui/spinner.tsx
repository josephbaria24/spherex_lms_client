"use client"

import { HashLoader } from "react-spinners"
import { cn } from "@/lib/utils"

type SpinnerProps = {
  className?: string
  /** Pixel size passed to HashLoader. Default 40 for page loads; use 16–20 in buttons. */
  size?: number
  color?: string
}

/** Brand loading spinner — HashLoader in PetroCademia orange. */
export function Spinner({ className, size = 40, color = "#FF4B1A" }: SpinnerProps) {
  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      role="status"
      aria-label="Loading"
    >
      <HashLoader color={color} size={size} />
    </span>
  )
}

type PageLoaderProps = {
  label?: string
  className?: string
  size?: number
}

/** Centered page / section loader. */
export function PageLoader({ label, className, size = 40 }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 py-10",
        className,
      )}
    >
      <Spinner size={size} />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  )
}
