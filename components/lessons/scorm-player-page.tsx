"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { apiGet } from "@/lib/api"
import {
  isScormTrackableUrl,
  resolveArticulateScormLaunchUrl,
  withIspringQuizCapture,
} from "@/lib/lesson-media"
import type { Lesson } from "@/lib/lesson-types"
import { packageFrameLooksComplete } from "@/lib/package-completion"
import {
  buildScormSessionCmi,
  createPersistentScorm12Api,
  hasScormBookmark,
  installScorm12Api,
  loadScormCmi,
  suspendScormContentFrame,
  type Scorm12Api,
} from "@/lib/scorm-api"
import { notifyStorylineResize, useStorylineIframeFill } from "@/lib/storyline-iframe-fill"

type RotateMode = "off" | "native" | "css"

function RotateScreenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="8" width="13" height="8" rx="1.5" />
      <path d="M16.5 6.2A6.2 6.2 0 0 1 21.5 12" />
      <path d="m16.2 3.8.4 3.2 3-.8" />
    </svg>
  )
}

async function unlockScreenOrientation() {
  try {
    screen.orientation?.unlock()
  } catch {
    /* not locked */
  }
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen()
    } catch {
      /* ignore */
    }
  }
}

type OutlineLesson = Lesson & { completed?: boolean; locked?: boolean }

type ScormPlayerPageProps = {
  courseId: string
  lessonId: string
  backHref: string
  /** Base path for lesson pages, e.g. `/courses/:id/learn` */
  learnBasePath?: string
  previewMode?: boolean
  fresh?: boolean
}

