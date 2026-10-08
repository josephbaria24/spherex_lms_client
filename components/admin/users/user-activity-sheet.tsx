"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiDelete, apiGet } from "@/lib/api"
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  CircleCheck,
  ExternalLink,
  FileQuestion,
  GraduationCap,
  Loader2,
  MonitorPlay,
  RotateCcw,
  Trash2,
  Users,
  ChevronDown,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

type UserSummary = {
  id: string
  email: string
  full_name: string | null
  name: string | null
  role: string
  status: string
  created_at: string
}

type UserActivityPayload = {
  user: UserSummary
  summary: {
    enrollments: number
    completed_courses: number
    lesson_progress_records: number
    lesson_completions: number
    scorm_sessions: number
    quiz_attempts: number
    certificates: number
    organizations: number
    courses_teaching: number
    materials_uploaded: number
    lessons_created: number
    evaluations_given: number
  }
  enrollments: Array<{
    id: string
    course_id: string
    course_title: string
    progress_percent: number
    completed: boolean
    completed_at: string | null
    created_at: string
    updated_at: string
    lessons_total: number
    lessons_completed: number
  }>
  lesson_progress: Array<{
    lesson_title: string
    course_title: string
    completed: boolean
    completed_at: string | null
    updated_at: string
    lesson_number: number | null
    lessons_total: number | null
  }>
  scorm_records: Array<{
    lesson_title: string
    course_title: string
    lesson_status: string
    suspend_data: string | null
    lesson_number: number | null
    lessons_total: number | null
    interactions: Array<{
      id: string | null
      description: string | null
      type: string | null
      student_response: string | null
      result: string | null
      latency: string | null
    }>
    updated_at: string
  }>
  quiz_attempts: Array<{
    quiz_title: string
    lesson_title: string
    course_title: string
    score: number
    passed: boolean
    created_at: string
  }>
  organizations: Array<{
    organization_name: string
    role: string
    joined_at: string
  }>
  teaching: Array<{ course_title: string; created_at: string }>
  materials_uploaded: Array<{ title: string; type: string; updated_at: string }>
  lessons_created: Array<{ title: string; course_title: string; status: string; updated_at: string }>
  evaluations_given: Array<{
    course_title: string
    student_name: string
    status: string
    score: number | null
    evaluated_at: string | null
  }>
  certificates: Array<{
    id: string
    course_title: string | null
    certificate_url: string | null
    issued_at: string
  }>
  recent_timeline: Array<{
    kind: string
    occurred_at: string
    label: string
    course_title: string | null
    detail: string
  }>
}

