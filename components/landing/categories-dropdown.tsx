"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { landingCategoryGroups } from "@/lib/landing-categories"

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function CategoryLink({
  href,
  onNavigate,
  children,
  className,
}: {
  href: string
  onNavigate?: () => void
  children: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const isHash = href.startsWith("/#")
  const sectionId = isHash ? href.slice(2) : null

  if (sectionId && pathname === "/") {
    return (
      <button
        type="button"
        onClick={() => {
          scrollToSection(sectionId)
          onNavigate?.()
        }}
        className={className}
      >
        {children}
      </button>
    )
  }

  return (
    <Link href={href} onClick={onNavigate} className={className}>
      {children}
    </Link>
  )
}

export function CategoriesDropdown({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors group-hover:text-teal-600"
        aria-haspopup="true"
      >
        Categories
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
      </button>

      {/* Hover bridge + panel */}
      <div className="pointer-events-none absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
          <div className="grid grid-cols-2 gap-0 p-2">
            {landingCategoryGroups.map((group) => (
              <div key={group.id} className="p-3">
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.id}>
                        <CategoryLink
                          href={item.href}
                          onNavigate={onNavigate}
                          className="flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-teal-50/80"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                              {item.badge && (
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">
                              {item.description}
                            </p>
                          </div>
                        </CategoryLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
            <p className="text-center text-xs text-slate-500">
              Course catalogs are managed per organization.{" "}
              <Link href="/organizations" className="font-medium text-teal-600 hover:underline">
                View all partners →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Mobile expandable categories list */
export function CategoriesMobileList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-3 border-l-2 border-teal-100 pl-3">
      {landingCategoryGroups.map((group) => (
        <div key={group.id}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
          <ul className="mt-1 space-y-1">
            {group.items.map((item) => (
              <li key={item.id}>
                <CategoryLink
                  href={item.href}
                  onNavigate={onNavigate}
                  className="block py-1.5 text-sm text-slate-600 hover:text-teal-600"
                >
                  {item.name}
                  {item.badge ? (
                    <span className="ml-2 text-[10px] text-orange-500">({item.badge})</span>
                  ) : null}
                </CategoryLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function CategoriesNavButton({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium text-slate-600", className)}>
      Categories
      <ChevronDown className="h-3.5 w-3.5" />
    </span>
  )
}
