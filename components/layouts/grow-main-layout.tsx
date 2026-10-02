import type React from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { GrowShell } from "@/components/grow-shell"

type GrowMainLayoutProps = {
  children: React.ReactNode
  /** When false, only applies the cream canvas (e.g. dashboard with its own bento grid) */
  bento?: boolean
  /** Fill the panel so a nested region can scroll to its end */
  fill?: boolean
}

/** MainLayout + Grow Shell canvas — use for admin, teacher, and org admin pages */
export function GrowMainLayout({ children, bento = true, fill = false }: GrowMainLayoutProps) {
  return (
    <MainLayout>
      <GrowShell bento={bento} fill={fill}>
        {children}
      </GrowShell>
    </MainLayout>
  )
}
