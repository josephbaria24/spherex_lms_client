const OUTLINE_TTL_MS = 10 * 60 * 1000
const LESSON_TTL_MS = 10 * 60 * 1000

type CacheEntry<T> = {
  data: T
  cachedAt: number
}

const outlineCache = new Map<string, CacheEntry<unknown>>()
const lessonCache = new Map<string, CacheEntry<unknown>>()

function read<T>(map: Map<string, CacheEntry<unknown>>, key: string, ttlMs: number): T | null {
  const entry = map.get(key)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > ttlMs) {
    map.delete(key)
    return null
  }
  return entry.data as T
}

function write<T>(map: Map<string, CacheEntry<unknown>>, key: string, data: T) {
  map.set(key, { data, cachedAt: Date.now() })
}

export function getCachedOutline<T>(courseId: string): T | null {
  return read<T>(outlineCache, courseId, OUTLINE_TTL_MS)
}

export function setCachedOutline<T>(courseId: string, data: T) {
  write(outlineCache, courseId, data)
}

export function getCachedLesson<T>(courseId: string, lessonId: string): T | null {
  return read<T>(lessonCache, `${courseId}:${lessonId}`, LESSON_TTL_MS)
}

export function setCachedLesson<T>(courseId: string, lessonId: string, data: T) {
  write(lessonCache, `${courseId}:${lessonId}`, data)
}

export function invalidateCourseLearnCache(courseId: string) {
  outlineCache.delete(courseId)
  for (const key of lessonCache.keys()) {
    if (key.startsWith(`${courseId}:`)) lessonCache.delete(key)
  }
}
