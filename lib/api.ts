export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

const TRANSIENT_NOT_FOUND_RETRY_DELAYS_MS = [400, 800, 1200]

function isTransientNotFound(res: Response): boolean {
  if (res.status !== 404) return false
  const contentType = res.headers.get("content-type") ?? ""
  return !contentType.includes("application/json")
}

async function fetchLms(path: string, init?: RequestInit): Promise<Response> {
  const maxAttempts =
    process.env.NODE_ENV === "development" ? TRANSIENT_NOT_FOUND_RETRY_DELAYS_MS.length : 1

  let lastResponse: Response | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`/api/lms${path}`, {
      credentials: "include",
      ...init,
    })

    if (!isTransientNotFound(res) || attempt === maxAttempts - 1) {
      return res
    }

    lastResponse = res
    await new Promise((resolve) =>
      setTimeout(resolve, TRANSIENT_NOT_FOUND_RETRY_DELAYS_MS[attempt] ?? 1200),
    )
  }

  return lastResponse ?? fetch(`/api/lms${path}`, { credentials: "include", ...init })
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  const contentType = res.headers.get("content-type") ?? ""

  let data = {} as T & { error?: string }
  if (text) {
    const looksLikeJson =
      contentType.includes("application/json") ||
      text.trimStart().startsWith("{") ||
      text.trimStart().startsWith("[")

    if (!looksLikeJson) {
      throw new ApiError(
        res.status === 404
          ? "API route not found. If you just refreshed during a rebuild, try again."
          : `Unexpected response from server (${res.status}).`,
        res.status,
        text.slice(0, 200),
      )
    }

    try {
      data = JSON.parse(text) as T & { error?: string }
    } catch {
      throw new ApiError(
        `Invalid JSON response (${res.status}).`,
        res.status,
        text.slice(0, 200),
      )
    }
  }

  if (!res.ok) {
    throw new ApiError(data.error ?? res.statusText, res.status, data)
  }
  return data as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetchLms(path)
  return parseResponse<T>(res)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetchLms(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return parseResponse<T>(res)
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchLms(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<T>(res)
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchLms(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<T>(res)
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetchLms(path, {
    method: "DELETE",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return parseResponse<T>(res)
}

export async function apiUploadFile<T>(path: string, fieldName: string, file: File): Promise<T> {
  const formData = new FormData()
  formData.append(fieldName, file)
  const res = await fetchLms(path, {
    method: "POST",
    body: formData,
  })
  return parseResponse<T>(res)
}

export async function authLogin(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  return parseResponse<{ user: AuthUser }>(res)
}

export async function authRegister(
  email: string,
  password: string,
  fullName?: string,
) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName?.trim() || undefined,
      name: fullName?.trim() || undefined,
    }),
  })
  return parseResponse<{ user: AuthUser }>(res)
}

export async function authLogout() {
  const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
  return parseResponse<{ ok: boolean }>(res)
}

export async function authMe() {
  const res = await fetch("/api/auth/me", { credentials: "include" })
  return parseResponse<{ user: AuthUser }>(res)
}

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  name: string | null
  role: "admin" | "teacher" | "student" | "user"
  status: string
  phone?: string | null
  notify_email?: boolean
  notify_training?: boolean
  notify_course_updates?: boolean
  created_at?: string
}
