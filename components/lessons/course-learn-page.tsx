"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GrowShell } from "@/components/grow-shell"
import { MainLayout } from "@/components/layouts/main-layout"
import { LessonContentViewer } from "@/components/lessons/lesson-content-viewer"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { grow } from "@/lib/grow-shell"
import { apiGet, ApiError } from "@/lib/api"
import {
  getCachedLesson,
  getCachedOutline,
  setCachedLesson,
  setCachedOutline,
} from "@/lib/learn-cache"
import type { Lesson, LessonQuiz } from "@/lib/lesson-types"
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Loader2, CircleDot, Lock } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import type { ScormProgressPayload } from "@/lib/scorm-api"

type CourseOutline = {
  course: {
    id: string
    title: string
    description?: string
    require_sequential_lessons?: boolean
  }
  lessons: (Lesson & { completed?: boolean; started?: boolean; locked?: boolean })[]
  progress: number
  preview?: boolean
}

type LessonDetail = {
  lesson: Lesson
  quiz: LessonQuiz | null
  completed: boolean
  preview?: boolean
}

function applyClientLessonLocks<T extends { completed?: boolean }>(
  lessons: T[],
): (T & { locked: boolean })[] {
  let priorLessonsComplete = true
  return lessons.map((lesson) => {
    const locked = !priorLessonsComplete
    if (!lesson.completed) {
      priorLessonsComplete = false
    }
    return { ...lesson, locked }
  })
}

