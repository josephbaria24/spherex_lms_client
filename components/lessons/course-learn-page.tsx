"use client"

import { Spinner } from "@/components/ui/spinner"
import { useCallback, useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GrowShell } from "@/components/grow-shell"
import { MainLayout } from "@/components/layouts/main-layout"
import { LessonContentViewer } from "@/components/lessons/lesson-content-viewer"
import { LessonConcernButton } from "@/components/lessons/lesson-concern-button"
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
import { CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Lock } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { groupLessonOutline } from "@/lib/lesson-outline"

import type { ScormProgressPayload } from "@/lib/scorm-api"

type CourseOutline = {
  course: {
    id: string
    title: string
    description?: string
    require_sequential_lessons?: boolean
  }
  lessons: (Lesson & {
    completed?: boolean
    started?: boolean
    locked?: boolean
    progress?: number
  })[]
  progress: number
  preview?: boolean
}

type LessonDetail = {
  lesson: Lesson
  quiz: LessonQuiz | null
  completed: boolean
  preview?: boolean
}

function lessonPercent(lesson: { completed?: boolean; started?: boolean; progress?: number }) {
  if (typeof lesson.progress === "number" && Number.isFinite(lesson.progress)) {
    return Math.min(100, Math.max(0, Math.round(lesson.progress)))
  }
  if (lesson.completed) return 100
  if (lesson.started) return 50
  return 0
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
  const [showPlayer, setShowPlayer] = useState(false)

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

  function focusPlayer() {
    setShowPlayer(true)
    requestAnimationFrame(() => {
      document.querySelector(".grow-shell")?.scrollTo({ top: 0 })
    })
  }

  function navigateToLesson(id: string) {
    focusPlayer()
    if (detail?.lesson.id === id) return
    startTransition(() => {
      router.push(lessonPath(id))
    })
  }

  const lessons = outline?.lessons ?? []
  const { roots, childrenOf } = groupLessonOutline(lessons)
  const lessonItems = roots.filter((lesson) => lesson.content_type !== "quiz")
  const quizItems = [
    ...roots.filter((lesson) => lesson.content_type === "quiz"),
    ...roots.flatMap((lesson) => childrenOf.get(lesson.id) ?? []),
  ]
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
            <Spinner size={28} />
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
        <div className={cn("flex flex-col gap-3 lg:flex-row lg:gap-5", isNavigating && "opacity-[0.98]")}>
          <aside className={cn("w-full shrink-0 lg:w-72", showPlayer && "max-lg:hidden")}>
            <div className={cn(grow.card, "space-y-3 p-3 transition-shadow duration-300 lg:sticky lg:top-4 lg:space-y-4 lg:p-5")}>
              <div className="lg:hidden">
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#6b5c4f] hover:text-[#1c1917] dark:hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {backLabel}
                </Link>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FF4B1A]">
                  Lessons
                </p>
                <h1 className="mt-1 text-lg font-bold leading-snug text-[#1c1917] dark:text-foreground">
                  {outline.course.title}
                </h1>
                <p className="mt-1.5 text-sm leading-5 text-[#6b5c4f] dark:text-muted-foreground">
                  {outline.course.require_sequential_lessons
                    ? "Start at lesson 1. The next one unlocks when you finish the one before it."
                    : "Tap a lesson to open it. You can go through them in any order."}
                </p>
                {!previewMode && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1c1917] dark:text-foreground">
                        {lessons.filter((item) => item.completed).length} of {lessons.length} finished
                      </span>
                      <span className="tabular-nums text-[#6b5c4f] dark:text-muted-foreground">
                        {outline.progress}%
                      </span>
                    </div>
                    <Progress
                      value={outline.progress}
                      className="h-1.5 [&_[data-slot=progress-indicator]]:bg-[#FF4B1A]"
                    />
                  </div>
                )}
              </div>

              <nav className="space-y-2 lg:hidden">
                {lessonItems.map((l, i) => {
                  const isActive = detail?.lesson.id === l.id
                  const status = l.locked
                    ? "Not available yet"
                    : l.completed
                      ? "Done"
                      : l.started
                        ? "In progress"
                        : "Not started"
                  const statusHint = l.locked
                    ? "Finish the previous lesson before you can open this"
                    : l.completed
                      ? "You can review this anytime"
                      : l.started
                        ? "Continue where you left off"
                        : "Tap to start"
                  const canOpen = !l.locked
                  const cardClass = cn(
                    "flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition",
                    isActive
                      ? "border-[#FF4B1A]/40 bg-[#FFF4EF] dark:border-[#FF4B1A]/40 dark:bg-[#FF4B1A]/10"
                      : l.locked
                        ? "cursor-not-allowed border-amber-200/80 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-950/20"
                        : "border-[#ebe4da] bg-white active:bg-[#faf8f5] dark:border-border dark:bg-card dark:active:bg-muted/40",
                  )
                  const body = (
                    <>
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          isActive
                            ? "bg-[#FF4B1A] text-white"
                            : l.completed
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-[#f3ede4] text-[#1c1917] dark:bg-muted dark:text-foreground",
                        )}
                      >
                        {!canOpen ? <Lock className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug text-[#1c1917] dark:text-foreground">
                          {l.title}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-[#1c1917] dark:text-foreground">
                          {status}
                          {!previewMode && !l.locked ? (
                            <span className="font-normal text-[#6b5c4f] dark:text-muted-foreground">
                              {" "}
                              · {lessonPercent(l)}%
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-[#6b5c4f] dark:text-muted-foreground">
                          {statusHint}
                        </span>
                      </span>
                      {canOpen ? (
                        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#6b5c4f]" />
                      ) : (
                        <Lock className="mt-2 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                      )}
                    </>
                  )

                  return (
                    <div
                      key={l.id}
                      className="overflow-hidden rounded-2xl border border-[#ebe4da] dark:border-border"
                    >
                      {!canOpen ? (
                        <div className={cn(cardClass, "rounded-none border-0")} title="Complete the previous lesson to unlock">
                          {body}
                        </div>
                      ) : (
                        <Link
                          href={lessonPath(l.id)}
                          className={cn(cardClass, "rounded-none border-0")}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                            e.preventDefault()
                            navigateToLesson(l.id)
                          }}
                        >
                          {body}
                        </Link>
                      )}
                    </div>
                  )
                })}
                {quizItems.length > 0 ? (
                  <div className="pt-2">
                    <p className="px-1 pb-2 text-sm font-semibold text-[#312e81]">Quizzes</p>
                    <div className="space-y-1.5">
                      {quizItems.map((quiz) => {
                        const quizActive = detail?.lesson.id === quiz.id
                        const quizClass = cn(
                          "flex items-center gap-2 rounded-xl border border-[#ebe4da] bg-white px-3 py-2.5 text-sm text-[#312e81] dark:border-border dark:bg-card",
                          quizActive && "border-[#312e81]/40 bg-[#ebe4f8] dark:bg-violet-950/40",
                          quiz.locked && "cursor-not-allowed opacity-60",
                        )
                        const quizLabel = (
                          <>
                            <CircleHelp className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{quiz.quiz_title || quiz.title}</span>
                            {quiz.locked ? (
                              <Lock className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <span
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0 rounded-full border border-[#312e81]/50",
                                  quiz.completed && "border-[#312e81] bg-[#312e81]",
                                )}
                              />
                            )}
                          </>
                        )
                        if (quiz.locked) {
                          return (
                            <div key={quiz.id} className={quizClass}>
                              {quizLabel}
                            </div>
                          )
                        }
                        return (
                          <Link
                            key={quiz.id}
                            href={lessonPath(quiz.id)}
                            className={quizClass}
                            onClick={(e) => {
                              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                              e.preventDefault()
                              navigateToLesson(quiz.id)
                            }}
                          >
                            {quizLabel}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </nav>

              <div className="hidden lg:block">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={backHref}
                    className="text-xs text-[#6b5c4f] transition-colors hover:text-[#1c1917] dark:hover:text-foreground"
                  >
                    ← {backLabel}
                  </Link>
                </div>
                <h1 className="mt-1 line-clamp-2 text-lg font-semibold leading-tight text-[#1c1917] dark:text-foreground">
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
              <nav className="hidden max-h-[50vh] space-y-0.5 overflow-x-hidden overflow-y-auto lg:block">
                {lessonItems.map((l) => {
                  const isActive = detail?.lesson.id === l.id
                  const rowClass = cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-[#312e81] transition-colors",
                    isActive
                      ? "bg-[#ebe4f8] dark:bg-violet-950/40"
                      : l.locked
                        ? "cursor-not-allowed opacity-60"
                        : "hover:bg-[#faf8f5] dark:hover:bg-muted/60",
                  )
                  const label = (
                    <>
                      <span className="min-w-0 flex-1 truncate font-medium">{l.title}</span>
                      {l.locked ? (
                        <Lock className="h-3.5 w-3.5 shrink-0 text-[#6b5c4f]" />
                      ) : (
                        <span
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 rounded-full border border-[#312e81]/50",
                            l.completed && "border-[#312e81] bg-[#312e81]",
                          )}
                        />
                      )}
                    </>
                  )
                  if (l.locked) {
                    return (
                      <div key={l.id} className={rowClass} title="Complete the previous lesson to unlock">
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
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                        e.preventDefault()
                        navigateToLesson(l.id)
                      }}
                    >
                      {label}
                    </Link>
                  )
                })}
                {quizItems.length > 0 ? (
                  <div className="pt-4">
                    <p className="px-2 pb-1 text-sm font-semibold text-[#312e81]">Quizzes</p>
                    <div className="space-y-0.5">
                      {quizItems.map((quiz) => {
                        const quizActive = detail?.lesson.id === quiz.id
                        const quizClass = cn(
                          "flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#312e81]",
                          quizActive && "bg-[#ebe4f8] dark:bg-violet-950/40",
                          quiz.locked
                            ? "cursor-not-allowed opacity-60"
                            : "hover:bg-[#faf8f5] dark:hover:bg-muted/60",
                        )
                        const quizLabel = (
                          <>
                            <CircleHelp className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{quiz.quiz_title || quiz.title}</span>
                            {quiz.locked ? (
                              <Lock className="h-3.5 w-3.5 shrink-0 text-[#6b5c4f]" />
                            ) : (
                              <span
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0 rounded-full border border-[#312e81]/50",
                                  quiz.completed && "border-[#312e81] bg-[#312e81]",
                                )}
                              />
                            )}
                          </>
                        )
                        if (quiz.locked) {
                          return (
                            <div key={quiz.id} className={quizClass} title="Complete the previous lesson to unlock">
                              {quizLabel}
                            </div>
                          )
                        }
                        return (
                          <Link
                            key={quiz.id}
                            href={lessonPath(quiz.id)}
                            className={quizClass}
                            onClick={(e) => {
                              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                              e.preventDefault()
                              navigateToLesson(quiz.id)
                            }}
                          >
                            {quizLabel}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </nav>
            </div>
          </aside>

          <main className={cn(grow.card, "min-w-0 flex-1 p-4 md:p-6", !showPlayer && "max-lg:hidden")}>
            <button
              type="button"
              className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-[#6b5c4f] lg:hidden"
              onClick={() => {
                setShowPlayer(false)
                document.querySelector(".grow-shell")?.scrollTo({ top: 0 })
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              All lessons
            </button>
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
                <Spinner size={28} />
                Loading lesson…
              </div>
            ) : null}

            {showLessonContent ? (
              <div
                key={detail.lesson.id}
                className="animate-in fade-in slide-in-from-right-3 space-y-4 duration-300 lg:space-y-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="grow-badge text-[#6b5c4f]">
                      Lesson {currentIdx + 1} of {lessons.length}
                    </span>
                    <h2 className="mt-2 text-xl font-bold text-[#1c1917] lg:text-2xl dark:text-foreground">
                      {detail.lesson.title}
                    </h2>
                    {detail.lesson.description && (
                      <p className="mt-1 text-[#6b5c4f] dark:text-muted-foreground">
                        {detail.lesson.description}
                      </p>
                    )}
                  </div>
                  <LessonConcernButton courseId={courseId} lessonId={detail.lesson.id} />
                </div>

                <LessonContentViewer
                  courseId={courseId}
                  lesson={detail.lesson}
                  quiz={detail.quiz}
                  completed={detail.completed}
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
                          ? { ...l, completed: true, started: false, progress: 100 }
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
                            ? {
                                ...l,
                                started: true,
                                progress: Math.max(lessonPercent(l), 50),
                              }
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