export function ScormPlayerPage({
  courseId,
  lessonId,
  backHref,
  learnBasePath,
  previewMode = false,
  fresh = false,
}: ScormPlayerPageProps) {
  const router = useRouter()
  const [lessonTitle, setLessonTitle] = useState("Lesson")
  const [launchUrl, setLaunchUrl] = useState<string | null>(null)
  const [resumeNote, setResumeNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lessonFinished, setLessonFinished] = useState(false)
  const [nextLesson, setNextLesson] = useState<{ id: string; title: string } | null>(null)
  const [goingNext, setGoingNext] = useState(false)
  const [rotateMode, setRotateMode] = useState<RotateMode>("off")
  const apiRef = useRef<Scorm12Api | null>(null)
  const flushRef = useRef<(() => Promise<void>) | null>(null)
  const markCompletedRef = useRef<(() => Promise<void>) | null>(null)
  const uninstallRef = useRef<(() => void) | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const exitingRef = useRef(false)

  const resolvedLearnBase =
    learnBasePath ?? (backHref.replace(/\/[^/]+\/?$/, "") || backHref)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const { lesson } = await apiGet<{ lesson: Lesson }>(
          `/learn/courses/${courseId}/lessons/${lessonId}`,
        )

        if (cancelled) return

        if (lesson.content_type !== "articulate" || !lesson.articulate_url) {
          setError("This lesson is not an Articulate package.")
          return
        }

        if (!isScormTrackableUrl(lesson.articulate_url)) {
          setError("SCORM player requires an uploaded package (same-origin /uploads/scorm/).")
          return
        }

        if ((lesson.articulate_launch_mode ?? "story") !== "scorm") {
          setError(
            'Set this lesson\'s launch mode to "SCORM LMS mode" in the lesson editor, then try again.',
          )
          return
        }

        const scormLaunch = resolveArticulateScormLaunchUrl(lesson.articulate_url)
        const launch = new URL(scormLaunch, window.location.href)
        if (launch.origin !== window.location.origin) {
          setError("SCORM launch URL must be served from this app (uploaded package).")
          return
        }

        setLessonTitle(lesson.title)

        const { cmi, preview } = await loadScormCmi(courseId, lessonId)
        if (cancelled) return

        const isPreview = previewMode || preview
        const sessionValues = buildScormSessionCmi(cmi, fresh)
        const initialCmi = { ...cmi, ...sessionValues }

        if (!fresh && !hasScormBookmark(cmi)) {
          setResumeNote("No saved slide bookmark yet — starting from the beginning.")
        } else if (!fresh && hasScormBookmark(cmi)) {
          setResumeNote("Resuming from your last saved position.")
        }

        const { api, flush, markCompleted } = createPersistentScorm12Api({
          courseId,
          lessonId,
          previewMode: isPreview,
          initialCmi,
          onLessonCompleted: () => {
            if (cancelled) return
            setLessonFinished(true)
            void loadNextLesson()
          },
        })
        apiRef.current = api
        flushRef.current = flush
        markCompletedRef.current = markCompleted
        uninstallRef.current = installScorm12Api(api)

        if (!cancelled) {
          setLaunchUrl(
            isPreview ? scormLaunch : withIspringQuizCapture(scormLaunch, courseId, lessonId),
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not start SCORM player")
        }
      }
    }

    async function loadNextLesson() {
      try {
        const outline = await apiGet<{ lessons: OutlineLesson[] }>(
          `/learn/courses/${courseId}`,
        )
        const lessons = outline.lessons ?? []
        const idx = lessons.findIndex((l) => l.id === lessonId)
        if (idx < 0 || idx >= lessons.length - 1) {
          setNextLesson(null)
          return
        }
        const candidate = lessons[idx + 1]
        if (!candidate || candidate.locked) {
          setNextLesson(null)
          return
        }
        setNextLesson({ id: candidate.id, title: candidate.title })
      } catch {
        setNextLesson(null)
      }
    }

    void boot()

    return () => {
      cancelled = true
      if (!exitingRef.current) {
        suspendScormContentFrame(iframeRef.current)
        void flushRef.current?.()
      }
      uninstallRef.current?.()
      apiRef.current = null
      flushRef.current = null
      markCompletedRef.current = null
      uninstallRef.current = null
    }
  }, [courseId, fresh, lessonId, previewMode])

  useEffect(() => {
    if (!launchUrl || previewMode) return
    let stopped = false

    let saving = false
    const timer = window.setInterval(() => {
      const frame = iframeRef.current?.contentWindow
      if (stopped || saving || !frame || !packageFrameLooksComplete(frame)) return
      saving = true
      void markCompletedRef.current?.()
        .then(() => {
          stopped = true
          window.clearInterval(timer)
        })
        .catch(() => {
          saving = false
        })
    }, 700)

    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [launchUrl, previewMode])

  useStorylineIframeFill(iframeRef, Boolean(launchUrl))

  useEffect(() => {
    const timers = [80, 400].map((ms) =>
      window.setTimeout(() => notifyStorylineResize(iframeRef.current), ms),
    )
    return () => {
      for (const id of timers) window.clearTimeout(id)
    }
  }, [rotateMode])

  useEffect(() => {
    function onBeforeUnload() {
      apiRef.current?.LMSCommit("")
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [])

  async function leavePlayer(href: string) {
    if (exitingRef.current) return
    exitingRef.current = true
    setGoingNext(true)

    await unlockScreenOrientation()

    suspendScormContentFrame(iframeRef.current)
    // Storyline debounces SetDataChunk ~500ms after the last slide change.
    await new Promise((resolve) => setTimeout(resolve, 700))
    await flushRef.current?.()
    uninstallRef.current?.()
    router.push(href)
  }

  async function exitPlayer() {
    await leavePlayer(backHref)
  }

  async function toggleRotate() {
    if (rotateMode !== "off") {
      if (rotateMode === "native") await unlockScreenOrientation()
      setRotateMode("off")
      return
    }

    const lock = screen.orientation?.lock?.bind(screen.orientation)
    if (lock) {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen()
        }
        await lock("landscape")
        setRotateMode("native")
        return
      } catch {
        await unlockScreenOrientation()
      }
    }

    setRotateMode("css")
  }

  async function goToNextLesson() {
    if (!nextLesson) {
      await exitPlayer()
      return
    }
    await leavePlayer(`${resolvedLearnBase}/${nextLesson.id}`)
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="max-w-md text-sm text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link href={backHref}>Back to lesson</Link>
        </Button>
      </div>
    )
  }

  if (!launchUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-white/80">Preparing SCORM player…</p>
      </div>
    )
  }

  const rotated = rotateMode === "css"

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden bg-black",
        rotated ? "left-1/2 top-1/2" : "inset-0 h-dvh w-dvw",
      )}
      style={
        rotated
          ? {
              width: "100dvh",
              height: "100dvw",
              transform: "translate(-50%, -50%) rotate(90deg)",
            }
          : undefined
      }
    >
      <div className="absolute left-3 top-3 z-10 flex max-w-[70%] flex-col gap-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5 bg-black/60 text-white hover:bg-black/80"
            onClick={() => void exitPlayer()}
            disabled={goingNext}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <span className="hidden truncate text-xs text-white/70 sm:inline">{lessonTitle}</span>
        </div>
        {resumeNote ? <p className="text-[10px] text-white/50">{resumeNote}</p> : null}
      </div>
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn(
            "bg-black/60 text-white hover:bg-black/80",
            rotateMode === "off" ? "lg:hidden" : "bg-white text-black hover:bg-white/90",
          )}
          onClick={() => void toggleRotate()}
          aria-label={rotateMode === "off" ? "Rotate screen" : "Return to portrait"}
          aria-pressed={rotateMode !== "off"}
          title={rotateMode === "off" ? "Rotate screen" : "Return to portrait"}
          disabled={goingNext}
        >
          <RotateScreenIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="bg-black/60 text-white hover:bg-black/80"
          onClick={() => void exitPlayer()}
          aria-label="Exit SCORM player"
          disabled={goingNext}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <iframe
        ref={iframeRef}
        src={launchUrl}
        title={lessonTitle}
        className="h-full w-full flex-1 border-0"
        allow="fullscreen; autoplay; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {lessonFinished ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950/95 p-6 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold text-white">Lesson complete</p>
            <p className="mt-1 text-sm text-white/65">
              {nextLesson
                ? "Continue to the next lesson, or return to the course."
                : "You've finished the last lesson in this course."}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {nextLesson ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 w-full justify-between gap-2 rounded-full bg-emerald-500 px-3.5 text-xs hover:bg-emerald-600 sm:h-10 sm:px-4 sm:text-sm"
                  disabled={goingNext}
                  onClick={() => void goToNextLesson()}
                >
                  <span className="min-w-0 flex-1 truncate text-left">Next: {nextLesson.title}</span>
                  {goingNext ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin sm:size-4" />
                  ) : (
                    <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
                  )}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 w-full rounded-full border-white/25 bg-white/10 text-xs text-white hover:bg-white/20 sm:h-10 sm:text-sm"
                disabled={goingNext}
                onClick={() => void exitPlayer()}
              >
                {nextLesson ? "Exit player" : "Back to course"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
