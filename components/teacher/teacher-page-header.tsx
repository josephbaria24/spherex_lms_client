"use client"

import type { LucideIcon } from "lucide-react"
import { GrowHeader } from "@/components/grow-shell"
import { TeacherOrgSelector } from "@/components/teacher/teacher-org-selector"

type TeacherPageHeaderProps = {
  icon: LucideIcon
  title: string
  accent?: string
  description?: string
  showDate?: boolean
  children?: React.ReactNode
}

export function TeacherPageHeader({
  icon,
  title,
  accent = "lead with purpose",
  description,
  showDate = true,
  children,
}: TeacherPageHeaderProps) {
  return (
    <GrowHeader
      icon={icon}
      title={title}
      accent={accent}
      description={description}
      showDate={showDate}
    >
      <TeacherOrgSelector />
      {children}
    </GrowHeader>
  )
}
