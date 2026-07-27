"use client"

import { use } from "react"
import { ScormPlayerPage } from "@/components/lessons/scorm-player-page"

export default function LearnScormPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; lessonId: string }>
  searchParams: Promise<{ fresh?: string }>
}) {
  const { courseId, lessonId } = use(params)
  const { fresh } = use(searchParams)

  return (
    <ScormPlayerPage
      courseId={courseId}
      lessonId={lessonId}
      backHref={`/courses/${courseId}/learn/${lessonId}`}
      fresh={fresh === "1"}
    />
  )
}
