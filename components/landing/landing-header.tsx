"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Moon, Sun, X } from "lucide-react"
import { useTheme } from "next-themes"
import { SphereXLogo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { landingNavLinks } from "@/lib/landing-navigation"
import { CategoriesDropdown, CategoriesMobileList } from "@/components/landing/categories-dropdown"

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="rounded-full dark:border-border dark:bg-transparent dark:hover:bg-muted"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  )
}

function NavItem({
  label,
  href,
  sectionId,
  onNavigate,
}: {
  label: string
  href: string
  sectionId?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const isActive = !sectionId && pathname === href
  const className = cn(
    "text-sm font-medium transition-colors hover:text-teal-600 dark:hover:text-teal-400",
    isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-600 dark:text-slate-300",
  )

  if (sectionId && isHome) {
    return (
      <button
        type="button"
        onClick={() => {
          scrollToSection(sectionId)
          onNavigate?.()
        }}
        className={className}
      >
        {label}
      </button>
    )
  }

  return (
    <Link href={href} onClick={onNavigate} className={className}>
      {label}
    </Link>
  )
}

export function LandingHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMobileCategoriesOpen(false)
  }, [pathname])

  const authQuery =
    pathname === "/courses" || pathname.startsWith("/courses/") ? "?next=/courses" : ""

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || pathname !== "/"
          ? "bg-white/90 shadow-sm backdrop-blur-md dark:bg-background/90 dark:shadow-black/20"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <SphereXLogo className="h-9 w-auto" priority />
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sphere<span className="text-teal-600 dark:text-teal-400">X</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {landingNavLinks.map((link) =>
            link.dropdown === "categories" ? (
              <CategoriesDropdown key={link.href} />
            ) : (
              <NavItem key={link.href} {...link} />
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LandingThemeToggle />
          <div className="hidden items-center gap-3 md:flex">
            <Link href={`/login${authQuery}`}>
              <Button variant="outline" className="rounded-full px-6 dark:border-border dark:bg-transparent dark:hover:bg-muted">
                Login
              </Button>
            </Link>
            <Link href={`/register${authQuery}`}>
              <Button className="rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                Sign up
              </Button>
            </Link>
          </div>
          <button
            type="button"
            className="relative h-6 w-6 text-slate-800 md:hidden dark:text-slate-100"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <Menu
              className={cn(
                "absolute inset-0 h-6 w-6 transition-all duration-300",
                mobileOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
              )}
            />
            <X
              className={cn(
                "absolute inset-0 h-6 w-6 transition-all duration-300",
                mobileOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0",
              )}
            />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid md:hidden",
          "transition-[grid-template-rows,opacity] duration-300 ease-out",
          mobileOpen
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t border-slate-200 bg-white px-4 py-4 transition-transform duration-300 ease-out dark:border-border dark:bg-background",
              mobileOpen ? "translate-y-0" : "-translate-y-2",
            )}
          >
            {landingNavLinks.map((link) =>
              link.dropdown === "categories" ? (
                <div key={link.href} className="py-2">
                  <button
                    type="button"
                    onClick={() => setMobileCategoriesOpen((open) => !open)}
                    className="flex w-full items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300"
                    aria-expanded={mobileCategoriesOpen}
                  >
                    Categories
                    <span
                      className={cn(
                        "text-xs text-slate-400 transition-transform duration-200 dark:text-slate-500",
                        mobileCategoriesOpen && "rotate-45",
                      )}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
                      mobileCategoriesOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-2">
                        <CategoriesMobileList onNavigate={() => setMobileOpen(false)} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={link.href} className="py-2">
                  <NavItem {...link} onNavigate={() => setMobileOpen(false)} />
                </div>
              ),
            )}
            <div className="mt-3 grid gap-2">
              <Link href={`/login${authQuery}`}>
                <Button variant="outline" className="w-full rounded-full">
                  Login
                </Button>
              </Link>
              <Link href={`/register${authQuery}`}>
                <Button className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  Sign up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
