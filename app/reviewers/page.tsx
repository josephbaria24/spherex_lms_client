"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  BookOpenCheck,
  ClipboardList,
  Download,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { ReviewerGroupCard } from "@/components/reviewers/reviewer-group-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  downloadPublicReviewer,
  fetchPublicReviewerGroups,
  fetchPublicReviewers,
  type PublicReviewerGroup,
  type PublicReviewerMaterial,
} from "@/lib/public-reviewers"

const EXAM_FILTERS = [
  { value: "all", label: "All" },
  { value: "CSE", label: "CSE" },
  { value: "NLE", label: "NLE" },
  { value: "LET", label: "LET" },
  { value: "Other", label: "Other" },
] as const

const VALID_EXAMS = new Set(["CSE", "NLE", "LET", "Other"])

function ReviewersPageContent() {
  const searchParams = useSearchParams()
  const examFromUrl = searchParams.get("exam")
  const tabFromUrl = searchParams.get("tab")
  const router = useRouter()

  useEffect(() => {
    if (examFromUrl?.toUpperCase() === "IELTS") {
      router.replace("/ielts")
    }
  }, [examFromUrl, router])

  const initialExam =
    examFromUrl && VALID_EXAMS.has(examFromUrl.toUpperCase())
      ? examFromUrl.toUpperCase()
      : "all"
  const initialMode = tabFromUrl === "materials" ? "materials" : "quizzes"

  const [mode, setMode] = useState<"quizzes" | "materials">(initialMode)
  const [materials, setMaterials] = useState<PublicReviewerMaterial[]>([])
  const [groups, setGroups] = useState<PublicReviewerGroup[]>([])
  const [query, setQuery] = useState("")
  const [examTab, setExamTab] = useState(initialExam)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  useEffect(() => {
    if (examFromUrl && VALID_EXAMS.has(examFromUrl.toUpperCase())) {
      setExamTab(examFromUrl.toUpperCase())
    }
  }, [examFromUrl])

  useEffect(() => {
    if (tabFromUrl === "materials" || tabFromUrl === "quizzes") {
      setMode(tabFromUrl)
    }
  }, [tabFromUrl])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchPublicReviewers(), fetchPublicReviewerGroups()])
      .then(([materialsData, groupsData]) => {
        if (cancelled) return
        setMaterials(materialsData.materials ?? [])
        setGroups(groupsData.groups ?? [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load reviewers")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredMaterials = useMemo(() => {
    const q = query.trim().toLowerCase()
    return materials.filter((m) => {
      if (m.exam_type === "IELTS") return false
      if (examTab !== "all" && m.exam_type !== examTab) return false
      if (!q) return true
      return (
        m.title.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q) ||
        (m.category ?? "").toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [materials, query, examTab])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups
      .filter((group) => {
        if (group.exam_type === "IELTS") return false
        if (examTab !== "all" && group.exam_type !== examTab) return false
        if (!q) return true
        const inGroup =
          group.title.toLowerCase().includes(q) ||
          (group.description ?? "").toLowerCase().includes(q) ||
          group.subject.toLowerCase().includes(q)
        if (inGroup) return true
        return group.quizzes.some(
          (quiz) =>
            quiz.title.toLowerCase().includes(q) ||
            (quiz.category ?? "").toLowerCase().includes(q),
        )
      })
      .map((group) => {
        if (!q) return group
        const inGroup =
          group.title.toLowerCase().includes(q) ||
          (group.description ?? "").toLowerCase().includes(q) ||
          group.subject.toLowerCase().includes(q)
        if (inGroup) return group
        return {
          ...group,
          quizzes: group.quizzes.filter(
            (quiz) =>
              quiz.title.toLowerCase().includes(q) ||
              (quiz.category ?? "").toLowerCase().includes(q),
          ),
        }
      })
      .filter((group) => group.quizzes.length > 0 || !q)
  }, [groups, query, examTab])

  const quizPartCount = useMemo(
    () =>
      filteredGroups.reduce((sum, g) => sum + (g.quizzes?.length ?? 0), 0),
    [filteredGroups],
  )

  const handleOpenMaterial = async (material: PublicReviewerMaterial) => {
    setOpeningId(material.id)
    try {
      if (material.external_url && !material.file_url) {
        window.open(material.external_url, "_blank", "noopener,noreferrer")
        return
      }
      const { url } = await downloadPublicReviewer(material.id)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      console.error(err)
      alert("Could not open this material. Please try again.")
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <>
      <section className="bg-gradient-to-br from-slate-50 via-orange-50/40 to-indigo-50/50 pb-12 pt-8 dark:from-background dark:via-orange-950/20 dark:to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Exam Reviewers
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              Practice by subject, one card at a time
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Each subject keeps all its parts together — English, Math, Filipino, and more —
              with its own color so you can find what you need quickly. Looking for IELTS?{" "}
              <a href="/ielts" className="font-semibold text-teal-700 underline-offset-2 hover:underline dark:text-teal-400">
                Go to IELTS prep
              </a>
              .
            </p>
          </div>

          <div className="relative mx-auto mt-10 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search subjects or parts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-full pl-9"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={mode === "quizzes" ? "default" : "outline"}
            className={
              mode === "quizzes"
                ? "rounded-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                : "rounded-full dark:border-border dark:bg-transparent dark:hover:bg-muted"
            }
            onClick={() => setMode("quizzes")}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Practice subjects ({filteredGroups.length})
          </Button>
          <Button
            variant={mode === "materials" ? "default" : "outline"}
            className={
              mode === "materials"
                ? "rounded-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                : "rounded-full dark:border-border dark:bg-transparent dark:hover:bg-muted"
            }
            onClick={() => setMode("materials")}
          >
            <Download className="mr-2 h-4 w-4" />
            Files & links ({filteredMaterials.length})
          </Button>
        </div>

        <Tabs value={examTab} onValueChange={setExamTab}>
          <TabsList className="mb-8 flex h-auto flex-wrap gap-1 bg-slate-100 p-1 dark:bg-muted">
            {EXAM_FILTERS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-full px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={examTab} className="mt-0">
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading reviewers…
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            ) : mode === "quizzes" ? (
              filteredGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-border dark:bg-muted/30">
                  <ClipboardList className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="font-medium text-slate-700 dark:text-slate-200">No subjects found</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Try another exam filter, or check Files & links.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {filteredGroups.length} subjects · {quizPartCount} practice parts
                  </p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {filteredGroups.map((group) => (
                      <ReviewerGroupCard key={group.id} group={group} />
                    ))}
                  </div>
                </div>
              )
            ) : filteredMaterials.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-border dark:bg-muted/30">
                <BookOpenCheck className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="font-medium text-slate-700 dark:text-slate-200">No materials found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Admins can upload PDFs and links from the Reviewers admin page.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMaterials.map((material) => {
                  const isLink = Boolean(material.external_url && !material.file_url)
                  const busy = openingId === material.id
                  return (
                    <article
                      key={material.id}
                      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-border dark:bg-card dark:hover:border-border dark:hover:shadow-black/40"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge className="bg-slate-800 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-white">
                          {material.exam_type}
                        </Badge>
                        {material.category ? (
                          <Badge variant="outline">{material.category}</Badge>
                        ) : null}
                        <Badge variant="secondary" className="text-xs">
                          {isLink ? "Online link" : "Download"}
                        </Badge>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{material.title}</h2>
                      {material.description ? (
                        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {material.description}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <Button
                        className="mt-5 w-full rounded-full bg-slate-800 hover:bg-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        disabled={busy}
                        onClick={() => handleOpenMaterial(material)}
                      >
                        {busy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isLink ? (
                          <ExternalLink className="mr-2 h-4 w-4" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {isLink ? "Open resource" : "Download"}
                      </Button>
                    </article>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </>
  )
}

export default function ReviewersPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-background dark:text-foreground">
      <LandingHeader />
      <main className="pb-16 pt-24">
        <Suspense
          fallback={
            <div className="flex min-h-[240px] items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading reviewers…
            </div>
          }
        >
          <ReviewersPageContent />
        </Suspense>
      </main>
    </div>
  )
}
