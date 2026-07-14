"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { isAdmin } from "@/lib/roles"
import { fetchTeacherWorkspaceOrgs } from "@/lib/teacher-orgs"
import {
  TEACHER_ORG_ID_STORAGE_KEY,
  TEACHER_ORG_SLUG_STORAGE_KEY,
  teacherRoute,
} from "@/lib/teacher-routes"

export default function TeacherHomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return

    let cancelled = false

    async function redirect() {
      try {
        const orgs = await fetchTeacherWorkspaceOrgs(isAdmin(user?.role))
        if (cancelled) return

        if (orgs.length === 0) {
          router.replace("/teacher/join")
          return
        }

        const storedSlug = localStorage.getItem(TEACHER_ORG_SLUG_STORAGE_KEY)
        const storedId = localStorage.getItem(TEACHER_ORG_ID_STORAGE_KEY)
        const fromSlug = storedSlug ? orgs.find((o) => o.organization.slug === storedSlug) : null
        const fromId = storedId ? orgs.find((o) => o.organization_id === storedId) : null
        const target = fromSlug ?? fromId ?? orgs[0]!

        router.replace(teacherRoute(target.organization.slug))
      } catch {
        if (!cancelled) router.replace("/teacher/join")
      }
    }

    redirect()
    return () => {
      cancelled = true
    }
  }, [router, authLoading, user?.role])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  )
}
