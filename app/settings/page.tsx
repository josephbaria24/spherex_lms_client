import { MainLayout } from "@/components/layouts/main-layout"
import { GrowShell } from "@/components/grow-shell"
import { UserSettingsPage } from "@/components/settings/user-settings-page"

export default function SettingsPage() {
  return (
    <MainLayout>
      <GrowShell>
        <UserSettingsPage />
      </GrowShell>
    </MainLayout>
  )
}
