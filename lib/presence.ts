import { apiPost } from "@/lib/api"

let activeCourseId: string | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let inFlight = false

export function setPresenceCourse(courseId: string | null) {
  activeCourseId = courseId
  void sendPresenceHeartbeat()
}

export async function sendPresenceHeartbeat() {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return
  if (inFlight) return
  inFlight = true
  try {
    await apiPost("/users/presence", {
      course_id: activeCourseId,
      clear_course: activeCourseId == null,
    })
  } catch {
    // Presence is best-effort; ignore network/auth blips.
  } finally {
    inFlight = false
  }
}

export function startPresenceHeartbeat(intervalMs = 45_000) {
  if (typeof window === "undefined") return () => {}
  void sendPresenceHeartbeat()
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(() => {
    void sendPresenceHeartbeat()
  }, intervalMs)

  const onVisible = () => {
    if (document.visibilityState === "visible") void sendPresenceHeartbeat()
  }
  document.addEventListener("visibilitychange", onVisible)

  return () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    document.removeEventListener("visibilitychange", onVisible)
  }
}
