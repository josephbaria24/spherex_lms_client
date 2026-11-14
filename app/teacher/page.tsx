"use client"

import { Spinner } from "@/components/ui/spinner"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { isAdmin, isIeltsTeacher } from "@/lib/roles"
import { fetchTeacherWorkspaceOrgs } from "@/lib/teacher-orgs"
import {
  TEACHER_ORG_ID_STORAGE_KEY,
  TEACHER_ORG_SLUG_STORAGE_KEY,
  teacherRoute,
} from "@/lib/teacher-routes"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { GrowHeader } from "@/components/grow-shell"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Languages } from "lucide-react"

export default function TeacherHomePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [checkingOrgs, setCheckingOrgs] = useState(true)
  const [hasOrgs, setHasOrgs] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (isIeltsTeacher(user?.role, user?.teaching_field)) {
      router.replace("/teacher/ielts")
      return
    }

    let cancelled = false

    async function redirect() {
      try {
        const orgs = await fetchTeacherWorkspaceOrgs(isAdmin(user?.role))
        if (cancelled) return

        if (orgs.length > 0) {
          const storedSlug = localStorage.getItem(TEACHER_ORG_SLUG_STORAGE_KEY)
          const storedId = localStorage.getItem(TEACHER_ORG_ID_STORAGE_KEY)
          const fromSlug = storedSlug
            ? orgs.find((o) => o.organization.slug === storedSlug)
            : null
          const fromId = storedId
            ? orgs.find((o) => o.organization_id === storedId)
            : null
          const target = fromSlug ?? fromId ?? orgs[0]!
          router.replace(teacherRoute(target.organization.slug))
          return
        }

        setHasOrgs(false)
      } catch {
        if (!cancelled) setHasOrgs(false)
      } finally {
        if (!cancelled) setCheckingOrgs(false)
      }
    }

    void redirect()
    return () => {
      cancelled = true
    }
  }, [router, authLoading, user?.role, user?.teaching_field])

  if (authLoading || isIeltsTeacher(user?.role, user?.teaching_field) || checkingOrgs) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size={36} />
      </div>
    )
  }

  if (!hasOrgs) {
    return (
      <GrowMainLayout>
        <div className="space-y-5">
          <GrowHeader
            icon={BookOpen}
            title="Teaching"
            accent="workspace"
            description="Your account is ready. Ask an admin to assign course access if you need org courses."
            showDate={false}
          />
          <div className="grow-card max-w-xl space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              No organization join code is required. If you teach IELTS, ask an admin to set your
              teaching field to IELTS so the IELTS hub opens automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/teacher/ielts">
                  <Languages className="mr-2 h-4 w-4" />
                  Open IELTS hub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </GrowMainLayout>
    )
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size={36} />
    </div>
  )
}
