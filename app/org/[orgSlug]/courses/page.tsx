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
import { orgRoute } from "@/lib/org-routes"
import { BookOpen, Eye, ListOrdered, Users } from "lucide-react"

type Course = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
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
                  <Card className="premium-card h-full border border-border shadow-none transition-colors group-hover:border-primary/40 group-hover:bg-muted/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                          {course.title}
                        </h3>
                        {course.level && <Badge variant="secondary">{course.level}</Badge>}
                      </div>
                      {course.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {course.description}
                        </p>
                      )}
                      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
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
                          <Badge variant="outline">{course.category}</Badge>
                        )}
                        <span className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-400">
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
