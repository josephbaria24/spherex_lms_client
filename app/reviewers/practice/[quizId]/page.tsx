"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PracticeSession } from "@/components/reviewers/practice-session"
import { fetchPublicReviewerQuiz } from "@/lib/public-reviewers"
import { Loader2 } from "lucide-react"

export default function ReviewerPracticePage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = use(params)
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPublicReviewerQuiz(quizId)
      .then((data) => {
        if (cancelled) return
        if (data.quiz.exam_type === "IELTS") {
          router.replace(`/ielts/practice/${quizId}`)
          return
        }
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [quizId, router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-[#f4f7f9] text-slate-500 dark:bg-background dark:text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <PracticeSession
      quizId={quizId}
      backHref="/reviewers?tab=quizzes"
      backLabel="Back to reviewers"
    />
  )
}
