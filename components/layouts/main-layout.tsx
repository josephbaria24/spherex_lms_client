"use client"

import type React from "react"
import { Sidebar } from "@/components/navigation/sidebar"
import { MobileNav } from "@/components/navigation/mobile-nav"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen min-h-0 bg-background">
      <aside className="relative z-30 shrink-0 overflow-visible">
        <Sidebar />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:py-3 md:pl-0 md:pr-3">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden md:rounded-[var(--sidebar-float-radius)] md:border md:border-border/80 md:bg-card has-[.grow-shell]:h-[calc(100vh-1.5rem)] has-[.grow-shell]:max-h-[calc(100vh-1.5rem)] dark:md:border-border/50">
          <div className="sleek-page flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-24 md:p-6 md:pb-6 has-[.grow-shell]:h-full has-[.grow-shell]:overflow-hidden has-[.grow-shell]:p-0 has-[.grow-shell]:pb-24 md:has-[.grow-shell]:pb-0">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
