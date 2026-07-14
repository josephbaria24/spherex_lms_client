"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import TutorLandingPage from "@/components/tutor-landing-page"
import { authMe } from "@/lib/api"
import { resolveAppHomePath } from "@/lib/home-route"

export default function Page() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    authMe()
      .then(async ({ user }) => {
        const home = await resolveAppHomePath(user)
        router.replace(home)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  return <TutorLandingPage />
}
