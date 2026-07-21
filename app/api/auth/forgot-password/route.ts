import { NextResponse } from "next/server"
import { API_URL } from "@/lib/api-config"

export async function POST(req: Request) {
  const body = await req.json()
  const upstream = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await upstream.json()
  return NextResponse.json(data, { status: upstream.status })
}
