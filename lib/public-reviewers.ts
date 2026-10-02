import { apiGet, apiPost } from "@/lib/api"

export type ReviewerExamType = "CSE" | "NLE" | "LET" | "IELTS" | "Other"

export type PublicReviewerMaterial = {
  id: string
  title: string
  description: string | null
  exam_type: ReviewerExamType | string
  category: string | null
  tags: string[]
  file_url: string
  external_url: string | null
  created_at: string
  updated_at: string
}

export type PublicReviewerQuizSummary = {
  id: string
  title: string
  description: string | null
  exam_type: ReviewerExamType | string
  category: string | null
  passing_score: number
  question_count: number
  updated_at: string
  group_id?: string | null
  sort_order?: number
}

export type PublicReviewerGroup = {
  id: string
  title: string
  description: string | null
  exam_type: ReviewerExamType | string
  subject: string
  accent_color: string
  cover_url: string | null
  sort_order: number
  quiz_count: number
  question_count: number
  quizzes: PublicReviewerQuizSummary[]
}

export type PublicReviewerQuizDetail = {
  id: string
  title: string
  description: string | null
  exam_type: string
  category: string | null
  passing_score: number
  question_count: number
  passage_html?: string | null
  audio_url?: string | null
  time_limit_seconds?: number | null
  questions: {
    id: string
    sort_order: number
    prompt: string
    question_type: string
    options: { id: string; text: string }[]
  }[]
}

export async function fetchPublicReviewers(params?: {
  exam_type?: string
  search?: string
}) {
  const qs = new URLSearchParams()
  if (params?.exam_type) qs.set("exam_type", params.exam_type)
  if (params?.search) qs.set("search", params.search)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return apiGet<{ materials: PublicReviewerMaterial[] }>(`/reviewers/public${suffix}`)
}

export async function downloadPublicReviewer(id: string) {
  return apiPost<{ url: string; external: boolean }>(
    `/reviewers/public/${encodeURIComponent(id)}/download`,
  )
}

export async function fetchPublicReviewerQuizzes(params?: {
  exam_type?: string
  search?: string
}) {
  const qs = new URLSearchParams()
  if (params?.exam_type) qs.set("exam_type", params.exam_type)
  if (params?.search) qs.set("search", params.search)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return apiGet<{ quizzes: PublicReviewerQuizSummary[] }>(
    `/reviewers/public/quizzes${suffix}`,
  )
}

export async function fetchPublicReviewerGroups(params?: {
  exam_type?: string
  search?: string
}) {
  const qs = new URLSearchParams()
  if (params?.exam_type) qs.set("exam_type", params.exam_type)
  if (params?.search) qs.set("search", params.search)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return apiGet<{ groups: PublicReviewerGroup[] }>(`/reviewers/public/groups${suffix}`)
}

export async function fetchPublicReviewerGroup(id: string) {
  return apiGet<{ group: PublicReviewerGroup }>(
    `/reviewers/public/groups/${encodeURIComponent(id)}`,
  )
}

export async function fetchPublicReviewerQuiz(id: string) {
  return apiGet<{ quiz: PublicReviewerQuizDetail }>(
    `/reviewers/public/quizzes/${encodeURIComponent(id)}`,
  )
}
