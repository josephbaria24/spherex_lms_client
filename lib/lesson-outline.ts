export function groupLessonOutline<T extends { id: string; parent_lesson_id?: string | null }>(
  lessons: T[],
) {
  const ids = new Set(lessons.map((lesson) => lesson.id))
  const childrenOf = new Map<string, T[]>()
  const roots: T[] = []

  for (const lesson of lessons) {
    const parentId = lesson.parent_lesson_id
    if (parentId && ids.has(parentId)) {
      const list = childrenOf.get(parentId) ?? []
      list.push(lesson)
      childrenOf.set(parentId, list)
    } else {
      roots.push(lesson)
    }
  }

  return { roots, childrenOf }
}
