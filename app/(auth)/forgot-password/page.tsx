"use client"

import Link from "next/link"
import { useState } from "react"
import { authForgotPassword } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SphereXLogo } from "@/components/logo"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const res = await authForgotPassword(email)
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e7e7e7] p-4 text-slate-950">
      <div className="w-full max-w-md rounded-[14px] border border-black/5 bg-white p-8 shadow-lg">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <SphereXLogo className="mb-6 h-9 w-auto" />
        <h1 className="text-2xl font-bold text-slate-950">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your account email and we will send a reset link if it exists.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                className="h-11 rounded-full border-slate-300 bg-white pl-10 text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-teal-500 dark:bg-white dark:text-slate-950"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      </div>
    </div>
  )
}
