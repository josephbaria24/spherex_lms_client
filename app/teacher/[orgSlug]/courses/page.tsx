"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookOpen, Plus, Users, ListOrdered } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api"
import { TeacherPageHeader } from "@/components/teacher/teacher-page-header"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { teacherApiPath } from "@/lib/teacher-api"

type Course = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  duration?: string | null
  student_count?: number
  lesson_count?: number
}

export default function TeacherCoursesPage() {
  const router = useRouter()
  const { selectedOrgId, selectedOrgSlug, loadingOrgs } = useTeacherOrg()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    duration: "",
  })

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setCourses([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<{ courses: Course[] }>(teacherApiPath(selectedOrgId, "/courses"))
      setCourses(data.courses ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrgId) return
    setSubmitting(true)
    try {
      await apiPost(teacherApiPath(selectedOrgId, "/courses"), {
        title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        level: form.level,
        duration: form.duration || undefined,
      })
      setOpen(false)
      setForm({ title: "", description: "", category: "", level: "beginner", duration: "" })
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <TeacherPageHeader icon={BookOpen} title="My courses" accent="shape minds" description="Courses you instruct — create new courses and manage content">
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Course
          </Button>
        </TeacherPageHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading courses…</p>
        ) : courses.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No courses assigned yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first course to start building lessons.</p>
              <Button className="mt-4" onClick={() => setOpen(true)}>
                Create Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="premium-card border border-border shadow-none cursor-pointer"
                onClick={() => {
                  if (selectedOrgSlug) {
                    router.push(`/teacher/${selectedOrgSlug}/courses/${course.id}`)
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{course.title}</h3>
                    {course.level && <Badge variant="secondary">{course.level}</Badge>}
                  </div>
                  {course.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.student_count ?? 0} students
                    </span>
                    <span className="flex items-center gap-1">
                      <ListOrdered className="h-3.5 w-3.5" />
                      {course.lesson_count ?? 0} lessons
                    </span>
                  </div>
                  {course.category && (
                    <Badge variant="outline" className="mt-3">
                      {course.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Course</DialogTitle>
            <DialogDescription>Add a new course to your teaching portfolio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, level: v as typeof form.level }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g. 8 hours"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating…" : "Create Course"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </GrowMainLayout>
  )
}
