"use client"

import Link from "next/link"
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  Flame,
  GraduationCap,
  History,
  Medal,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react"
import { GrowHeader } from "@/components/grow-shell"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { LearnAchievementsPayload } from "@/lib/learn-achievements-types"

type StudentAchievementsPageProps = {
  data: LearnAchievementsPayload
}

type Milestone = {
  id: string
  title: string
  description: string
  icon: typeof Trophy
  earned: boolean
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function activityIcon(kind: string) {
  switch (kind) {
    case "course_completed":
      return GraduationCap
    case "quiz_attempt":
      return Target
    case "enrolled":
      return BookOpen
    default:
      return CheckCircle2
  }
}

function buildMilestones(summary: LearnAchievementsPayload["summary"]): Milestone[] {
  return [
    {
      id: "first-lesson",
      title: "First step",
      description: "Complete your first lesson",
      icon: Sparkles,
      earned: summary.lessons_completed >= 1,
    },
    {
      id: "lesson-10",
      title: "Dedicated learner",
      description: "Complete 10 lessons",
      icon: BookOpen,
      earned: summary.lessons_completed >= 10,
    },
    {
      id: "streak-7",
      title: "On fire",
      description: "Maintain a 7-day learning streak",
      icon: Flame,
      earned: summary.streak_days >= 7,
    },
    {
      id: "course-done",
      title: "Course graduate",
      description: "Finish your first course",
      icon: GraduationCap,
      earned: summary.courses_completed >= 1,
    },
    {
      id: "certified",
      title: "Certified",
      description: "Earn your first certificate",
      icon: Award,
      earned: summary.certificates >= 1,
    },
    {
      id: "quiz-5",
      title: "Quiz master",
      description: "Complete 5 quiz attempts",
      icon: Medal,
      earned: summary.quiz_attempts >= 5,
    },
  ]
}

export function StudentAchievementsPage({ data }: StudentAchievementsPageProps) {
  const { summary, enrollments, certificates, activity_history } = data
  const milestones = buildMilestones(summary)
  const earnedCount = milestones.filter((m) => m.earned).length
  const inProgressCourses = enrollments.filter((e) => !e.completed)
  const completedCourses = enrollments.filter((e) => e.completed)

  return (
    <>
      <GrowHeader
        title="Achievements"
        accent="your journey"
        description="Track milestones, certificates, and your full learning history"
      >
        <Button variant="outline" className="grow-btn-outline" asChild>
          <Link href="/courses">
            <BookOpen className="mr-1.5 h-4 w-4" />
            My courses
          </Link>
        </Button>
      </GrowHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="grow-card-coral p-5">
          <p className="text-sm font-medium text-white/85">Learning streak</p>
          <p className="mt-2 flex items-center gap-2 text-4xl font-bold">
            <Flame className="h-8 w-8 text-white/90" />
            {summary.streak_days}
          </p>
          <p className="mt-1 text-sm text-white/75">day{summary.streak_days === 1 ? "" : "s"} active</p>
        </div>
        <div className="grow-card p-5">
          <p className="text-sm text-muted-foreground">Lessons completed</p>
          <p className="mt-2 text-4xl font-bold text-[#1c1917] dark:text-foreground">
            {summary.lessons_completed}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.knowledge_growth_percent >= 0 ? "+" : ""}
            {summary.knowledge_growth_percent}% vs last week
          </p>
        </div>
        <div className="grow-card-accent p-5">
          <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">Certificates</p>
          <p className="mt-2 text-4xl font-bold text-[#1c1917] dark:text-foreground">
            {summary.certificates}
          </p>
          <p className="mt-1 text-sm text-[#6b5c4f] dark:text-muted-foreground">credentials earned</p>
        </div>
        <div className="grow-card-dark p-5">
          <p className="text-sm text-white/70">Courses finished</p>
          <p className="mt-2 text-4xl font-bold">{summary.courses_completed}</p>
          <p className="mt-1 text-sm text-white/60">
            of {summary.courses_enrolled} enrolled
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="grow-tabs-list">
          <TabsTrigger value="overview" className="grow-tab-trigger">
            Overview
          </TabsTrigger>
          <TabsTrigger value="progress" className="grow-tab-trigger">
            Progress
          </TabsTrigger>
          <TabsTrigger value="certificates" className="grow-tab-trigger">
            Certificates
          </TabsTrigger>
          <TabsTrigger value="history" className="grow-tab-trigger">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <section className="grow-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1c1917] dark:text-foreground">
                    Milestones
                  </h2>
                  <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                    {earnedCount} of {milestones.length} unlocked
                  </p>
                </div>
                <span className="grow-badge">
                  <Trophy className="mr-1 inline h-3.5 w-3.5" />
                  {earnedCount}/{milestones.length}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {milestones.map((milestone) => {
                  const Icon = milestone.icon
                  return (
                    <div
                      key={milestone.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                        milestone.earned
                          ? "border-[#ebe4da] bg-[#faf8f5] dark:border-border dark:bg-muted/40"
                          : "border-dashed border-[#ddd6ce] bg-white/50 opacity-70 dark:border-border dark:bg-card/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          milestone.earned
                            ? "bg-[#ebe4f8] text-[#7c6cf0] dark:bg-violet-950/50"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-[#1c1917] dark:text-foreground">
                          {milestone.title}
                        </p>
                        <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="grow-card p-5 md:p-6">
              <h2 className="text-lg font-semibold text-[#1c1917] dark:text-foreground">
                Weekly goal
              </h2>
              <p className="mt-1 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                {summary.hours_completed}h of {summary.hours_goal}h learning time
              </p>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b5c4f] dark:text-muted-foreground">Progress</span>
                  <span className="font-medium text-[#1c1917] dark:text-foreground">
                    {summary.weekly_goal_percent}%
                  </span>
                </div>
                <Progress
                  value={summary.weekly_goal_percent}
                  className="h-2 [&_[data-slot=progress-indicator]]:bg-[#7c6cf0]"
                />
              </div>
              <div className="mt-6 space-y-3 border-t border-[#ebe4da] pt-4 dark:border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b5c4f] dark:text-muted-foreground">Quiz attempts</span>
                  <span className="font-medium">{summary.quiz_attempts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b5c4f] dark:text-muted-foreground">Enrolled courses</span>
                  <span className="font-medium">{summary.courses_enrolled}</span>
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {enrollments.length === 0 ? (
            <div className="grow-empty">
              <BookOpen className="mx-auto h-10 w-10 text-[#c9bfb0] dark:text-muted-foreground" />
              <p className="mt-3 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                No course progress yet. Enroll in a course to get started.
              </p>
              <Button asChild className="grow-btn-primary mt-4">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
          ) : (
            <>
              {inProgressCourses.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-[#1c1917] dark:text-foreground">
                    In progress
                  </h2>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {inProgressCourses.map((enrollment) => (
                      <article key={enrollment.id} className="grow-card p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-[#1c1917] dark:text-foreground">
                              {enrollment.course.title}
                            </h3>
                            <p className="mt-1 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                              {enrollment.lessons_completed} of {enrollment.lessons_total} lessons
                            </p>
                          </div>
                          <span className="grow-badge">{enrollment.progress_percent}%</span>
                        </div>
                        <Progress
                          value={enrollment.progress_percent}
                          className="mt-4 h-2 [&_[data-slot=progress-indicator]]:bg-[#e85d4a]"
                        />
                        <Button asChild size="sm" className="grow-btn-outline mt-4" variant="outline">
                          <Link href={`/courses/${enrollment.course_id}/learn`}>Continue</Link>
                        </Button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {completedCourses.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-[#1c1917] dark:text-foreground">
                    Completed
                  </h2>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {completedCourses.map((enrollment) => (
                      <article key={enrollment.id} className="grow-card-accent p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-[#1c1917] dark:text-foreground">
                              {enrollment.course.title}
                            </h3>
                            <p className="mt-1 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                              {enrollment.lessons_total} lessons completed
                            </p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#e85d4a]" />
                        </div>
                        <Button asChild size="sm" className="grow-btn-outline mt-4" variant="outline">
                          <Link href={`/courses/${enrollment.course_id}/learn`}>Review</Link>
                        </Button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          {certificates.length === 0 ? (
            <div className="grow-empty">
              <Award className="mx-auto h-10 w-10 text-[#c9bfb0] dark:text-muted-foreground" />
              <p className="mt-3 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                No certificates yet. Complete a course to earn one.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {certificates.map((cert, index) => {
                const isCoral = index % 2 === 0
                return (
                  <article
                    key={cert.id}
                    className={isCoral ? "grow-card-coral p-5" : "grow-card p-5"}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                          isCoral
                            ? "bg-white/20 text-white"
                            : "bg-[#ebe4f8] text-[#7c6cf0] dark:bg-violet-950/50",
                        )}
                      >
                        <Award className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3
                          className={cn(
                            "text-lg font-bold",
                            isCoral
                              ? "text-white"
                              : "text-[#1c1917] dark:text-foreground",
                          )}
                        >
                          {cert.course_title ?? "Course certificate"}
                        </h3>
                        <p
                          className={cn(
                            "mt-1 text-sm",
                            isCoral
                              ? "text-white/75"
                              : "text-[#6b5c4f] dark:text-muted-foreground",
                          )}
                        >
                          Issued {formatDate(cert.issued_at)}
                        </p>
                      </div>
                    </div>
                    {cert.certificate_url ? (
                      <Button
                        asChild
                        size="sm"
                        className={cn(
                          "mt-4 gap-1.5",
                          isCoral
                            ? "bg-white/15 text-white hover:bg-white/25"
                            : "grow-btn-outline",
                        )}
                        variant={isCoral ? "secondary" : "outline"}
                      >
                        <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                          View certificate
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </a>
                      </Button>
                    ) : (
                      <p
                        className={cn(
                          "mt-4 text-sm",
                          isCoral
                            ? "text-white/70"
                            : "text-[#6b5c4f] dark:text-muted-foreground",
                        )}
                      >
                        Certificate on file — contact your instructor for a copy.
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {activity_history.length === 0 ? (
            <div className="grow-empty">
              <History className="mx-auto h-10 w-10 text-[#c9bfb0] dark:text-muted-foreground" />
              <p className="mt-3 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                Your learning history will appear here as you complete lessons and quizzes.
              </p>
            </div>
          ) : (
            <div className="grow-card divide-y divide-[#ebe4da] dark:divide-border">
              {activity_history.map((item, index) => {
                const Icon = activityIcon(item.kind)
                return (
                  <div key={`${item.kind}-${item.occurred_at}-${index}`} className="flex gap-4 p-4 md:p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#faf8f5] text-[#7c6cf0] dark:bg-muted">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-[#1c1917] dark:text-foreground">
                            {item.label}
                          </p>
                          <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                            {item.detail}
                            {item.course_title && item.kind !== "course_completed"
                              ? ` · ${item.course_title}`
                              : null}
                          </p>
                        </div>
                        <time className="shrink-0 text-xs text-[#6b5c4f] dark:text-muted-foreground">
                          {formatDateTime(item.occurred_at)}
                        </time>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
