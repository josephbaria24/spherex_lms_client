export type LessonContentType = "text" | "video" | "articulate" | "quiz"

export type QuizOption = { id: string; text: string }

export type QuizQuestion = {
  id?: string
  sort_order?: number
  prompt: string
  question_type: "multiple_choice" | "true_false"
  options: QuizOption[]
  correct_option_id?: string
}

export type LessonQuiz = {
  id: string
  lesson_id: string
  title: string
  passing_score: number
  questions: QuizQuestion[]
}

export type Lesson = {
  id: string
  course_id: string
  course_title?: string
  title: string
  description?: string | null
  content?: string | null
  content_type: LessonContentType
  video_url?: string | null
  articulate_url?: string | null
  articulate_launch_mode?: "story" | "scorm"
  sort_order: number
  duration_minutes: number
  status: "draft" | "published"
  completed?: boolean
  quiz_question_count?: number
  quiz_passing_score?: number
}

export const LESSON_CONTENT_TYPES: { value: LessonContentType; label: string }[] = [
  { value: "text", label: "Text / HTML" },
  { value: "video", label: "Video" },
  { value: "articulate", label: "Articulate (Storyline / Rise)" },
  { value: "quiz", label: "Quiz" },
]
