"use client"

import { Spinner } from "@/components/ui/spinner"
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
        <Spinner size={40} />
      </div>
    )
  }

  return <TutorLandingPage />
}
