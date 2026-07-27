import { requireTeacherUser } from "@/lib/server-api"
import { TeacherLayoutClient } from "@/components/teacher/teacher-layout-client"

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireTeacherUser()
  return <TeacherLayoutClient>{children}</TeacherLayoutClient>
}
