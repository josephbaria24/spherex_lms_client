import { NextRequest } from "next/server"
import { proxyToBackend } from "@/lib/proxy-request"

type Params = { params: Promise<{ path: string[] }> }

async function handler(req: NextRequest, { params }: Params) {
  const { path } = await params
  return proxyToBackend(req, `/api/${path.join("/")}`)
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
export const PUT = handler
