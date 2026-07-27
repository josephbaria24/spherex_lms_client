"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  UsersIcon,
} from "@heroicons/react/24/outline"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingSmoothScroll } from "@/components/landing/landing-smooth-scroll"
import { OrgLogo } from "@/components/org/org-logo"
import {
  fetchPublicOrganizations,
  isOrgCatalogLive,
  orgStatusLabel,
  type PublicOrganization,
} from "@/lib/public-organizations"
import { cn } from "@/lib/utils"

export default function OrganizationsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "soon">("all")
  const [organizations, setOrganizations] = useState<PublicOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPublicOrganizations()
      .then((data) => {
        if (!cancelled) setOrganizations(data.organizations ?? [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load organizations")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return organizations.filter((org) => {
      const live = isOrgCatalogLive(org.status)
      if (statusFilter === "live" && !live) return false
      if (statusFilter === "soon" && live) return false
      if (!q) return true
      return (
        org.name.toLowerCase().includes(q) ||
        (org.industry ?? "").toLowerCase().includes(q) ||
        (org.description ?? "").toLowerCase().includes(q)
      )
    })
  }, [organizations, query, statusFilter])

  return (
    <LandingSmoothScroll>
      <div className="min-h-screen bg-white text-slate-800">
        <LandingHeader />

        <main className="pt-24 pb-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <header className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Organizations
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base">
                Partner catalogs hosted on SphereX. Browse programs, open a catalog, and enroll after
                you sign in.
              </p>
            </header>

            {/* Controls */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 w-full border-b border-slate-200 bg-transparent pl-9 pr-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "live", label: "Live" },
                    { id: "soon", label: "Coming soon" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={cn(
                      "h-9 px-3 text-sm font-medium transition",
                      statusFilter === item.id
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-700",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {!loading && !error ? (
              <p className="mt-6 text-sm text-slate-400">
                {filtered.length} organization{filtered.length === 1 ? "" : "s"}
              </p>
            ) : null}

            {/* List */}
            <section className="mt-6">
              {loading ? (
                <div className="space-y-0 divide-y divide-slate-200 border-y border-slate-200">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-36 animate-pulse bg-slate-50/80" />
                  ))}
                </div>
              ) : error ? (
                <p className="border-y border-red-100 py-10 text-center text-sm text-red-600">
                  {error}
                </p>
              ) : filtered.length === 0 ? (
                <div className="border-y border-slate-200 py-16 text-center">
                  <BuildingOffice2Icon className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-600">No organizations match your filters.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200 border-y border-slate-200">
                  {filtered.map((org) => (
                    <OrganizationRow key={org.id} org={org} />
                  ))}
                </ul>
              )}
            </section>

            {/* CTA */}
            <section className="mt-20 border-t border-slate-200 pt-12">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-lg">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Bring your organization onboard
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                    Host your catalog, publish courses, and manage learners on SphereX.
                  </p>
                </div>
                <Link
                  href="/register"
                  className="inline-flex h-11 shrink-0 items-center gap-2 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Get started
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </LandingSmoothScroll>
  )
}

function OrganizationRow({ org }: { org: PublicOrganization }) {
  const live = isOrgCatalogLive(org.status)

  return (
    <li className="py-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
        <OrgLogo
          slug={org.slug}
          logo={org.logo}
          name={org.name}
          brandColor={org.brand_primary}
          logo_padding={org.logo_padding}
          logo_position_x={org.logo_position_x}
          logo_position_y={org.logo_position_y}
          className="h-12 w-12 shrink-0 rounded-none border-0 bg-transparent shadow-none"
          imageClassName="object-contain"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{org.name}</h2>
            <span
              className={cn(
                "text-xs font-medium",
                live ? "text-teal-700" : "text-slate-400",
              )}
            >
              {orgStatusLabel(org.status)}
            </span>
          </div>

          {org.industry ? (
            <p className="mt-1 text-sm text-slate-500">{org.industry}</p>
          ) : null}

          {org.description ? (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600 line-clamp-2">
              {org.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <UsersIcon className="h-4 w-4" />
              {org.member_count.toLocaleString()} members
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpenIcon className="h-4 w-4" />
              {org.course_count} courses
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <Link
              href={`/organizations/${org.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-teal-700"
            >
              {live ? "View catalog" : "View organization"}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
            {org.website ? (
              <a
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Website
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}
