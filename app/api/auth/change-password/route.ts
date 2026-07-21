import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { API_URL, SESSION_COOKIE } from "@/lib/api-config"

export async function POST(req: Request) {
  const body = await req.json()
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  const upstream = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
