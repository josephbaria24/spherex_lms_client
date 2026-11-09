"use client"

import { PageLoader } from "@/components/ui/spinner"
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { CourseCategoryFields } from "@/components/admin/courses/course-category-fields"
import { CourseDurationFields } from "@/components/admin/courses/course-duration-fields"
import { CoursePriceFields } from "@/components/admin/courses/course-price-fields"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { formatCoursePrice } from "@/lib/course-pricing"
import { type CourseCardTheme, DEFAULT_COURSE_CARD_THEME } from "@/lib/course-card-themes"
import { BookOpen, Copy, KeyRound, ListOrdered, MoreVertical, Pencil, Search, Tag, Trash2, Users } from "lucide-react"
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
  enroll_code_max_uses?: number | null
  enroll_code_uses?: number
  enroll_code_expires_at?: string | null
}

type AccessCodeDetails = {
  title: string
  code: string
  uses: number
  maxUses: number | null
  expiresAt: string | null
}

function defaultExpiresLocalValue(daysFromNow = 30) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setSeconds(0, 0)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function formatAccessExpiry(value: string | null | undefined) {
  if (!value) return "No expiration"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No expiration"
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatAccessUses(uses: number, maxUses: number | null | undefined) {
  if (maxUses == null) return `${uses} used · Unlimited`
  return `${uses} / ${maxUses} uses`
}

export default function AdminCoursesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchReady, setSearchReady] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState("all")
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [accessCode, setAccessCode] = useState<AccessCodeDetails | null>(null)
  const [codeSetup, setCodeSetup] = useState<{ id: string; title: string } | null>(null)
  const [codeMaxUses, setCodeMaxUses] = useState("25")
  const [codeExpiresAt, setCodeExpiresAt] = useState(defaultExpiresLocalValue())
  const [generatingCodeId, setGeneratingCodeId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    organization_id: "",
    require_sequential_lessons: false,
    card_theme: DEFAULT_COURSE_CARD_THEME as CourseCardTheme,
    image: null as string | null,
    price_cents: 0,
    enroll_code: "" as string,
  })
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
        category: editForm.category.trim() || undefined,
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

  function toDatetimeLocalValue(value: string | null | undefined, fallbackDays = 30) {
    if (!value) return defaultExpiresLocalValue(fallbackDays)
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return defaultExpiresLocalValue(fallbackDays)
    const offset = date.getTimezoneOffset()
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
  }

  function openAccessCodeSetup(course: Course) {
    setCodeSetup({ id: course.id, title: course.title })
    setCodeMaxUses(
      course.enroll_code_max_uses != null ? String(course.enroll_code_max_uses) : "25",
    )
    setCodeExpiresAt(toDatetimeLocalValue(course.enroll_code_expires_at))
  }

  async function confirmGenerateAccessCode() {
    if (!codeSetup) return
    const parsedMax = codeMaxUses.trim() === "" ? null : Number(codeMaxUses)
    if (parsedMax != null && (!Number.isInteger(parsedMax) || parsedMax < 1)) {
      toast.error("Max uses must be a whole number of at least 1, or leave blank for unlimited")
      return
    }
    setGeneratingCodeId(codeSetup.id)
    try {
      const res = await apiPost<{
        enroll_code: string
        enroll_code_max_uses: number | null
        enroll_code_uses: number
        enroll_code_expires_at: string | null
      }>(`/courses/${codeSetup.id}/regenerate-enroll-code`, {
        max_uses: parsedMax,
        expires_at: codeExpiresAt.trim() ? new Date(codeExpiresAt).toISOString() : null,
      })
      setAccessCode({
        title: codeSetup.title,
        code: res.enroll_code,
        uses: res.enroll_code_uses ?? 0,
        maxUses: res.enroll_code_max_uses ?? null,
        expiresAt: res.enroll_code_expires_at ?? null,
      })
      setEditForm((f) => ({ ...f, enroll_code: res.enroll_code }))
      setEditCourse((current) =>
        current && current.id === codeSetup.id
          ? {
              ...current,
              enroll_code: res.enroll_code,
              enroll_code_max_uses: res.enroll_code_max_uses ?? null,
              enroll_code_uses: res.enroll_code_uses ?? 0,
              enroll_code_expires_at: res.enroll_code_expires_at ?? null,
            }
          : current,
      )
      setCodeSetup(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate an access code")
    } finally {
      setGeneratingCodeId(null)
    }
  }

  async function copyAccessCode() {
    if (!accessCode) return
    try {
      await navigator.clipboard.writeText(accessCode.code)
      toast.success("Access code copied")
    } catch {
      toast.error("Could not copy the access code")
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

        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-[#fbfbfb] p-3 md:flex-row md:items-end dark:border-border dark:bg-muted/20">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              name="course-search"
              type="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              readOnly={!searchReady}
              placeholder="Search courses or organizations…"
              className="h-11 rounded-xl border-neutral-200 bg-white pl-10 shadow-none focus-visible:ring-[#FF4B1A]/25 dark:border-border dark:bg-background"
              value={searchQuery}
              onFocus={() => setSearchReady(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                Organization
              </Label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="h-11 w-[200px] rounded-xl border-neutral-200 bg-white dark:border-border dark:bg-background">
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
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Category
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 w-[160px] rounded-xl border-neutral-200 bg-white dark:border-border dark:bg-background">
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
          <PageLoader label="Loading courses…" className="min-h-[20vh] py-6" />
        ) : filteredCourses.length === 0 ? (
          <Card className="rounded-[1.5rem] border border-dashed border-neutral-200 shadow-none dark:border-border">
            <CardContent className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFE8E0] text-[#FF4B1A]">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="mt-4 font-semibold text-neutral-950 dark:text-foreground">No courses found</p>
              <p className="mt-1 text-sm text-neutral-500">
                {courses.length === 0
                  ? "Create a course and assign it to an organization."
                  : "Try adjusting your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-[#FFD8C8] hover:shadow-[0_22px_50px_-24px_rgba(255,75,26,0.35)] dark:border-border dark:bg-card"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#FFF4EF]">
                  {course.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={assetUrl(course.image)}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0">
                      <CourseCardHero cardTheme={course.card_theme} />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {course.organization_name ? (
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-neutral-700 shadow-sm">
                        {course.organization_name}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 shadow-sm">
                        Unassigned
                      </span>
                    )}
                    {course.level ? (
                      <span className="rounded-full bg-neutral-950/80 px-2.5 py-1 text-[10px] font-semibold capitalize text-white shadow-sm">
                        {course.level}
                      </span>
                    ) : null}
                  </div>
                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/95 text-neutral-700 shadow-sm hover:bg-white hover:text-neutral-950"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditCourse(course)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAccessCodeSetup(course)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Generate access code
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
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-neutral-950 dark:text-foreground">
                      {course.title}
                    </h3>
                    <span className="shrink-0 text-sm font-bold text-[#FF4B1A]">
                      {formatCoursePrice(course.price_cents ?? 0)}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 min-h-10 whitespace-pre-line text-sm leading-6 text-neutral-500">
                    {course.description || "\u00A0"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-[#FF4B1A]" />
                      {course.enrolled_count ?? 0} enrolled
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ListOrdered className="h-3.5 w-3.5 text-[#FF4B1A]" />
                      {course.lesson_count ?? course.lessons ?? 0} lessons
                    </span>
                    {course.category ? (
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-[#FF4B1A]" />
                        {course.category}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-5">
                    <Button
                      asChild
                      size="sm"
                      className="h-10 w-full rounded-xl bg-[#FF4B1A] font-semibold text-white hover:bg-[#e84314]"
                    >
                      <Link href={`/admin/courses/${course.id}/certificate`}>Manage certificate</Link>
                    </Button>
                    {course.organization_id ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-10 w-full rounded-xl border-neutral-200 font-semibold hover:border-[#FFD8C8] hover:bg-[#FFF8F5] hover:text-[#FF4B1A]"
                      >
                        <Link href={`/admin/courses/${course.id}/lessons`}>Manage lessons</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editCourse} onOpenChange={() => setEditCourse(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="min-h-0 space-y-4">
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
              <Textarea
                id="edit-description"
                rows={8}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.stopPropagation()
                }}
                className="block min-h-40 max-h-[min(24rem,50vh)] resize-y overflow-y-auto whitespace-pre-wrap leading-relaxed [field-sizing:fixed]"
              />
            </div>
            <CourseCategoryFields
              idPrefix="edit"
              value={editForm.category}
              onChange={(category) => setEditForm((f) => ({ ...f, category }))}
            />
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
                  disabled={!editCourse}
                  onClick={() => {
                    if (!editCourse) return
                    openAccessCodeSetup(editCourse)
                  }}
                >
                  Generate
                </Button>
              </div>
              {editCourse?.enroll_code ? (
                <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <p>
                    Uses:{" "}
                    <span className="font-medium text-foreground">
                      {formatAccessUses(
                        editCourse.enroll_code_uses ?? 0,
                        editCourse.enroll_code_max_uses ?? null,
                      )}
                    </span>
                  </p>
                  <p>
                    Expires:{" "}
                    <span className="font-medium text-foreground">
                      {formatAccessExpiry(editCourse.enroll_code_expires_at)}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Generate a code to set use limits and an expiration date.
                </p>
              )}
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

      <Dialog
        open={!!codeSetup}
        onOpenChange={(open) => {
          if (!open) setCodeSetup(null)
        }}
      >
        <DialogContent className="max-w-md rounded-[1.5rem]">
          <DialogHeader>
            <DialogTitle>Generate access code</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Create a new code for {codeSetup?.title}. This replaces any existing course access code.
          </p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="access-code-max-uses">Max uses</Label>
              <Input
                id="access-code-max-uses"
                type="number"
                min={1}
                placeholder="Leave blank for unlimited"
                value={codeMaxUses}
                onChange={(e) => setCodeMaxUses(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                How many learners can enroll with this code.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="access-code-expires">Expiration</Label>
              <Input
                id="access-code-expires"
                type="datetime-local"
                value={codeExpiresAt}
                onChange={(e) => setCodeExpiresAt(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full text-xs"
                  onClick={() => setCodeExpiresAt(defaultExpiresLocalValue(7))}
                >
                  7 days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full text-xs"
                  onClick={() => setCodeExpiresAt(defaultExpiresLocalValue(30))}
                >
                  30 days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full text-xs"
                  onClick={() => setCodeExpiresAt("")}
                >
                  No expiration
                </Button>
              </div>
            </div>
          </div>
          <Button
            type="button"
            className="w-full rounded-full"
            disabled={!!generatingCodeId}
            onClick={() => void confirmGenerateAccessCode()}
          >
            {generatingCodeId ? "Generating…" : "Generate code"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!accessCode} onOpenChange={(open) => !open && setAccessCode(null)}>
        <DialogContent className="max-w-sm rounded-[1.5rem]">
          <DialogHeader>
            <DialogTitle>Access code</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Share this code for {accessCode?.title}. Learners enter it to enroll.
          </p>
          <p className="rounded-xl bg-muted px-3 py-3 text-center font-mono text-lg font-semibold tracking-wide">
            {accessCode?.code}
          </p>
          <div className="grid gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Uses</span>
              <span className="font-medium">
                {accessCode
                  ? formatAccessUses(accessCode.uses, accessCode.maxUses)
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Expires</span>
              <span className="text-right font-medium">
                {formatAccessExpiry(accessCode?.expiresAt)}
              </span>
            </div>
          </div>
          <Button type="button" className="w-full rounded-full" onClick={() => void copyAccessCode()}>
            <Copy className="mr-2 h-4 w-4" />
            Copy code
          </Button>
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
            <div className="pointer-events-none absolute h-0 overflow-hidden opacity-0" aria-hidden>
              <input tabIndex={-1} type="text" name="username" autoComplete="username" defaultValue="" />
            </div>
            <Label htmlFor="delete-course-password">Your password</Label>
            <Input
              id="delete-course-password"
              name="confirm-delete-password"
              type="password"
              autoComplete="off"
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
