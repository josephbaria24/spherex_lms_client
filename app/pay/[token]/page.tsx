"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SphereXLogo } from "@/components/logo"
import { formatCoursePrice } from "@/lib/course-pricing"
import { ApiError, apiGet, apiUploadFile } from "@/lib/api"
import { Loader2, Upload } from "lucide-react"

type UploadInfo = {
  transaction_number: string
  full_name: string
  email: string
  amount_cents: number
  currency: string
  status: string
  course_title: string
  has_receipt: boolean
}

export default function ReceiptUploadPage() {
  const params = useParams()
  const token = typeof params.token === "string" ? params.token : ""
  const [info, setInfo] = useState<UploadInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<{ payment_request: UploadInfo }>(
        `/payment-requests/upload/${token}`,
      )
      setInfo(data.payment_request)
      if (data.payment_request.has_receipt) setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid upload link")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !token) return
    setUploading(true)
    setError(null)
    try {
      await apiUploadFile(`/payment-requests/upload/${token}/receipt`, "receipt", file)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e7e7e7] px-4 py-10">
      <div className="mx-auto max-w-lg rounded-[14px] border border-black/5 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <SphereXLogo className="h-8 w-auto" />
          <p className="text-xs font-semibold uppercase text-teal-700">Payment receipt</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : error && !info ? (
          <div className="space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        ) : info && done ? (
          <div className="space-y-3">
            <h1 className="text-2xl font-bold">Receipt received</h1>
            <p className="text-sm text-muted-foreground">
              Transaction <span className="font-mono font-semibold">{info.transaction_number}</span>{" "}
              for <strong>{info.course_title}</strong>. An admin will review your payment and email
              you when access is ready.
            </p>
            <Button asChild className="mt-4">
              <Link href="/login">Go to login</Link>
            </Button>
          </div>
        ) : info ? (
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Upload payment receipt</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {info.course_title} · {formatCoursePrice(info.amount_cents)}
              </p>
              <p className="mt-1 text-sm">
                Transaction: <span className="font-mono font-semibold">{info.transaction_number}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {info.full_name} · {info.email}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt (JPEG, PNG, WebP, or PDF)</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full gap-2" disabled={uploading || !file}>
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload receipt
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