type UserActivitySheetProps = {
  userId: string | null
  userLabel?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

function truncate(value: string | null | undefined, max = 220) {
  if (!value) return null
  if (value.length <= max) return value
  return `${value.slice(0, max)}...`
}

function looksReadableScormResponse(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function humanizeIspringId(token: string) {
  let text = token.trim().replace(/^\d+_/, "")
  text = text.replace(/__([A-Za-z0-9]+)_(?=$|_)/g, " ($1)")
  text = text.replace(/__/g, ", ")
  text = text.replace(/_/g, " ")
  return text.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim()
}

function answerLines(value: string | null | undefined) {
  if (!value?.trim()) return ["No choice saved"]
  const trimmed = value.trim()
  if (/^(t|true)$/i.test(trimmed)) return ["True"]
  if (/^(f|false)$/i.test(trimmed)) return ["False"]
  if (trimmed.includes("\n")) {
    return trimmed.split("\n").map((line) => line.trim()).filter(Boolean)
  }
  if (trimmed.includes("[.]")) {
    const pairs = trimmed.includes("[,]") ? trimmed.split("[,]") : trimmed.split(/,\s+(?=\d+_)/)
    return pairs
      .map((pair) => {
        const [left, right] = pair.split("[.]")
        const source = humanizeIspringId(left ?? "")
        const target = right ? humanizeIspringId(right) : ""
        return target ? `${source} → ${target}` : source
      })
      .filter(Boolean)
  }
  if (/^\d+_/.test(trimmed)) return [humanizeIspringId(trimmed)]
  if (trimmed === trimmed.toLowerCase()) {
    return [`${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`]
  }
  return [trimmed]
}

function resultLabel(value: string | null | undefined) {
  if (!value) return null
  if (value === "correct") return "Correct"
  if (value === "incorrect") return "Incorrect"
  return value
}

function getScormResponseRecords(data: UserActivityPayload | null) {
  if (!data?.scorm_records) return []

  return data.scorm_records
    .map((row) => ({
      ...row,
      readableInteractions: row.interactions.filter((interaction) =>
        looksReadableScormResponse(interaction.student_response),
      ),
    }))
    .filter((row) => row.readableInteractions.length > 0 || Boolean(row.suspend_data))
}

export function UserActivitySheet({
  userId,
  userLabel,
  open,
  onOpenChange,
}: UserActivitySheetProps) {
  const [data, setData] = useState<UserActivityPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetAllOpen, setResetAllOpen] = useState(false)
  const [resetCourse, setResetCourse] = useState<{ id: string; title: string } | null>(null)
  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const activity = await apiGet<UserActivityPayload>(`/users/${userId}/activity`)
      setData(activity)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load user activity")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (open && userId) void load()
  }, [open, userId, load])

  async function handleReset(courseId?: string) {
    if (!userId) return
    setResetting(true)
    try {
      const path = courseId
        ? `/users/${userId}/progress?course_id=${courseId}`
        : `/users/${userId}/progress`
      await apiDelete(path)
      toast.success(courseId ? "Course progress reset" : "All learning progress reset")
      setResetAllOpen(false)
      setResetCourse(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset progress")
    } finally {
      setResetting(false)
    }
  }

  const displayName =
    data?.user.full_name ?? data?.user.name ?? userLabel ?? data?.user.email ?? "User"
  const canResetProgress =
    data &&
    (data.summary.enrollments > 0 ||
      data.summary.lesson_progress_records > 0 ||
      data.summary.scorm_sessions > 0 ||
      data.summary.quiz_attempts > 0)

  const completedEnrollments = data?.enrollments.filter((e) => e.completed) ?? []
  const hasAchievements =
    (data?.certificates.length ?? 0) > 0 || completedEnrollments.length > 0
  const scormResponseRecords = getScormResponseRecords(data)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col overflow-hidden px-[21px] py-[5px] sm:max-w-2xl">
          <SheetHeader className="shrink-0">
            <SheetTitle>{displayName}</SheetTitle>
            <SheetDescription>
              {data ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span>{data.user.email}</span>
                  <Badge variant="secondary">{data.user.role}</Badge>
                  <Badge variant="outline">{data.user.status}</Badge>
                </span>
              ) : (
                "Progress and platform activity"
              )}
            </SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading activity…
            </div>
          ) : !data ? (
            <p className="text-sm text-muted-foreground">No activity data available.</p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-6">
              <div className="shrink-0 space-y-4">
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  <Stat icon={Users} label="Enrollments" value={data.summary.enrollments} />
                  <Stat icon={CheckCircle2} label="Lessons done" value={data.summary.lesson_completions} />
                  <Stat icon={CircleCheck} label="Completed" value={data.summary.completed_courses} />
                  <Stat icon={Award} label="Certificates" value={data.summary.certificates} />
                  <Stat icon={MonitorPlay} label="SCORM" value={data.summary.scorm_sessions} />
                  <Stat icon={FileQuestion} label="Quizzes" value={data.summary.quiz_attempts} />
                  <Stat icon={Building2} label="Orgs" value={data.summary.organizations} />
                  <Stat icon={GraduationCap} label="Teaching" value={data.summary.courses_teaching} />
                </div>

              <Section title="Achievements" icon={Award}>
                {!hasAchievements ? (
                  <p className="text-sm text-muted-foreground">
                    No certificates or completed courses yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.certificates.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/10 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {cert.course_title ?? "Certificate"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Issued {formatWhen(cert.issued_at)}
                          </p>
                        </div>
                        {cert.certificate_url ? (
                          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
                            <a
                              href={cert.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">
                            Certificate
                          </Badge>
                        )}
                      </div>
                    ))}
                    {completedEnrollments
                      .filter(
                        (enrollment) =>
                          !data.certificates.some(
                            (cert) => cert.course_title === enrollment.course_title,
                          ),
                      )
                      .map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-start justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{enrollment.course_title}</p>
                            <p className="text-xs text-muted-foreground">
                              Course completed {formatWhen(enrollment.completed_at)}
                            </p>
                          </div>
                          <Badge className="shrink-0 bg-emerald-600/90">Completed</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </Section>

              {canResetProgress ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit gap-2 text-destructive hover:text-destructive"
                  onClick={() => setResetAllOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Reset all learning progress
                </Button>
              ) : null}
              </div>

              <Tabs defaultValue="activity" className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <TabsList className="grid w-full shrink-0 grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="learning">Learning</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
                  {data.organizations.length > 0 ? (
                    <Section title="Organizations" icon={Building2}>
                      {data.organizations.map((org) => (
                        <Row
                          key={`${org.organization_name}-${org.joined_at}`}
                          title={org.organization_name}
                          meta={`${org.role} · joined ${formatWhen(org.joined_at)}`}
                        />
                      ))}
                    </Section>
                  ) : null}

                  {data.teaching.length > 0 ? (
                    <Section title="Courses teaching" icon={GraduationCap}>
                      {data.teaching.map((row) => (
                        <Row key={row.course_title} title={row.course_title} meta={formatWhen(row.created_at)} />
                      ))}
                    </Section>
                  ) : null}

                  {data.materials_uploaded.length > 0 ? (
                    <Section title="Materials uploaded" icon={BookOpen}>
                      {data.materials_uploaded.map((row) => (
                        <Row
                          key={`${row.title}-${row.updated_at}`}
                          title={row.title}
                          meta={`${row.type} · ${formatWhen(row.updated_at)}`}
                        />
                      ))}
                    </Section>
                  ) : null}

                  {data.lessons_created.length > 0 ? (
                    <Section title="Lessons created" icon={BookOpen}>
                      {data.lessons_created.map((row) => (
                        <Row
                          key={`${row.title}-${row.updated_at}`}
                          title={row.title}
                          meta={`${row.course_title} · ${row.status}`}
                        />
                      ))}
                    </Section>
                  ) : null}

                  {data.evaluations_given.length > 0 ? (
                    <Section title="Evaluations given" icon={GraduationCap}>
                      {data.evaluations_given.map((row, i) => (
                        <Row
                          key={`${row.course_title}-${i}`}
                          title={row.student_name}
                          meta={`${row.course_title} · ${row.status}${row.score != null ? ` · ${row.score}%` : ""}`}
                        />
                      ))}
                    </Section>
                  ) : null}

                  {data.organizations.length === 0 &&
                  data.teaching.length === 0 &&
                  data.materials_uploaded.length === 0 &&
                  data.lessons_created.length === 0 &&
                  data.evaluations_given.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No org or teaching activity yet.</p>
                  ) : null}
                </TabsContent>

                <TabsContent value="learning" className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto">
                  {data.enrollments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No course enrollments.</p>
                  ) : (
                    data.enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="rounded-lg border border-border p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{enrollment.course_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {enrollment.lessons_completed}/{enrollment.lessons_total} lessons ·
                              enrolled {formatWhen(enrollment.created_at)}
                            </p>
                          </div>
                          {enrollment.completed ? (
                            <Badge className="bg-emerald-600/90">Completed</Badge>
                          ) : (
                            <Badge variant="outline">In progress</Badge>
                          )}
                        </div>
                        <Progress value={enrollment.progress_percent} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">
                          {enrollment.progress_percent}% · last activity {formatWhen(enrollment.updated_at)}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 px-2 text-destructive hover:text-destructive"
                          onClick={() =>
                            setResetCourse({
                              id: enrollment.course_id,
                              title: enrollment.course_title,
                            })
                          }
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset course progress
                        </Button>
                      </div>
                    ))
                  )}

                  {data.scorm_records.length > 0 ? (
                    <Section title="SCORM activity" icon={Activity}>
                      {data.scorm_records.slice(0, 10).map((row, i) => (
                        <Row
                          key={`${row.lesson_title}-${i}`}
                          title={row.lesson_title}
                          meta={`${row.course_title} · ${row.lesson_status} · ${formatWhen(row.updated_at)}`}
                        />
                      ))}
                    </Section>
                  ) : null}

                  {scormResponseRecords.length > 0 ? (
                    <Section title="SCORM responses" icon={FileQuestion}>
                      {scormResponseRecords.slice(0, 8).map((row, i) => (
                        <div
                          key={`${row.lesson_title}-response-${i}`}
                          className="rounded-md border border-border/60 px-3 py-2"
                        >
                          <p className="text-sm font-medium">{row.lesson_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.course_title} · {row.lesson_status} · {formatWhen(row.updated_at)}
                          </p>

                          {row.readableInteractions.length > 0 ? (
                            <AnswerList
                              interactions={row.readableInteractions}
                              lessonTitle={row.lesson_title}
                              lessonCount={lessonCountLabel(row.lesson_number, row.lessons_total)}
                              titleKey={`${row.lesson_title}-response-${i}`}
                            />
                          ) : (
                            <div className="mt-2 rounded border border-dashed border-border/70 bg-muted/10 px-3 py-2">
                              <p className="text-xs font-medium text-foreground">
                                No readable SCORM answer captured
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                This package only saved resume/state data, not admin-readable learner text.
                              </p>
                            </div>
                          )}

                          {row.suspend_data && row.readableInteractions.length === 0 ? (
                            <details className="mt-2 rounded border border-border/60 bg-muted/10 px-3 py-2">
                              <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground">
                                Show raw suspend data
                              </summary>
                              <p className="mt-2 break-all text-[11px] text-muted-foreground">
                                {truncate(row.suspend_data, 800)}
                              </p>
                            </details>
                          ) : null}
                        </div>
                      ))}
                    </Section>
                  ) : null}

                  {data.quiz_attempts.length > 0 ? (
                    <Section title="Quiz attempts" icon={Activity}>
                      {data.quiz_attempts.slice(0, 10).map((row, i) => (
                        <Row
                          key={`${row.quiz_title}-${i}`}
                          title={row.quiz_title}
                          meta={`${row.score}%${row.passed ? " passed" : ""} · ${formatWhen(row.created_at)}`}
                        />
                      ))}
                    </Section>
                  ) : null}
                </TabsContent>

                <TabsContent value="activity" className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
                  <ActivityByLesson data={data} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={resetAllOpen} onOpenChange={setResetAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all learning progress?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears all enrollments progress, lesson completions, SCORM bookmarks, quiz attempts,
              and certificates for {displayName}. Enrollments remain — only progress is wiped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void handleReset()
              }}
            >
              {resetting ? "Resetting…" : "Reset all progress"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!resetCourse} onOpenChange={() => setResetCourse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset course progress?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears all progress for &quot;{resetCourse?.title}&quot; including SCORM data and
              quiz attempts for {displayName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                if (resetCourse) void handleReset(resetCourse.id)
              }}
            >
              {resetting ? "Resetting…" : "Reset course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/15 px-2 py-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-none">{value}</p>
        <p className="truncate text-[10px] leading-tight text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function lessonCountLabel(lessonNumber: number | null | undefined, lessonsTotal: number | null | undefined) {
  if (!lessonNumber || !lessonsTotal) return null
  return `Lesson ${lessonNumber}/${lessonsTotal}`
}

