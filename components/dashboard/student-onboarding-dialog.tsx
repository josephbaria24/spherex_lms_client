"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BookOpen, Building2, Sparkles } from "lucide-react"
import type { AuthUser } from "@/lib/api"
import { JoinOrganizationForm } from "@/components/org/join-organization-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GROW_SHELL } from "@/lib/grow-shell"
import { cn } from "@/lib/utils"

const STORAGE_PREFIX = "spherex:onboarding:student:"

type Step = "welcome" | "code-ask" | "code-input"

type StudentOnboardingDialogProps = {
  user: AuthUser
  enrollmentCount: number
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function displayName(user: AuthUser) {
  return user.full_name ?? user.name ?? user.email.split("@")[0]
}

export function StudentOnboardingDialog({
  user,
  enrollmentCount,
}: StudentOnboardingDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("welcome")

  useEffect(() => {
    if (typeof window === "undefined") return
    if (user.role !== "student" && user.role !== "user") return
    try {
      if (window.localStorage.getItem(storageKey(user.id))) return
    } catch {
      return
    }
    setStep("welcome")
    setOpen(true)
  }, [user.id, user.role])

  function complete() {
    try {
      window.localStorage.setItem(storageKey(user.id), new Date().toISOString())
    } catch {
      // ignore quota / private mode
    }
    setOpen(false)
  }

  function onOpenChange(next: boolean) {
    if (!next) {
      complete()
      return
    }
    setOpen(true)
  }

  const emptyCourses = enrollmentCount === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "gap-0 overflow-hidden rounded-[1.75rem] border-[#ebe4da] bg-[#fbf8f3] p-0 shadow-xl sm:max-w-md",
          "dark:border-border dark:bg-card",
        )}
      >
        <div className="border-b border-[#ebe4da] bg-white/70 px-6 py-5 dark:border-border dark:bg-card/80">
          <DialogHeader className="gap-2 text-left">
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ebe4da] bg-[#f7f3ec] dark:border-border dark:bg-muted">
              <Sparkles className="h-5 w-5 text-[#5c4d8a]" aria-hidden />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-[#1c1917] dark:text-foreground">
              Welcome
              {displayName(user) ? (
                <>
                  ,{" "}
                  <span
                    className="font-serif italic"
                    style={{ color: GROW_SHELL.colors.accent }}
                  >
                    {displayName(user)}
                  </span>
                </>
              ) : null}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
              {step === "welcome" &&
                (emptyCourses
                  ? "You’re all set up — next, find a course to start learning."
                  : "A quick tour to help you get the most out of SphereX.")}
              {step === "code-ask" &&
                "Some organizations unlock free courses with a student code."}
              {step === "code-input" &&
                "Enter the student organization code you received."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {step === "welcome" ? (
            <>
              <div className="rounded-[1.25rem] border border-[#ebe4da] bg-white/80 p-4 dark:border-border dark:bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a1f2e] text-white">
                    <BookOpen className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-[#1c1917] dark:text-foreground">
                      {emptyCourses ? "No courses yet" : "Browse more courses"}
                    </p>
                    <p className="text-xs leading-relaxed text-[#6b5c4f] dark:text-muted-foreground">
                      {emptyCourses
                        ? "Open the Courses page to explore the catalog and enroll with payment or an admin enrollment code."
                        : "You can always find new training in Courses from the sidebar."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button asChild className="grow-btn-primary rounded-full">
                  <Link href="/courses" onClick={complete}>
                    Go to courses
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="grow-btn-outline rounded-full"
                  onClick={() => setStep("code-ask")}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : null}

          {step === "code-ask" ? (
            <>
              <div className="rounded-[1.25rem] border border-[#ebe4da] bg-white/80 p-4 dark:border-border dark:bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
                    <Building2 className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-[#1c1917] dark:text-foreground">
                      Do you have a student organization code?
                    </p>
                    <p className="text-xs leading-relaxed text-[#6b5c4f] dark:text-muted-foreground">
                      If your school or company gave you a code (for example PETRO-STUDENT),
                      you can join and unlock org courses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  className="grow-btn-primary rounded-full"
                  onClick={() => setStep("code-input")}
                >
                  Yes, I have a code
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="grow-btn-outline rounded-full"
                  onClick={complete}
                >
                  No, skip for now
                </Button>
              </div>
            </>
          ) : null}

          {step === "code-input" ? (
            <>
              <JoinOrganizationForm
                mode="student"
                compact
                redirectTo="/courses"
                onSuccess={() => complete()}
              />
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-full text-muted-foreground"
                onClick={complete}
              >
                Skip for now
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
