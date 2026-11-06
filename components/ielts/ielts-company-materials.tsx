"use client"

import { useEffect, useState } from "react"
import { FileText, Headphones, Lock } from "lucide-react"
import { apiGet } from "@/lib/api"
import {
  IELTS_ACADEMIC_KEYS,
  IELTS_ACADEMIC_MOCKS,
  type IeltsAcademicMaterial,
} from "@/lib/ielts-academic-materials"

export function IeltsCompanyMaterials({
  unlocked,
  onLocked,
}: {
  unlocked: boolean
  onLocked: (title: string) => void
}) {
  const [showAnswerKeys, setShowAnswerKeys] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiGet<{ show_answer_keys?: boolean }>("/reviewers/ielts/answer-keys")
      .then((data) => {
        if (!cancelled) setShowAnswerKeys(data.show_answer_keys === true)
      })
      .catch(() => {
        if (!cancelled) setShowAnswerKeys(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function openFile(title: string, href: string) {
    if (!unlocked) {
      onLocked(title)
      return
    }
    window.open(href, "_blank", "noopener,noreferrer")
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Academic mock exams</h3>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          Question papers and listening recordings from the company’s IELTS preparation. These are
          practice materials, not an official IELTS result.
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
        {IELTS_ACADEMIC_MOCKS.map((mock) => (
          <article
            key={mock.day}
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-2.5 sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#FF4B1A]">
                  {mock.day}
                </p>
                <h4 className="mt-0.5 text-xs font-semibold leading-4 text-foreground sm:text-sm">
                  {mock.title}
                </h4>
              </div>
              {!unlocked ? <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
            </div>
            {mock.note ? (
              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{mock.note}</p>
            ) : null}
            <div className="mt-2 flex flex-col gap-1.5">
              {mock.files.map((file) => (
                <FileButton key={file.id} file={file} onOpen={() => openFile(mock.title, file.href)} />
              ))}
            </div>
          </article>
        ))}
      </div>
      {showAnswerKeys ? (
        <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2">
          {IELTS_ACADEMIC_KEYS.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => openFile(file.title, file.href)}
              className="flex min-w-0 items-center gap-1.5 rounded-xl border border-[#FFD8C8] bg-[#FFF1EC] px-2 py-2 text-left text-[10px] font-semibold leading-4 text-[#FF4B1A] sm:px-3 sm:text-xs dark:border-[#FF4B1A]/30 dark:bg-[#FF4B1A]/15"
            >
              {!unlocked ? <Lock className="h-3 w-3 shrink-0" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
              <span className="truncate">{file.title}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function FileButton({
  file,
  onOpen,
}: {
  file: IeltsAcademicMaterial
  onOpen: () => void
}) {
  const Icon = file.kind === "audio" ? Headphones : FileText
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-[#FF4B1A] px-2 text-[11px] font-semibold text-white hover:bg-[#e84314] sm:h-8 sm:text-xs"
    >
      <Icon className="h-3.5 w-3.5" />
      {file.title}
    </button>
  )
}
