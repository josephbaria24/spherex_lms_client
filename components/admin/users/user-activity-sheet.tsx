"use client"

import { useCallback, useEffect, useState } from "react"
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
  }>
  scorm_records: Array<{
    lesson_title: string
    course_title: string
    lesson_status: string
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col overflow-hidden px-[21px] py-[5px] sm:max-w-xl">
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

              <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                  {data.recent_timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
                  ) : (
                    <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                      {data.recent_timeline.map((item, i) => (
                        <li
                          key={`${item.kind}-${item.occurred_at}-${i}`}
                          className="rounded-lg border border-border px-3 py-2"
                        >
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.detail}
                            {item.course_title ? ` · ${item.course_title}` : ""}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {formatWhen(item.occurred_at)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
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

function Row({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-md border border-border/60 px-3 py-2">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{meta}</p>
    </div>
  )
}
