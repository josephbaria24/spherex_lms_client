"use client"

import { use, useEffect } from "react"
import { usePathname } from "next/navigation"
import { CourseLearnPage } from "@/components/lessons/course-learn-page"

const LESSON_ID_RE =
  /\/learn\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i

export default function CourseLearnLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const pathname = usePathname()

  if (pathname.includes("/scorm")) {
    return <>{children}</>
  }

  const lessonId = pathname.match(LESSON_ID_RE)?.[1]

  return <CourseLearnPage courseId={courseId} lessonId={lessonId} />
}
