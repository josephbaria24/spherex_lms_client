"use client"

import type React from "react"
import { Sidebar } from "@/components/navigation/sidebar"
import { MobileNav } from "@/components/navigation/mobile-nav"
import { NotificationBell } from "@/components/navigation/notification-bell"
import { SphereXLogo } from "@/components/logo"
import { APP_NAME } from "@/lib/constants"

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
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-[var(--sidebar-float-radius)] md:border md:border-border/80 md:bg-card md:has-[.grow-shell]:h-[calc(100vh-1.5rem)] md:has-[.grow-shell]:max-h-[calc(100vh-1.5rem)] dark:md:border-border/50">
          <div className="relative flex h-[3.25rem] shrink-0 items-center bg-primary text-primary-foreground dark:bg-[hsl(250,25%,9%)] dark:text-white">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center md:hidden">
              <div className="flex items-center gap-2">
                <SphereXLogo light className="h-7 w-auto" priority alt="" />
                <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
              </div>
            </div>
            <div className="relative z-10 ml-auto flex items-center px-3 md:px-4">
              <NotificationBell />
            </div>
          </div>
          <div className="sleek-page flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-24 md:p-6 md:pb-6 has-[.grow-shell]:overflow-hidden has-[.grow-shell]:p-0 has-[.grow-shell]:!min-h-0 has-[.grow-shell]:pb-0">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
