"use client"

import { useSearchParams } from "next/navigation"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { CourseLessonsManager } from "@/components/lessons/course-lessons-manager"
import { TeacherPageHeader } from "@/components/teacher/teacher-page-header"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { ListOrdered } from "lucide-react"

export default function TeacherLessonsPage() {
  const searchParams = useSearchParams()
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const courseIdFromUrl = searchParams.get("course_id") ?? undefined

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={ListOrdered}
          title="Lessons"
          accent="craft content"
          description="Create and organize lesson content for your courses"
        />

        {!selectedOrgId && !loadingOrgs ? (
          <p className="text-sm text-muted-foreground">Select an organization to manage lessons.</p>
        ) : selectedOrgId ? (
          <CourseLessonsManager orgId={selectedOrgId} courseId={courseIdFromUrl} />
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </div>
    </GrowMainLayout>
  )
}
