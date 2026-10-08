import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { APP_NAME, SPHEREX_LOGO_DARK, SPHEREX_LOGO_LIGHT } from "@/lib/constants"

type SphereXLogoProps = {
  className?: string
  imageClassName?: string
  priority?: boolean
  alt?: string
  /** Swap marks so the logo stays visible on a primary-colored surface. */
  onPrimary?: boolean
  /** Always use the white mark. For bars that stay dark in both themes. */
  light?: boolean
}

/** Theme-aware SphereX mark — spx.png in light mode, spxwhite.png in dark mode. */
export function SphereXLogo({
  className = "h-8 w-auto",
  imageClassName,
  priority = false,
  alt = APP_NAME,
  onPrimary = false,
  light = false,
}: SphereXLogoProps) {
  const lightSrc = light || onPrimary ? SPHEREX_LOGO_DARK : SPHEREX_LOGO_LIGHT
  const darkSrc = light ? SPHEREX_LOGO_DARK : onPrimary ? SPHEREX_LOGO_LIGHT : SPHEREX_LOGO_DARK

  return (
    <span className="inline-flex shrink-0 items-center">
      <Image
        src={lightSrc}
        alt={alt}
        width={96}
        height={32}
        className={cn("object-contain dark:hidden", className, imageClassName)}
        priority={priority}
      />
      <Image
        src={darkSrc}
        alt={alt}
        width={96}
        height={32}
        className={cn("hidden object-contain dark:block", className, imageClassName)}
        priority={priority}
      />
    </span>
  )
}

interface LogoProps {
  className?: string
  showText?: boolean
  href?: string
  logoClassName?: string
}

export function Logo({ className = "", showText = false, href = "/", logoClassName }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <SphereXLogo className={logoClassName ?? "h-7 w-auto"} priority />
      {showText && <span className="text-xl font-bold tracking-tight text-foreground">{APP_NAME}</span>}
    </Link>
  )
}
