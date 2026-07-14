import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { API_URL, SESSION_COOKIE } from "./api-config"

function isTextResponse(contentType: string): boolean {
  if (!contentType) return true
  return (
    contentType.includes("application/json") ||
    contentType.startsWith("text/") ||
    contentType.includes("application/javascript")
  )
}

export async function proxyToBackend(req: NextRequest, backendPath: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  const url = new URL(backendPath, API_URL)
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  const headers = new Headers()
  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const hasBody = req.method !== "GET" && req.method !== "HEAD"
  const body = hasBody ? await req.arrayBuffer() : undefined

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
  })

  const upstreamType = upstream.headers.get("content-type") ?? ""

  if (isTextResponse(upstreamType)) {
    const responseText = await upstream.text()
    return new NextResponse(responseText, {
      status: upstream.status,
      headers: {
        "Content-Type": upstreamType || "application/json",
      },
    })
  }

  const buffer = await upstream.arrayBuffer()
  const responseHeaders = new Headers()
  responseHeaders.set("Content-Type", upstreamType)
  const cacheControl = upstream.headers.get("cache-control")
  if (cacheControl) responseHeaders.set("Cache-Control", cacheControl)

  return new NextResponse(buffer, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
