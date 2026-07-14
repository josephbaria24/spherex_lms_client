"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Building2, Search, Users, BookOpen, ArrowRight, ExternalLink, Loader2 } from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { OrgLogo } from "@/components/org/org-logo"
import {
  fetchPublicOrganizations,
  isOrgCatalogLive,
  orgStatusLabel,
  type PublicOrganization,
} from "@/lib/public-organizations"

export default function OrganizationsPage() {
  const [query, setQuery] = useState("")
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
    if (!q) return organizations
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        (org.industry ?? "").toLowerCase().includes(q) ||
        (org.description ?? "").toLowerCase().includes(q),
    )
  }, [organizations, query])

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <LandingHeader />

      <main className="pt-24 pb-16">
        <section className="bg-gradient-to-br from-orange-50 via-rose-50/60 to-white pb-12 pt-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-4 py-1.5 text-xs font-semibold text-teal-700">
                <Building2 className="h-3.5 w-3.5" />
                Partner Organizations
              </span>
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Organizations on SphereX
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Course catalogs are managed per organization. Browse partner programs, view
                catalogs, and sign in to enroll.
              </p>
            </div>

            <div className="relative mx-auto mt-10 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search organizations…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-full pl-9"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading organizations…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-700">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-slate-600">
                {query ? "No organizations match your search." : "No organizations published yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {filtered.map((org) => (
                <OrganizationCard key={org.id} org={org} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-8 sm:p-10">
            <h2 className="text-2xl font-extrabold text-slate-900">Bring your organization onboard</h2>
            <p className="mt-3 text-slate-600">
              Host your own course catalog on SphereX — self-paced, blended, exam prep, or language programs.
            </p>
            <Link href="/register" className="mt-6 inline-flex items-center gap-2">
              <Button className="rounded-full bg-teal-600 px-8 hover:bg-teal-700">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function OrganizationCard({ org }: { org: PublicOrganization }) {
  const live = isOrgCatalogLive(org.status)

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="h-28 bg-gradient-to-br from-teal-50 to-orange-50"
        style={
          org.brand_primary
            ? { background: `linear-gradient(135deg, ${org.brand_primary}22, ${org.brand_primary}08)` }
            : undefined
        }
      />
      <div className="relative px-6 pb-6">
        <OrgLogo
          logo={org.logo}
          name={org.name}
          brandColor={org.brand_primary}
          logo_padding={org.logo_padding}
          logo_position_x={org.logo_position_x}
          logo_position_y={org.logo_position_y}
          className="absolute -top-10 h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-md"
        />
        <div className="pt-14">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">{org.name}</h2>
            <Badge variant={live ? "default" : "secondary"}>{orgStatusLabel(org.status)}</Badge>
          </div>
          {org.industry ? (
            <Badge variant="outline" className="mt-2">
              {org.industry}
            </Badge>
          ) : null}
          {org.description ? (
            <p className="mt-3 line-clamp-3 text-sm text-slate-600">{org.description}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            {org.member_count > 0 ? (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {org.member_count.toLocaleString()} member{org.member_count === 1 ? "" : "s"}
              </span>
            ) : null}
            {org.course_count > 0 ? (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {org.course_count} course{org.course_count === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/organizations/${org.slug}`}>
              <Button size="sm" className="rounded-full bg-teal-600 hover:bg-teal-700">
                {live ? "View catalog" : "View organization"}
              </Button>
            </Link>
            {org.website ? (
              <a href={org.website} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="gap-1 rounded-full">
                  Website <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
