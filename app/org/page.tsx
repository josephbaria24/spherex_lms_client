"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useOrgAdmin } from "@/components/org/org-provider"
import { ORG_ID_STORAGE_KEY, ORG_SLUG_STORAGE_KEY, orgRoute } from "@/lib/org-routes"

export default function OrgHomePage() {
  const router = useRouter()
  const { orgAdminOrgs, loadingOrgs } = useOrgAdmin()

  useEffect(() => {
    if (loadingOrgs) return

    if (orgAdminOrgs.length === 0) {
      router.replace("/dashboard")
      return
    }
    const storedSlug = localStorage.getItem(ORG_SLUG_STORAGE_KEY)
    const storedId = localStorage.getItem(ORG_ID_STORAGE_KEY)
    const fromSlug = storedSlug ? orgAdminOrgs.find((o) => o.slug === storedSlug) : null
    const fromId = storedId ? orgAdminOrgs.find((o) => o.id === storedId) : null
    const target = fromSlug ?? fromId ?? orgAdminOrgs[0]!

    router.replace(orgRoute(target.slug))
  }, [loadingOrgs, orgAdminOrgs, router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  )
}
