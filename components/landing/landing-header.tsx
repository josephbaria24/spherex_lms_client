"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { SphereXLogo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { landingNavLinks } from "@/lib/landing-navigation"
import { CategoriesDropdown, CategoriesMobileList } from "@/components/landing/categories-dropdown"

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
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
    "text-sm font-medium transition-colors hover:text-teal-600",
    isActive ? "text-teal-600" : "text-slate-600",
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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || pathname !== "/" ? "bg-white/90 shadow-sm backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <SphereXLogo className="h-9 w-auto" priority />
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sphere<span className="text-teal-600">X</span>
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

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="outline" className="rounded-full px-6">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="rounded-full bg-slate-900 px-6 hover:bg-slate-800">Sign up</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-white px-4 py-4 md:hidden">
          {landingNavLinks.map((link) =>
            link.dropdown === "categories" ? (
              <div key={link.href} className="py-2">
                <button
                  type="button"
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="flex w-full items-center justify-between text-sm font-medium text-slate-600"
                >
                  Categories
                  <span className="text-xs text-slate-400">{mobileCategoriesOpen ? "−" : "+"}</span>
                </button>
                {mobileCategoriesOpen && (
                  <div className="mt-2">
                    <CategoriesMobileList onNavigate={() => setMobileOpen(false)} />
                  </div>
                )}
              </div>
            ) : (
              <div key={link.href} className="py-2">
                <NavItem {...link} onNavigate={() => setMobileOpen(false)} />
              </div>
            ),
          )}
          <div className="mt-3 grid gap-2">
            <Link href="/login">
              <Button variant="outline" className="w-full rounded-full">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="w-full rounded-full">Sign up</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
