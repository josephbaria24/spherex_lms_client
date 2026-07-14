"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/api"
import {
  isScormTrackableUrl,
  resolveArticulateScormLaunchUrl,
} from "@/lib/lesson-media"
import type { Lesson } from "@/lib/lesson-types"
import {
  buildScormSessionCmi,
  createPersistentScorm12Api,
  hasScormBookmark,
  installScorm12Api,
  loadScormCmi,
  suspendScormContentFrame,
  type Scorm12Api,
} from "@/lib/scorm-api"
import { useStorylineIframeFill } from "@/lib/storyline-iframe-fill"

type ScormPlayerPageProps = {
  courseId: string
  lessonId: string
  backHref: string
  previewMode?: boolean
  fresh?: boolean
}

export function ScormPlayerPage({
  courseId,
  lessonId,
  backHref,
  previewMode = false,
  fresh = false,
}: ScormPlayerPageProps) {
  const router = useRouter()
  const [lessonTitle, setLessonTitle] = useState("Lesson")
  const [launchUrl, setLaunchUrl] = useState<string | null>(null)
  const [resumeNote, setResumeNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const apiRef = useRef<Scorm12Api | null>(null)
  const flushRef = useRef<(() => Promise<void>) | null>(null)
  const uninstallRef = useRef<(() => void) | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const exitingRef = useRef(false)

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

        const { api, flush } = createPersistentScorm12Api({
          courseId,
          lessonId,
          previewMode: isPreview,
          initialCmi,
          onLessonCompleted: () => {
            /* learner returns to lesson page to see updated progress */
          },
        })
        apiRef.current = api
        flushRef.current = flush
        uninstallRef.current = installScorm12Api(api)

        if (!cancelled) {
          setLaunchUrl(scormLaunch)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not start SCORM player")
        }
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
      uninstallRef.current = null
    }
  }, [courseId, fresh, lessonId, previewMode])

  useStorylineIframeFill(iframeRef, Boolean(launchUrl))

  useEffect(() => {
    function onBeforeUnload() {
      apiRef.current?.LMSCommit("")
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [])

  async function exitPlayer() {
    if (exitingRef.current) return
    exitingRef.current = true
    suspendScormContentFrame(iframeRef.current)
    // Storyline debounces SetDataChunk ~500ms after the last slide change.
    await new Promise((resolve) => setTimeout(resolve, 700))
    await flushRef.current?.()
    uninstallRef.current?.()
    router.push(backHref)
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

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-black">
      <div className="absolute left-3 top-3 z-10 flex max-w-[70%] flex-col gap-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5 bg-black/60 text-white hover:bg-black/80"
            onClick={() => void exitPlayer()}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <span className="hidden truncate text-xs text-white/70 sm:inline">{lessonTitle}</span>
        </div>
        {resumeNote ? <p className="text-[10px] text-white/50">{resumeNote}</p> : null}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-3 top-3 z-10 bg-black/60 text-white hover:bg-black/80"
        onClick={() => void exitPlayer()}
        aria-label="Exit SCORM player"
      >
        <X className="h-4 w-4" />
      </Button>
      <iframe
        ref={iframeRef}
        src={launchUrl}
        title={lessonTitle}
        className="h-full w-full flex-1 border-0"
        allow="fullscreen; autoplay; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
