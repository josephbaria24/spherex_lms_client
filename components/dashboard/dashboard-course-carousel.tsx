"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { CourseCardHero } from "@/components/admin/courses/course-card-hero"
import { Button } from "@/components/ui/button"
import { apiGet } from "@/lib/api"
import { formatCoursePrice } from "@/lib/course-pricing"
import { cn } from "@/lib/utils"
import { ArrowRight, Building2, Sparkles } from "lucide-react"

type CatalogCourse = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  duration?: string | null
  image?: string | null
  card_theme?: string | null
  price_cents?: number
  is_enrolled?: boolean
  organization_name?: string | null
}

const AUTO_ADVANCE_MS = 5500
const CAROUSEL_CLASS = "bento-card relative overflow-hidden rounded-[1.75rem] bg-[#ebe4f8] p-3 dark:bg-violet-950/40 lg:col-span-12"

function chunkSlides<T>(items: T[], size: number): T[][] {
  const slides: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    slides.push(items.slice(i, i + size))
  }
  return slides
}

function CoursePromoCard({ course }: { course: CatalogCourse }) {
  return (
    <article className="flex h-full min-h-[220px] flex-col overflow-hidden rounded-[1.25rem] border border-white/50 bg-white shadow-sm dark:border-white/10 dark:bg-card">
      <div className="relative h-24 shrink-0">
        <CourseCardHero
          image={course.image}
          cardTheme={course.card_theme}
          className="absolute inset-0 h-full border-b-0"
          compact
        />
        {course.organization_name ? (
          <span className="absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            <Building2 className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{course.organization_name}</span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {course.category ? (
            <span className="rounded-full bg-[#f3ede4] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6b5c4f] dark:bg-muted dark:text-muted-foreground">
              {course.category}
            </span>
          ) : null}
          {course.level ? (
            <span className="rounded-full bg-[#ebe4f8] px-2 py-0.5 text-[9px] font-semibold capitalize text-[#5c4d8a] dark:bg-violet-950/50 dark:text-violet-200">
              {course.level}
            </span>
          ) : null}
          <span className="rounded-full bg-[#1a1f2e] px-2 py-0.5 text-[9px] font-semibold text-white dark:bg-violet-600">
            {formatCoursePrice(course.price_cents ?? 0)}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-[#1c1917] dark:text-foreground">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs text-[#5c5368] dark:text-muted-foreground">
          {course.description?.trim() ||
            "Start learning with structured lessons from expert organizations."}
        </p>
        {course.duration ? (
          <p className="mt-1 text-[11px] text-muted-foreground">{course.duration}</p>
        ) : null}

        <Button
          asChild
          size="sm"
          className="mt-3 w-full rounded-full bg-[#1a1f2e] text-white hover:bg-[#252b3d] dark:bg-violet-600 dark:hover:bg-violet-500"
        >
          <Link href={course.is_enrolled ? `/courses/${course.id}/learn` : "/courses"}>
            {course.is_enrolled ? "Continue" : "View course"}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  )
}

export function DashboardCourseCarousel() {
  const [courses, setCourses] = useState<CatalogCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)

  const slides = useMemo(() => chunkSlides(courses, 2), [courses])

  useEffect(() => {
    let cancelled = false
    apiGet<{ courses: CatalogCourse[] }>("/courses")
      .then((data) => {
        if (cancelled) return
        const withOrg = (data.courses ?? []).filter((c) => c.organization_name)
        setCourses(withOrg.length > 0 ? withOrg : (data.courses ?? []))
      })
      .catch(() => {
        if (!cancelled) setCourses([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    setActiveIndex(carouselApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api, onSelect])

  useEffect(() => {
    if (!api || slides.length <= 1) return
    const timer = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext()
      } else {
        api.scrollTo(0)
      }
    }, AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [api, slides.length])

  if (loading) {
    return (
      <div className={cn(CAROUSEL_CLASS, "flex min-h-[260px] animate-pulse items-center justify-center")}>
        <p className="text-sm text-[#6b5c7a] dark:text-violet-300/80">Loading courses…</p>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div
        className={cn(
          CAROUSEL_CLASS,
          "relative min-h-[260px] bg-gradient-to-br from-[#ebe4f8] via-[#e8dff5] to-[#ddd0f0] p-6 dark:from-violet-950/50 dark:via-violet-950/40 dark:to-violet-900/30",
        )}
      >
        <div className="flex h-full min-h-[212px] flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5c7a] dark:text-violet-300/80">
            Discover courses
          </p>
          <h3 className="mt-2 text-2xl font-bold text-[#1c1917] dark:text-foreground">
            Explore what organizations offer
          </h3>
          <p className="mt-2 max-w-md text-sm text-[#5c5368] dark:text-muted-foreground">
            Browse the catalog and enroll in your next learning path.
          </p>
          <Button
            asChild
            className="mt-6 w-fit rounded-full bg-[#1a1f2e] text-white hover:bg-[#252b3d] dark:bg-violet-600"
          >
            <Link href="/courses">
              Explore courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={CAROUSEL_CLASS}>
      <div className="mb-3 flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#7c6cf0]" />
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5c7a] dark:text-violet-300/80">
            From our organizations
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex
                  ? "w-6 bg-[#7c6cf0]"
                  : "w-1.5 bg-[#7c6cf0]/30 hover:bg-[#7c6cf0]/50",
              )}
            />
          ))}
        </div>
      </div>

      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent className="-ml-2">
          {slides.map((slideCourses, slideIndex) => (
            <CarouselItem key={slideIndex} className="pl-2">
              <div
                className={cn(
                  "grid min-h-[220px] gap-2",
                  slideCourses.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
                )}
              >
                {slideCourses.map((course) => (
                  <CoursePromoCard key={course.id} course={course} />
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
