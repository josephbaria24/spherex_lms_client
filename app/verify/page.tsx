"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LandingHeader } from "@/components/landing/landing-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function VerifyCertificatePage() {
  const router = useRouter()
  const [serial, setSerial] = useState("")

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-neutral-950 dark:bg-background dark:text-foreground">
      <LandingHeader />
      <main className="mx-auto max-w-lg px-4 pb-20 pt-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF4B1A]">
          PetroCademia
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Verify a certificate</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-muted-foreground">
          Enter the serial number printed on a Petrosphere certificate of completion.
        </p>
        <form
          className="mt-6 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            const next = serial.trim()
            if (!next) return
            router.push(`/verify/${encodeURIComponent(next)}`)
          }}
        >
          <Input
            value={serial}
            onChange={(event) => setSerial(event.target.value)}
            placeholder="SPX-IELTS-2026-00001"
            className="h-11 rounded-full"
            autoComplete="off"
          />
          <Button type="submit" className="h-11 rounded-full bg-[#FF4B1A] px-6 text-white hover:bg-[#e84314]">
            Verify
          </Button>
        </form>
      </main>
    </div>
  )
}
