"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, ImageIcon, Loader2, Maximize2, X } from "lucide-react"
import { toast } from "sonner"
import { GrowHeader } from "@/components/grow-shell"
import { Button } from "@/components/ui/button"
import { assetUrl } from "@/lib/asset-url"
import type { LearnAchievementsPayload } from "@/lib/learn-achievements-types"
import {
  CertificatePlaque,
  downloadPlaquePng,
  type PlaqueDetails,
} from "@/components/achievements/certificate-plaque"

function formatIssued(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

async function downloadPdf(certId: string, serial: string | null) {
  const res = await fetch(`/api/lms/certificates/${certId}/pdf`, { credentials: "include" })
  if (!res.ok) {
    const text = await res.text()
    let message = "Download failed"
    try {
      message = (JSON.parse(text) as { error?: string }).error ?? message
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${serial ?? certId}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function CertificatesCoursesPage({
  data,
  learnerName,
}: {
  data: LearnAchievementsPayload
  learnerName: string
}) {
  const completed = data.enrollments.filter((item) => item.completed)
  const inProgress = data.enrollments.filter((item) => !item.completed)
  const [openId, setOpenId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const cards = completed.map((enrollment) => {
    const cert = data.certificates.find((item) => item.course_id === enrollment.course_id)
    const details: PlaqueDetails = {
      learnerName,
      courseTitle: enrollment.course.title,
      coverUrl: cert?.course_image ?? enrollment.course.image ?? null,
      serial: cert?.serial_number ?? null,
      issuedLabel: cert ? formatIssued(cert.issued_at) : "Completed",
    }
    return { enrollment, cert, details }
  })

  const openCard = cards.find((card) => card.enrollment.id === openId) ?? null

  async function onPng(details: PlaqueDetails) {
    setBusy("png")
    try {
      await downloadPlaquePng(details)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the PNG")
    } finally {
      setBusy(null)
    }
  }

  async function onPdf(certId: string, serial: string | null) {
    setBusy("pdf")
    try {
      await downloadPdf(certId, serial)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download the PDF")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <GrowHeader
        title="Certificates and courses"
        accent="well done"
        description="Finished courses, cover photos, and your certificates"
      >
        <Button variant="outline" className="grow-btn-outline" asChild>
          <Link href="/achievements">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Achievements
          </Link>
        </Button>
      </GrowHeader>

      {completed.length > 0 ? (
        <section className="rounded-lg bg-[#1a1f2e] px-4 py-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffb199]">
            Congratulations
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            You finished {completed.length} course{completed.length === 1 ? "" : "s"}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            Each plaque below is your certificate for that course. Open it full screen, or download
            a high-resolution PNG or PDF.
          </p>
        </section>
      ) : (
        <section className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
          Finish a course to unlock a certificate plaque. Your enrolled courses are listed below.
        </section>
      )}

      {cards.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-2">
          {cards.map(({ enrollment, cert, details }) => (
            <article key={enrollment.id} className="space-y-3">
              <CertificatePlaque details={details} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpenId(enrollment.id)}>
                  <Maximize2 className="h-4 w-4" />
                  Full screen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => void onPng(details)}
                >
                  {busy === "png" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  PNG
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!cert || busy !== null}
                  onClick={() => cert && void onPdf(cert.id, cert.serial_number)}
                >
                  {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  PDF
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {inProgress.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Still in progress</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {inProgress.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.course_id}/learn`}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <div className="aspect-[4/3] bg-muted">
                  {enrollment.course.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={assetUrl(enrollment.course.image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="px-2.5 py-2">
                  <p className="line-clamp-2 text-xs font-semibold">{enrollment.course.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {enrollment.progress_percent}% complete
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {openCard ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/80 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white"
              disabled={busy !== null}
              onClick={() => void onPng(openCard.details)}
            >
              <ImageIcon className="h-4 w-4" />
              PNG
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!openCard.cert || busy !== null}
              onClick={() =>
                openCard.cert && void onPdf(openCard.cert.id, openCard.cert.serial_number)
              }
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="icon" className="bg-white" onClick={() => setOpenId(null)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto">
            <CertificatePlaque details={openCard.details} className="max-w-3xl" />
          </div>
        </div>
      ) : null}
    </>
  )
}