type LessonSection = {
  key: string
  courseTitle: string
  lessonTitle: string
  lessonCount: string | null
  lessonNumber: number | null
  answers: UserActivityPayload["scorm_records"][number]["interactions"]
  occurredAt: string | null
}

type CourseSection = {
  courseTitle: string
  enrolledAt: string | null
  completedAt: string | null
  lessons: LessonSection[]
}

function readableAnswers(interactions: LessonSection["answers"]) {
  return interactions.filter(
    (interaction) =>
      looksReadableScormResponse(interaction.student_response) ||
      looksReadableScormResponse(interaction.description),
  )
}

function groupActivityByLesson(data: UserActivityPayload) {
  const courses = new Map<string, CourseSection>()
  const lessons = new Map<string, LessonSection>()

  function courseSection(title: string) {
    const name = title || "Other"
    const existing = courses.get(name)
    if (existing) return existing
    const created: CourseSection = {
      courseTitle: name,
      enrolledAt: null,
      completedAt: null,
      lessons: [],
    }
    courses.set(name, created)
    return created
  }

  function lessonSection(courseTitle: string, lessonTitle: string) {
    const key = `${courseTitle}::${lessonTitle}`
    const existing = lessons.get(key)
    if (existing) return existing
    const created: LessonSection = {
      key,
      courseTitle,
      lessonTitle,
      lessonCount: null,
      lessonNumber: null,
      answers: [],
      occurredAt: null,
    }
    lessons.set(key, created)
    courseSection(courseTitle).lessons.push(created)
    return created
  }

  for (const row of data.scorm_records) {
    const section = lessonSection(row.course_title, row.lesson_title)
    section.lessonCount = lessonCountLabel(row.lesson_number, row.lessons_total)
    section.lessonNumber = row.lesson_number
    section.occurredAt = row.updated_at
    section.answers = readableAnswers(row.interactions)
  }

  for (const row of data.lesson_progress) {
    const section = lessonSection(row.course_title, row.lesson_title)
    if (!section.lessonCount) {
      section.lessonCount = lessonCountLabel(row.lesson_number, row.lessons_total)
      section.lessonNumber = row.lesson_number
    }
    if (!section.occurredAt) section.occurredAt = row.completed_at ?? row.updated_at
  }

  for (const item of data.recent_timeline) {
    if (!item.course_title) continue
    if (item.kind === "enrollment") courseSection(item.course_title).enrolledAt = item.occurred_at
    if (item.kind === "course_completed") courseSection(item.course_title).completedAt = item.occurred_at
    if (item.kind === "scorm_activity" || item.kind === "lesson_completed") {
      lessonSection(item.course_title, item.label)
    }
  }

  const courseList = [...courses.values()]
  for (const course of courseList) {
    course.lessons.sort((a, b) => (a.lessonNumber ?? 999) - (b.lessonNumber ?? 999))
  }
  return courseList
}

