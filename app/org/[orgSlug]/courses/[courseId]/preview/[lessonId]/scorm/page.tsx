"use client"

import { use } from "react"
import { ScormPlayerPage } from "@/components/lessons/scorm-player-page"
import { orgRoute } from "@/lib/org-routes"

export default function OrgPreviewScormPlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; courseId: string; lessonId: string }>
  searchParams: Promise<{ fresh?: string }>
}) {
  const { orgSlug, courseId, lessonId } = use(params)
  const { fresh } = use(searchParams)

  return (
    <ScormPlayerPage
      courseId={courseId}
      lessonId={lessonId}
      backHref={orgRoute(orgSlug, `courses/${courseId}/preview/${lessonId}`)}
      previewMode
      fresh={fresh === "1"}
    />
  )
}
