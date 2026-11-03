"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Sidebar } from "@/components/navigation/sidebar"
import { NotificationBell } from "@/components/navigation/notification-bell"
import { SphereXLogo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants"

interface MainLayoutProps {
  children: React.ReactNode
}

function MobileThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-full text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground dark:bg-background dark:text-foreground dark:hover:bg-background dark:hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen min-h-0 bg-background">
      <aside className="relative z-30 shrink-0 overflow-visible">
        <Sidebar />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:py-3 md:pl-0 md:pr-3">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-[var(--sidebar-float-radius)] md:border md:border-border/80 md:bg-card md:has-[.grow-shell]:h-[calc(100vh-1.5rem)] md:has-[.grow-shell]:max-h-[calc(100vh-1.5rem)] dark:md:border-border/50">
          {/* Mobile-only brand bar */}
          <div className="relative flex h-[3.25rem] shrink-0 items-center bg-primary text-primary-foreground md:hidden dark:bg-[hsl(250,25%,9%)] dark:text-white">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <SphereXLogo className="h-7 w-auto" priority alt="" />
                <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
              </div>
            </div>
            <div className="relative z-10 ml-auto flex items-center gap-0.5 px-3">
              <MobileThemeToggle />
              <NotificationBell />
            </div>
          </div>

          {/* Desktop notifications without the dark bar */}
          <div className="relative z-10 hidden shrink-0 items-center justify-end px-4 pt-3 md:flex md:px-5">
            <NotificationBell />
          </div>
          <div className="sleek-page flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6 has-[.grow-shell]:overflow-hidden has-[.grow-shell]:p-0 has-[.grow-shell]:!min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
