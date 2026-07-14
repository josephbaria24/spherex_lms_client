"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateCourseModal } from "@/components/admin/courses/create-course-modal"
import { CourseCardAppearanceFields } from "@/components/admin/courses/course-card-appearance"
import { CourseCardHero } from "@/components/admin/courses/course-card-hero"
import { CourseDurationFields } from "@/components/admin/courses/course-duration-fields"
import { CoursePriceFields } from "@/components/admin/courses/course-price-fields"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import { formatCoursePrice } from "@/lib/course-pricing"
import { type CourseCardTheme, DEFAULT_COURSE_CARD_THEME } from "@/lib/course-card-themes"
import { BookOpen, ListOrdered, MoreVertical, Pencil, Search, Tag, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

type Organization = { id: string; name: string; slug: string }

type Course = {
  id: string
  title: string
  description?: string | null
  category?: string | null
  level?: string | null
  enrolled_count?: number
  duration?: string | null
  lessons?: number
  lesson_count?: number
  organization_id?: string | null
  organization_name?: string | null
  organization_slug?: string | null
  require_sequential_lessons?: boolean
  image?: string | null
  card_theme?: string | null
  price_cents?: number
  enroll_code?: string | null
}

export default function AdminCoursesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrg, setSelectedOrg] = useState("all")
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "" as "beginner" | "intermediate" | "advanced" | "",
    duration: "",
    organization_id: "",
    require_sequential_lessons: false,
    card_theme: DEFAULT_COURSE_CARD_THEME as CourseCardTheme,
    image: null as string | null,
    price_cents: 0,
    enroll_code: "" as string,
  })
  const [regeneratingCode, setRegeneratingCode] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [orgsRes, coursesRes] = await Promise.all([
        apiGet<{ organizations: Organization[] }>("/admin/organizations"),
        apiGet<{ courses: Course[] }>("/courses"),
      ])
      setOrganizations(orgsRes.organizations ?? [])
      setCourses(coursesRes.courses ?? [])
    } catch {
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const categories = useMemo(() => {
    const set = new Set(courses.map((c) => c.category).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [courses])

  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredCourses = courses.filter((course) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      course.title.toLowerCase().includes(q) ||
      course.description?.toLowerCase().includes(q) ||
      course.organization_name?.toLowerCase().includes(q)
    const matchesOrg =
      selectedOrg === "all" ||
      (selectedOrg === "unassigned" ? !course.organization_id : course.organization_id === selectedOrg)
    const matchesCategory =
      selectedCategory === "all" || course.category === selectedCategory
    return matchesSearch && matchesOrg && matchesCategory
  })

  const defaultOrgId = selectedOrg !== "all" && selectedOrg !== "unassigned" ? selectedOrg : undefined

  useEffect(() => {
    if (editCourse) {
      setEditForm({
        title: editCourse.title || "",
        description: editCourse.description || "",
        category: editCourse.category || "",
        level: (editCourse.level as typeof editForm.level) || "",
        duration: editCourse.duration || "",
        organization_id: editCourse.organization_id || "",
        require_sequential_lessons: editCourse.require_sequential_lessons ?? false,
        card_theme: (editCourse.card_theme as CourseCardTheme) || DEFAULT_COURSE_CARD_THEME,
        image: editCourse.image ?? null,
        price_cents: editCourse.price_cents ?? 0,
        enroll_code: editCourse.enroll_code ?? "",
      })
    }
  }, [editCourse])

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editCourse) return
    if (!editForm.organization_id) {
      toast.error("Select an organization")
      return
    }
    setEditLoading(true)
    try {
      await apiPatch(`/courses/${editCourse.id}`, {
        title: editForm.title,
        description: editForm.description || undefined,
        category: editForm.category || undefined,
        level: editForm.level || undefined,
        duration: editForm.duration || undefined,
        organization_id: editForm.organization_id,
        require_sequential_lessons: editForm.require_sequential_lessons,
        card_theme: editForm.card_theme,
        image: editForm.image || "",
        price_cents: editForm.price_cents,
        enroll_code: editForm.enroll_code.trim() || null,
      })
      toast.success("Course updated")
      setEditCourse(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update course")
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteCourseId || !deletePassword.trim()) return
    setDeleteLoading(true)
    try {
      await apiDelete(`/courses/${deleteCourseId}`, { password: deletePassword })
      toast.success("Course deleted")
      setDeleteCourseId(null)
      setDeletePassword("")
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete course")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={BookOpen}
          title="Manage courses"
          accent="shape learning"
          description="Create and organize courses per organization"
        >
          <CreateCourseModal onCreated={load} defaultOrganizationId={defaultOrgId} />
        </PageHeader>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses or organizations…"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Organization</Label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizations</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {categories.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading courses…</p>
        ) : filteredCourses.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No courses found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {courses.length === 0
                  ? "Create a course and assign it to an organization."
                  : "Try adjusting your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="premium-card flex h-full flex-col gap-0 overflow-hidden border border-border py-0 shadow-none"
              >
                <CourseCardHero image={course.image} cardTheme={course.card_theme} />
                <CardContent className="flex h-full flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {course.organization_name ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {course.organization_name}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-700">
                            Unassigned
                          </Badge>
                        )}
                        {course.level && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {course.level}
                          </Badge>
                        )}
                        <Badge
                          variant={(course.price_cents ?? 0) > 0 ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {formatCoursePrice(course.price_cents ?? 0)}
                        </Badge>
                      </div>
                      <h3 className="font-semibold leading-tight">{course.title}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditCourse(course)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteCourseId(course.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                    {course.description || "\u00A0"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.enrolled_count ?? 0} enrolled
                    </span>
                    <span className="flex items-center gap-1">
                      <ListOrdered className="h-3.5 w-3.5" />
                      {course.lesson_count ?? course.lessons ?? 0} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {formatCoursePrice(course.price_cents ?? 0)}
                    </span>
                  </div>

                  <div className="mt-3 min-h-[26px]">
                    {course.category ? (
                      <Badge variant="outline">{course.category}</Badge>
                    ) : null}
                  </div>

                  {course.organization_id ? (
                    <div className="mt-auto pt-4">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={`/admin/courses/${course.id}/lessons`}>Manage lessons</Link>
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editCourse} onOpenChange={() => setEditCourse(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select
                value={editForm.organization_id}
                onValueChange={(v) => setEditForm((f) => ({ ...f, organization_id: v }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                required
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={editForm.category}
                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={editForm.level}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, level: v as typeof editForm.level }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CourseDurationFields
              idPrefix="edit-duration"
              resetKey={editCourse?.id}
              value={editForm.duration}
              onChange={(duration) => setEditForm((f) => ({ ...f, duration }))}
            />
            <CoursePriceFields
              idPrefix="edit-course"
              resetKey={editCourse?.id}
              priceCents={editForm.price_cents}
              onPriceCentsChange={(price_cents) => setEditForm((f) => ({ ...f, price_cents }))}
            />
            <div className="space-y-2 rounded-lg border border-border p-3">
              <Label htmlFor="edit-enroll-code">Enrollment code</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-enroll-code"
                  className="font-mono uppercase"
                  placeholder="ENR-XXXXXXXX"
                  value={editForm.enroll_code}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, enroll_code: e.target.value.toUpperCase() }))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={regeneratingCode || !editCourse}
                  onClick={async () => {
                    if (!editCourse) return
                    setRegeneratingCode(true)
                    try {
                      const res = await apiPost<{ enroll_code: string }>(
                        `/courses/${editCourse.id}/regenerate-enroll-code`,
                      )
                      setEditForm((f) => ({ ...f, enroll_code: res.enroll_code }))
                      toast.success("Enrollment code generated")
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not generate code")
                    } finally {
                      setRegeneratingCode(false)
                    }
                  }}
                >
                  {regeneratingCode ? "…" : "Generate"}
                </Button>
              </div>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-1">
                <Label htmlFor="edit-sequential">Require lessons in order</Label>
                <p className="text-xs text-muted-foreground">
                  Learners must complete each lesson before the next unlocks.
                </p>
              </div>
              <Switch
                id="edit-sequential"
                checked={editForm.require_sequential_lessons}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, require_sequential_lessons: checked }))
                }
              />
            </div>

            <CourseCardAppearanceFields
              courseId={editCourse?.id}
              cardTheme={editForm.card_theme}
              image={editForm.image}
              previewTitle={editForm.title || "Course preview"}
              onCardThemeChange={(card_theme) => setEditForm((f) => ({ ...f, card_theme }))}
              onImageChange={(image) => setEditForm((f) => ({ ...f, image }))}
            />

            <Button type="submit" disabled={editLoading} className="w-full">
              {editLoading ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteCourseId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCourseId(null)
            setDeletePassword("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the course, its lessons, and enrollments. This cannot be undone. Enter
              your account password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-course-password">Your password</Label>
            <Input
              id="delete-course-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              disabled={deleteLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deletePassword.trim() || deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GrowMainLayout>
  )
}
