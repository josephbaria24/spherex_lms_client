"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { OrgProvider } from "@/components/org/org-provider"

export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, canAccessOrgAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (!canAccessOrgAdmin) {
      router.replace("/dashboard")
    }
  }, [user, loading, canAccessOrgAdmin, router])

  if (loading || !user || !canAccessOrgAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return <OrgProvider enabled>{children}</OrgProvider>
}
