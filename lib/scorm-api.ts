import { apiGet, apiPost } from "@/lib/api"

export type Scorm12Api = {
  LMSInitialize: (param: string) => string
  LMSFinish: (param: string) => string
  LMSGetValue: (element: string) => string
  LMSSetValue: (element: string, value: string) => string
  LMSCommit: (param: string) => string
  LMSGetLastError: () => string
  LMSGetErrorString: (errorCode: string) => string
  LMSGetDiagnostic: (errorCode: string) => string
}

/** SCORM 1.2 read-only element defaults Storyline expects from a real LMS. */
const SCORM12_STATIC: Record<string, string> = {
  "cmi.core._children":
    "student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time",
  "cmi.core.score._children": "raw,min,max",
  "cmi.objectives._children": "id,score,status",
  "cmi.interactions._children": "id,objectives,time,type,correct_responses,weighting,student_response,result,latency",
}

const SCORM12_READONLY = new Set([
  "cmi.core._children",
  "cmi.core.score._children",
  "cmi.core.entry",
  "cmi.core.total_time",
  "cmi.core.credit",
  "cmi.core.lesson_mode",
  "cmi.objectives._children",
  "cmi.interactions._children",
  "cmi.interactions._count",
  "cmi.objectives._count",
])

export const SCORM_DEFAULT_CMI: Record<string, string> = {
  "cmi.core.lesson_status": "not attempted",
  "cmi.core.lesson_location": "",
  "cmi.core.score.raw": "",
  "cmi.core.score.min": "0",
  "cmi.core.score.max": "100",
  "cmi.suspend_data": "",
  "cmi.core.student_id": "learner",
  "cmi.core.student_name": "Learner",
  "cmi.core.lesson_mode": "normal",
  "cmi.core.credit": "credit",
  "cmi.core.entry": "ab-initio",
  "cmi.core.exit": "",
  "cmi.core.total_time": "00:00:00",
  "cmi.core.session_time": "00:00:00",
  "cmi.launch_data": "",
  "cmi.objectives._count": "0",
  "cmi.interactions._count": "0",
  ...SCORM12_STATIC,
}

function isPersistedCmiElement(element: string): boolean {
  return element.startsWith("cmi.") && !SCORM12_READONLY.has(element)
}

export function hasScormBookmark(cmi: Record<string, string>): boolean {
  return Boolean(cmi["cmi.suspend_data"]?.trim() || cmi["cmi.core.lesson_location"]?.trim())
}

/** Session launch values — only use resume when bookmark data exists. */
export function buildScormSessionCmi(
  cmi: Record<string, string>,
  fresh: boolean,
): Record<string, string> {
  const bookmark = !fresh && hasScormBookmark(cmi)
  const session: Record<string, string> = {
    "cmi.core.entry": fresh || !bookmark ? "ab-initio" : "resume",
    "cmi.core.exit": "",
  }

  if (fresh) {
    session["cmi.suspend_data"] = ""
    session["cmi.core.lesson_location"] = ""
    session["cmi.core.lesson_status"] = "not attempted"
  } else if (bookmark) {
    session["cmi.core.lesson_status"] = cmi["cmi.core.lesson_status"] || "incomplete"
  } else {
    session["cmi.core.lesson_status"] = "incomplete"
  }

  return session
}

function readScormValue(store: Record<string, string>, element: string, initialized: boolean): string {
  if (!initialized && element.startsWith("cmi.")) return ""
  if (element in store) return store[element] ?? ""
  if (element in SCORM12_STATIC) return SCORM12_STATIC[element]
  if (element.endsWith("._count")) return "0"
  return ""
}

export async function loadScormCmi(
  courseId: string,
  lessonId: string,
): Promise<{ cmi: Record<string, string>; preview: boolean }> {
  const res = await apiGet<{ cmi: Record<string, string>; preview?: boolean }>(
    `/learn/courses/${courseId}/lessons/${lessonId}/scorm`,
  )
  return { cmi: res.cmi ?? SCORM_DEFAULT_CMI, preview: res.preview ?? false }
}

export type ScormProgressPayload = {
  progress: number
  completed: boolean
  total: number
  done: number
  started?: number
}

export async function recordScormProgress(
  courseId: string,
  lessonId: string,
  values: Record<string, string>,
): Promise<{ lesson_completed?: boolean; progress?: ScormProgressPayload }> {
  return apiPost(`/learn/courses/${courseId}/lessons/${lessonId}/scorm`, { values })
}

export async function resetScormProgress(courseId: string, lessonId: string): Promise<void> {
  await apiPost(`/learn/courses/${courseId}/lessons/${lessonId}/scorm/reset`, {})
}

export function createScorm12ApiShim(initialCmi?: Record<string, string>): Scorm12Api {
  const store: Record<string, string> = { ...SCORM_DEFAULT_CMI, ...initialCmi }
  let initialized = false

  return {
    LMSInitialize: () => {
      initialized = true
      return "true"
    },
    LMSFinish: () => "true",
    LMSGetValue: (element) => readScormValue(store, element, initialized),
    LMSSetValue: (element, value) => {
      if (SCORM12_READONLY.has(element)) return "false"
      store[element] = value
      return "true"
    },
    LMSCommit: () => "true",
    LMSGetLastError: () => "0",
    LMSGetErrorString: () => "No error",
    LMSGetDiagnostic: () => "",
  }
}

