import { OrgSlugGate } from "@/components/org/org-slug-gate"
import { OrgTheme } from "@/components/org/org-theme"

export default function OrgSlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgSlugGate>
      <OrgTheme>{children}</OrgTheme>
    </OrgSlugGate>
  )
}
