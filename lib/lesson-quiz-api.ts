import { apiPut } from "@/lib/api"
import { teacherApiPath } from "@/lib/teacher-api"
import {
  quizDraftToPayload,
  type QuizDraft,
} from "@/components/lessons/quiz-editor"
import type { LessonQuiz } from "@/lib/lesson-types"

export async function saveLessonQuiz(orgId: string, lessonId: string, quiz: QuizDraft) {
  const payload = quizDraftToPayload(quiz)
  const res = await apiPut<{ quiz: LessonQuiz }>(
    teacherApiPath(orgId, `/lessons/${lessonId}/quiz`),
    payload,
  )
  return res.quiz
}
