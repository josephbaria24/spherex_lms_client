import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { APP_LOGO, APP_NAME } from "@/lib/constants"

type SphereXLogoProps = {
  className?: string
  imageClassName?: string
  priority?: boolean
  alt?: string
  /** Kept for call-site compatibility. The mark is the same on every surface. */
  onPrimary?: boolean
  /** Kept for call-site compatibility. The mark is the same on every surface. */
  light?: boolean
  /** Kept for call-site compatibility. The mark is the same on every surface. */
  ink?: boolean
}

/** PetroCademia icon mark (no word) used across landing, auth, and app shells. */
export function SphereXLogo({
  className = "h-9 w-auto",
  imageClassName,
  priority = false,
  alt = APP_NAME,
}: SphereXLogoProps) {
  return (
    <span className="inline-flex shrink-0 items-center">
      <Image
        src={APP_LOGO}
        alt={alt}
        width={72}
        height={78}
        className={cn("object-contain", className, imageClassName)}
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

export function Logo({ className = "", showText = true, href = "/", logoClassName }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <SphereXLogo className={logoClassName ?? "h-9 w-auto"} priority />
      {showText && (
        <span className="text-lg font-semibold tracking-[-0.03em] text-foreground">{APP_NAME}</span>
      )}
    </Link>
  )
}
