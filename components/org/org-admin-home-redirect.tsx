"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { fetchOrgAdminOrganizations, pickOrgAdminHomeSlug } from "@/lib/home-route"
import { orgRoute } from "@/lib/org-routes"

/**
 * Org owners/admins should use /org/{slug} as their home — not the student dashboard.
 * Platform super-admins may still use /dashboard.
 */
export function OrgAdminHomeRedirect() {
  const { user, loading, isAdmin, orgAdminCount } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user || isAdmin || orgAdminCount === 0) return
    if (pathname?.startsWith("/org")) return
    if (pathname !== "/dashboard") return

    let cancelled = false

    async function redirect() {
      try {
        const organizations = await fetchOrgAdminOrganizations()
        const slug = pickOrgAdminHomeSlug(organizations)
        if (!cancelled && slug) {
          router.replace(orgRoute(slug))
        }
      } catch {
        /* ignore */
      }
    }

    redirect()
    return () => {
      cancelled = true
    }
  }, [loading, user, isAdmin, orgAdminCount, pathname, router])

  return null
}
