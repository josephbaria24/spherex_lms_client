import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { GrowHeader } from "@/components/grow-shell/grow-header"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  /** Accent phrase — coral serif in grow mode; teal kicker in ops mode */
  accent?: string
  showDate?: boolean
  className?: string
  children?: React.ReactNode
  variant?: "grow" | "ops"
}

export function PageHeader({
  title,
  description,
  icon,
  accent,
  showDate = false,
  className,
  children,
  variant = "grow",
}: PageHeaderProps) {
  if (accent || icon || variant === "ops") {
    return (
      <GrowHeader
        title={title}
        accent={accent}
        description={description}
        icon={icon}
        showDate={showDate}
        className={className}
        variant={variant}
      >
        {children}
      </GrowHeader>
    )
  }

  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="setup-type-page-title">{title}</h1>
        {description && <p className="setup-type-page-desc mt-1">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}
