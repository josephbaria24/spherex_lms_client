import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Clock, ListOrdered, Tag, Users, TrendingUp } from "lucide-react"
import type { Course } from "@/lib/types"
import { formatCoursePrice } from "@/lib/course-pricing"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  course: Course
  showProgress?: boolean
  linkToDetails?: boolean
  variant?: "default" | "bento" | "shop" | "compact" | "resume"
}

const BENTO_HERO_GRADIENTS = [
  "from-[#ff7a45]/20 via-[#ff6b35]/15 to-[#e85a4a]/10",
  "from-violet-400/20 via-purple-400/15 to-indigo-400/10",
  "from-sky-400/20 via-blue-400/15 to-cyan-400/10",
  "from-lime-400/25 via-emerald-400/15 to-teal-400/10",
  "from-amber-400/20 via-orange-400/15 to-rose-400/10",
]

function heroGradient(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % BENTO_HERO_GRADIENTS.length
  return BENTO_HERO_GRADIENTS[hash]
}

function CatalogPrice({ cents }: { cents: number }) {
  const label = formatCoursePrice(cents)
  const priced = label.startsWith("₱")
  const amount = priced ? label.slice(1).trim() : label
  return (
    <span className="inline-flex shrink-0 items-baseline rounded-md bg-[#E8F8EF] px-1.5 py-0.5 text-[#128A3E] sm:px-2 sm:py-1 dark:bg-emerald-500/15 dark:text-emerald-300">
      {priced ? <span className="mr-0.5 text-[10px] font-bold leading-none sm:text-[11px]">₱</span> : null}
      <span
        className={cn(
          "leading-none tabular-nums tracking-tight",
          priced ? "text-xs font-semibold sm:text-[15px]" : "text-[10px] font-semibold sm:text-xs",
        )}
      >
        {amount}
      </span>
    </span>
  )
}

