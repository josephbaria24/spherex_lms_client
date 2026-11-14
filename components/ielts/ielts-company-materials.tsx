"use client"

import { useEffect, useState } from "react"
import { FileText, Headphones, Lock } from "lucide-react"
import { useAuth } from "@/app/provider"
import { apiGet } from "@/lib/api"
import { canAccessTeacherPanel } from "@/lib/roles"
import {
  IELTS_ACADEMIC_KEYS,
  IELTS_ACADEMIC_MOCKS,
  isMockOpenForSession,
  type IeltsAcademicMaterial,
} from "@/lib/ielts-academic-materials"

export function IeltsCompanyMaterials({
  unlocked,
  onLocked,
}: {
  unlocked: boolean
  onLocked: (title: string) => void
}) {
  const { user } = useAuth()
  const [showAnswerKeys, setShowAnswerKeys] = useState(false)
  const [mockSessionOpen, setMockSessionOpen] = useState(false)
  const [openMockIds, setOpenMockIds] = useState<string[]>([])
  const staff = canAccessTeacherPanel(user?.role)

  useEffect(() => {
    let cancelled = false
    apiGet<{
      show_answer_keys?: boolean
      mock_session_open?: boolean
      open_mock_ids?: string[]
    }>("/reviewers/ielts/answer-keys")
      .then((data) => {
        if (cancelled) return
        setShowAnswerKeys(data.show_answer_keys === true)
        setMockSessionOpen(data.mock_session_open === true)
        setOpenMockIds(Array.isArray(data.open_mock_ids) ? data.open_mock_ids : [])
      })
      .catch(() => {
        if (cancelled) return
        setShowAnswerKeys(false)
        setMockSessionOpen(false)
        setOpenMockIds([])
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

  const anyMockOpen =
    staff ||
    IELTS_ACADEMIC_MOCKS.some((mock) =>
      isMockOpenForSession(mock.id, mockSessionOpen, openMockIds),
    )
  const waitingForTrainer = unlocked && !anyMockOpen

  return (
    <section id="ielts-academic-mocks" className="scroll-mt-24 space-y-2">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Academic mock exams</h3>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {waitingForTrainer
            ? "Locked until your trainer starts the live session. Practice sets stay available."
            : anyMockOpen && unlocked
              ? "Your trainer has opened selected mock tests for this session."
              : "Question papers and listening recordings from the company’s IELTS preparation."}
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:gap-2 xl:grid-cols-3">
        {IELTS_ACADEMIC_MOCKS.map((mock) => {
          const mockOpen =
            staff || isMockOpenForSession(mock.id, mockSessionOpen, openMockIds)
          const locked = !unlocked || !mockOpen
          return (
            <article
              key={mock.id}
              className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-2 sm:rounded-2xl sm:p-3"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#FF4B1A]">
                    {mock.day}
                  </p>
                  <h4 className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-foreground sm:text-sm">
                    {mock.title}
                  </h4>
                </div>
                {locked ? <Lock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" /> : null}
              </div>
              {mock.note ? (
                <p className="mt-1 hidden text-[10px] leading-4 text-muted-foreground sm:line-clamp-2 sm:block">
                  {mock.note}
                </p>
              ) : null}
              <div className="mt-1.5 flex flex-col gap-1">
                {mock.files.map((file) => (
                  <FileButton
                    key={file.id}
                    file={file}
                    locked={locked}
                    onOpen={() => {
                      if (!unlocked) {
                        onLocked(mock.title)
                        return
                      }
                      if (!mockOpen) return
                      openFile(mock.title, file.href)
                    }}
                  />
                ))}
              </div>
            </article>
          )
        })}
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
  locked,
  onOpen,
}: {
  file: IeltsAcademicMaterial
  locked?: boolean
  onOpen: () => void
}) {
  const Icon = locked ? Lock : file.kind === "audio" ? Headphones : FileText
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={locked}
      className={
        locked
          ? "inline-flex h-6 cursor-not-allowed items-center justify-center gap-1 rounded-full bg-neutral-200 px-2 text-[10px] font-semibold text-neutral-500 sm:h-7 sm:text-[11px] dark:bg-muted dark:text-muted-foreground"
          : "inline-flex h-6 items-center justify-center gap-1 rounded-full bg-[#FF4B1A] px-2 text-[10px] font-semibold text-white hover:bg-[#e84314] sm:h-7 sm:text-[11px]"
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {file.title}
    </button>
  )
}
