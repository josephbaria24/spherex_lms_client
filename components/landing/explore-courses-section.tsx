"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { petrosphereCourses } from "@/lib/landing-categories"
import { cn } from "@/lib/utils"

const CATEGORIES = ["All", ...Array.from(new Set(petrosphereCourses.map((c) => c.category)))]

const instructorAvatar =
  "https://elearning.petrosphere.com.ph/wp-content/uploads/2020/10/BLS-Course-2-624x468.png"

type Course = (typeof petrosphereCourses)[number]

function ProgramCard({ course }: { course: Course }) {
  return (
    <Link
      href="/login"
      className="group flex h-full min-h-[18.5rem] flex-col rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.08),0_16px_32px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:min-h-[20rem] sm:p-7"
    >
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
        <span>{course.category}</span>
        <span className={course.price === "Free" ? "text-teal-600" : "text-slate-400"}>
          {course.price}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900 sm:text-xl">
        {course.title}
      </h3>
      <p className="mt-3 line-clamp-3 flex-1 text-[15px] leading-relaxed text-slate-600">
        {course.description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={instructorAvatar}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{course.instructor}</p>
            <p className="text-xs text-slate-500">{course.lessons} lessons</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-800 transition group-hover:text-slate-950">
          Enroll
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  )
}

export function ExploreCoursesSection() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return petrosphereCourses.filter((course) => {
      const matchesCategory = category === "All" || course.category === category
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  const isFiltering = query.trim().length > 0 || category !== "All"

  function clearFilters() {
    setQuery("")
    setCategory("All")
  }

  return (
    <section
      id="courses"
      className="relative scroll-mt-14 bg-[#f7f7f5] text-slate-800"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-7xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8">
        {/* Header — Petrosphere curriculum style */}
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Explore Our Courses
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Explore our comprehensive catalog of industry-standard safety, technical, and compliance
            courses — featured from{" "}
            <Link
              href="/organizations/petrosphere"
              className="font-medium text-slate-900 underline decoration-[#c9a227]/40 underline-offset-4 hover:decoration-[#c9a227]"
            >
              Petrosphere
            </Link>
            .
          </p>
        </div>

        {/* Filters + search toolbar */}
        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((item) => {
              const active = category === item
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[#c9a227] text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-slate-200/80 hover:ring-slate-300",
                  )}
                >
                  {item}
                </button>
              )
            })}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search programs…"
              aria-label="Search programs"
              className="h-11 rounded-lg border-slate-200 bg-white pl-10 pr-10 shadow-sm"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {isFiltering ? (
          <p className="mt-4 text-sm text-slate-500">
            {filtered.length} {filtered.length === 1 ? "program" : "programs"} found
            {" · "}
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-slate-700 underline-offset-2 hover:underline"
            >
              Clear all filters
            </button>
          </p>
        ) : null}

        {/* Program grid */}
        {filtered.length === 0 ? (
          <div className="mt-12 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <Search className="h-8 w-8 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No programs found</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              We couldn&apos;t find any courses matching your current search parameters.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              className="mt-6 rounded-lg border-slate-200"
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid flex-1 auto-rows-fr content-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <ProgramCard key={course.title} course={course} />
            ))}
          </div>
        )}

        {/* Footer CTAs */}
        <div className="mt-auto flex flex-col items-center justify-between gap-5 border-t border-slate-200/80 pt-10 sm:flex-row">
          <p className="text-sm text-slate-500">
            {petrosphereCourses.length} featured programs · Full catalog available in Petrosphere
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/organizations/petrosphere">
              <Button
                variant="outline"
                className="h-11 rounded-lg border-slate-200 bg-white px-6 hover:bg-slate-50"
              >
                Petrosphere Catalog
              </Button>
            </Link>
            <Link href="/login">
              <Button className="h-11 rounded-lg bg-slate-900 px-8 hover:bg-slate-800">
                View All Courses
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
