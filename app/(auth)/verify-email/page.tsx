"use client"

import { useEffect, useState } from "react"
import { authMe, authResendVerification, authVerifyEmail, authLogout } from "@/lib/api"
import { completeAuthSession } from "@/lib/post-auth-redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SphereXLogo } from "@/components/logo"
import { Loader2, Mail, ShieldCheck } from "lucide-react"

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    authMe()
      .then(({ user }) => {
        if (user.email_verified !== false) {
          void completeAuthSession()
          return
        }
        setEmail(user.email)
        setChecking(false)
      })
      .catch(() => {
        window.location.href = "/login"
      })
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await authVerifyEmail(code.trim())
      await completeAuthSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify code")
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError(null)
    setMessage(null)
    try {
      const res = await authResendVerification()
      setMessage(res.message)
      setCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code")
    } finally {
      setResending(false)
    }
  }

  async function handleLogout() {
    await authLogout()
    window.location.href = "/login"
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e7e7e7]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e7e7e7] p-4 text-slate-950">
      <div className="w-full max-w-md rounded-[14px] border border-black/5 bg-white p-8 shadow-lg">
        <SphereXLogo className="mb-6 h-9 w-auto" />
        <h1 className="text-2xl font-bold text-slate-950">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-500">
          We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>.
          Enter it below to start enrolling in courses.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-slate-700">
              Verification code
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="h-11 rounded-full border-slate-300 bg-white pl-10 tracking-[0.4em] text-slate-950 shadow-none placeholder:tracking-normal placeholder:text-slate-400 focus-visible:ring-teal-500 dark:bg-white dark:text-slate-950"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                required
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify email
              </>
            )}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            className="font-medium text-teal-700 hover:underline disabled:text-slate-400"
            onClick={() => void handleResend()}
            disabled={resending || cooldown > 0}
          >
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
          </button>
          <button type="button" className="text-slate-500 hover:text-slate-900" onClick={() => void handleLogout()}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
