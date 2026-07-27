import type { LearnDashboardEnrollment } from "@/lib/learn-dashboard-types"

export type LearnAchievementCertificate = {
  id: string
  course_id: string | null
  course_title: string | null
  certificate_url: string | null
  issued_at: string
}

export type LearnAchievementActivity = {
  kind: string
  occurred_at: string
  label: string
  course_title: string | null
  detail: string
}

export type LearnAchievementsPayload = {
  summary: {
    streak_days: number
    lessons_completed: number
    quiz_attempts: number
    certificates: number
    courses_enrolled: number
    courses_completed: number
    hours_completed: number
    hours_goal: number
    weekly_goal_percent: number
    knowledge_growth_percent: number
  }
  enrollments: LearnDashboardEnrollment[]
  certificates: LearnAchievementCertificate[]
  activity_history: LearnAchievementActivity[]
}