function quizSummary(answers: LessonSection["answers"]) {
  const graded = answers.filter(
    (interaction) => interaction.result === "correct" || interaction.result === "incorrect",
  )
  const correctCount = graded.filter((interaction) => interaction.result === "correct").length
  if (graded.length === 0) return null
  return {
    correctCount,
    total: graded.length,
    passed: correctCount === graded.length,
  }
}

function ActivityByLesson({ data }: { data: UserActivityPayload }) {
  const courses = groupActivityByLesson(data)
  const [openCourses, setOpenCourses] = useState<Record<string, boolean>>({})
  const [openLessons, setOpenLessons] = useState<Record<string, boolean>>({})

  if (courses.length === 0) {
    return <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
  }

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      {courses.map((course) => {
        const courseOpen = openCourses[course.courseTitle] ?? true
        return (
          <section key={course.courseTitle} className="rounded-lg border border-border">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-3 text-left"
              aria-expanded={courseOpen}
              onClick={() =>
                setOpenCourses((current) => ({
                  ...current,
                  [course.courseTitle]: !courseOpen,
                }))
              }
            >
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${courseOpen ? "" : "-rotate-90"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{course.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {course.lessons.length} {course.lessons.length === 1 ? "lesson" : "lessons"}
                  {course.enrolledAt ? ` · enrolled ${formatWhen(course.enrolledAt)}` : ""}
                  {course.completedAt ? " · course completed" : ""}
                </p>
              </div>
            </button>
            {courseOpen ? (
              <div className="space-y-2 border-t border-border px-3 py-3">
                {course.lessons.map((lesson) => {
                  const lessonOpen = openLessons[lesson.key] ?? false
                  const summary = quizSummary(lesson.answers)
                  return (
                    <div key={lesson.key} className="rounded-lg border border-border/70">
                      <button
                        type="button"
                        className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
                        aria-expanded={lessonOpen}
                        onClick={() =>
                          setOpenLessons((current) => ({
                            ...current,
                            [lesson.key]: !lessonOpen,
                          }))
                        }
                      >
                        <ChevronDown
                          className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${lessonOpen ? "" : "-rotate-90"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {lesson.lessonCount ? (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                                {lesson.lessonCount}
                              </span>
                            ) : null}
                            {summary ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  summary.passed
                                    ? "bg-emerald-500/15 text-emerald-500"
                                    : "bg-destructive/15 text-destructive"
                                }`}
                              >
                                {summary.passed ? "Passed" : "Failed"} {summary.correctCount}/{summary.total}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm font-medium leading-snug">{lesson.lessonTitle}</p>
                          {lesson.occurredAt ? (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              {formatWhen(lesson.occurredAt)}
                            </p>
                          ) : null}
                        </div>
                      </button>
                      {lessonOpen ? (
                        <div className="border-t border-border/70 px-3 pb-3">
                          {lesson.answers.length > 0 ? (
                            <AnswerList
                              interactions={lesson.answers}
                              lessonTitle={lesson.lessonTitle}
                              lessonCount={lesson.lessonCount}
                              showLessonTag={false}
                              titleKey={lesson.key}
                            />
                          ) : (
                            <p className="pt-3 text-xs text-muted-foreground">
                              No quiz choices were saved for this lesson.
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

function AnswerList({
  interactions,
  lessonTitle,
  lessonCount,
  showLessonTag = true,
  titleKey,
}: {
  interactions: UserActivityPayload["scorm_records"][number]["interactions"]
  lessonTitle: string
  lessonCount: string | null
  showLessonTag?: boolean
  titleKey: string
}) {
  const shown = interactions.slice(0, 30)
  const graded = shown.filter(
    (interaction) => interaction.result === "correct" || interaction.result === "incorrect",
  )
  const correctCount = graded.filter((interaction) => interaction.result === "correct").length
  const passed = graded.length > 0 && correctCount === graded.length

  return (
    <div className="mt-3 space-y-3">
      {graded.length > 0 ? (
        <div
          className={`flex items-center gap-4 rounded-xl px-4 py-3 ${
            passed ? "bg-emerald-500/15" : "bg-destructive/15"
          }`}
        >
          <p className="text-4xl font-bold leading-none tabular-nums">
            {correctCount}
            <span className="text-xl font-semibold text-muted-foreground">/{graded.length}</span>
          </p>
          <div>
            <p className={`text-lg font-semibold ${passed ? "text-emerald-500" : "text-destructive"}`}>
              {passed ? "Passed" : "Failed"}
            </p>
            <p className="text-sm text-muted-foreground">
              {correctCount} of {graded.length} correct
            </p>
          </div>
        </div>
      ) : null}

      {shown.map((interaction, idx) => (
        <QuizAnswerCard
          key={`${titleKey}-interaction-${idx}`}
          interaction={interaction}
          index={idx}
          lessonTitle={lessonCount ? `${lessonCount} · ${lessonTitle}` : `Lesson · ${lessonTitle}`}
          showLessonTag={showLessonTag}
          titleKey={titleKey}
        />
      ))}
    </div>
  )
}

function QuizAnswerCard({
  interaction,
  index,
  lessonTitle,
  showLessonTag = true,
  titleKey,
}: {
  interaction: UserActivityPayload["scorm_records"][number]["interactions"][number]
  index: number
  lessonTitle: string
  showLessonTag?: boolean
  titleKey: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const verdict = resultLabel(interaction.result)
  const correct = verdict === "Correct"
  const incorrect = verdict === "Incorrect"
  const lines = answerLines(interaction.student_response)

  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body || expanded) return
    setOverflows(body.scrollHeight > body.clientHeight + 1)
  }, [expanded, interaction.description, interaction.student_response, interaction.result])

  return (
    <div
      className={`flex flex-col rounded-lg border border-border/70 border-l-4 bg-muted/15 px-3 py-2 ${
        expanded ? "" : "h-24"
      } ${correct ? "border-l-emerald-500" : incorrect ? "border-l-destructive" : "border-l-border"}`}
    >
      <div ref={bodyRef} className={expanded ? "" : "min-h-0 flex-1 overflow-hidden"}>
        {showLessonTag ? (
          <p className="truncate text-[11px] font-medium text-muted-foreground">{lessonTitle}</p>
        ) : null}
        <div className={`flex items-start justify-between gap-3 ${showLessonTag ? "mt-1" : ""}`}>
          <p className="text-sm font-semibold leading-snug text-foreground">
            {index + 1}. {interaction.description ?? interaction.id ?? "Question"}
          </p>
          {verdict ? (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                correct
                  ? "bg-emerald-500/15 text-emerald-500"
                  : incorrect
                    ? "bg-destructive/15 text-destructive"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {verdict}
            </span>
          ) : null}
        </div>
        <ul className="mt-2 space-y-1">
          {lines.map((line, lineIndex) => (
            <li key={`${titleKey}-${index}-${lineIndex}`} className="text-sm leading-snug text-foreground/80">
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-1 h-6 shrink-0">
        {overflows || expanded ? (
          <button
            type="button"
            className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? "See less" : "See more"}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Row({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-md border border-border/60 px-3 py-2">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{meta}</p>
    </div>
  )
}
