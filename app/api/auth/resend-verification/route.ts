import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { API_URL, SESSION_COOKIE } from "@/lib/api-config"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  const upstream = await fetch(`${API_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
