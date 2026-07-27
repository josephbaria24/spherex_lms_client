"use client"

import { useSearchParams } from "next/navigation"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { CourseLessonsManager } from "@/components/lessons/course-lessons-manager"
import { TeacherOrgSelector } from "@/components/teacher/teacher-org-selector"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"

export default function TeacherLessonsPage() {
  const searchParams = useSearchParams()
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const courseIdFromUrl = searchParams.get("course_id") ?? undefined

  return (
    <GrowMainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Teaching workspace
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Lessons
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                Create and organize lesson content for your courses — text, video, Articulate, and
                quizzes.
              </p>
            </div>
            <TeacherOrgSelector />
          </header>

          {!selectedOrgId && !loadingOrgs ? (
            <div className="rounded-xl border border-[#e2e8f0] bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-medium text-[#0f172a]">No organization selected</p>
              <p className="mt-1 text-sm text-[#94a3b8]">
                Choose an organization to manage lessons.
              </p>
            </div>
          ) : selectedOrgId ? (
            <div className="space-y-6">
              <CourseLessonsManager orgId={selectedOrgId} courseId={courseIdFromUrl} />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[96px] animate-pulse rounded-xl border border-[#e2e8f0] bg-white"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </GrowMainLayout>
  )
}
