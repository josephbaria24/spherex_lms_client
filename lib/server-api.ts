import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { API_URL, SESSION_COOKIE } from "./api-config"
import type { AuthUser } from "./api"

async function serverFetch(path: string, init?: RequestInit) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  const headers = new Headers(init?.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json")
  }
  return fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" })
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const res = await serverFetch("/api/auth/me")
  if (!res.ok) return null
  const data = (await res.json()) as { user: AuthUser }
  return data.user
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  return user
}

export async function requireAdminUser(): Promise<AuthUser> {
  const user = await requireUser()
  if (user.role !== "admin") redirect("/dashboard")
  return user
}

export async function requireTeacherUser(): Promise<AuthUser> {
  const user = await requireUser()
  if (user.role !== "admin" && user.role !== "teacher") redirect("/dashboard")
  return user
}

export async function serverGet<T>(path: string): Promise<T> {
  const res = await serverFetch(path)
  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }
  return res.json() as Promise<T>
}
