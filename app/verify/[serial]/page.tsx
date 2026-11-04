"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { LandingHeader } from "@/components/landing/landing-header"
import { apiGet } from "@/lib/api"
import { Button } from "@/components/ui/button"

type ResultRow = {
  quiz_id: string
  title: string
  skill: string
  score: number
  band_score: number | null
}

type Certificate = {
  valid: true
  kind: "ielts_preparation" | "course"
  holder_name: string
  serial_number: string
  issued_at: string
  title: string
  issuer: string
  disclaimer: string
  results?: ResultRow[]
}

export default function VerifySerialPage() {
  const params = useParams<{ serial: string }>()
  const serial = decodeURIComponent(params.serial ?? "")
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiGet<{ certificate: Certificate }>(`/certificates/verify/${encodeURIComponent(serial)}`)
      .then((data) => {
        if (!cancelled) setCertificate(data.certificate)
      })
      .catch((err) => {
        if (!cancelled) {
          setCertificate(null)
          setError(err instanceof Error ? err.message : "No certificate matches that serial number.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [serial])

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-neutral-950 dark:bg-background dark:text-foreground">
      <LandingHeader />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <Link href="/verify" className="text-sm font-medium text-[#FF4B1A] hover:underline">
          Check another serial
        </Link>
        {loading ? (
          <p className="mt-6 text-sm text-neutral-500">Looking up {serial}…</p>
        ) : error || !certificate ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/30 dark:bg-amber-950/20">
            <h1 className="text-xl font-semibold">Certificate not found</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              {error ?? "No certificate matches that serial number."}
            </p>
            <p className="mt-2 font-mono text-sm">{serial}</p>
          </div>
        ) : (
          <article className="mt-6 rounded-[1.75rem] border border-[#ebe4da] bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF4B1A]">
              Verified · {certificate.issuer}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Certificate of completion
            </h1>
            <p className="mt-1 text-lg font-medium">{certificate.title}</p>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">Holder</dt>
                <dd className="font-semibold">{certificate.holder_name}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Serial</dt>
                <dd className="font-mono font-semibold">{certificate.serial_number}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Issued</dt>
                <dd className="font-semibold">
                  {new Date(certificate.issued_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
            </dl>
            {certificate.results && certificate.results.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#ebe4da] text-xs uppercase tracking-wide text-neutral-500 dark:border-border">
                      <th className="py-2 pr-3 font-medium">Skill</th>
                      <th className="py-2 pr-3 font-medium">Test</th>
                      <th className="py-2 pr-3 font-medium">Score</th>
                      <th className="py-2 font-medium">Practice band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificate.results.map((row) => (
                      <tr key={row.quiz_id} className="border-b border-[#ebe4da]/70 dark:border-border">
                        <td className="py-2 pr-3">{row.skill}</td>
                        <td className="py-2 pr-3">{row.title}</td>
                        <td className="py-2 pr-3 tabular-nums">{row.score}%</td>
                        <td className="py-2 tabular-nums">
                          {row.band_score == null ? "—" : Number(row.band_score).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <p className="mt-6 text-sm leading-6 text-neutral-500 dark:text-muted-foreground">
              {certificate.disclaimer}
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-full">
              <Link href="/ielts">IELTS preparation</Link>
            </Button>
          </article>
        )}
      </main>
    </div>
  )
}
