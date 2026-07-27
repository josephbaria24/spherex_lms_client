import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { StudentAchievementsPage } from "@/components/achievements/student-achievements-page"
import { requireUser, serverGet } from "@/lib/server-api"
import type { LearnAchievementsPayload } from "@/lib/learn-achievements-types"

export const revalidate = 0

export default async function AchievementsPage() {
  await requireUser()
  const data = await serverGet<LearnAchievementsPayload>("/api/learn/achievements")

  return (
    <GrowMainLayout>
      <StudentAchievementsPage data={data} />
    </GrowMainLayout>
  )
}
