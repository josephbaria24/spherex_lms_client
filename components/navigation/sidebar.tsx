"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Settings,
  LayoutDashboard,
} from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useAuth } from "@/app/provider"
import {
  canAccessAdminPanel,
  canAccessOrgAdminPanel,
  canAccessTeacherPanel,
  isStudent,
  roleLabel,
} from "@/lib/roles"
import { adminNav, studentNav } from "@/lib/navigation"
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
import { SidebarBrand } from "@/components/layout/sidebar-brand"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  sidebarPrimaryNavLinkClass,
  sidebarSectionLabelClass,
} from "@/lib/sidebar-tree-styles"

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
}

const footerNavClass = (iconOnly?: boolean) =>
  cn(
    "sidebar-footer-item sidebar-footer-item-inactive",
    iconOnly && "sidebar-footer-item-icon",
  )

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [showCollapsedContent, setShowCollapsedContent] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const hasHydratedRef = useRef(false)
  const navScrollRef = useRef<HTMLElement | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  const { user, logout, orgAdminCount } = useAuth()
  const pathname = usePathname()
  const showAdminNav = canAccessAdminPanel(user?.role)
  const showOrgAdminNav = canAccessOrgAdminPanel(user?.role, orgAdminCount)
  const showTeacherNav = canAccessTeacherPanel(user?.role) && user?.role === "teacher"
  const showStudentNav =
    (isStudent(user?.role) || user?.role === "admin") &&
    !showOrgAdminNav &&
    !showTeacherNav

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

  const pathOrgSlug = getOrgSlugFromPath(pathname ?? "")
  const teacherNavItems = teacherNavSlug ? buildTeacherNav(teacherNavSlug) : null
  const orgNavItems = (pathOrgSlug ?? orgNavSlug)
    ? buildOrgAdminNav(pathOrgSlug ?? orgNavSlug!)
    : orgAdminNavFallback

  useEffect(() => {
    const nextCollapsed = localStorage.getItem("sidebar:collapsed") === "1"
    setCollapsed(nextCollapsed)
    setShowCollapsedContent(nextCollapsed)
    hasHydratedRef.current = true
  }, [])

  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0")
  }, [collapsed])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    if (collapsed) {
      setShowCollapsedContent(true)
      return
    }
    const timeoutId = window.setTimeout(() => setShowCollapsedContent(false), 240)
    return () => window.clearTimeout(timeoutId)
  }, [collapsed])

  useLayoutEffect(() => {
    const navEl = navScrollRef.current
    if (!navEl) return
    const saved = sessionStorage.getItem("sidebar:scrollTop")
    if (!saved) return
    const parsed = Number(saved)
    if (!Number.isFinite(parsed)) return
    requestAnimationFrame(() => {
      navEl.scrollTop = parsed
    })
  }, [pathname])

  const isActive = (href: string) => {
    if (getTeacherOrgSlugFromPath(href) || href === "/teacher") {
      return isTeacherNavHrefActive(pathname ?? "", href)
    }
    if (href.startsWith("/org")) {
      return isOrgNavHrefActive(pathname ?? "", href)
    }
    if (pathname === href) return true
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href
    }
    return pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    setMobileOpen(false)
    await logout()
  }

  useEffect(() => {
    setThemeMounted(true)
  }, [])

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark")

  const themeToggleLabel = themeMounted
    ? resolvedTheme === "dark"
      ? "Light mode"
      : "Dark mode"
    : "Toggle theme"
  const ThemeToggleIcon = themeMounted && resolvedTheme === "dark" ? Sun : Moon

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)
    const Icon = item.icon

    const linkContent = (
      <Link
        href={item.href}
        scroll={false}
        onClick={() => setMobileOpen(false)}
        className={sidebarPrimaryNavLinkClass(active, showCollapsedContent)}
      >
        <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
        {!showCollapsedContent ? (
          <span className="truncate text-[13px]">{item.label}</span>
        ) : null}
      </Link>
    )

    if (showCollapsedContent) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  const FooterNavButton = ({
    label,
    icon: Icon,
    onClick,
    iconOnly = false,
    href,
    active = false,
    disabled = false,
  }: {
    label: string
    icon: React.ElementType
    onClick?: () => void
    iconOnly?: boolean
    href?: string
    active?: boolean
    disabled?: boolean
  }) => {
    const className = cn(footerNavClass(iconOnly), active && "bg-muted/70 font-medium text-foreground")
    const inner = (
      <>
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
        {!iconOnly && <span className="truncate">{label}</span>}
      </>
    )

    if (href) {
      const link = (
        <Link
          href={href}
          className={className}
          aria-label={label}
          onClick={() => {
            setMobileOpen(false)
            onClick?.()
          }}
        >
          {inner}
        </Link>
      )
      if (iconOnly) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        )
      }
      return link
    }

    const button = (
      <button type="button" className={className} aria-label={label} onClick={onClick} disabled={disabled}>
        {inner}
      </button>
    )

    if (iconOnly) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      )
    }

    return button
  }

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="space-y-0.5">
      {!showCollapsedContent && <p className={sidebarSectionLabelClass()}>{title}</p>}
      {items.map((item) => (
        <NavLink key={item.label} item={item} />
      ))}
    </div>
  )

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn("floating-sidebar-panel flex h-full w-full min-w-0 flex-col overflow-hidden", mobile && "w-64")}>
      <div
        className={cn(
          "relative flex shrink-0 items-center transition-[padding] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          showCollapsedContent
            ? "justify-center px-1 pb-2 pt-2.5"
            : "justify-start pl-[9px] pr-2 pb-1.5 pt-[19px]",
          mobile && !showCollapsedContent && "pr-1",
        )}
      >
        <div
          className={cn(
            showCollapsedContent ? "flex w-full justify-center" : "min-w-0 flex-1",
            mobile && !showCollapsedContent && "pr-8",
          )}
        >
          <SidebarBrand collapsed={showCollapsedContent} />
        </div>
        {mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-4 h-8 w-8 shrink-0 text-slate-500"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav
        ref={navScrollRef}
        className={cn(
          "flex-1 space-y-3 overflow-y-auto pb-2 [scrollbar-color:hsl(var(--sidebar-border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1",
          showCollapsedContent ? "px-1.5" : "px-2.5",
        )}
      >
        {showOrgAdminNav && renderSection("Organization", orgNavItems as NavItem[])}
        {showTeacherNav &&
          renderSection(
            "Teaching",
            (teacherNavItems ?? [
              { label: "Dashboard", icon: LayoutDashboard, href: "/teacher" },
            ]) as NavItem[],
          )}
        {showStudentNav && renderSection("Learning", studentNav as NavItem[])}
        {showAdminNav && renderSection("Administration", adminNav as NavItem[])}
      </nav>

      <div
        className={cn(
          "relative shrink-0 border-t border-border/60 py-2",
          showCollapsedContent ? "px-1.5" : "px-2",
        )}
      >
        {!showCollapsedContent && user?.email && (
          <div className="mb-2 px-2">
            <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            {user.role && (
              <p className="mt-0.5 text-[10px] font-medium capitalize text-emerald-700 dark:text-emerald-400">
                {roleLabel(user.role)}
              </p>
            )}
          </div>
        )}
        {showCollapsedContent ? (
          <div className="flex flex-col gap-0.5">
            <FooterNavButton
              label={themeToggleLabel}
              icon={ThemeToggleIcon}
              iconOnly
              onClick={toggleTheme}
            />
            <FooterNavButton label="Settings" icon={Settings} iconOnly href="/settings" active={pathname === "/settings"} />
            <FooterNavButton
              label={loggingOut ? "Signing out…" : "Log out"}
              icon={LogOut}
              iconOnly
              onClick={handleLogout}
              disabled={loggingOut}
            />
            {!mobile && (
              <FooterNavButton
                label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                icon={collapsed ? ChevronRight : ChevronLeft}
                iconOnly
                onClick={() => setCollapsed((v) => !v)}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <FooterNavButton
              label={themeToggleLabel}
              icon={ThemeToggleIcon}
              onClick={toggleTheme}
            />
            <FooterNavButton label="Settings" icon={Settings} href="/settings" active={pathname === "/settings"} />
            <FooterNavButton
              label={loggingOut ? "Signing out…" : "Log out"}
              icon={LogOut}
              onClick={handleLogout}
              disabled={loggingOut}
            />
            {!mobile && (
              <FooterNavButton
                label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                icon={collapsed ? ChevronRight : ChevronLeft}
                onClick={() => setCollapsed((v) => !v)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className="hidden py-3 pl-2 pr-2 md:block">
        <div
          className={cn(
            "relative h-[calc(100vh-1.5rem)] shrink-0 transition-[width] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed ? "w-[4.5rem]" : "w-60",
          )}
        >
          <SidebarContent />
        </div>
      </div>

      <div className="fixed left-0 top-0 z-50 p-3 md:hidden">
        <Button variant="outline" size="icon" className="h-9 w-9 bg-background" onClick={() => setMobileOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative m-3 h-[calc(100%-1.5rem)] w-64 max-w-[85vw]">
            <SidebarContent mobile />
          </div>
        </div>
      )}
    </>
  )
}
