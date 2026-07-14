import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { requireUser, serverGet } from "@/lib/server-api"
import type { LearnDashboardPayload } from "@/lib/learn-dashboard-types"

export const revalidate = 0

export default async function DashboardPage() {
  const user = await requireUser()
  const dashboard = await serverGet<LearnDashboardPayload>("/api/learn/dashboard")

  return (
    <GrowMainLayout bento={false}>
      <StudentDashboard user={user} dashboard={dashboard} />
    </GrowMainLayout>
  )
}