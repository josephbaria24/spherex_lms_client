"use client"

import { TeacherOrgGate } from "@/components/teacher/teacher-org-gate"
import { TeacherOrgProvider } from "@/components/teacher/teacher-org-provider"

export function TeacherLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <TeacherOrgGate>
      <TeacherOrgProvider>{children}</TeacherOrgProvider>
    </TeacherOrgGate>
  )
}
