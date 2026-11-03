"use client"

import { Spinner } from "@/components/ui/spinner"
import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { isAdmin } from "@/lib/roles"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { teacherRoute } from "@/lib/teacher-routes"

export function TeacherOrgSlugGate({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { teachingOrgs, loadingOrgs, selectedOrgId } = useTeacherOrg()
  const orgSlug = typeof params.orgSlug === "string" ? params.orgSlug : ""
  const isPlatformAdmin = isAdmin(user?.role)

  useEffect(() => {
    if (loadingOrgs || !orgSlug || isPlatformAdmin) return

    const match = teachingOrgs.find((m) => m.organization.slug === orgSlug)
    if (match) return

    if (teachingOrgs.length === 0) {
      router.replace("/teacher/join")
      return
    }

    router.replace(teacherRoute(teachingOrgs[0]!.organization.slug))
  }, [loadingOrgs, orgSlug, teachingOrgs, router, isPlatformAdmin])

  if (loadingOrgs && !isPlatformAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size={36} />
      </div>
    )
  }

  const valid =
    teachingOrgs.some((m) => m.organization.slug === orgSlug) ||
    (isPlatformAdmin && !!orgSlug && (!!selectedOrgId || !loadingOrgs))

  if (!valid) return null

  return <>{children}</>
}
