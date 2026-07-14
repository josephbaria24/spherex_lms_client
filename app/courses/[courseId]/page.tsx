"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CourseDetailRedirect({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const router = useRouter()

  useEffect(() => {
    router.replace(`/courses/${courseId}/learn`)
  }, [courseId, router])

  return null
}
