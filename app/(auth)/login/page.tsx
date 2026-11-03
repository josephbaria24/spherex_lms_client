"use client"

import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { useState } from "react"
import { authLogin } from "@/lib/api"
import { completeAuthSession } from "@/lib/post-auth-redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SphereXLogo } from "@/components/logo"
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel"
import { ArrowLeft, Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await authLogin(email, password)
      const next = new URLSearchParams(window.location.search).get("next") ?? undefined
      await completeAuthSession({ next })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] p-4 text-neutral-950 sm:p-6 lg:p-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-5rem)]">
        <div className="grid w-full overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.1)] lg:min-h-[760px] lg:grid-cols-[0.94fr_1.06fr]">
          <section className="flex min-w-0 flex-col px-6 py-8 sm:px-10 lg:px-16 lg:py-14">
            <Link
              href="/"
              className="mb-6 inline-flex w-fit items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back to the home page
            </Link>

            <div className="flex items-center gap-2.5">
              <SphereXLogo className="h-9 w-auto" priority />
              <p className="text-[15px] font-semibold tracking-[-0.03em] text-neutral-950">
                Petro<span className="text-[#FF4B1A]">Cademia</span>
              </p>
            </div>

            <div className="mt-12 max-w-md">
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-neutral-950 sm:text-5xl">
                Welcome back
              </h1>
              <p className="mt-4 text-[15px] leading-7 text-neutral-500">
                Sign in to manage courses, organizations, lessons, and learner progress in PetroCademia.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-9 max-w-md space-y-4" aria-busy={loading}>
              <div className="space-y-2">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="email"
                    type="email"
                    className="h-12 rounded-xl border-neutral-200 bg-white pl-12 pr-5 text-sm text-neutral-950 shadow-none placeholder:text-neutral-400 focus-visible:ring-[#FF4B1A]/30 dark:bg-white dark:text-neutral-950"
                    placeholder="Email address"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="sr-only">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-12 rounded-xl border-neutral-200 bg-white pl-12 pr-12 text-sm text-neutral-950 shadow-none placeholder:text-neutral-400 focus-visible:ring-[#FF4B1A]/30 dark:bg-white dark:text-neutral-950"
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-950"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs font-medium text-neutral-500 hover:text-[#FF4B1A]">
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-12 w-full gap-2 rounded-xl bg-[#FF4B1A] text-sm font-semibold text-white hover:bg-[#e84314]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size={16} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Login
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-neutral-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-[#FF4B1A] hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </section>

          <AuthMarketingPanel title="Organize learning, track progress, and manage every organization in PetroCademia." />
        </div>
      </div>
    </div>
  )
}
