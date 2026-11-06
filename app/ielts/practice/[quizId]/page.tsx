"use client"

import { use } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { PracticeSession } from "@/components/reviewers/practice-session"
import { IeltsAccessDialog, useIeltsAccess } from "@/components/ielts/ielts-access-dialog"
import { LandingHeader } from "@/components/landing/landing-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export default function IeltsPracticePage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = use(params)
  const access = useIeltsAccess()

  if (access.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7f9] dark:bg-background">
        <Spinner size={28} />
      </div>
    )
  }

  if (!access.unlocked) {
    return (
      <div className="min-h-screen bg-[#f4f7f9] text-slate-800 dark:bg-background dark:text-foreground">
        <LandingHeader />
        <main className="mx-auto flex max-w-lg flex-col items-center px-4 pb-20 pt-32 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFE8E0] text-[#FF4B1A] dark:bg-[#FF4B1A]/15">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
            This IELTS training is locked
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Request access and wait for an admin to accept it, or enter the code they send you.
          </p>
          <Button
            type="button"
            className="mt-6 bg-[#FF4B1A] hover:bg-[#e84314]"
            onClick={() => access.ask("IELTS practice")}
          >
            Request access
          </Button>
          <Link href="/ielts" className="mt-4 text-sm font-medium text-slate-500 hover:underline">
            Back to IELTS
          </Link>
        </main>
        <IeltsAccessDialog
          open={access.open}
          onOpenChange={access.setOpen}
          training={access.training}
          onUnlocked={access.markUnlocked}
        />
      </div>
    )
  }

  return (
    <PracticeSession quizId={quizId} backHref="/ielts" backLabel="Back to IELTS" />
  )
}
