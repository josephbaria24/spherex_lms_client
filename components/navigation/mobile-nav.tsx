"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Settings,
  GraduationCap,
  Users,
  Building2,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/app/provider"
import {
  canAccessAdminPanel,
  canAccessOrgAdminPanel,
  canAccessTeacherPanel,
  isStudent,
} from "@/lib/roles"
import {
  buildTeacherNav,
  getTeacherOrgSlugFromPath,
  isTeacherNavHrefActive,
  TEACHER_ORG_SLUG_STORAGE_KEY,
} from "@/lib/teacher-routes"
import {
  buildOrgAdminNav,
  getOrgSlugFromPath,
  isOrgNavHrefActive,
  orgAdminNavFallback,
  ORG_SLUG_STORAGE_KEY,
} from "@/lib/org-routes"

const studentItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Courses", href: "/courses", icon: BookOpen },
  { title: "Achievements", href: "/achievements", icon: Trophy },
  { title: "Settings", href: "/settings", icon: Settings },
]

const teacherItemsFallback = [
  { title: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { title: "Courses", href: "/teacher", icon: BookOpen },
  { title: "Grades", href: "/teacher", icon: ClipboardCheck },
  { title: "Settings", href: "/settings", icon: Settings },
]

const adminItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Admin", href: "/admin", icon: GraduationCap },
  { title: "Settings", href: "/settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user, orgAdminCount } = useAuth()
  const [teacherNavSlug, setTeacherNavSlug] = useState<string | null>(() =>
    getTeacherOrgSlugFromPath(pathname ?? ""),
  )
  const [orgNavSlug, setOrgNavSlug] = useState<string | null>(() =>
    getOrgSlugFromPath(pathname ?? ""),
  )

  useEffect(() => {
    const fromUrl = getTeacherOrgSlugFromPath(pathname ?? "")
    if (fromUrl) {
      setTeacherNavSlug(fromUrl)
      return
    }
    const stored = localStorage.getItem(TEACHER_ORG_SLUG_STORAGE_KEY)
    setTeacherNavSlug(stored)
  }, [pathname])

  useEffect(() => {
    const fromUrl = getOrgSlugFromPath(pathname ?? "")
    if (fromUrl) {
      setOrgNavSlug(fromUrl)
      return
    }
    const stored = localStorage.getItem(ORG_SLUG_STORAGE_KEY)
    setOrgNavSlug(stored)
  }, [pathname])

  const teacherItems = teacherNavSlug
    ? buildTeacherNav(teacherNavSlug)
        .filter((item) => ["Dashboard", "My Courses", "Evaluations"].includes(item.label))
        .map((item) => ({
          title: item.label === "Evaluations" ? "Grades" : item.label === "My Courses" ? "Courses" : item.label,
          href: item.href,
          icon: item.label === "Evaluations" ? ClipboardCheck : item.label === "My Courses" ? BookOpen : LayoutDashboard,
        }))
    : teacherItemsFallback

  const pathOrgSlug = getOrgSlugFromPath(pathname ?? "")
  const orgAdminItems = (pathOrgSlug ?? orgNavSlug)
    ? buildOrgAdminNav(pathOrgSlug ?? orgNavSlug!).map((item) => ({
        title: item.label,
        href: item.href,
        icon:
          item.label === "Members"
            ? Users
            : item.label === "Courses"
              ? BookOpen
              : item.label === "Settings"
                ? Settings
                : Building2,
      }))
    : orgAdminNavFallback.map((item) => ({
        title: item.label,
        href: item.href,
        icon:
          item.label === "Members"
            ? Users
            : item.label === "Courses"
              ? BookOpen
              : item.label === "Settings"
                ? Settings
                : Building2,
      }))

  const navItems = canAccessOrgAdminPanel(user?.role, orgAdminCount)
    ? orgAdminItems
    : canAccessAdminPanel(user?.role)
      ? adminItems
      : canAccessTeacherPanel(user?.role) && user?.role === "teacher"
        ? teacherItems
        : isStudent(user?.role)
          ? studentItems
          : studentItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur md:hidden">
      <div className="flex justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = getTeacherOrgSlugFromPath(item.href) || item.href === "/teacher"
            ? isTeacherNavHrefActive(pathname ?? "", item.href)
            : item.href.startsWith("/org")
              ? isOrgNavHrefActive(pathname ?? "", item.href)
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "bg-[#1a1f2e] text-white shadow-sm dark:bg-[#12151f]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
