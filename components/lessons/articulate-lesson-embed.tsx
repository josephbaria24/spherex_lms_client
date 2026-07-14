"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle, Loader2, Maximize2, Play, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { resolveArticulateLaunchUrl } from "@/lib/lesson-media"
import { loadScormCmi, recordScormProgress, resetScormProgress, hasScormBookmark, type ScormProgressPayload } from "@/lib/scorm-api"
import { useStorylineIframeFill } from "@/lib/storyline-iframe-fill"

type ArticulateLessonEmbedProps = {
  title: string
  url: string
  launchMode?: "story" | "scorm"
  durationMinutes?: number
  courseId: string
  lessonId: string
  previewMode?: boolean
  onLessonCompleted?: (progress?: ScormProgressPayload) => void
  onProgressChange?: (progress: ScormProgressPayload) => void
  scormPlayerHref?: string
}

type ScormStatus = "not-started" | "in-progress" | "completed" | "untracked" | "preview"

function deriveScormStatus(cmi?: Record<string, string>): ScormStatus {
  const status = (cmi?.["cmi.core.lesson_status"] ?? cmi?.["cmi.completion_status"] ?? "")
    .toLowerCase()
    .trim()
  if (!status || status === "not attempted" || status === "unknown") return "not-started"
  if (status === "completed" || status === "passed") return "completed"
  return "in-progress"
}

function scormStatusLabel(status: ScormStatus): string {
  switch (status) {
    case "completed":
      return "Completed"
    case "in-progress":
      return "In progress"
    case "not-started":
      return "Not started"
    case "preview":
      return "Preview"
    default:
      return "Not tracked"
  }
}

function lessonProgressValue(status: ScormStatus): number {
  switch (status) {
    case "completed":
      return 100
    case "in-progress":
      return 45
    case "not-started":
      return 0
    default:
      return 0
  }
}

function LessonProgressIndicator({
  status,
  saving,
}: {
  status: ScormStatus
  saving?: boolean
}) {
  const label = scormStatusLabel(status)
  const value = lessonProgressValue(status)

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-center gap-2">
        {status === "completed" ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        ) : status === "in-progress" ? (
          <span
            className="relative flex h-4 w-4 shrink-0 items-center justify-center"
            aria-hidden
          >
            <Circle className="h-4 w-4 text-amber-500" />
            <span className="absolute h-1.5 w-1.5 rounded-full bg-amber-500" />
          </span>
        ) : (
          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="text-sm font-medium text-foreground">{label}</span>
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-label="Saving" />
        ) : null}
      </div>
      {status !== "preview" && status !== "untracked" ? (
        <Progress
          value={value}
          className={cn(
            "h-1.5",
            status === "completed" && "[&_[data-slot=progress-indicator]]:bg-emerald-600",
            status === "in-progress" && "[&_[data-slot=progress-indicator]]:bg-amber-500",
          )}
          aria-label={`Lesson progress: ${label}`}
        />
      ) : null}
    </div>
  )
}

