"use client"

import { use } from "react"
import { usePathname } from "next/navigation"
import { CourseLearnPage } from "@/components/lessons/course-learn-page"
import { orgRoute } from "@/lib/org-routes"

const LESSON_ID_RE =
  /\/preview\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i

export default function OrgCoursePreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string; courseId: string }>
}) {
  const { orgSlug, courseId } = use(params)
  const pathname = usePathname()

  if (pathname.includes("/scorm")) {
    return <>{children}</>
  }

  const lessonId = pathname.match(LESSON_ID_RE)?.[1]
  const base = orgRoute(orgSlug, `courses/${courseId}/preview`)

  return (
    <CourseLearnPage
      courseId={courseId}
      lessonId={lessonId}
      learnBasePath={base}
      backHref={orgRoute(orgSlug, "courses")}
      backLabel="Organization courses"
      previewMode
    />
  )
}
