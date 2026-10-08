import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { CertificatesCoursesPage } from "@/components/achievements/certificates-courses-page"
import { requireUser, serverGet } from "@/lib/server-api"
import type { LearnAchievementsPayload } from "@/lib/learn-achievements-types"

export const revalidate = 0

export default async function CertificatesPage() {
  const user = await requireUser()
  const data = await serverGet<LearnAchievementsPayload>("/api/learn/achievements")
  const learnerName = user.full_name?.trim() || user.name?.trim() || user.email.split("@")[0]

  return (
    <GrowMainLayout>
      <CertificatesCoursesPage data={data} learnerName={learnerName} />
    </GrowMainLayout>
  )
}
