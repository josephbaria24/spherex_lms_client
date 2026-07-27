import type React from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { GrowShell } from "@/components/grow-shell"

type GrowMainLayoutProps = {
  children: React.ReactNode
  /** When false, only applies the cream canvas (e.g. dashboard with its own bento grid) */
  bento?: boolean
  /**
   * `grow` — student/teacher Grow Shell
   * `ops` — admin editorial console
   */
  variant?: "grow" | "ops"
}

/** MainLayout + Grow Shell canvas — use for admin, teacher, and org admin pages */
export function GrowMainLayout({
  children,
  bento = true,
  variant = "grow",
}: GrowMainLayoutProps) {
  return (
    <MainLayout>
      <GrowShell bento={bento} variant={variant}>
        {children}
      </GrowShell>
    </MainLayout>
  )
}
