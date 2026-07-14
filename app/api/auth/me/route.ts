import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { API_URL, SESSION_COOKIE } from "@/lib/api-config"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const upstream = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
