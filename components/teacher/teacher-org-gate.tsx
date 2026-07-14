"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { JoinOrganizationForm } from "@/components/org/join-organization-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { isAdmin } from "@/lib/roles"
import { fetchTeacherWorkspaceOrgs } from "@/lib/teacher-orgs"
import {
  TEACHER_ORG_ID_STORAGE_KEY,
  TEACHER_ORG_SLUG_STORAGE_KEY,
  teacherRoute,
} from "@/lib/teacher-routes"
import { Building2 } from "lucide-react"

export function TeacherOrgGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [checking, setChecking] = useState(true)
  const [hasOrg, setHasOrg] = useState(false)

  const isJoinPage = pathname === "/teacher/join"
  const isTeacherRoot = pathname === "/teacher"
  const isPlatformAdmin = isAdmin(user?.role)

  useEffect(() => {
    if (authLoading || isTeacherRoot) {
      if (!authLoading && isTeacherRoot) setChecking(false)
      return
    }

    let cancelled = false

    async function check() {
      try {
        if (isPlatformAdmin) {
          if (!cancelled) {
            setHasOrg(true)
            if (isJoinPage) {
              const orgs = await fetchTeacherWorkspaceOrgs(true)
              const storedSlug = localStorage.getItem(TEACHER_ORG_SLUG_STORAGE_KEY)
              const target =
                (storedSlug && orgs.find((m) => m.organization.slug === storedSlug)) ?? orgs[0]
              if (target) router.replace(teacherRoute(target.organization.slug))
            }
          }
          return
        }

        const teaching = await fetchTeacherWorkspaceOrgs(false)
        const ok = teaching.length > 0

        if (!cancelled) {
          setHasOrg(ok)

          if (ok && isJoinPage) {
            const storedSlug = localStorage.getItem(TEACHER_ORG_SLUG_STORAGE_KEY)
            const storedId = localStorage.getItem(TEACHER_ORG_ID_STORAGE_KEY)
            const target =
              (storedSlug && teaching.find((m) => m.organization.slug === storedSlug)) ||
              (storedId && teaching.find((m) => m.organization_id === storedId)) ||
              teaching[0]
            router.replace(teacherRoute(target!.organization.slug))
          } else if (!ok && !isJoinPage) {
            router.replace("/teacher/join")
          }
        }
      } catch {
        if (!cancelled) setHasOrg(isPlatformAdmin)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [authLoading, isJoinPage, isTeacherRoot, isPlatformAdmin, router])

  if (isJoinPage || isTeacherRoot) {
    return <>{children}</>
  }

  if (authLoading || checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  if (!hasOrg && !isPlatformAdmin) {
    return null
  }

  return <>{children}</>
}

export function TeacherJoinCard() {
  const router = useRouter()
  const { loading: authLoading, user } = useAuth()
  const isPlatformAdmin = isAdmin(user?.role)

  useEffect(() => {
    if (authLoading || !isPlatformAdmin) return
    fetchTeacherWorkspaceOrgs(true).then((orgs) => {
      if (orgs[0]) router.replace(teacherRoute(orgs[0].organization.slug))
    })
  }, [authLoading, isPlatformAdmin, router])

  if (authLoading || isPlatformAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/60 shadow-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold">Join your organization</p>
          <p className="text-sm text-muted-foreground">
            Enter the teacher code shared by your organization admin to access the teaching workspace.
          </p>
        </CardHeader>
        <CardContent>
          <JoinOrganizationForm redirectTo="/teacher" />
        </CardContent>
      </Card>
    </div>
  )
}
