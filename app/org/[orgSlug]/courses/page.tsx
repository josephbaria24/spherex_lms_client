"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OrgSelector } from "@/components/org/org-selector"
import { useOrgAdmin } from "@/components/org/org-provider"
import { apiGet } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { orgRoute } from "@/lib/org-routes"
import { CourseCardHero } from "@/components/admin/courses/course-card-hero"
import { BookOpen, Eye, ListOrdered, Users } from "lucide-react"

type Course = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  image?: string | null
  card_theme?: string | null
  student_count?: number
  lesson_count?: number
}

export default function OrgCoursesPage() {
  const { selectedOrgId, selectedOrgSlug, loadingOrgs } = useOrgAdmin()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedOrgId) return
    setLoading(true)
    try {
      const data = await apiGet<{ courses: Course[] }>(`/org-admin/${selectedOrgId}/courses`)
      setCourses(data.courses ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId])

  useEffect(() => {
    if (!loadingOrgs) load()
  }, [load, loadingOrgs])

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={BookOpen}
          title="Organization Courses"
          description="Courses belonging to this organization — click a course to preview as a student"
        >
          <OrgSelector />
        </PageHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading courses…</p>
        ) : courses.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No courses linked to this organization yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const previewHref =
                selectedOrgSlug
                  ? orgRoute(selectedOrgSlug, `courses/${course.id}/preview`)
                  : "#"
              return (
                <Link key={course.id} href={previewHref} className="group block">
                  <Card
                    className={`premium-card relative flex h-full flex-col gap-0 overflow-hidden border border-border py-0 shadow-none transition-colors group-hover:border-primary/40 ${
                      course.image ? "min-h-[18rem]" : "group-hover:bg-muted/20"
                    }`}
                  >
                    {course.image ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetUrl(course.image)}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
                      </>
                    ) : (
                      <CourseCardHero cardTheme={course.card_theme} />
                    )}
                    <CardContent
                      className={`relative z-10 flex flex-col p-4 ${course.image ? "mt-auto text-white" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-semibold leading-tight ${
                            course.image
                              ? "drop-shadow-sm"
                              : "group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
                          }`}
                        >
                          {course.title}
                        </h3>
                        {course.level && (
                          <Badge
                            variant="secondary"
                            className={
                              course.image
                                ? "border-white/30 bg-black/25 text-white capitalize hover:bg-black/25"
                                : "capitalize"
                            }
                          >
                            {course.level}
                          </Badge>
                        )}
                      </div>
                      {course.description && (
                        <p
                          className={`mt-2 line-clamp-2 text-sm ${
                            course.image ? "text-white/85" : "text-muted-foreground"
                          }`}
                        >
                          {course.description}
                        </p>
                      )}
                      <div
                        className={`mt-4 flex gap-4 text-xs ${
                          course.image ? "text-white/80" : "text-muted-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {course.student_count ?? 0} enrolled
                        </span>
                        <span className="flex items-center gap-1">
                          <ListOrdered className="h-3.5 w-3.5" />
                          {course.lesson_count ?? 0} lessons
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {course.category && (
                          <Badge
                            variant="outline"
                            className={course.image ? "border-white/30 bg-black/20 text-white" : ""}
                          >
                            {course.category}
                          </Badge>
                        )}
                        <span
                          className={`ml-auto flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100 ${
                            course.image ? "text-white" : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
