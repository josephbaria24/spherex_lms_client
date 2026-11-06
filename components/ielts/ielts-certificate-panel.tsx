"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Award, Download, Info } from "lucide-react"
import { useAuth } from "@/app/provider"
import { apiGet, apiPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type TestRow = {
  id: string
  title: string
  skill: string
  passed: boolean
  best_score: number | null
  band_score: number | null
}

type Certificate = {
  id: string
  serial_number: string
  issued_at: string
  holder_name: string
  results: {
    quiz_id: string
    title: string
    skill: string
    score: number
    band_score: number | null
  }[]
}

type Status = {
  total: number
  passed: number
  eligible: boolean
  tests: TestRow[]
  certificate: Certificate | null
}

export function IeltsCertificatePanel() {
  const { user, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(false)
  const [issuing, setIssuing] = useState(false)

  const load = useCallback(async () => {
    if (!user) {
      setStatus(null)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<Status>("/reviewers/ielts/certificate")
      setStatus(data)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) void load()
  }, [authLoading, load])

  async function claim() {
    setIssuing(true)
    try {
      await apiPost("/reviewers/ielts/certificate")
      toast.success("Certificate issued")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not issue the certificate")
    } finally {
      setIssuing(false)
    }
  }

  async function download() {
    const serial = status?.certificate?.serial_number ?? "ielts-certificate"
    const res = await fetch("/api/lms/reviewers/ielts/certificate/pdf", { credentials: "include" })
    if (!res.ok) {
      toast.error("Could not download the certificate")
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${serial}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pct =
    status && status.total > 0 ? Math.round((status.passed / status.total) * 100) : 0

  return (
    <section
      id="certificate"
      className="mx-auto mt-6 max-w-3xl rounded-2xl border border-[#ebe4da] bg-white p-3 text-left shadow-sm sm:mt-8 sm:rounded-[1.5rem] sm:p-4 dark:border-border dark:bg-card"
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFE8E0] text-[#FF4B1A]">
          <Award className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
            Certificate of completion
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Pass every published practice test while signed in. The certificate lists your scores
            and a serial number. It is not an official IELTS result.
          </p>
        </div>
      </div>

      {authLoading || (user && loading) ? (
        <p className="mt-4 text-sm text-slate-500">Checking your practice results…</p>
      ) : !user ? (
        <Link
          href="/login?next=/ielts"
          className="mt-4 inline-flex h-10 items-center rounded-full bg-[#FF4B1A] px-5 text-sm font-semibold text-white hover:bg-[#e84314]"
        >
          Sign in to track results
        </Link>
      ) : status ? (
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900 dark:text-white">
                {status.passed} of {status.total} practice tests passed
              </span>
              <span className="tabular-nums text-slate-500">{pct}%</span>
            </div>
            <Progress
              value={pct}
              className="mt-2 h-1.5 [&_[data-slot=progress-indicator]]:bg-[#FF4B1A]"
            />
          </div>

          {status.certificate ? (
            <div className="rounded-2xl border border-[#ebe4da] bg-[#faf8f5] p-4 dark:border-border dark:bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#FF4B1A]">
                Issued to {status.certificate.holder_name}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                {status.certificate.serial_number}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(status.certificate.issued_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-9 rounded-full bg-[#FF4B1A] text-white hover:bg-[#e84314]"
                  onClick={() => void download()}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download PDF
                </Button>
                <Button asChild variant="outline" className="h-9 rounded-full">
                  <Link href={`/verify/${status.certificate.serial_number}`}>Verify serial</Link>
                </Button>
              </div>
            </div>
          ) : status.eligible ? (
            <Button
              type="button"
              disabled={issuing}
              className="h-9 rounded-full bg-[#FF4B1A] px-4 text-white hover:bg-[#e84314]"
              onClick={() => void claim()}
            >
              {issuing ? "Issuing…" : "Get certificate"}
            </Button>
          ) : (
            <div className="flex items-start gap-2 rounded-xl bg-[#f4f7f9] px-3 py-2.5 text-xs leading-5 text-slate-600 dark:bg-muted/40 dark:text-slate-300">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF4B1A]" />
              <p>Pass the remaining tests to unlock your certificate.</p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}
