"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LandingHeader } from "@/components/landing/landing-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiGet } from "@/lib/api"
import { Search } from "lucide-react"

type PublicCert = {
  serial_number: string
  course_title: string
  learner_name: string
  issued_at: string
  source: "lms" | "legacy" | "ielts"
}

export default function PublicCertificatesPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [serial, setSerial] = useState("")
  const [rows, setRows] = useState<PublicCert[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const load = useCallback(async (q: string) => {
    const query = q.trim()
    if (!query) {
      setRows([])
      setHasSearched(false)
      return
    }
    setLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      params.set("search", query)
      params.set("limit", "50")
      const data = await apiGet<{ certificates: PublicCert[] }>(
        `/certificates/registry?${params.toString()}`,
      )
      setRows(data.certificates ?? [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-neutral-950 dark:bg-background dark:text-foreground">
      <LandingHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF4B1A]">
          PetroCademia
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Certificate tracker</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-muted-foreground">
          Look up your own certificate by serial number or name. Certificate records are not listed
          publicly.
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
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Verify serial · e.g. PSI-ELA-LOTO-000007"
            className="h-11 rounded-full"
            autoComplete="off"
          />
          <Button
            type="submit"
            className="h-11 rounded-full bg-[#FF4B1A] px-6 text-white hover:bg-[#e84314]"
          >
            Verify
          </Button>
        </form>

        <form
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            void load(search)
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your name or serial…"
              className="h-11 rounded-full pl-11"
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="outline" className="h-11 rounded-full" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </Button>
        </form>

        {hasSearched ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#ebe4da] bg-white dark:border-border dark:bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#ebe4da] text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-border">
                    <th className="px-4 py-3 font-semibold">Serial</th>
                    <th className="px-4 py-3 font-semibold">Learner</th>
                    <th className="px-4 py-3 font-semibold">Training</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Issued</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-500">
                        Searching…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-500">
                        No certificates matched that search.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={`${row.serial_number}-${row.issued_at}`}
                        className="border-b border-[#f0ebe3] last:border-0 dark:border-border/60"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/verify/${encodeURIComponent(row.serial_number)}`}
                            className="font-mono text-sm font-semibold text-[#FF4B1A] hover:underline"
                          >
                            {row.serial_number}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{row.learner_name}</td>
                        <td className="px-4 py-3 text-sm">{row.course_title}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {row.source === "legacy"
                              ? "Previous platform"
                              : row.source === "ielts"
                                ? "IELTS prep"
                                : "PetroCademia"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {new Date(row.issued_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-[#ebe4da] bg-white/70 px-4 py-10 text-center text-sm text-neutral-500 dark:border-border dark:bg-card/50">
            Enter your name or serial above to find your certificate.
          </p>
        )}

        <p className="mt-4 text-xs text-neutral-500">
          Direct verify link:{" "}
          <Link href="/verify" className="font-medium text-[#FF4B1A] hover:underline">
            /verify
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
