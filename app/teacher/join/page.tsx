"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

/** Org join code is no longer required for teachers. */
export default function TeacherJoinPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/teacher")
  }, [router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size={36} />
    </div>
  )
}
