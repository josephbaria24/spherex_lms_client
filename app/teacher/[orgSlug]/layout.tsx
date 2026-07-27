import { TeacherOrgSlugGate } from "@/components/teacher/teacher-org-slug-gate"

export default function TeacherOrgSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TeacherOrgSlugGate>{children}</TeacherOrgSlugGate>
}
