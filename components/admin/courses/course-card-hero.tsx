import type { ReactNode } from "react"
import { assetUrl } from "@/lib/asset-url"
import {
  getCourseCardThemeOption,
  normalizeCourseCardTheme,
  type CourseCardTheme,
} from "@/lib/course-card-themes"
import { cn } from "@/lib/utils"

type CourseCardHeroProps = {
  image?: string | null
  cardTheme?: string | null
  className?: string
  children?: ReactNode
  compact?: boolean
}

function BlobDecor({
  blobA,
  blobB,
  blobC,
}: {
  blobA: string
  blobB: string
  blobC: string
}) {
  return (
    <>
      <div
        className={cn(
          "absolute -left-6 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full blur-2xl",
          blobA,
        )}
      />
      <div className={cn("absolute -right-4 -top-6 h-20 w-28 rounded-full blur-2xl", blobB)} />
      <div className={cn("absolute bottom-0 right-1/3 h-16 w-20 rounded-full blur-xl", blobC)} />
    </>
  )
}

const GLASS_PANEL_CLASS =
  "border border-white/50 bg-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-md"

function CourseCardAccentIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={cn("text-foreground/80 drop-shadow-sm", className)}
      aria-hidden
    >
      <path d="M0 0h24v24H0z" fill="none" />
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 8c0-2.828 0-4.243.879-5.121C5.757 2 7.172 2 10 2h4c2.828 0 4.243 0 5.121.879C20 3.757 20 5.172 20 8v8c0 2.828 0 4.243-.879 5.121C18.243 22 16.828 22 14 22h-4c-2.828 0-4.243 0-5.121-.879C4 20.243 4 18.828 4 16z" />
        <path d="M19.898 16h-12c-.93 0-1.395 0-1.777.102A3 3 0 0 0 4 18.224" />
        <path strokeLinecap="round" d="M8 7h8m-8 3.5h5" />
      </g>
    </svg>
  )
}

function ThemeAccentPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-2xl",
        compact ? "h-12 w-12" : "h-16 w-16",
        GLASS_PANEL_CLASS,
      )}
    >
      <CourseCardAccentIcon className={compact ? "h-7 w-7" : "h-9 w-9"} />
    </div>
  )
}

function ThemeBackground({ theme, compact = false }: { theme: CourseCardTheme; compact?: boolean }) {
  const option = getCourseCardThemeOption(theme)
  return (
    <div className="absolute inset-0" style={{ backgroundColor: option.background }}>
      <BlobDecor blobA={option.blobA} blobB={option.blobB} blobC={option.blobC} />
      <ThemeAccentPanel compact={compact} />
    </div>
  )
}

function ImageBackground({ image }: { image: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetUrl(image)}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[3px]"
      />
      <div className="absolute inset-0 bg-black/50" />
    </>
  )
}

export function CourseCardHero({
  image,
  cardTheme,
  className,
  children,
  compact = false,
}: CourseCardHeroProps) {
  const theme = normalizeCourseCardTheme(cardTheme)
  const hasImage = Boolean(image)

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-border/40",
        compact ? "h-20" : "h-28",
        className,
      )}
    >
      {hasImage ? <ImageBackground image={image!} /> : <ThemeBackground theme={theme} compact={compact} />}
      {!hasImage ? (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/[0.04]" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-t from-card/70 via-card/10 to-transparent" />
      )}
      {children ? (
        <div className={cn("relative z-10 h-full", compact ? "pl-[4.25rem]" : "pl-[5.25rem]")}>
          {children}
        </div>
      ) : null}
    </div>
  )
}

export function CourseCardThemeSwatch({
  theme,
  selected,
  onClick,
  className,
}: {
  theme: CourseCardTheme
  selected?: boolean
  onClick?: () => void
  className?: string
}) {
  const option = getCourseCardThemeOption(theme)
  const Tag = onClick ? "button" : "div"

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative h-16 overflow-hidden rounded-2xl border-2 transition-all",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-border",
        onClick && "cursor-pointer",
        className,
      )}
      aria-pressed={onClick ? selected : undefined}
      aria-label={onClick ? `${option.label} theme` : undefined}
    >
      <div className="absolute inset-0" style={{ backgroundColor: option.background }}>
        <BlobDecor blobA={option.blobA} blobB={option.blobB} blobC={option.blobC} />
        <div
          className={cn(
            "absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl",
            GLASS_PANEL_CLASS,
          )}
        >
          <CourseCardAccentIcon className="h-5 w-5" />
        </div>
      </div>
      <span
        className={cn(
          "absolute bottom-1.5 left-2 text-[10px] font-semibold drop-shadow-sm",
          option.labelClass,
        )}
      >
        {option.label}
      </span>
    </Tag>
  )
}
