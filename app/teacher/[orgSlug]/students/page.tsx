"use client"

import { useCallback, useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users } from "lucide-react"
import { apiGet } from "@/lib/api"
import { TeacherPageHeader } from "@/components/teacher/teacher-page-header"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { teacherApiPath } from "@/lib/teacher-api"

type Course = { id: string; title: string }
type StudentRow = {
  enrollment_id: string
  user_id: string
  email: string
  full_name: string | null
  name: string | null
  course_id: string
  course_title: string
  progress_percent: number
  completed: boolean
  enrolled_at: string
}

export default function TeacherStudentsPage() {
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [filterCourse, setFilterCourse] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setCourses([])
      setStudents([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const studentsPath =
        filterCourse !== "all"
          ? teacherApiPath(selectedOrgId, `/students?course_id=${filterCourse}`)
          : teacherApiPath(selectedOrgId, "/students")
      const [coursesRes, studentsRes] = await Promise.all([
        apiGet<{ courses: Course[] }>(teacherApiPath(selectedOrgId, "/courses")),
        apiGet<{ students: StudentRow[] }>(studentsPath),
      ])
      setCourses(coursesRes.courses ?? [])
      setStudents(studentsRes.students ?? [])
    } finally {
      setLoading(false)
    }
  }, [filterCourse, selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={Users}
          title="Students"
          accent="guide progress"
          description="View enrolled learners and their progress across your courses"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Label className="text-sm text-muted-foreground">Filter by course</Label>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading students…</p>
        ) : students.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No students enrolled</p>
              <p className="mt-1 text-sm text-muted-foreground">Students will appear here once they enroll in your courses.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {students.map((s) => (
              <Card key={s.enrollment_id} className="premium-card border border-border shadow-none">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{s.full_name || s.name || s.email}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{s.course_title}</p>
                    </div>
                    <Badge variant={s.completed ? "default" : "secondary"}>
                      {s.completed ? "Completed" : "In progress"}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{s.progress_percent}%</span>
                    </div>
                    <Progress value={s.progress_percent} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </GrowMainLayout>
  )
}
