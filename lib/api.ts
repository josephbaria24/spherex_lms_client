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

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  const data = text ? (JSON.parse(text) as T & { error?: string }) : ({} as T & { error?: string })
  if (!res.ok) {
    throw new ApiError(data.error ?? res.statusText, res.status, data)
  }
  return data as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/lms${path}`, { credentials: "include" })
  return parseResponse<T>(res)
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/lms${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return parseResponse<T>(res)
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/lms${path}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<T>(res)
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/lms${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<T>(res)
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/lms${path}`, {
    method: "DELETE",
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return parseResponse<T>(res)
}

export async function apiUploadFile<T>(path: string, fieldName: string, file: File): Promise<T> {
  const formData = new FormData()
  formData.append(fieldName, file)
  const res = await fetch(`/api/lms${path}`, {
    method: "POST",
    credentials: "include",
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
