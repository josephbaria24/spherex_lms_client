import { NextResponse } from "next/server"
import { API_URL, SESSION_COOKIE } from "@/lib/api-config"

export async function POST(req: Request) {
  const body = await req.json()

  const upstream = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const data = await upstream.json()
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status })
  }

  const res = NextResponse.json({ user: data.user })
  if (data.token) {
    res.cookies.set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    })
  }
  return res
}
