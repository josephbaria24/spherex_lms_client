// components/navigation/header.tsx
"use client"

import { useRouter } from "next/navigation"
import { Bell, LogOut, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ModeToggle } from "../mode-toggle"
import { useSupabase } from "@/app/provider" // ← Changed

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { supabase, user } = useSupabase() // ← Get from context
  const router = useRouter()

  // ✅ User data comes from context - no fetching needed!
  const userName = user?.email?.split("@")[0] || "User"
  const userEmail = user?.email || "Loading..."

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Logout failed:", error.message)
    } else {
      // Force hard redirect to clear all state
      window.location.href = "/login"
    }
  }

  return (
    <header className="sticky top-0 z-40 border-0 shadow-md bg-card backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses, materials..."
              className="w-full pl-10 bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-accent transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </Button>

          {/* Theme Toggle */}
          <ModeToggle />

          {/* User Profile - Desktop */}
          <div className="hidden md:flex items-center gap-3 ml-2 pl-3 border-l border-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
              <span className="text-sm font-semibold">
                {userName?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground leading-none">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-destructive/10 hover:text-destructive transition-colors ml-1"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}