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

export async function apiDownload(path: string, filename: string): Promise<void> {
  const res = await fetch(`/api/lms${path}`, { credentials: "include" })
  if (!res.ok) {
    const text = await res.text()
    let message = res.statusText
    try {
      const data = JSON.parse(text) as { error?: string }
      message = data.error ?? message
    } catch {
      if (text) message = text
    }
    throw new ApiError(message, res.status)
  }
  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const data = (await res.json()) as { url?: string; filename?: string }
    if (!data.url) throw new ApiError("Download link missing", 500)
    const link = document.createElement("a")
    link.href = data.url
    link.download = data.filename || filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    return
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
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

export function apiUploadFile<T>(
  path: string,
  fieldName: string,
  file: File,
  options?: { onProgress?: (percent: number) => void },
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `/api/lms${path}`)
    xhr.withCredentials = true
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
      options?.onProgress?.(percent)
    }
    xhr.onload = () => {
      const text = xhr.responseText
      let data = {} as T & { error?: string }
      try {
        data = text ? (JSON.parse(text) as T & { error?: string }) : data
      } catch {
        reject(new ApiError(text || xhr.statusText || "Upload failed", xhr.status))
        return
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(data.error ?? xhr.statusText ?? "Upload failed", xhr.status, data))
        return
      }
      resolve(data)
    }
    xhr.onerror = () => reject(new ApiError("Upload failed", 0))
    const formData = new FormData()
    formData.append(fieldName, file)
    xhr.send(formData)
  })
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
  must_change_password?: boolean
  email_verified?: boolean
  created_at?: string
}

export async function authForgotPassword(email: string) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  return parseResponse<{ ok: boolean; message: string }>(res)
}

export async function authResetPassword(token: string, password: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  })
  return parseResponse<{ ok: boolean; message: string }>(res)
}

export async function authChangePassword(body: {
  current_password?: string
  new_password: string
}) {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse<{ ok: boolean; message: string }>(res)
}

export async function authVerifyEmail(code: string) {
  const res = await fetch("/api/auth/verify-email", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  })
  return parseResponse<{ user: AuthUser }>(res)
}

export async function authResendVerification() {
  const res = await fetch("/api/auth/resend-verification", {
    method: "POST",
    credentials: "include",
  })
  return parseResponse<{ ok: boolean; sent: boolean; message: string }>(res)
}
