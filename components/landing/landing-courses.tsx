"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CourseDetailsModal } from "@/components/course-detail-modal"
import { apiGet } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { formatCoursePrice } from "@/lib/course-pricing"
import type { Course } from "@/lib/types"

const FEATURED_LIMIT = 6

type CatalogCourseRow = {
  id: string
  title: string
  description?: string
  category?: string
  level?: string
  duration?: string
  enrolled_count?: number
  lessons?: number
  lesson_count?: number
  thumbnail?: string | null
  image?: string | null
  price_cents?: number
  requires_enroll_code?: boolean
  is_enrolled?: boolean
  organization_name?: string | null
  created_at?: string
  updated_at?: string
}

type LandingCourse = Course & {
  lessonCount: number
  cover: string
}

function mapCourse(c: CatalogCourseRow): LandingCourse {
  return {
    id: c.id,
    title: c.title ?? "Untitled",
    description: c.description ?? "",
    category: c.category ?? "Uncategorized",
    thumbnail: c.thumbnail ?? c.image ?? "",
    duration: c.duration ?? "Unknown",
    level: (c.level as Course["level"]) ?? "beginner",
    enrolledCount: c.enrolled_count ?? 0,
    priceCents: c.price_cents ?? 0,
    requiresEnrollCode: c.requires_enroll_code ?? false,
    isEnrolled: c.is_enrolled ?? false,
    organizationName: c.organization_name ?? null,
    createdAt: new Date(c.created_at ?? new Date().toISOString()),
    updatedAt: new Date(c.updated_at ?? c.created_at ?? new Date().toISOString()),
    lessonCount: c.lesson_count ?? c.lessons ?? 0,
    cover: assetUrl(c.image ?? c.thumbnail),
  }
}

export function LandingCourses() {
  const router = useRouter()
  const [courses, setCourses] = useState<LandingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [selected, setSelected] = useState<LandingCourse | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadCourses = async () => {
    try {
      const data = await apiGet<{ courses: CatalogCourseRow[] }>("/courses")
      setCourses((data.courses ?? []).map(mapCourse))
    } catch (err) {
      console.error("Failed to load catalog:", err)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCourses()
  }, [])

  const categories = useMemo(() => {
    const names = new Set(
      courses.map((c) => c.category).filter((name) => name && name !== "Uncategorized"),
    )
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [courses])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return courses.filter((c) => {
      if (category !== "all" && c.category !== category) return false
      if (!q) return true
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.organizationName ?? "").toLowerCase().includes(q)
      )
    })
  }, [courses, search, category])

  const featured = filtered.slice(0, FEATURED_LIMIT)
  const organizationNames = Array.from(
    new Set(courses.map((course) => course.organizationName).filter((name): name is string => Boolean(name))),
  )
  const catalogOwner = organizationNames.length === 1 ? organizationNames[0] : "SphereX"

  const openCourse = (course: LandingCourse) => {
    if (course.isEnrolled) {
      router.push(`/courses/${course.id}/learn`)
      return
    }
    setSelected(course)
    setModalOpen(true)
  }

  const categoryLabel = category === "all" ? "All Category" : category

  return (
    <section id="courses" className="bg-slate-50/80 py-16 dark:bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Explore {catalogOwner} Courses
          </h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-full pl-9 sm:w-56"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 dark:border-border dark:bg-card dark:text-slate-300"
                >
                  {categoryLabel} <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setCategory("all")}>All Category</DropdownMenuItem>
                {categories.map((name) => (
                  <DropdownMenuItem key={name} onSelect={() => setCategory(name)}>
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Live catalog from SphereX — the same courses you can enroll in after you sign in.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-slate-100 bg-white dark:border-border dark:bg-card"
              />
            ))
          ) : featured.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-border dark:bg-card">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {search || category !== "all"
                  ? "No courses match your search."
                  : "No courses published yet."}
              </p>
            </div>
          ) : (
            featured.map((course) => {
              const orgInitial = (course.organizationName ?? "S").trim().charAt(0).toUpperCase()
              const lessonLabel =
                course.lessonCount === 1 ? "1 lesson" : `${course.lessonCount} lessons`

              return (
                <article
                  key={course.id}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-border dark:bg-card dark:hover:shadow-black/40"
                  onClick={() => openCourse(course)}
                >
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-teal-50 to-orange-50 dark:from-teal-950/40 dark:to-orange-950/30">
                    {course.cover ? (
                      <img
                        src={course.cover}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-background/90 dark:text-slate-200">
                      {course.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 font-bold text-slate-900 dark:text-white">{course.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{lessonLabel}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700 dark:bg-teal-950/70 dark:text-teal-300">
                        {orgInitial}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {course.organizationName ?? "SphereX"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-orange-500">
                        {formatCoursePrice(course.priceCents ?? 0)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full dark:border-border dark:bg-transparent dark:text-foreground dark:hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation()
                          openCourse(course)
                        }}
                      >
                        {course.isEnrolled ? "Continue" : "Enroll"}
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/organizations/petrosphere">
            <Button variant="outline" className="rounded-full dark:border-border dark:bg-transparent dark:hover:bg-muted">
              Petrosphere Catalog
            </Button>
          </Link>
          <Link href="/courses">
            <Button className="rounded-full bg-teal-600 px-8 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400">
              View All Courses
            </Button>
          </Link>
        </div>
      </div>

      <CourseDetailsModal
        course={selected}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onEnroll={() => void loadCourses()}
        isEnrolled={selected?.isEnrolled}
      />
    </section>
  )
}
