export type LearnDashboardEnrollment = {
  id: string
  course_id: string
  progress_percent: number
  completed: boolean
  updated_at: string
  lessons_total: number
  lessons_completed: number
  course: {
    id: string
    title: string
    duration: string | null
  }
}

export type LearnDashboardPayload = {
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
  knowledge_timeline: Array<{ occurred_at: string }>
  focus_by_day: Array<{ day: string; activities: number; peak: boolean }>
  course_peers: Array<{ id: string; name: string; course_title: string }>
  recent_activity: Array<{
    kind: string
    occurred_at: string
    label: string
    course_title: string | null
    detail: string
  }>
}