export function CourseLearnPage({
  courseId,
  lessonId,
  learnBasePath,
  backHref = "/courses",
  backLabel = "My courses",
  previewMode: previewModeProp,
}: {
  courseId: string
  lessonId?: string
  learnBasePath?: string
  backHref?: string
  backLabel?: string
  previewMode?: boolean
}) {
  const router = useRouter()
  const [isNavigating, startTransition] = useTransition()
  const basePath = learnBasePath ?? `/courses/${courseId}/learn`
  const [outline, setOutline] = useState<CourseOutline | null>(
    () => getCachedOutline<CourseOutline>(courseId),
  )
  const [detail, setDetail] = useState<LessonDetail | null>(() =>
    lessonId ? getCachedLesson<LessonDetail>(courseId, lessonId) : null,
  )
  const [initialLoading, setInitialLoading] = useState(() => !getCachedOutline<CourseOutline>(courseId))
  const [lessonLoading, setLessonLoading] = useState(
    () => !!lessonId && !getCachedLesson<LessonDetail>(courseId, lessonId),
  )
  const [lessonBlocked, setLessonBlocked] = useState<string | null>(null)

  const previewMode = previewModeProp ?? outline?.preview ?? detail?.preview ?? false

  const lessonPath = (id: string) => `${basePath}/${id}`

  const loadOutline = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false
      try {
        const data = await apiGet<CourseOutline>(`/learn/courses/${courseId}`)
        setCachedOutline(courseId, data)
        setOutline(data)
        return data
      } catch (err) {
        if (!silent) throw err
        return null
      }
    },
    [courseId],
  )

  const loadLesson = useCallback(
    async (id: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false
      const cached = getCachedLesson<LessonDetail>(courseId, id)

      try {
        const data = await apiGet<LessonDetail>(`/learn/courses/${courseId}/lessons/${id}`)
        setCachedLesson(courseId, id, data)
        setLessonBlocked(null)
        setDetail(data)
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setLessonBlocked(err.message)
          setDetail(null)
          return
        }
        if (!cached && !silent) throw err
      } finally {
        setLessonLoading(false)
      }
    },
    [courseId],
  )

  useEffect(() => {
    const cached = getCachedOutline<CourseOutline>(courseId)
    if (cached) {
      setOutline(cached)
      setInitialLoading(false)
      void loadOutline({ silent: true })
      return
    }

    setInitialLoading(true)
    loadOutline()
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load course"))
      .finally(() => setInitialLoading(false))
  }, [courseId, loadOutline])

  useEffect(() => {
    if (previewMode) return

    function refreshProgress() {
      if (document.visibilityState !== "visible") return
      void loadOutline({ silent: true })
      if (lessonId) void loadLesson(lessonId, { silent: true })
    }

    window.addEventListener("focus", refreshProgress)
    document.addEventListener("visibilitychange", refreshProgress)
    return () => {
      window.removeEventListener("focus", refreshProgress)
      document.removeEventListener("visibilitychange", refreshProgress)
    }
  }, [lessonId, loadLesson, loadOutline, previewMode])

  const applyProgressUpdate = useCallback(
    (progress: ScormProgressPayload) => {
      setOutline((o) => {
        if (!o) return o
        const next = { ...o, progress: progress.progress }
        setCachedOutline(courseId, next)
        return next
      })
    },
    [courseId],
  )

  useEffect(() => {
    if (!lessonId) return

    const cached = getCachedLesson<LessonDetail>(courseId, lessonId)
    if (cached) {
      setDetail(cached)
      setLessonBlocked(null)
      setLessonLoading(false)
    } else {
      setDetail(null)
      setLessonLoading(true)
    }

    void loadLesson(lessonId).catch((err) =>
      toast.error(err instanceof Error ? err.message : "Could not load lesson"),
    )
  }, [lessonId, courseId, loadLesson])

  useEffect(() => {
    if (lessonId || !outline?.lessons.length) return
    const targetId =
      outline.lessons.find((l) => !l.completed && !l.locked)?.id ??
      outline.lessons.find((l) => !l.locked)?.id ??
      outline.lessons[0]?.id
    if (targetId) {
      startTransition(() => {
        router.replace(`${basePath}/${targetId}`)
      })
    }
  }, [lessonId, outline, basePath, router])

  function navigateToLesson(id: string) {
    if (detail?.lesson.id === id) return
    startTransition(() => {
      router.push(lessonPath(id))
    })
  }

  const lessons = outline?.lessons ?? []
  const currentIdx = detail ? lessons.findIndex((l) => l.id === detail.lesson.id) : -1
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null
  const nextLessonCandidate =
    currentIdx >= 0 && currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null
  const nextLesson =
    detail?.completed && nextLessonCandidate && !nextLessonCandidate.locked
      ? nextLessonCandidate
      : null
  const showLessonContent = detail && !lessonBlocked
  const showLessonSkeleton = lessonLoading && !showLessonContent && !!lessonId

  if (initialLoading && !outline) {
    return (
      <MainLayout>
        <GrowShell bento={false}>
          <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#6b5c4f]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading course…
          </div>
        </GrowShell>
      </MainLayout>
    )
  }

  if (!outline || lessons.length === 0) {
    return (
      <MainLayout>
        <GrowShell bento={false}>
          <div className={cn(grow.card, "mx-auto max-w-lg p-8 text-center")}>
            <p className="font-medium text-[#1c1917] dark:text-foreground">No published lessons yet</p>
            <p className="mt-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">
              Check back when your instructor publishes content.
            </p>
            <Button asChild className="grow-btn-outline mt-6" variant="outline">
              <Link href={backHref}>Back</Link>
            </Button>
          </div>
        </GrowShell>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <GrowShell bento={false}>
        {previewMode && (
          <div className="mb-4 rounded-[11px] border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-200">
            Student preview — you are viewing published lessons as a learner would. Progress is not
            saved.
          </div>
        )}
        <div className={cn("flex flex-col gap-5 lg:flex-row", isNavigating && "opacity-[0.98]")}>
          <aside className="w-full shrink-0 lg:w-72">
            <div className={cn(grow.card, "sticky top-4 space-y-4 p-5 transition-shadow duration-300")}>
              <div>
                <Link
                  href={backHref}
                  className="text-xs text-[#6b5c4f] transition-colors hover:text-[#1c1917] dark:hover:text-foreground"
                >
                  ← {backLabel}
                </Link>
                <h1 className="mt-1 text-lg font-semibold leading-tight text-[#1c1917] dark:text-foreground">
                  {outline.course.title}
                </h1>
                {!previewMode && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#6b5c4f] dark:text-muted-foreground">Progress</span>
                      <span className="font-medium text-[#1c1917] transition-all duration-500 dark:text-foreground">
                        {outline.progress}%
                      </span>
                    </div>
                    <Progress
                      value={outline.progress}
                      className="h-1.5 transition-all duration-500 [&_[data-slot=progress-indicator]]:bg-[#7c6cf0]"
                    />
                  </div>
                )}
              </div>
              <nav className="max-h-[50vh] space-y-1 overflow-x-hidden overflow-y-auto">
                {lessons.map((l, i) => {
                  const isActive = detail?.lesson.id === l.id
                  const rowClass = cn(
                    "flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-all duration-200",
                    isActive
                      ? "bg-[#ebe4f8] text-[#1c1917] shadow-sm dark:bg-violet-950/40 dark:text-foreground"
                      : l.locked
                        ? "cursor-not-allowed opacity-60"
                        : "hover:bg-[#faf8f5] dark:hover:bg-muted/60",
                  )
                  const icon = l.locked ? (
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#6b5c4f]" />
                  ) : l.completed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#e85d4a]" />
                  ) : l.started ? (
                    <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-[#7c6cf0]" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#6b5c4f]" />
                  )
                  const label = (
                    <>
                      {icon}
                      <span>
                        <span className="text-[10px] text-[#6b5c4f] dark:text-muted-foreground">Lesson {i + 1}</span>
                        <span className="block font-medium leading-snug">{l.title}</span>
                      </span>
                    </>
                  )

                  if (l.locked) {
                    return (
                      <div
                        key={l.id}
                        className={rowClass}
                        title="Complete the previous lesson to unlock"
                      >
                        {label}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={l.id}
                      href={lessonPath(l.id)}
                      className={rowClass}
                      onClick={(e) => {
                        if (isActive) return
                        e.preventDefault()
                        navigateToLesson(l.id)
                      }}
                    >
                      {label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          <main className={cn(grow.card, "min-w-0 flex-1 p-5 md:p-6")}>
            {lessonBlocked ? (
              <div
                key="blocked"
                className="animate-in fade-in slide-in-from-right-3 p-8 text-center duration-300"
              >
                <Lock className="mx-auto h-10 w-10 text-[#6b5c4f]" />
                <p className="mt-4 font-medium text-[#1c1917] dark:text-foreground">This lesson is locked</p>
                <p className="mt-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">{lessonBlocked}</p>
                {prevLesson && !prevLesson.locked ? (
                  <Button
                    className="grow-btn-outline mt-6"
                    variant="outline"
                    onClick={() => navigateToLesson(prevLesson.id)}
                  >
                    Go to previous lesson
                  </Button>
                ) : null}
              </div>
            ) : null}

            {showLessonSkeleton ? (
              <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#6b5c4f]">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading lesson…
              </div>
            ) : null}

            {showLessonContent ? (
              <div
                key={detail.lesson.id}
                className="animate-in fade-in slide-in-from-right-3 space-y-6 duration-300"
              >
                <div>
                  <span className="grow-badge text-[#6b5c4f]">
                    Lesson {currentIdx + 1} of {lessons.length}
                  </span>
                  <h2 className="mt-2 text-2xl font-bold text-[#1c1917] dark:text-foreground">
                    {detail.lesson.title}
                  </h2>
                  {detail.lesson.description && (
                    <p className="mt-1 text-[#6b5c4f] dark:text-muted-foreground">
                      {detail.lesson.description}
                    </p>
                  )}
                </div>

                <LessonContentViewer
                  courseId={courseId}
                  lesson={detail.lesson}
                  quiz={detail.quiz}
                  previewMode={previewMode}
                  scormPlayerHref={`${basePath}/${detail.lesson.id}/scorm`}
                  onLessonComplete={(progress) => {
                    if (previewMode) return
                    const nextDetail = { ...detail, completed: true }
                    setDetail(nextDetail)
                    setCachedLesson(courseId, detail.lesson.id, nextDetail)
                    setOutline((o) => {
                      if (!o) return o
                      const updatedLessons = o.lessons.map((l) =>
                        l.id === detail.lesson.id
                          ? { ...l, completed: true, started: false }
                          : l,
                      )
                      const next = {
                        ...o,
                        progress: progress?.progress ?? o.progress,
                        lessons: applyClientLessonLocks(updatedLessons),
                      }
                      setCachedOutline(courseId, next)
                      return next
                    })
                    if (progress) {
                      applyProgressUpdate(progress)
                    }
                    void loadOutline({ silent: true })
                  }}
                  onProgressChange={(progress) => {
                    if (previewMode) return
                    applyProgressUpdate(progress)
                    setOutline((o) => {
                      if (!o) return o
                      const next = {
                        ...o,
                        lessons: o.lessons.map((l) =>
                          l.id === detail.lesson.id && !l.completed
                            ? { ...l, started: true }
                            : l,
                        ),
                      }
                      setCachedOutline(courseId, next)
                      return next
                    })
                  }}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe4da] pt-4 dark:border-border">
                  <div>
                    {prevLesson && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="grow-btn-outline gap-1"
                        onClick={() => navigateToLesson(prevLesson.id)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!previewMode && detail.completed && (
                      <span className="flex items-center gap-1 text-sm text-[#e85d4a]">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </span>
                    )}
                    {nextLesson ? (
                      <Button
                        size="sm"
                        className="grow-btn-primary gap-1"
                        onClick={() => navigateToLesson(nextLesson.id)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : nextLessonCandidate && !detail.completed ? (
                      <Button size="sm" className="grow-btn-primary gap-1" disabled>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </GrowShell>
    </MainLayout>
  )
}
