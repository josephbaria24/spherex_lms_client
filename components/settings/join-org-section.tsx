"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, X } from "lucide-react"
import { apiGet } from "@/lib/api"
import type { OrgMembership } from "@/lib/org-types"
import {
  getStudentMemberships,
  hasAnyOrganization,
  hasTeachingOrganization,
} from "@/lib/org-membership"
import {
  JoinOrganizationForm,
  type RedeemedCourse,
} from "@/components/org/join-organization-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/app/provider"
import { isStudent, isAdmin } from "@/lib/roles"
import { cn } from "@/lib/utils"

type JoinOrgSectionProps = {
  /** @deprecated Use variant="grow" */
  variant?: "default" | "student" | "grow"
}

export function JoinOrgSection({ variant = "default" }: JoinOrgSectionProps) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockedCourse, setUnlockedCourse] = useState<RedeemedCourse | null>(null)
  const isGrowStyle = variant === "grow" || variant === "student"

  useEffect(() => {
    apiGet<{ memberships: OrgMembership[] }>("/organizations/me")
      .then((data) => setMemberships(data.memberships ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  if (isAdmin(user?.role) && !hasAnyOrganization(memberships)) {
    return null
  }

  const shellClass = isGrowStyle
    ? "grow-card p-6"
    : "rounded-xl border border-border bg-card p-6 shadow-none"

  if (hasAnyOrganization(memberships)) {
    return (
      <section className={cn(isGrowStyle ? "grow-card-lime p-6" : shellClass)}>
        <h2 className="text-xl font-semibold text-[#1c1917] dark:text-foreground">
          Organizations
        </h2>
        <ul className="mt-4 space-y-2">
          {memberships.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-2xl bg-white/60 px-3 py-2 text-sm dark:bg-white/10"
            >
              <span className="font-medium text-[#1c1917] dark:text-foreground">
                {m.organization.name}
              </span>
              <Badge className="grow-badge">{m.role}</Badge>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const showStudentJoin = isStudent(user?.role)
  const showTeacherJoin = !showStudentJoin && !isAdmin(user?.role)

  if (!showStudentJoin && !showTeacherJoin) return null

  return (
    <>
      <section
        className={cn(
          isGrowStyle
            ? "grow-card-accent border border-dashed border-[#c9bfd8] p-6 dark:border-violet-500/30"
            : shellClass,
        )}
      >
        <h2 className="text-xl font-semibold text-[#1c1917] dark:text-foreground">
          {showStudentJoin ? "Join with a code" : "Join an organization"}
        </h2>
        <p className="mt-1 text-sm text-[#6b5c4f] dark:text-muted-foreground">
          {showStudentJoin
            ? "Use an organization student code or a course access code from your training provider."
            : "Have a teacher code from your organization? Enter it below to join as an instructor."}
        </p>
        <div className="mt-4 max-w-sm">
          <JoinOrganizationForm
            mode={showStudentJoin ? "student" : "teacher"}
            compact
            redirectTo={showStudentJoin ? "/courses" : "/teacher"}
            onCourseEnrolled={showStudentJoin ? setUnlockedCourse : undefined}
          />
        </div>
      </section>
      <CourseUnlockedDialog course={unlockedCourse} onClose={() => setUnlockedCourse(null)} />
    </>
  )
}

const JOIN_BANNER_HIDE_MS = 24 * 60 * 60 * 1000

function joinBannerStorageKey(userId: string | undefined) {
  return `petrocademia.student-join-banner.dismissed-at.${userId ?? "anonymous"}`
}

function joinBannerIsHidden(userId: string | undefined) {
  if (typeof window === "undefined") return false
  const raw = window.localStorage.getItem(joinBannerStorageKey(userId))
  const dismissedAt = Number(raw)
  if (!Number.isFinite(dismissedAt)) return false
  return Date.now() - dismissedAt < JOIN_BANNER_HIDE_MS
}

function CourseUnlockedDialog({
  course,
  onClose,
}: {
  course: RedeemedCourse | null
  onClose: () => void
}) {
  const open = Boolean(course)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md rounded-[1.5rem] border border-[#FFD8C8] bg-white p-6 dark:border-[#FF4B1A]/35 dark:bg-card sm:rounded-[1.5rem]">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF4B1A]/12 text-[#FF4B1A]">
            <BookOpen className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl">
            {course?.created ? "You're in" : "Already enrolled"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-[#6b5c4f] dark:text-muted-foreground">
            {course ? (
              <>
                {course.created
                  ? "Your course access code worked. Open "
                  : "You already have access to "}
                <span className="font-semibold text-[#1c1917] dark:text-foreground">
                  {course.title}
                </span>
                {course.created ? " to start learning." : "."}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          {course ? (
            <Button asChild className="h-10 w-full rounded-full bg-[#FF4B1A] text-white hover:bg-[#e84314]">
              <Link href={`/courses/${course.id}/learn`} onClick={onClose}>
                Go to {course.title}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-full"
            onClick={onClose}
          >
            Stay here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function StudentJoinBanner({
  compact = false,
}: {
  compact?: boolean
}) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [unlockedCourse, setUnlockedCourse] = useState<RedeemedCourse | null>(null)

  useEffect(() => {
    if (!isStudent(user?.role)) {
      setLoading(false)
      return
    }
    setDismissed(joinBannerIsHidden(user?.id))
    apiGet<{ memberships: OrgMembership[] }>("/organizations/me")
      .then((data) => setMemberships(data.memberships ?? []))
      .finally(() => setLoading(false))
  }, [user?.id, user?.role])

  // Keep showing for students without an org so they can join or unlock a course by code.
  if (loading || dismissed || !isStudent(user?.role) || getStudentMemberships(memberships).length > 0) {
    return null
  }

  if (hasTeachingOrganization(memberships)) return null

  function dismissBanner() {
    window.localStorage.setItem(joinBannerStorageKey(user?.id), String(Date.now()))
    setDismissed(true)
  }

  if (compact) {
    return (
      <>
        <aside className="relative flex w-full flex-col gap-3 rounded-2xl border border-[#FFD8C8] bg-[#FFF6F2] p-3 pr-10 text-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-4 sm:pr-11 dark:border-[#FF4B1A]/35 dark:bg-[#FF4B1A]/10">
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Hide for a day"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-[#9a6b5c] transition hover:bg-white/80 hover:text-[#1c1917] dark:text-[#FFB09A] dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FF4B1A]">
              Access code
            </p>
            <h2 className="mt-0.5 text-sm font-semibold leading-5 text-[#1c1917] dark:text-foreground">
              Join with an org or course code
            </h2>
          </div>
          <div className="w-full min-w-0 sm:max-w-sm">
            <JoinOrganizationForm
              mode="student"
              compact
              dense
              redirectTo="/courses"
              onCourseEnrolled={setUnlockedCourse}
            />
          </div>
        </aside>
        <CourseUnlockedDialog course={unlockedCourse} onClose={() => setUnlockedCourse(null)} />
      </>
    )
  }

  return (
    <>
      <section className="grow-card-lime border border-dashed border-[#a8c97a] p-6 dark:border-lime-500/30">
        <h2 className="text-lg font-bold text-[#1c1917] dark:text-foreground">
          Join with a code
        </h2>
        <p className="mt-1 text-sm text-[#4a5c3a] dark:text-muted-foreground">
          Enter an organization student code to unlock free org courses, or a course access code to
          enroll in a specific course.
        </p>
        <div className="mt-4 max-w-md">
          <JoinOrganizationForm
            mode="student"
            compact
            redirectTo="/courses"
            onCourseEnrolled={setUnlockedCourse}
          />
        </div>
      </section>
      <CourseUnlockedDialog course={unlockedCourse} onClose={() => setUnlockedCourse(null)} />
    </>
  )
}
