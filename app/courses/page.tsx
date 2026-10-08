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
import { LandingHeader } from "@/components/landing/landing-header"
import { assetUrl } from "@/lib/asset-url"
import { cn } from "@/lib/utils"

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
  thumbnail?: string | null
  image?: string | null
}

type EnrollmentRow = {
  course_id: string
  progress_percent?: number
  course?: CourseRow
}

export default function CoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [completedCourses, setCompletedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [catalogTab, setCatalogTab] = useState("enrolled")

  const mapCourse = (c: CourseRow, progress = 0): Course => ({
    id: c.id,
    title: c.title ?? "Untitled",
    description: c.description ?? "",
    category: c.category ?? "Uncategorized",
    thumbnail: assetUrl(c.image ?? c.thumbnail),
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
    setLoading(true)

    try {
      const allData = await apiGet<{ courses: CourseRow[] }>("/courses")

      if (!user) {
        setAllCourses((allData.courses ?? []).map((c) => mapCourse(c)))
        setEnrolledCourses([])
        setCompletedCourses([])
        return
      }

      const [enrolledData, completedData] = await Promise.all([
        apiGet<{ enrollments: EnrollmentRow[] }>("/enrollments?completed=false&include=course"),
        apiGet<{ enrollments: EnrollmentRow[] }>("/enrollments?completed=true&include=course"),
      ])

      const enrolledIds = new Set(
        [
          ...(enrolledData.enrollments ?? []),
          ...(completedData.enrollments ?? []),
        ].map((e) => e.course_id),
      )
      const progressByCourse = new Map<string, number>([
        ...(enrolledData.enrollments ?? []).map((e) => [e.course_id, e.progress_percent ?? 0] as const),
        ...(completedData.enrollments ?? []).map((e) => [e.course_id, e.progress_percent ?? 100] as const),
      ])

      setAllCourses(
        (allData.courses ?? []).map((c) => ({
          ...mapCourse(c, progressByCourse.get(c.id) ?? 0),
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
    if (authLoading) return
    void fetchCourses()
  }, [user, authLoading])

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

  const myEnrolled = useMemo(
    () => filterCourses(enrolledCourses),
    [enrolledCourses, search],
  )

  const openCourse = (course: Course) => {
    setSelectedCourse(course)
    setModalOpen(true)
  }

  const scrollToCatalog = () => {
    setCatalogTab("catalog")
    requestAnimationFrame(() => {
      document.getElementById("course-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const renderGrid = (
    courses: Course[],
    options: { showProgress?: boolean; catalog?: boolean; emphasize?: boolean } = {},
  ) => {
    const { showProgress = false, catalog = false, emphasize = false } = options
    if (loading) {
      return <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">Loading courses…</p>
    }
    if (courses.length === 0) {
      return (
        <div className="grow-empty py-8">
          <BookOpen className="mx-auto h-10 w-10 text-[#c9bfb0] dark:text-muted-foreground" />
          <p className="mt-3 text-sm text-[#6b5c4f] dark:text-muted-foreground">
            {search ? "No courses match your search." : "Nothing here yet."}
          </p>
        </div>
      )
    }
    return (
      <div
        className={
          emphasize
            ? "grid gap-3 sm:grid-cols-2 sm:gap-4"
            : "grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3"
        }
      >
        {courses.map((course) =>
          catalog ? (
            <div
              key={course.id}
              onClick={() => openCourse(course)}
              className="cursor-pointer"
            >
              <CourseCard
                course={course}
                showProgress={Boolean(course.isEnrolled)}
                linkToDetails={false}
              />
            </div>
          ) : (
            <div
              key={course.id}
              className={
                emphasize
                  ? "rounded-[1.75rem] ring-2 ring-[#7c6cf0]/35 ring-offset-2 ring-offset-white dark:ring-offset-background"
                  : undefined
              }
            >
              <CourseCard
                course={{ ...course, isEnrolled: true }}
                showProgress={showProgress}
                linkToDetails={course.isEnrolled || emphasize}
              />
            </div>
          ),
        )}
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-background">
        <p className="text-sm text-muted-foreground">Loading courses…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-slate-800 dark:bg-background dark:text-foreground">
        <LandingHeader />
        <main className="pt-24 pb-16">
          <section className="bg-gradient-to-br from-orange-50 via-rose-50/60 to-white pb-10 pt-8 dark:from-background dark:via-orange-950/20 dark:to-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-4 py-1.5 text-xs font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                  <BookOpen className="h-3.5 w-3.5" />
                  Course catalog
                </span>
                <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                  Browse courses
                </h1>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Explore published courses. Sign in to enroll, or request paid access without an
                  account.
                </p>
              </div>
              <div className="relative mx-auto mt-10 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search courses…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-full pl-9"
                />
              </div>
            </div>
          </section>
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            {renderGrid(catalogCourses, { catalog: true })}
          </section>
        </main>
        <CourseDetailsModal
          course={selectedCourse}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onEnroll={fetchCourses}
          isEnrolled={selectedCourse?.isEnrolled}
        />
      </div>
    )
  }

  return (
    <MainLayout>
      <GrowShell className="max-md:p-3 max-md:pb-4" contentClassName="max-md:space-y-3">
        <GrowHeader
          title="Courses"
          accent="explore & enroll"
          description="Your enrolled courses first — then browse the catalog to add more"
          denseOnMobile
        >
          <Button variant="outline" className="grow-btn-outline" asChild>
            <Link href="/dashboard">
              <GraduationCap className="mr-1.5 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </GrowHeader>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5">
          <section className="min-w-0 flex-1 space-y-2 md:space-y-4">
            <div
              className={cn(
                "flex flex-wrap items-end justify-between gap-2",
                enrolledCourses.length === 0 && "hidden md:flex",
              )}
            >
              <div>
                <h2 className="text-base font-bold tracking-tight text-[#1c1917] md:text-xl dark:text-foreground">
                  My enrolled courses
                </h2>
                <p className="mt-0.5 hidden text-sm text-[#6b5c4f] md:block dark:text-muted-foreground">
                  {enrolledCourses.length > 0
                    ? `${enrolledCourses.length} active · continue where you left off`
                    : "Courses you’re learning appear here"}
                </p>
              </div>
              {enrolledCourses.length > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-teal-700 hover:text-teal-800"
                  onClick={scrollToCatalog}
                >
                  Browse catalog
                </Button>
              ) : null}
            </div>

            {loading ? (
              <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">Loading…</p>
            ) : enrolledCourses.length === 0 ? (
              <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                No courses yet.{" "}
                <button
                  type="button"
                  onClick={scrollToCatalog}
                  className="font-medium text-[#1c1917] underline underline-offset-2 dark:text-foreground"
                >
                  Explore the catalog
                </button>
              </p>
            ) : (
              renderGrid(myEnrolled, { showProgress: true, emphasize: true })
            )}
          </section>

          <div className="w-full shrink-0 empty:hidden lg:w-[260px]">
            <StudentJoinBanner compact />
          </div>
        </div>

        <div className="grow-toolbar max-md:gap-0 max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses…"
              className="grow-input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="grow-btn-outline hidden gap-2 md:inline-flex">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="grow-card-coral rounded-lg! px-2.5 py-2 md:rounded-xl! md:p-4">
            <p className="text-[10px] font-medium text-white/85 md:text-xs">Catalog</p>
            <p className="text-lg font-bold leading-tight md:mt-1 md:text-3xl">{allCourses.length}</p>
          </div>
          <div className="grow-card rounded-lg! px-2.5 py-2 md:rounded-xl! md:p-4">
            <p className="text-[10px] text-muted-foreground md:text-xs">Enrolled</p>
            <p className="text-lg font-bold leading-tight text-[#1c1917] md:mt-1 md:text-3xl dark:text-foreground">
              {enrolledCourses.length}
            </p>
          </div>
          <div className="grow-card-dark rounded-lg! px-2.5 py-2 md:rounded-xl! md:p-4">
            <p className="text-[10px] text-white/70 md:text-xs">Completed</p>
            <p className="text-lg font-bold leading-tight md:mt-1 md:text-3xl">{completedCourses.length}</p>
          </div>
        </div>

        <section id="course-catalog" className="scroll-mt-4 space-y-2 md:space-y-4">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#1c1917] md:text-xl dark:text-foreground">
              Catalog
            </h2>
            <p className="mt-0.5 hidden text-sm text-[#6b5c4f] md:block dark:text-muted-foreground">
              Browse all courses, completed paths, and more to enroll
            </p>
          </div>

          <Tabs value={catalogTab} onValueChange={setCatalogTab}>
            <TabsList className="grow-tabs-list max-md:w-full">
              <TabsTrigger value="enrolled" className="grow-tab-trigger max-md:flex-1 max-md:px-2">
                <span className="md:hidden">Enrolled</span>
                <span className="hidden md:inline">My enrolled</span>
              </TabsTrigger>
              <TabsTrigger value="catalog" className="grow-tab-trigger max-md:flex-1 max-md:px-2">
                <span className="md:hidden">All</span>
                <span className="hidden md:inline">All courses</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="grow-tab-trigger max-md:flex-1 max-md:px-2">
                Completed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="mt-3 md:mt-5">
              {renderGrid(catalogCourses, { catalog: true })}
            </TabsContent>

            <TabsContent value="enrolled" className="mt-3 md:mt-5">
              {!loading && myEnrolled.length === 0 && !search.trim() ? (
                <div className="flex flex-col items-center px-4 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3ede4] dark:bg-muted">
                    <BookOpen className="h-8 w-8 text-[#c9bfb0] dark:text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#1c1917] dark:text-foreground">
                    No enrolled courses yet
                  </p>
                  <Button
                    type="button"
                    onClick={scrollToCatalog}
                    className="mt-4 rounded-full bg-[#1a1f2e] text-white hover:bg-[#252b3d]"
                  >
                    Explore courses
                  </Button>
                </div>
              ) : (
                renderGrid(myEnrolled, { showProgress: true, emphasize: true })
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-3 md:mt-5">
              {renderGrid(filterCourses(completedCourses), { showProgress: true })}
            </TabsContent>
          </Tabs>
        </section>

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
