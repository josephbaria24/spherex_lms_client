"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { isAdmin, isIeltsTeacher } from "@/lib/roles"
import { Spinner } from "@/components/ui/spinner"
import AdminIeltsPage from "@/app/admin/ielts/page"

function TeacherIeltsGate() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (isAdmin(user?.role)) {
      router.replace("/admin/ielts")
      return
    }
    if (!isIeltsTeacher(user?.role, user?.teaching_field)) {
      router.replace("/teacher")
    }
  }, [loading, user?.role, user?.teaching_field, router])

  if (loading || !isIeltsTeacher(user?.role, user?.teaching_field)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size={36} />
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size={36} />
        </div>
      }
    >
      <AdminIeltsPage />
    </Suspense>
  )
}

export default function TeacherIeltsPage() {
  return <TeacherIeltsGate />
}
