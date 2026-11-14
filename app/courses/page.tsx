"use client"

import { PageLoader } from "@/components/ui/spinner"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { GrowShell, GrowHeader } from "@/components/grow-shell"
import { CourseCard } from "@/components/course-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, BookOpen, Compass, Filter, Search } from "lucide-react"
import { useAuth } from "@/app/provider"
import { apiGet } from "@/lib/api"
import type { Course } from "@/lib/types"
import { CourseDetailsModal } from "@/components/course-detail-modal"
import { StudentJoinBanner } from "@/components/settings/join-org-section"
import { LandingHeader } from "@/components/landing/landing-header"
import { CatalogTrackIntro, CatalogTrackPicker } from "@/components/courses/catalog-track-picker"
import { IeltsTrainingCatalog } from "@/components/ielts/ielts-training-catalog"
import { IeltsEnrolledCard, ieltsMatchesSearch } from "@/components/ielts/ielts-enrolled-card"
import { useIeltsAccess } from "@/components/ielts/ielts-access-dialog"
import { assetUrl } from "@/lib/asset-url"
import { isIeltsCourse, type CatalogTrackId } from "@/lib/catalog-tracks"
import { cn } from "@/lib/utils"

function CatalogTabBar() {
  const listRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const [animate, setAnimate] = useState(false)

  const measure = () => {
    const root = listRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
    if (!active) return
    const rootRect = root.getBoundingClientRect()
    const rect = active.getBoundingClientRect()
    const next = {
      left: rect.left - rootRect.left,
      top: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
    }
    setPill((current) =>
      current &&
      current.left === next.left &&
      current.top === next.top &&
      current.width === next.width &&
      current.height === next.height
        ? current
        : next,
    )
  }

  useLayoutEffect(() => {
    measure()
  })

  useEffect(() => {
    const root = listRef.current
    if (!root) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(root)
    const frame = requestAnimationFrame(() => setAnimate(true))
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={listRef} className="relative inline-flex w-fit max-w-full self-start rounded-full bg-[#f3ede4] max-md:w-full dark:bg-muted">
      {pill ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute rounded-full bg-[#1a1f2e] dark:bg-foreground",
            animate && "transition-[left,top,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          )}
          style={{ left: pill.left, top: pill.top, width: pill.width, height: pill.height }}
        />
      ) : null}
      <TabsList className="grow-tabs-list relative z-10 max-md:w-full !bg-transparent">
        <TabsTrigger
          value="enrolled"
          className="grow-tab-trigger relative z-10 bg-transparent shadow-none transition-colors duration-300 data-[state=active]:!bg-transparent data-[state=active]:!text-white data-[state=active]:!shadow-none max-md:flex-1 max-md:px-2 dark:data-[state=active]:!text-background"
        >
          <span className="md:hidden">Enrolled</span>
          <span className="hidden md:inline">My enrolled</span>
        </TabsTrigger>
        <TabsTrigger
          value="catalog"
          className="grow-tab-trigger relative z-10 bg-transparent shadow-none transition-colors duration-300 data-[state=active]:!bg-transparent data-[state=active]:!text-white data-[state=active]:!shadow-none max-md:flex-1 max-md:px-2 dark:data-[state=active]:!text-background"
        >
          <span className="md:hidden">All</span>
          <span className="hidden md:inline">All courses</span>
        </TabsTrigger>
        <TabsTrigger
          value="completed"
          className="grow-tab-trigger relative z-10 bg-transparent shadow-none transition-colors duration-300 data-[state=active]:!bg-transparent data-[state=active]:!text-white data-[state=active]:!shadow-none max-md:flex-1 max-md:px-2 dark:data-[state=active]:!text-background"
        >
          Completed
        </TabsTrigger>
      </TabsList>
    </div>
  )
}

type CourseRow = {
  id: string
  title: string
  description?: string
  category?: string
  level?: string
  enrolled_count?: number
  duration?: string
  lessons?: number
  created_at?: string
  updated_at?: string
  price_cents?: number
  lesson_count?: number
  requires_enroll_code?: boolean
  is_enrolled?: boolean
  organization_name?: string | null
  thumbnail?: string | null
  image?: string | null
}

type EnrollmentRow = {
  course_id: string
  progress_percent?: number
  completed?: boolean
  certificate_ready?: boolean
  course?: CourseRow
}

export default function CoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const ieltsAccess = useIeltsAccess()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [completedCourses, setCompletedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [catalogTab, setCatalogTab] = useState("catalog")
  const [track, setTrack] = useState<CatalogTrackId>("osh")
  const openedRegistrationCourse = useRef(false)
  const [guestAccessRequest, setGuestAccessRequest] = useState(false)

  const mapCourse = (c: CourseRow, progress = 0, certificatePending = false): Course => ({
    id: c.id,
    title: c.title ?? "Untitled",
    description: c.description ?? "",
    category: c.category ?? "Uncategorized",
    thumbnail: assetUrl(c.image ?? c.thumbnail),
    duration: c.duration ?? "Unknown",
    level: (c.level as Course["level"]) ?? "beginner",
    enrolledCount: c.enrolled_count ?? 0,
    lessonCount: c.lesson_count ?? c.lessons,
    progress,
    priceCents: c.price_cents ?? 0,
    requiresEnrollCode: c.requires_enroll_code ?? false,
    isEnrolled: c.is_enrolled ?? false,
    organizationName: c.organization_name ?? null,
    certificatePending,
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

      const waitingForCertificate = (enrollment: EnrollmentRow) =>
        enrollment.completed === true && enrollment.certificate_ready !== true

      setEnrolledCourses(
        (enrolledData.enrollments ?? [])
          .map((e) =>
            e.course
              ? mapCourse(e.course, e.progress_percent ?? 0, waitingForCertificate(e))
              : null,
          )
          .filter((c): c is Course => c !== null),
      )

      setCompletedCourses(
        (completedData.enrollments ?? [])
          .map((e) =>
            e.course
              ? mapCourse(e.course, e.progress_percent ?? 100, waitingForCertificate(e))
              : null,
          )
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

  useEffect(() => {
    if (loading || openedRegistrationCourse.current) return
    const courseId = new URLSearchParams(window.location.search).get("course")
    if (!courseId) return
    const match =
      allCourses.find((course) => course.id === courseId) ??
      enrolledCourses.find((course) => course.id === courseId) ??
      completedCourses.find((course) => course.id === courseId)
    if (!match) return
    openedRegistrationCourse.current = true
    setGuestAccessRequest(!user)
    setSelectedCourse(match)
    setModalOpen(true)
  }, [loading, allCourses, enrolledCourses, completedCourses])

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

  const catalogCourses = useMemo(() => {
    const searched = filterCourses(allCourses)
    if (track === "osh") return searched.filter((course) => !isIeltsCourse(course))
    if (track === "ielts") return searched.filter(isIeltsCourse)
    return searched
  }, [allCourses, search, track])

  const myEnrolled = useMemo(() => {
    const waiting = filterCourses(completedCourses).filter((course) => course.certificatePending)
    const active = filterCourses(enrolledCourses)
    const seen = new Set(active.map((course) => course.id))
    return [...active, ...waiting.filter((course) => !seen.has(course.id))]
  }, [enrolledCourses, completedCourses, search])

  const showIelts = Boolean(user) && ieltsAccess.unlocked && ieltsMatchesSearch(search)
  const activeCount = enrolledCourses.length + (ieltsAccess.unlocked ? 1 : 0)

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
    options: {
      showProgress?: boolean
      catalog?: boolean
      emphasize?: boolean
      featured?: boolean
      append?: ReactNode
    } = {},
  ) => {
    const { showProgress = false, catalog = false, emphasize = false, featured = false, append = null } = options
    if (loading) {
      return <PageLoader label="Loading courses…" className="min-h-[20vh] py-6" />
    }
    if (courses.length === 0 && !append) {
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
          featured
            ? "grid gap-3 sm:grid-cols-2"
            : emphasize
              ? "grid gap-2 sm:grid-cols-2"
              : "grid min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3"
        }
      >
        {courses.map((course) =>
          catalog ? (
            <div
              key={course.id}
              onClick={() => openCourse(course)}
              className="min-w-0 cursor-pointer"
            >
              <CourseCard
                course={course}
                showProgress={Boolean(course.isEnrolled)}
                linkToDetails={false}
                variant="shop"
              />
            </div>
          ) : (
            <CourseCard
              key={course.id}
              course={{ ...course, isEnrolled: true }}
              showProgress={showProgress}
              linkToDetails={course.isEnrolled || emphasize || featured}
              variant={featured ? "resume" : emphasize ? "compact" : "shop"}
            />
          ),
        )}
        {append}
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-background">
        <PageLoader label="Loading courses…" className="min-h-[20vh] py-6" />
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
            <CatalogTrackPicker value={track} onChange={setTrack} />
            {track ? (
              <div className="mt-8">
                <CatalogTrackIntro track={track} />
                {track === "ielts" ? <IeltsTrainingCatalog /> : null}
                {track === "osh" ? renderGrid(catalogCourses, { catalog: true }) : null}
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Choose IELTS, OSH trainings, or Reviewers to see what is available.
              </p>
            )}
          </section>
        </main>
        <CourseDetailsModal
          course={selectedCourse}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onEnroll={fetchCourses}
          isEnrolled={selectedCourse?.isEnrolled}
          startWithAccessRequest={guestAccessRequest}
        />
      </div>
    )
  }

  return (
    <MainLayout>
      <GrowShell className="max-md:p-3" contentClassName="max-md:space-y-3">
        <div className="space-y-3">
          <GrowHeader
            title="Courses"
            accent="explore & enroll"
            description="Continue a course, or shop the catalog."
            denseOnMobile
          />
          <StudentJoinBanner compact />
        </div>

        <section className="min-w-0 space-y-2">
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-2",
                enrolledCourses.length === 0 && !ieltsAccess.unlocked && "hidden md:flex",
              )}
            >
              <h2 className="text-sm font-semibold tracking-tight text-[#1c1917] dark:text-foreground">
                My enrolled courses
              </h2>
              <p className="text-xs text-[#6b5c4f] dark:text-muted-foreground">
                {activeCount > 0 ? `${activeCount} active` : "None yet"}
              </p>
            </div>

            {loading ? (
              <PageLoader label="Loading…" className="min-h-[20vh] py-6" />
            ) : enrolledCourses.length === 0 && !showIelts ? (
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
              renderGrid(myEnrolled, {
                showProgress: true,
                featured: true,
                append: showIelts ? <IeltsEnrolledCard variant="resume" /> : null,
              })
            )}
            {!loading && (enrolledCourses.length > 0 || showIelts) ? (
              <button
                type="button"
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-[#1c1917] transition hover:text-[#FF4B1A] dark:text-foreground dark:hover:text-[#FF8A6A]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFE8E0] text-[#FF4B1A] dark:bg-[#FF4B1A]/15">
                  <Compass className="h-3.5 w-3.5" />
                </span>
                Explore more courses
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
        </section>

        <div className="flex w-full max-w-md items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses…"
              className="h-9 rounded-full border-border bg-card pl-9 text-sm shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-9 shrink-0 gap-1.5 rounded-full px-3 text-sm">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
        </div>

        <section id="course-catalog" className="scroll-mt-4 space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-[#1c1917] dark:text-foreground">
              Shop courses
            </h2>
            <p className="text-xs text-[#6b5c4f] dark:text-muted-foreground">
              {allCourses.length} in catalog · {activeCount} enrolled · {completedCourses.length} completed
            </p>
          </div>

          <Tabs value={catalogTab} onValueChange={setCatalogTab}>
            <CatalogTabBar />

            <TabsContent value="catalog" className="catalog-tab-panel mt-3 space-y-4 md:mt-5">
              <CatalogTrackPicker value={track} onChange={setTrack} />
              {track === "reviewers" ? <CatalogTrackIntro track="reviewers" /> : null}
              {track === "osh" ? <CatalogTrackIntro track="osh" /> : null}
              {track === "ielts" ? <IeltsTrainingCatalog /> : null}
              {track === "osh"
                ? renderGrid(catalogCourses, { catalog: true })
                : !track ? (
                    <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">
                      Choose IELTS, OSH trainings, or Reviewers.
                    </p>
                  ) : null}
            </TabsContent>

            <TabsContent value="enrolled" className="catalog-tab-panel mt-3 md:mt-5">
              {!loading && myEnrolled.length === 0 && !showIelts && !search.trim() ? (
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
                renderGrid(myEnrolled, {
                  showProgress: true,
                  emphasize: true,
                  append: showIelts ? <IeltsEnrolledCard variant="compact" /> : null,
                })
              )}
            </TabsContent>

            <TabsContent value="completed" className="catalog-tab-panel mt-3 md:mt-5">
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
