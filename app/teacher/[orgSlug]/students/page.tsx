"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TeacherOrgSelector } from "@/components/teacher/teacher-org-selector"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { apiGet } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react"

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

type StatusFilter = "all" | "completed" | "in_progress"
type SortKey = "name" | "progress" | "enrolled"

const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]"

export default function TeacherStudentsPage() {
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [filterCourse, setFilterCourse] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
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

  const counts = useMemo(() => {
    const completed = students.filter((s) => s.completed).length
    return {
      all: students.length,
      completed,
      in_progress: students.length - completed,
      courses: new Set(students.map((s) => s.course_id)).size,
      avgProgress:
        students.length === 0
          ? 0
          : Math.round(
              students.reduce((sum, s) => sum + (s.progress_percent ?? 0), 0) /
                students.length,
            ),
    }
  }, [students])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    let list = students.filter((s) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" ? s.completed : !s.completed)
      const name = (s.full_name || s.name || s.email).toLowerCase()
      const matchesSearch =
        !q ||
        name.includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.course_title.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })

    list = [...list].sort((a, b) => {
      const nameA = a.full_name || a.name || a.email
      const nameB = b.full_name || b.name || b.email
      let cmp = 0
      if (sortKey === "name") cmp = nameA.localeCompare(nameB)
      else if (sortKey === "progress") cmp = a.progress_percent - b.progress_percent
      else cmp = new Date(a.enrolled_at).getTime() - new Date(b.enrolled_at).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [students, searchTerm, statusFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "progress" || key === "enrolled" ? "desc" : "asc")
    }
  }

  const statusTabs: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "in_progress", label: "In progress" },
    { id: "completed", label: "Completed" },
  ]

  return (
    <GrowMainLayout>
      <div className="-m-4 min-h-full w-full bg-[#f8fafc] font-[family-name:var(--font-outfit)] md:-m-6">
        <div className="w-full space-y-6 px-4 py-7 md:px-5 md:py-8 lg:px-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
                Teaching workspace
              </p>
              <h1 className="mt-1.5 text-[1.85rem] font-bold tracking-tight text-[#0f172a] md:text-[2rem]">
                Students
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                View enrolled learners and their progress across your courses.
              </p>
            </div>
            <TeacherOrgSelector />
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Users} value={counts.all} label="Enrolled" hint="Active enrollments" />
            <MetricCard
              icon={CircleDashed}
              value={counts.in_progress}
              label="In progress"
              hint="Still learning"
            />
            <MetricCard
              icon={CheckCircle2}
              value={counts.completed}
              label="Completed"
              hint="Finished coursework"
            />
            <MetricCard
              icon={BookOpen}
              value={`${counts.avgProgress}%`}
              label="Avg. progress"
              hint={`${counts.courses} course${counts.courses === 1 ? "" : "s"}`}
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f4] px-4 py-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={cn(
                      "text-sm transition-colors",
                      statusFilter === tab.id
                        ? "font-semibold text-[#0f172a]"
                        : "font-medium text-[#94a3b8] hover:text-[#64748b]",
                    )}
                  >
                    {tab.label}
                    <span className="ml-1 tabular-nums">
                      {tab.id === "all"
                        ? counts.all
                        : tab.id === "completed"
                          ? counts.completed
                          : counts.in_progress}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white shadow-none sm:w-[200px]">
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
                <div className="relative min-w-[180px] flex-1 sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                  <Input
                    placeholder="Search students"
                    className="h-9 w-full rounded-lg border-[#e2e8f0] bg-white pl-9 text-sm shadow-none placeholder:text-[#94a3b8] sm:w-[220px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-[#f1f5f9]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4">
                    <div className="h-5 w-5 animate-pulse rounded bg-[#f1f5f9]" />
                    <div className="h-4 w-56 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <Users className="h-8 w-8 text-[#cbd5e1]" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium text-[#0f172a]">
                  {students.length === 0 ? "No students enrolled" : "No students match your filters"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-[#94a3b8]">
                  {students.length === 0
                    ? "Students will appear here once they enroll in your courses."
                    : "Try another status, course, or search term."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef0f4] bg-[#fafbfc]">
                      <th className={thClass}>
                        <SortHeader
                          label="Student"
                          active={sortKey === "name"}
                          dir={sortDir}
                          onClick={() => toggleSort("name")}
                        />
                      </th>
                      <th className={thClass}>Course</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>
                        <SortHeader
                          label="Progress"
                          active={sortKey === "progress"}
                          dir={sortDir}
                          onClick={() => toggleSort("progress")}
                        />
                      </th>
                      <th className={thClass}>
                        <SortHeader
                          label="Enrolled"
                          active={sortKey === "enrolled"}
                          dir={sortDir}
                          onClick={() => toggleSort("enrolled")}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filtered.map((s) => {
                      const displayName = s.full_name || s.name || s.email
                      return (
                        <tr key={s.enrollment_id} className="transition-colors hover:bg-[#fafbfc]">
                          <td className="py-3.5 pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#0f172a]">
                                  {displayName}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-[#94a3b8]">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">{s.course_title}</td>
                          <td className="px-4 py-3.5">
                            <StatusPill completed={s.completed} />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex min-w-[140px] items-center gap-3">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f1f5f9]">
                                <div
                                  className="h-full rounded-full bg-[#0f172a]"
                                  style={{ width: `${Math.min(100, s.progress_percent)}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-sm tabular-nums text-[#64748b]">
                                {s.progress_percent}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-[#64748b]">
                            {formatDate(s.enrolled_at)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="border-t border-[#eef0f4] px-4 py-3">
                <p className="text-xs text-[#94a3b8]">
                  {filtered.length} student{filtered.length === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </GrowMainLayout>
  )
}

function MetricCard({
  icon: Icon,
  value,
  label,
  hint,
}: {
  icon: LucideIcon
  value: number | string
  label: string
  hint: string
}) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold tabular-nums text-[#0f172a]">{value}</p>
          <p className="mt-0.5 text-sm font-medium text-[#334155]">{label}</p>
          <p className="mt-1 text-xs text-[#94a3b8]">{hint}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-[#64748b]" strokeWidth={1.5} />
      </div>
    </div>
  )
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-[#64748b]",
        active && "text-[#64748b]",
      )}
    >
      {label}
      {active && <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  )
}

function StatusPill({ completed }: { completed: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
        completed ? "bg-emerald-50 text-emerald-700" : "bg-[#f1f5f9] text-[#64748b]",
      )}
    >
      {completed ? "Completed" : "In progress"}
    </span>
  )
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return "—"
  }
}
