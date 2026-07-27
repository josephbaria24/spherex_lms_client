"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, ListOrdered, Users } from "lucide-react"
import { apiGet } from "@/lib/api"
import { TeacherPageHeader } from "@/components/teacher/teacher-page-header"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { teacherApiPath } from "@/lib/teacher-api"

type CourseDetail = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  duration?: string | null
  student_count?: number
  lesson_count?: number
}

export default function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; courseId: string }>
}) {
  const { courseId } = use(params)
  const router = useRouter()
  const { selectedOrgId, selectedOrgSlug, loadingOrgs } = useTeacherOrg()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<{ courses: CourseDetail[] }>(
        teacherApiPath(selectedOrgId, "/courses"),
      )
      const found = data.courses.find((c) => c.id === courseId)
      if (found) {
        setCourse(found)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, courseId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <GrowMainLayout>
        <p className="text-sm text-muted-foreground">Loading course…</p>
      </GrowMainLayout>
    )
  }

  if (!course) {
    return (
      <GrowMainLayout>
        <p className="text-sm text-muted-foreground">Course not found.</p>
      </GrowMainLayout>
    )
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 gap-1 text-muted-foreground"
            onClick={() => {
              if (selectedOrgSlug) {
                router.push(`/teacher/${selectedOrgSlug}/courses`)
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Button>
          <TeacherPageHeader
            icon={BookOpen}
            title={course.title}
            description={course.description ?? "No description"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-4 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-2xl font-bold">{course.student_count ?? 0}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </CardContent>
          </Card>
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-4 text-center">
              <ListOrdered className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-2xl font-bold">{course.lesson_count ?? 0}</p>
              <p className="text-sm text-muted-foreground">Lessons</p>
            </CardContent>
          </Card>
          {course.level && (
            <Card className="premium-card border border-border shadow-none">
              <CardContent className="p-4 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <Badge variant="secondary" className="mt-2">
                  {course.level}
                </Badge>
                <p className="mt-1 text-sm text-muted-foreground">Level</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              if (selectedOrgSlug) {
                router.push(`/teacher/${selectedOrgSlug}/lessons?course_id=${course.id}`)
              }
            }}
          >
            <ListOrdered className="mr-2 h-4 w-4" />
            Manage Lessons
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedOrgSlug) {
                router.push(`/teacher/${selectedOrgSlug}/students?course_id=${course.id}`)
              }
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            View Students
          </Button>
        </div>

        {course.category && (
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <Badge variant="outline">{course.category}</Badge>
          </div>
        )}

        {course.duration && (
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{course.duration}</p>
          </div>
        )}
      </div>
    </GrowMainLayout>
  )
}
