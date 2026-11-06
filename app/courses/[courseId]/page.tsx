"use client"

import { Spinner } from "@/components/ui/spinner"
import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"


export default function CourseDetailRedirect({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (user) {
      router.replace(`/courses/${courseId}/learn`)
      return
    }
    router.replace(`/courses?course=${courseId}`)
  }, [courseId, loading, router, user])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size={32} />
    </div>
  )
}