type PersistentScormOptions = {
  courseId: string
  lessonId: string
  previewMode?: boolean
  initialCmi?: Record<string, string>
  onLessonCompleted?: () => void
  onProgressChange?: (progress: ScormProgressPayload) => void
}

export type PersistentScormRuntime = {
  api: Scorm12Api
  flush: () => Promise<void>
}

export function createPersistentScorm12Api({
  courseId,
  lessonId,
  previewMode,
  initialCmi,
  onLessonCompleted,
  onProgressChange,
}: PersistentScormOptions): PersistentScormRuntime {
  const store: Record<string, string> = { ...SCORM_DEFAULT_CMI, ...initialCmi }
  let initialized = false
  let commitInFlight = false
  let commitQueued = false
  let commitTimer: ReturnType<typeof setTimeout> | null = null

  async function commitToServer() {
    if (previewMode) return
    if (commitInFlight) {
      commitQueued = true
      return
    }
    commitInFlight = true
    try {
      const res = await apiPost<{ lesson_completed?: boolean; progress?: ScormProgressPayload }>(
        `/learn/courses/${courseId}/lessons/${lessonId}/scorm`,
        { values: { ...store } },
      )
      if (res.progress) onProgressChange?.(res.progress)
      if (res.lesson_completed) onLessonCompleted?.()
    } finally {
      commitInFlight = false
      if (commitQueued) {
        commitQueued = false
        await commitToServer()
      }
    }
  }

  function scheduleCommit(immediate = false) {
    if (previewMode) return
    if (commitTimer) clearTimeout(commitTimer)
    if (immediate) {
      commitTimer = null
      void commitToServer()
      return
    }
    commitTimer = setTimeout(() => {
      commitTimer = null
      void commitToServer()
    }, 400)
  }

  async function flush() {
    if (commitTimer) {
      clearTimeout(commitTimer)
      commitTimer = null
    }
    while (commitInFlight) {
      commitQueued = true
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    await commitToServer()
    while (commitQueued) {
      commitQueued = false
      await commitToServer()
    }
  }

  const api: Scorm12Api = {
    LMSInitialize: () => {
      initialized = true
      return "true"
    },
    LMSFinish: () => {
      void flush()
      return "true"
    },
    LMSGetValue: (element) => readScormValue(store, element, initialized),
    LMSSetValue: (element, value) => {
      if (SCORM12_READONLY.has(element)) return "false"
      store[element] = value
      const status = element === "cmi.core.lesson_status" ? value.toLowerCase() : ""
      if (isPersistedCmiElement(element)) {
        const immediate =
          element === "cmi.suspend_data" ||
          element === "cmi.core.lesson_location" ||
          element === "cmi.core.exit"
        scheduleCommit(immediate)
      }
      if (status === "completed" || status === "passed") {
        void flush()
      }
      return "true"
    },
    LMSCommit: () => {
      void flush()
      return "true"
    },
    LMSGetLastError: () => "0",
    LMSGetErrorString: () => "No error",
    LMSGetDiagnostic: () => "",
  }

  return { api, flush }
}

/** Ask Storyline's SCORM driver (inside the iframe) to suspend and flush bookmark data. */
export function suspendScormContentFrame(iframe: HTMLIFrameElement | null): void {
  if (!iframe?.contentWindow) return
  const win = iframe.contentWindow as Window & {
    Suspend?: () => void
    CommitData?: () => void
  }
  try {
    win.Suspend?.()
  } catch {
    try {
      win.CommitData?.()
    } catch {
      /* not ready */
    }
  }
  try {
    win.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }))
  } catch {
    /* ignore */
  }
}

export function installScorm12Api(api: Scorm12Api): () => void {
  if (typeof window === "undefined") return () => {}

  const win = window as Window & { API?: Scorm12Api; API_1484_11?: unknown }
  const previousApi = win.API
  win.API = api

  try {
    if (win.parent && win.parent !== win) {
      ;(win.parent as Window & { API?: Scorm12Api }).API = api
    }
    if (win.top && win.top !== win) {
      ;(win.top as Window & { API?: Scorm12Api }).API = api
    }
  } catch {
    /* cross-origin */
  }

  return () => {
    if (previousApi) win.API = previousApi
    else delete win.API
    try {
      if (win.parent && win.parent !== win) {
        const parent = win.parent as Window & { API?: Scorm12Api }
        if (parent.API === api) delete parent.API
      }
      if (win.top && win.top !== win) {
        const top = win.top as Window & { API?: Scorm12Api }
        if (top.API === api) delete top.API
      }
    } catch {
      /* ignore */
    }
  }
}

/** In-memory stub for external (cross-origin) articulate URLs. */
export function installScorm12ApiShim(initialCmi?: Record<string, string>): () => void {
  return installScorm12Api(createScorm12ApiShim(initialCmi))
}

export function installPersistentScorm12Api(options: PersistentScormOptions): () => void {
  const { api } = createPersistentScorm12Api(options)
  return installScorm12Api(api)
}