export function ArticulateLessonEmbed({
  title,
  url,
  launchMode = "story",
  durationMinutes = 30,
  courseId,
  lessonId,
  previewMode,
  onLessonCompleted,
  onProgressChange,
  scormPlayerHref,
}: ArticulateLessonEmbedProps) {
  const router = useRouter()
  const { playbackSrc, trackable } = resolveArticulateLaunchUrl(url, launchMode)
  const useScormPlayer = launchMode === "scorm" && trackable && !!scormPlayerHref

  const [active, setActive] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [scormStatus, setScormStatus] = useState<ScormStatus>(
    trackable ? (previewMode ? "preview" : "not-started") : "untracked",
  )
  const [resetting, setResetting] = useState(false)
  const [hasBookmark, setHasBookmark] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const hasResumableSession =
    trackable && !previewMode && (scormStatus === "in-progress" || hasBookmark)

  const openScormPlayer = useCallback(
    (fresh: boolean) => {
      if (!scormPlayerHref) return
      const suffix = fresh ? "?fresh=1" : ""
      router.push(`${scormPlayerHref}${suffix}`)
    },
    [router, scormPlayerHref],
  )

  const persistSessionExit = useCallback(async () => {
    if (!trackable || previewMode || useScormPlayer) return
    try {
      const res = await recordScormProgress(courseId, lessonId, {
        "cmi.core.lesson_status": "incomplete",
        "cmi.core.exit": "suspend",
      })
      if (res.progress) onProgressChange?.(res.progress)
      if (res.lesson_completed) {
        setScormStatus("completed")
        onLessonCompleted?.(res.progress)
      } else {
        setScormStatus("in-progress")
      }
    } catch {
      /* keep local state */
    }
  }, [courseId, lessonId, onLessonCompleted, onProgressChange, previewMode, trackable, useScormPlayer])

  const exitPlayer = useCallback(() => {
    void persistSessionExit()
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    }
    setActive(false)
  }, [persistSessionExit])

  const beginPlayback = useCallback(
    (fresh: boolean) => {
      if (useScormPlayer) {
        openScormPlayer(fresh)
        return
      }
      setIframeKey((k) => k + 1)
      setActive(true)
    },
    [openScormPlayer, useScormPlayer],
  )

  const handleStartOver = useCallback(async () => {
    if (useScormPlayer) {
      setResetting(true)
      try {
        if (!previewMode) await resetScormProgress(courseId, lessonId)
        setScormStatus("not-started")
        openScormPlayer(true)
      } catch {
        openScormPlayer(true)
      } finally {
        setResetting(false)
      }
      return
    }

    if (!trackable || previewMode) {
      beginPlayback(true)
      return
    }
    setResetting(true)
    try {
      await resetScormProgress(courseId, lessonId)
      setScormStatus("not-started")
      beginPlayback(true)
    } catch {
      beginPlayback(true)
    } finally {
      setResetting(false)
    }
  }, [beginPlayback, courseId, lessonId, openScormPlayer, previewMode, trackable, useScormPlayer])

  useEffect(() => {
    let cancelled = false

    async function loadInitialStatus() {
      if (!trackable) {
        setScormStatus("untracked")
        return
      }
      if (previewMode) {
        setScormStatus("preview")
        return
      }
      try {
        const { cmi, preview } = await loadScormCmi(courseId, lessonId)
        if (cancelled) return
        setHasBookmark(hasScormBookmark(cmi))
        setScormStatus(preview ? "preview" : deriveScormStatus(cmi))
      } catch {
        if (!cancelled) setScormStatus("not-started")
      }
    }

    void loadInitialStatus()
    return () => {
      cancelled = true
    }
  }, [courseId, lessonId, previewMode, trackable])

  useEffect(() => {
    if (!active || useScormPlayer) return

    if (trackable && !previewMode && scormStatus === "not-started") {
      void recordScormProgress(courseId, lessonId, {
        "cmi.core.lesson_status": "incomplete",
        "cmi.core.entry": "ab-initio",
      }).then((res) => {
        if (res.progress) onProgressChange?.(res.progress)
        if (res.lesson_completed) {
          setScormStatus("completed")
          onLessonCompleted?.(res.progress)
        } else {
          setScormStatus("in-progress")
        }
      })
    }
  }, [active, courseId, lessonId, onLessonCompleted, onProgressChange, previewMode, scormStatus, trackable, useScormPlayer])

  useEffect(() => {
    if (!active || !playerRef.current || useScormPlayer) return
    const el = playerRef.current
    void el.requestFullscreen?.().catch(() => {
      /* Overlay still works if the browser blocks fullscreen */
    })
  }, [active, useScormPlayer])

  useStorylineIframeFill(iframeRef, active && !useScormPlayer)

  useEffect(() => {
    if (useScormPlayer) return

    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        void persistSessionExit()
        setActive(false)
      }
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [persistSessionExit, useScormPlayer])

  if (active && !useScormPlayer) {
    const playerSrc = `${playbackSrc}${playbackSrc.includes("?") ? "&" : "?"}v=${iframeKey}`

    return (
      <div
        ref={playerRef}
        className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-black"
      >
        <div className="absolute right-3 top-3 z-10">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="bg-black/60 text-white hover:bg-black/80"
            onClick={exitPlayer}
            aria-label="Exit lesson"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={playerSrc}
          title={title}
          className="h-full w-full flex-1 border-0"
          allow="fullscreen; autoplay; clipboard-write"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trackable || previewMode ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <LessonProgressIndicator status={scormStatus} />
        </div>
      ) : null}

      <div className="relative flex h-[min(50vh,420px)] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_70%)]" />
        <div className="relative flex flex-col items-center gap-4 px-6 text-center">
          <p className="text-lg font-semibold">{title}</p>

          {hasResumableSession ? (
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                className="gap-2 rounded-full bg-emerald-500 px-6 hover:bg-emerald-600"
                onClick={() => beginPlayback(false)}
              >
                <Play className="h-4 w-4 fill-current" />
                Resume lesson
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="gap-2 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => void handleStartOver()}
                disabled={resetting}
              >
                <RotateCcw className="h-4 w-4" />
                {resetting ? "Resetting…" : "Start over"}
              </Button>
            </div>
          ) : scormStatus === "completed" ? (
            <div className="space-y-2">
              <p className="text-sm text-emerald-200">You completed this lesson.</p>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="gap-2 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => void handleStartOver()}
                disabled={resetting}
              >
                <RotateCcw className="h-4 w-4" />
                {resetting ? "Resetting…" : "Replay from start"}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => beginPlayback(true)}
              className="group flex flex-col items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={`Play ${title}`}
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 transition group-hover:scale-105 group-hover:bg-emerald-500/90 group-hover:ring-emerald-300/40">
                <Play className="h-9 w-9 fill-white text-white pl-1" />
              </span>
              <p className="flex items-center justify-center gap-1.5 text-sm text-white/70">
                <Maximize2 className="h-3.5 w-3.5" />
                {useScormPlayer ? "Open lesson" : "Click to start in fullscreen"}
              </p>
            </button>
          )}

          {hasResumableSession && useScormPlayer && (
            <p className="max-w-md text-xs text-white/60">
              {hasBookmark
                ? "You'll resume from where you left off."
                : "No saved position yet — resume starts from the beginning. Use Start over to reset."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
