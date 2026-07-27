"use client"

import Link from "next/link"
import { useState } from "react"
import { authLogin } from "@/lib/api"
import { completeAuthSession } from "@/lib/post-auth-redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SphereXLogo } from "@/components/logo"
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel"
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from "lucide-react"

const sampleUsers = [
  { label: "Admin", email: "admin@spherex.local", password: "Admin123!" },
  { label: "Org admin", email: "orgadmin@petrosphere.local", password: "OrgAdmin123!" },
  { label: "Teacher", email: "teacher@spherex.local", password: "Teacher123!" },
  {
    label: "New teacher",
    email: "newteacher@spherex.local",
    password: "Teacher123!",
    code: "PETRO-DEMO",
    codeType: "teacher" as const,
  },
  { label: "Student", email: "student@spherex.local", password: "Student123!" },
  {
    label: "New student",
    email: "newstudent@spherex.local",
    password: "Student123!",
    code: "PETRO-STUDENT",
    codeType: "student" as const,
  },
]

const fieldClass =
  "h-11 rounded-md border-border/90 bg-background pl-10 pr-3 text-sm shadow-none focus-visible:ring-[#0f766e]"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOrgCode, setShowOrgCode] = useState(false)
  const [orgCode, setOrgCode] = useState("")
  const [showStudentOrgCode, setShowStudentOrgCode] = useState(false)
  const [studentOrgCode, setStudentOrgCode] = useState("")
  const [showSamples, setShowSamples] = useState(false)

  function useSampleUser(sample: (typeof sampleUsers)[number]) {
    setEmail(sample.email)
    setPassword(sample.password)
    if (sample.codeType === "teacher") {
      setShowOrgCode(true)
      setOrgCode(sample.code ?? "")
      setStudentOrgCode("")
      return
    }
    if (sample.codeType === "student") {
      setShowStudentOrgCode(true)
      setStudentOrgCode(sample.code ?? "")
      setOrgCode("")
      return
    }
    setOrgCode("")
    setStudentOrgCode("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await authLogin(email, password)
      await completeAuthSession({
        teacherOrgCode: orgCode,
        studentOrgCode: studentOrgCode,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#eef1f4] p-4 text-[#0f172a] sm:p-6 lg:p-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-5rem)]">
        <div className="grid w-full overflow-hidden rounded-xl border border-[#d8dee6] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:min-h-[680px] lg:grid-cols-[1fr_0.92fr]">
          <section className="flex min-w-0 flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
            <Link
              href="/"
              className="mb-8 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="flex items-center gap-3">
              <SphereXLogo className="h-8 w-auto" priority />
              <div className="h-6 w-px bg-slate-200" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0f766e]">
                SphereX LMS
              </p>
            </div>

            <div className="mt-10 max-w-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0f766e]">
                Sign in
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Sign in to manage courses, organizations, lessons, and learner progress.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 max-w-md space-y-3.5" aria-busy={loading}>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-600">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    className={fieldClass}
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-600">
                    Password
                  </Label>
                  <button type="button" className="text-[11px] font-medium text-slate-500 hover:text-[#0f766e]">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className={`${fieldClass} pr-10`}
                    placeholder="Password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {showStudentOrgCode && (
                <div className="space-y-1.5 rounded-md border border-[#0f766e]/20 bg-[#0f766e]/5 p-3">
                  <Label htmlFor="student-org-code" className="text-xs font-medium text-[#0f766e]">
                    Student organization code
                  </Label>
                  <Input
                    id="student-org-code"
                    placeholder="PETRO-STUDENT"
                    className="h-10 rounded-md border-[#0f766e]/25 bg-white font-mono uppercase shadow-none focus-visible:ring-[#0f766e]"
                    value={studentOrgCode}
                    onChange={(e) => setStudentOrgCode(e.target.value.toUpperCase())}
                    disabled={loading}
                  />
                </div>
              )}

              {showOrgCode && (
                <div className="space-y-1.5 rounded-md border border-[#0f766e]/20 bg-[#0f766e]/5 p-3">
                  <Label htmlFor="org-code" className="text-xs font-medium text-[#0f766e]">
                    Teacher organization code
                  </Label>
                  <Input
                    id="org-code"
                    placeholder="PETRO-DEMO"
                    className="h-10 rounded-md border-[#0f766e]/25 bg-white font-mono uppercase shadow-none focus-visible:ring-[#0f766e]"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-xs">
                <button
                  type="button"
                  className="font-medium text-[#0f766e] hover:underline"
                  onClick={() => setShowStudentOrgCode((v) => !v)}
                >
                  {showStudentOrgCode ? "Hide student code" : "Have a student code?"}
                </button>
                <button
                  type="button"
                  className="font-medium text-[#0f766e] hover:underline"
                  onClick={() => setShowOrgCode((v) => !v)}
                >
                  {showOrgCode ? "Hide teacher code" : "Have a teacher code?"}
                </button>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full gap-2 rounded-md bg-[#0f172a] text-sm font-semibold text-white hover:bg-[#1e293b]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-[#0f766e] hover:underline">
                  Sign up
                </Link>
              </p>
            </form>

            {process.env.NODE_ENV !== "production" && (
              <div className="mt-8 max-w-md border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => setShowSamples((v) => !v)}
                  className="flex w-full items-center justify-between text-left text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  <span>Developer sample accounts</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${showSamples ? "rotate-180" : ""}`}
                  />
                </button>
                {showSamples && (
                  <div className="mt-3 grid gap-1.5">
                    {sampleUsers.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => useSampleUser(sample)}
                        className="grid gap-0.5 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2 text-left transition hover:border-[#0f766e]/40 hover:bg-[#0f766e]/5 sm:grid-cols-[5.5rem_1fr]"
                      >
                        <span className="text-[11px] font-semibold text-slate-900">{sample.label}</span>
                        <span className="min-w-0 truncate font-mono text-[11px] text-slate-500">
                          {sample.email}
                          {sample.code ? ` · ${sample.code}` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <AuthMarketingPanel title="Organize learning, track progress, and manage every organization in one place." />
        </div>
      </div>
    </div>
  )
}