export function CourseCard({
  course,
  showProgress = false,
  linkToDetails = true,
  variant = "bento",
}: CourseCardProps) {
  const isBento = variant === "bento"
  const isCompleted = showProgress && (course.progress ?? 0) >= 100

  const shopCard = (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-[#FFD8C8] sm:rounded-[1.5rem] dark:border-border dark:bg-card">
      <div
        className={cn(
          "relative aspect-[4/3] overflow-hidden bg-[#FFF4EF] sm:aspect-[16/10] dark:bg-muted",
          !course.thumbnail && `bg-gradient-to-br ${heroGradient(course.id)}`,
        )}
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] sm:left-3 sm:top-3">
          {course.organizationName ? (
            <span className="truncate rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-semibold text-neutral-700 shadow-sm sm:px-2.5 sm:py-1 sm:text-[10px]">
              {course.organizationName}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-2 sm:p-5">
        <div className="flex items-start justify-between gap-1.5 sm:gap-3">
          <h3 className="line-clamp-2 min-w-0 text-xs font-semibold leading-4 tracking-tight text-neutral-950 sm:text-[15px] sm:leading-snug dark:text-foreground">
            {course.title}
          </h3>
          <CatalogPrice cents={course.priceCents ?? 0} />
        </div>
        <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-neutral-500 sm:mt-2 sm:line-clamp-2 sm:min-h-10 sm:text-sm sm:leading-6 dark:text-muted-foreground">
          {course.description || "\u00A0"}
        </p>
        <p className="mt-1 truncate text-[10px] text-neutral-500 sm:mt-4 sm:text-xs dark:text-muted-foreground">
          <span>{course.enrolledCount} enrolled</span>
          {course.lessonCount != null ? <span> · {course.lessonCount} lessons</span> : null}
          {course.category ? <span> · {course.category}</span> : null}
        </p>
        <div className="mt-auto pt-2 sm:pt-5">
          <span className="inline-flex h-7 w-full items-center justify-center rounded-lg bg-[#FF4B1A] text-[11px] font-semibold text-white sm:h-10 sm:rounded-xl sm:text-sm">
            <span className="sm:hidden">{course.isEnrolled ? "Continue" : "View"}</span>
            <span className="hidden sm:inline">{course.isEnrolled ? "Continue" : "View course"}</span>
          </span>
        </div>
      </div>
    </article>
  )

  const progress = course.progress ?? 0
  const resumeCard = (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-[#FFD8C8] dark:border-border dark:bg-card">
      <div
        className={cn(
          "relative h-36 overflow-hidden bg-[#FFF4EF] dark:bg-muted",
          !course.thumbnail && `bg-gradient-to-br ${heroGradient(course.id)}`,
        )}
      >
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span className="absolute right-3 top-3 rounded-full bg-neutral-950/80 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
          {isCompleted ? "Done" : `${progress}%`}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-neutral-950 dark:text-foreground">
            {course.title}
          </h3>
          <CatalogPrice cents={course.priceCents ?? 0} />
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-500/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">
              {isCompleted ? "Completed" : "Progress"}
            </span>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
              {progress}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-emerald-200/80 dark:bg-emerald-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-muted-foreground">
          {course.lessonCount != null ? (
            <span className="inline-flex items-center gap-1">
              <ListOrdered className="h-3.5 w-3.5 text-[#FF4B1A]" />
              {course.lessonCount} lessons
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-[#FF4B1A]" />
            {course.duration}
          </span>
          {course.category ? (
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-[#FF4B1A]" />
              {course.category}
            </span>
          ) : null}
        </div>
        <span className="mt-auto inline-flex items-center text-sm font-semibold text-[#FF4B1A]">
          {isCompleted ? "Review course" : "Continue"}
        </span>
      </div>
    </article>
  )

  const compactCard = (
    <article className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-sm dark:border-border dark:bg-card">
      <div
        className={cn(
          "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-[#FFF4EF]",
          !course.thumbnail && `bg-gradient-to-br ${heroGradient(course.id)}`,
        )}
      >
        {course.thumbnail ? (
          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 py-0.5 pr-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-neutral-950 dark:text-foreground">
            {course.title}
          </h3>
          <span className="shrink-0 text-xs font-bold text-[#FF4B1A]">
            {formatCoursePrice(course.priceCents ?? 0)}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-neutral-500">
          {isCompleted ? "Completed" : `Enrolled · ${course.progress ?? 0}%`}
        </p>
        {showProgress ? (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#f3ede4] dark:bg-muted">
            <div
              className="h-full rounded-full bg-[#FF4B1A]"
              style={{ width: `${course.progress ?? 0}%` }}
            />
          </div>
        ) : null}
      </div>
    </article>
  )

  const card = variant === "shop" ? shopCard : variant === "resume" ? resumeCard : variant === "compact" ? compactCard : isBento ? (
    <article className="grow-card group cursor-pointer overflow-hidden">
      <div
        className={cn(
          "relative h-28 overflow-hidden bg-gradient-to-br sm:h-44",
          !course.thumbnail && heroGradient(course.id),
        )}
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent",
            course.thumbnail
              ? "h-24 from-white via-white/80 dark:from-card dark:via-card/80"
              : "h-full from-white via-white/20 dark:from-card dark:via-card/40",
          )}
        />
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span className="grow-badge bg-white/90 text-[#1c1917] dark:bg-card">
            {formatCoursePrice(course.priceCents ?? 0)}
          </span>
          {course.isEnrolled ? (
            <span className="rounded-full bg-[#7c6cf0] px-2.5 py-0.5 text-[10px] font-semibold text-white">
              Enrolled
            </span>
          ) : null}
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
          <span className="grow-badge mb-1 sm:mb-2">{course.category}</span>
          <h3 className="line-clamp-2 h-10 text-base font-bold leading-5 tracking-tight text-[#1c1917] transition-colors group-hover:text-[#e85d4a] sm:h-12 sm:text-lg sm:leading-6 dark:text-foreground">
            {course.title}
          </h3>
        </div>
      </div>

      <div className="space-y-2 p-3 sm:space-y-3 sm:p-5">
        <p className="line-clamp-2 h-10 text-sm leading-5 text-[#6b5c4f] dark:text-muted-foreground">
          {course.description}
        </p>

        <div className="flex h-5 items-center gap-2 overflow-hidden whitespace-nowrap text-[11px] text-[#8a7d72] sm:gap-3 sm:text-xs dark:text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="truncate">{course.duration}</span>
          </div>
          <div className="hidden min-w-0 items-center gap-1 sm:flex">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{course.enrolledCount} enrolled</span>
          </div>
          <div className="flex min-w-0 items-center gap-1 capitalize">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{course.level}</span>
          </div>
        </div>

        {showProgress && course.progress !== undefined ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-[#6b5c4f] dark:text-muted-foreground">
              <span>Progress</span>
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </span>
                ) : null}
                <span className="font-semibold text-[#1c1917] dark:text-foreground">
                  {course.progress}%
                </span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f3ede4] dark:bg-muted">
              <div
                className="h-full rounded-full bg-[#7c6cf0] transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </article>
  ) : (
    <article className="premium-card premium-row group cursor-pointer overflow-hidden rounded-xl border border-border shadow-none">
      <div className="relative h-40 overflow-hidden border-b border-border/60 bg-gradient-to-br from-emerald-500/10 to-sky-500/10">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <Badge variant="secondary" className="mb-2 text-[10px]">
            {course.category}
          </Badge>
          <h3 className="setup-type-module-title line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
            {course.title}
          </h3>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="setup-type-module-sub line-clamp-2">{course.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{course.enrolledCount} enrolled</span>
          </div>
          <div className="flex items-center gap-1 capitalize">
            <TrendingUp className="h-3 w-3" />
            <span>{course.level}</span>
          </div>
        </div>

        {showProgress && course.progress !== undefined ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{isCompleted ? "Completed" : "Progress"}</span>
              <span className="font-medium text-foreground">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-1.5" />
          </div>
        ) : null}
      </div>
    </article>
  )

  return linkToDetails ? (
    <Link href={showProgress ? `/courses/${course.id}/learn` : `/courses/${course.id}`}>
      {card}
    </Link>
  ) : (
    card
  )
}
