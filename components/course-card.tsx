import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Users, TrendingUp } from "lucide-react"
import type { Course } from "@/lib/types"
import { formatCoursePrice } from "@/lib/course-pricing"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  course: Course
  showProgress?: boolean
  linkToDetails?: boolean
  variant?: "default" | "bento"
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

export function CourseCard({
  course,
  showProgress = false,
  linkToDetails = true,
  variant = "bento",
}: CourseCardProps) {
  const isBento = variant === "bento"

  const card = isBento ? (
    <article className="grow-card group cursor-pointer overflow-hidden">
      <div
        className={cn(
          "relative h-36 overflow-hidden bg-gradient-to-br",
          heroGradient(course.id),
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent dark:from-card dark:via-card/40" />
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span className="grow-badge bg-white/90 text-[#1c1917] dark:bg-card">
            {formatCoursePrice(course.priceCents ?? 0)}
          </span>
          {course.isEnrolled ? (
            <span className="rounded-full bg-[#7c6cf0] px-2.5 py-0.5 text-[10px] font-semibold text-white">
              Enrolled
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <span className="grow-badge mb-2">{course.category}</span>
          <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-[#1c1917] transition-colors group-hover:text-[#e85d4a] dark:text-foreground">
            {course.title}
          </h3>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <p className="line-clamp-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">
          {course.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8a7d72] dark:text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{course.enrolledCount} enrolled</span>
          </div>
          <div className="flex items-center gap-1 capitalize">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{course.level}</span>
          </div>
        </div>

        {showProgress && course.progress !== undefined ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-[#6b5c4f] dark:text-muted-foreground">
              <span>Progress</span>
              <span className="font-semibold text-[#1c1917] dark:text-foreground">
                {course.progress}%
              </span>
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
      <div className="relative h-32 overflow-hidden border-b border-border/60 bg-gradient-to-br from-emerald-500/10 to-sky-500/10">
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
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
              <span className="text-muted-foreground">Progress</span>
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
