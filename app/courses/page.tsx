"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layouts/main-layout"
import { GrowShell, GrowHeader } from "@/components/grow-shell"
import { CourseCard } from "@/components/course-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, BookOpen, GraduationCap } from "lucide-react"
import { useAuth } from "@/app/provider"
import { apiGet } from "@/lib/api"
import type { Course } from "@/lib/types"
import { CourseDetailsModal } from "@/components/course-detail-modal"
import { StudentJoinBanner } from "@/components/settings/join-org-section"

type CourseRow = {
  id: string
  title: string
  description?: string
  category?: string
  level?: string
  enrolled_count?: number
  duration?: string
  created_at?: string
  updated_at?: string
  price_cents?: number
  requires_enroll_code?: boolean
  is_enrolled?: boolean
  organization_name?: string | null
}

type EnrollmentRow = {
  course_id: string
  progress_percent?: number
  course?: CourseRow
}

export default function CoursesPage() {
  const { user } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [completedCourses, setCompletedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")

  const mapCourse = (c: CourseRow, progress = 0): Course => ({
    id: c.id,
    title: c.title ?? "Untitled",
    description: c.description ?? "",
    category: c.category ?? "Uncategorized",
    thumbnail: "",
    duration: c.duration ?? "Unknown",
    level: (c.level as Course["level"]) ?? "beginner",
    enrolledCount: c.enrolled_count ?? 0,
    progress,
    priceCents: c.price_cents ?? 0,
    requiresEnrollCode: c.requires_enroll_code ?? false,
    isEnrolled: c.is_enrolled ?? false,
    organizationName: c.organization_name ?? null,
    createdAt: new Date(c.created_at ?? new Date().toISOString()),
    updatedAt: new Date(c.updated_at ?? c.created_at ?? new Date().toISOString()),
  })

  const fetchCourses = async () => {
    if (!user) return
    setLoading(true)

    try {
      const [allData, enrolledData, completedData] = await Promise.all([
        apiGet<{ courses: CourseRow[] }>("/courses"),
        apiGet<{ enrollments: EnrollmentRow[] }>("/enrollments?completed=false&include=course"),
        apiGet<{ enrollments: EnrollmentRow[] }>("/enrollments?completed=true&include=course"),
      ])

      const enrolledIds = new Set(
        [
          ...(enrolledData.enrollments ?? []),
          ...(completedData.enrollments ?? []),
        ].map((e) => e.course_id),
      )

      setAllCourses(
        (allData.courses ?? []).map((c) => ({
          ...mapCourse(c),
          isEnrolled: enrolledIds.has(c.id),
        })),
      )

      setEnrolledCourses(
        (enrolledData.enrollments ?? [])
          .map((e) => (e.course ? mapCourse(e.course, e.progress_percent ?? 0) : null))
          .filter((c): c is Course => c !== null),
      )

      setCompletedCourses(
        (completedData.enrollments ?? [])
          .map((e) => (e.course ? mapCourse(e.course, e.progress_percent ?? 100) : null))
          .filter((c): c is Course => c !== null),
      )
    } catch (err) {
      console.error("Failed to load courses:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [user])

  const filterCourses = (courses: Course[]) => {
    const q = search.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.organizationName ?? "").toLowerCase().includes(q),
    )
  }

  const catalogCourses = useMemo(
    () => filterCourses(allCourses),
    [allCourses, search],
  )

  const openCourse = (course: Course) => {
    setSelectedCourse(course)
    setModalOpen(true)
  }

  const renderGrid = (
    courses: Course[],
    options: { showProgress?: boolean; catalog?: boolean } = {},
  ) => {
    const { showProgress = false, catalog = false } = options
    if (loading) {
      return <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">Loading courses…</p>
    }
    if (courses.length === 0) {
      return (
        <div className="grow-empty">
          <BookOpen className="mx-auto h-10 w-10 text-[#c9bfb0] dark:text-muted-foreground" />
          <p className="mt-3 text-sm text-[#6b5c4f] dark:text-muted-foreground">
            {search ? "No courses match your search." : "Nothing here yet."}
          </p>
        </div>
      )
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) =>
          catalog ? (
            <div
              key={course.id}
              onClick={() => openCourse(course)}
              className="cursor-pointer"
            >
              <CourseCard course={course} linkToDetails={false} />
            </div>
          ) : (
            <CourseCard
              key={course.id}
              course={course}
              showProgress={showProgress}
              linkToDetails={course.isEnrolled}
            />
          ),
        )}
      </div>
    )
  }

  return (
    <MainLayout>
      <GrowShell>
        <GrowHeader
          title="Courses"
          accent="explore & enroll"
          description="Browse the full catalog and enroll with payment or an admin enrollment code"
        >
          <Button variant="outline" className="grow-btn-outline" asChild>
            <Link href="/dashboard">
              <GraduationCap className="mr-1.5 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </GrowHeader>

        <StudentJoinBanner />

        <div className="grow-toolbar">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses…"
              className="grow-input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="grow-btn-outline gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grow-card-coral p-5">
            <p className="text-sm font-medium text-white/85">Catalog</p>
            <p className="mt-2 text-4xl font-bold">{allCourses.length}</p>
            <p className="mt-1 text-sm text-white/75">courses available</p>
          </div>
          <div className="grow-card p-5">
            <p className="text-sm text-muted-foreground">Enrolled</p>
            <p className="mt-2 text-4xl font-bold text-[#1c1917] dark:text-foreground">
              {enrolledCourses.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">active paths</p>
          </div>
          <div className="grow-card-dark p-5">
            <p className="text-sm text-white/70">Completed</p>
            <p className="mt-2 text-4xl font-bold">{completedCourses.length}</p>
            <p className="mt-1 text-sm text-white/60">courses finished</p>
          </div>
        </div>

        <Tabs defaultValue="catalog">
          <TabsList className="grow-tabs-list">
            <TabsTrigger value="catalog" className="grow-tab-trigger">
              All courses
            </TabsTrigger>
            <TabsTrigger value="enrolled" className="grow-tab-trigger">
              My enrolled
            </TabsTrigger>
            <TabsTrigger value="completed" className="grow-tab-trigger">
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-5">
            {renderGrid(catalogCourses, { catalog: true })}
          </TabsContent>

          <TabsContent value="enrolled" className="mt-5">
            {renderGrid(filterCourses(enrolledCourses), { showProgress: true })}
          </TabsContent>

          <TabsContent value="completed" className="mt-5">
            {renderGrid(filterCourses(completedCourses), { showProgress: true })}
          </TabsContent>
        </Tabs>

        <CourseDetailsModal
          course={selectedCourse}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onEnroll={fetchCourses}
          isEnrolled={selectedCourse?.isEnrolled}
        />
      </GrowShell>
    </MainLayout>
  )
}
