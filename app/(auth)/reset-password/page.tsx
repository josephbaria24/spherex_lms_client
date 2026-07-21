"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { authResetPassword } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SphereXLogo } from "@/components/logo"
import { ArrowLeft, Loader2 } from "lucide-react"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    if (!token) {
      setError("Missing reset token")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await authResetPassword(token, password)
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-[14px] border border-black/5 bg-white p-8 text-slate-950 shadow-lg">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
      <SphereXLogo className="mb-6 h-9 w-auto" />
      <h1 className="text-2xl font-bold text-slate-950">Reset password</h1>
      {message ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-emerald-700">{message}</p>
          <Button
            asChild
            className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800"
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">
              New password
            </Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              required
              className="h-11 rounded-full border-slate-300 bg-white text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-teal-500 dark:bg-white dark:text-slate-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-slate-700">
              Confirm password
            </Label>
            <Input
              id="confirm"
              type="password"
              minLength={8}
              required
              className="h-11 rounded-full border-slate-300 bg-white text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-teal-500 dark:bg-white dark:text-slate-950"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={loading || !token}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e7e7e7] p-4 text-slate-950">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
