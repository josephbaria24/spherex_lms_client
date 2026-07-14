"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOrgAdmin } from "@/components/org/org-provider"
import { orgRoute } from "@/lib/org-routes"

export function OrgSlugGate({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const { orgAdminOrgs, loadingOrgs } = useOrgAdmin()
  const orgSlug = typeof params.orgSlug === "string" ? params.orgSlug : ""

  useEffect(() => {
    if (loadingOrgs || !orgSlug) return

    const match = orgAdminOrgs.find((o) => o.slug === orgSlug)
    if (match) return

    if (orgAdminOrgs.length === 0) {
      router.replace("/dashboard")
      return
    }

    router.replace(orgRoute(orgAdminOrgs[0]!.slug))
  }, [loadingOrgs, orgSlug, orgAdminOrgs, router])

  if (loadingOrgs) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const valid = orgAdminOrgs.some((o) => o.slug === orgSlug)
  if (!valid) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
