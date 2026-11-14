"use client"

import { Spinner } from "@/components/ui/spinner"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { isAdmin, isIeltsTeacher } from "@/lib/roles"
import { fetchTeacherWorkspaceOrgs } from "@/lib/teacher-orgs"
import {
  TEACHER_ORG_ID_STORAGE_KEY,
  TEACHER_ORG_SLUG_STORAGE_KEY,
  isTeacherIeltsPath,
  teacherRoute,
} from "@/lib/teacher-routes"

/**
 * Soft gate for org-scoped teacher routes. Never forces an org join code screen.
 * IELTS teachers and the IELTS workspace bypass org checks entirely.
 */
export function TeacherOrgGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [checking, setChecking] = useState(true)

  const isJoinPage = pathname === "/teacher/join"
  const isTeacherRoot = pathname === "/teacher"
  const isIeltsWorkspace = isTeacherIeltsPath(pathname ?? "")
  const isPlatformAdmin = isAdmin(user?.role)
  const ieltsTeacher = isIeltsTeacher(user?.role, user?.teaching_field)

  useEffect(() => {
    if (authLoading) return

    // Join page is retired — send people to the teacher home.
    if (isJoinPage) {
      router.replace("/teacher")
      return
    }

    if (isTeacherRoot || isIeltsWorkspace || ieltsTeacher) {
      setChecking(false)
      return
    }

    let cancelled = false

    async function check() {
      try {
        if (isPlatformAdmin) {
          if (!cancelled) setChecking(false)
          return
        }

        const teaching = await fetchTeacherWorkspaceOrgs(false)
        if (cancelled) return

        if (teaching.length > 0) {
          const storedSlug = localStorage.getItem(TEACHER_ORG_SLUG_STORAGE_KEY)
          const storedId = localStorage.getItem(TEACHER_ORG_ID_STORAGE_KEY)
          const onOrgRoute = Boolean(getSlugFromPath(pathname ?? ""))
          if (!onOrgRoute) {
            const target =
              (storedSlug && teaching.find((m) => m.organization.slug === storedSlug)) ||
              (storedId && teaching.find((m) => m.organization_id === storedId)) ||
              teaching[0]
            if (target) router.replace(teacherRoute(target.organization.slug))
          }
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [
    authLoading,
    isJoinPage,
    isTeacherRoot,
    isIeltsWorkspace,
    ieltsTeacher,
    isPlatformAdmin,
    pathname,
    router,
  ])

  if (isJoinPage || isTeacherRoot || isIeltsWorkspace || ieltsTeacher) {
    return <>{children}</>
  }

  if (authLoading || checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size={36} />
      </div>
    )
  }

  return <>{children}</>
}

function getSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/teacher\/([^/]+)/)
  if (!match?.[1] || match[1] === "join" || match[1] === "ielts") return null
  return match[1]
}
