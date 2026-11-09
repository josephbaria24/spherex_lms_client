export type CourseCompletionSummary = {
  course: {
    id: string
    title: string
    image: string | null
  }
  completed: boolean
  progress_percent: number
  lessons_total: number
  lessons_completed: number
  study_seconds: number
  quiz_attempts: number
  quizzes_attempted: number
  quizzes_passed: number
  quiz_repeats: number
  quiz_failed_attempts: number
  quiz_avg_score: number | null
  quiz_best_score: number | null
  interactions_total: number
  interactions_correct: number
  enrolled_at: string
  completed_at: string | null
  certificate: {
    id: string
    serial_number: string | null
    issued_at: string
    has_template: boolean
    pdf_url: string
  } | null
}
