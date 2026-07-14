"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { CourseLessonsManager } from "@/components/lessons/course-lessons-manager"
import { CourseLessonAccessSettings } from "@/components/admin/courses/course-lesson-access-settings"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/api"
import { ArrowLeft, ListOrdered } from "lucide-react"
import { toast } from "sonner"

type CourseDetail = {
  id: string
  title: string
  organization_id?: string | null
  organization_name?: string | null
  require_sequential_lessons?: boolean
}

export default function AdminCourseLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    apiGet<{ course: CourseDetail }>(`/courses/${courseId}`)
      .then((data) => setCourse(data.course))
      .catch(() => toast.error("Could not load course"))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return (
      <GrowMainLayout>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </GrowMainLayout>
    )
  }

  if (!course?.organization_id) {
    return (
      <GrowMainLayout>
        <div className="space-y-4">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/admin/courses">
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            This course has no organization. Edit the course and assign an organization before adding
            lessons.
          </p>
        </div>
      </GrowMainLayout>
    )
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={ListOrdered}
          title="Course lessons"
          accent="craft content"
          description={
            course.organization_name
              ? `${course.title} · ${course.organization_name}`
              : course.title
          }
        >
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/admin/courses">
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Link>
          </Button>
        </PageHeader>

        <CourseLessonAccessSettings
          courseId={course.id}
          initialRequireSequential={course.require_sequential_lessons ?? false}
        />

        <CourseLessonsManager
          orgId={course.organization_id}
          courseId={course.id}
          courseTitle={course.title}
        />
      </div>
    </GrowMainLayout>
  )
}
