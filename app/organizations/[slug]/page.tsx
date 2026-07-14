"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { ArrowLeft, BookOpen, Clock, ExternalLink, Loader2, Users } from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OrgLogo } from "@/components/org/org-logo"
import { assetUrl } from "@/lib/asset-url"
import {
  fetchPublicOrganization,
  isOrgCatalogLive,
  orgStatusLabel,
  type PublicOrganization,
  type PublicOrganizationCourse,
} from "@/lib/public-organizations"

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [organization, setOrganization] = useState<PublicOrganization | null>(null)
  const [courses, setCourses] = useState<PublicOrganizationCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    fetchPublicOrganization(slug)
      .then((data) => {
        if (cancelled) return
        setOrganization(data.organization)
        setCourses(data.courses ?? [])
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <LandingHeader />
        <main className="flex min-h-[50vh] items-center justify-center gap-2 pt-24 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading organization…
        </main>
      </div>
    )
  }

  if (notFound || !organization) {
    return (
      <div className="min-h-screen bg-white">
        <LandingHeader />
        <main className="mx-auto max-w-lg px-4 pt-32 text-center">
          <h1 className="text-2xl font-bold">Organization not found</h1>
          <Link href="/organizations" className="mt-4 inline-block text-teal-600 hover:underline">
            ← Back to organizations
          </Link>
        </main>
      </div>
    )
  }

  const live = isOrgCatalogLive(organization.status)

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <LandingHeader />

      <main className="pt-24 pb-16">
        <section
          className="bg-gradient-to-br from-orange-50 via-rose-50/60 to-white pb-10 pt-6"
          style={
            organization.brand_primary
              ? {
                  background: `linear-gradient(135deg, ${organization.brand_primary}18, #fff8f5 40%, white)`,
                }
              : undefined
          }
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/organizations"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600"
            >
              <ArrowLeft className="h-4 w-4" />
              All organizations
            </Link>

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
              <OrgLogo
                logo={organization.logo}
                name={organization.name}
                brandColor={organization.brand_primary}
                logo_padding={organization.logo_padding}
                logo_position_x={organization.logo_position_x}
                logo_position_y={organization.logo_position_y}
                className="h-24 w-24 rounded-2xl border-4 border-white bg-white shadow-lg"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold text-slate-900">{organization.name}</h1>
                  <Badge variant={live ? "default" : "secondary"}>
                    {live ? "Active on SphereX" : orgStatusLabel(organization.status)}
                  </Badge>
                </div>
                {organization.industry ? (
                  <p className="mt-1 text-sm font-medium text-teal-600">{organization.industry}</p>
                ) : null}
                {organization.description ? (
                  <p className="mt-4 max-w-3xl text-slate-600">{organization.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  {organization.member_count > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {organization.member_count.toLocaleString()} members
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {organization.course_count} course{organization.course_count === 1 ? "" : "s"}
                  </span>
                </div>
                {organization.website ? (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline"
                  >
                    Visit website <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {!live ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-4 text-xl font-bold">Catalog coming soon</h2>
              <p className="mt-2 text-slate-600">
                {organization.name} courses will be available on SphereX as the partnership is finalized.
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="text-slate-600">No courses published for this organization yet.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-slate-900">Course catalog</h2>
              <p className="mt-2 text-slate-600">
                {courses.length} program{courses.length === 1 ? "" : "s"} from {organization.name}
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <PublicCourseCard key={course.id} course={course} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function PublicCourseCard({ course }: { course: PublicOrganizationCourse }) {
  const cover = assetUrl(course.thumbnail ?? course.image)

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="h-36 overflow-hidden bg-gradient-to-br from-teal-50 to-orange-50">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-slate-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        {course.category ? (
          <Badge variant="outline" className="text-[10px]">
            {course.category}
          </Badge>
        ) : null}
        <h3 className="mt-2 font-bold leading-snug text-slate-900">{course.title}</h3>
        {course.description ? (
          <p className="mt-2 line-clamp-2 text-xs text-slate-500">{course.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {course.lessons > 0 ? (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course.lessons} lesson{course.lessons === 1 ? "" : "s"}
            </span>
          ) : null}
          {course.duration ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {course.duration}
            </span>
          ) : null}
          {course.enrolled_count > 0 ? (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course.enrolled_count} enrolled
            </span>
          ) : null}
        </div>
        {course.level ? (
          <Badge variant="secondary" className="mt-3 text-[10px] capitalize">
            {course.level}
          </Badge>
        ) : null}
        <div className="mt-4">
          <Link href="/login">
            <Button size="sm" variant="outline" className="w-full rounded-full">
              Sign in to enroll
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}
