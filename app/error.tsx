"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SphereXLogo } from "@/components/logo"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app error]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f3ec] px-6 py-16 dark:bg-background">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <SphereXLogo className="h-10 w-auto" priority />
        </div>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e8dfd3] bg-white/80 shadow-sm dark:border-border dark:bg-card">
          <AlertTriangle className="h-6 w-6 text-[#e85d4a]" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1c1917] dark:text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">
          An unexpected error occurred. You can try again, or head back to a safe page.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            Ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={reset}
            className="rounded-full bg-[#1a1f2e] text-white hover:bg-[#252b3d] dark:bg-primary dark:text-primary-foreground"
          >
            Try again
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
