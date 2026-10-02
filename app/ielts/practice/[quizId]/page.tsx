"use client"

import { use } from "react"
import { PracticeSession } from "@/components/reviewers/practice-session"

export default function IeltsPracticePage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = use(params)
  return (
    <PracticeSession quizId={quizId} backHref="/ielts" backLabel="Back to IELTS" />
  )
}
