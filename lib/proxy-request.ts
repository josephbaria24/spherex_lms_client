import { randomUUID } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
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

  // 204/205/304 must not include a body. xAPI statement and state saves use 204.
  if (upstream.status === 204 || upstream.status === 205 || upstream.status === 304) {
    return new NextResponse(null, { status: upstream.status })
  }

  if (isTextResponse(upstreamType)) {
    const responseText = await upstream.text()
    return new NextResponse(responseText, {
      status: upstream.status,
      headers: {
        "Content-Type": upstreamType || "application/json",
      },
    })
  }

  const disposition = upstream.headers.get("content-disposition")
  // Only rewrite ZIP package downloads to a public /downloads URL.
  // Certificate PDFs (and other non-zip attachments) must stream through as binary —
  // treating them as zip returned JSON that clients saved as a broken .pdf.
  const isZipAttachment =
    Boolean(disposition?.includes("attachment")) &&
    upstream.ok &&
    (upstreamType.includes("application/zip") ||
      upstreamType.includes("application/x-zip-compressed") ||
      /\.zip"/i.test(disposition ?? ""))

  if (isZipAttachment) {
    const bytes = Buffer.from(await upstream.arrayBuffer())
    const id = randomUUID()
    const dir = path.join(process.cwd(), "public", "downloads")
    await mkdir(dir, { recursive: true })
    const storedName = `${id}.zip`
    await writeFile(path.join(dir, storedName), bytes)
    setTimeout(() => {
      void unlink(path.join(dir, storedName)).catch(() => {})
    }, 10 * 60 * 1000)
    const match = /filename="([^"]+)"/.exec(disposition ?? "")
    return NextResponse.json({
      url: `/downloads/${storedName}`,
      filename: match?.[1] ?? "download.zip",
    })
  }

  const buffer = await upstream.arrayBuffer()
  const responseHeaders = new Headers()
  responseHeaders.set("Content-Type", upstreamType || "application/octet-stream")
  const cacheControl = upstream.headers.get("cache-control")
  if (cacheControl) responseHeaders.set("Cache-Control", cacheControl)
  if (disposition) responseHeaders.set("Content-Disposition", disposition)

  return new NextResponse(buffer, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
