"use client"

import Link from "next/link"
import { useState } from "react"
import { authRegister } from "@/lib/api"
import { completeAuthSession } from "@/lib/post-auth-redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SphereXLogo } from "@/components/logo"
import { AuthMarketingPanel } from "@/components/auth/auth-marketing-panel"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react"

const fieldClass =
  "h-11 rounded-full border-slate-200 bg-white pl-10 pr-3 text-sm shadow-none focus-visible:ring-teal-600"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOrgCode, setShowOrgCode] = useState(false)
  const [orgCode, setOrgCode] = useState("")
  const [showStudentOrgCode, setShowStudentOrgCode] = useState(false)
  const [studentOrgCode, setStudentOrgCode] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      await authRegister(email, password, fullName)
      await completeAuthSession({
        teacherOrgCode: orgCode,
        studentOrgCode: studentOrgCode,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e7e7e7] p-4 text-slate-900 sm:p-6 lg:p-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-5rem)]">
        <div className="grid w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:min-h-[680px] lg:grid-cols-[1fr_0.92fr]">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-700">
                SphereX LMS
              </p>
            </div>

            <div className="mt-10 max-w-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-700">
                Create account
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Join SphereX
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                Enroll in courses, track progress, and earn certificates. Use an organization code
                if your school or company provided one.
              </p>
            </div>

            <form onSubmit={handleRegister} className="mt-8 max-w-md space-y-3.5" aria-busy={loading}>
              <div className="space-y-1.5">
                <Label htmlFor="full-name" className="text-xs font-medium text-slate-600">
                  Full name
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="full-name"
                    type="text"
                    className={fieldClass}
                    placeholder="Your name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

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
                <Label htmlFor="password" className="text-xs font-medium text-slate-600">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className={`${fieldClass} pr-10`}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
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

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-medium text-slate-600">
                  Confirm password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    className={fieldClass}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {showStudentOrgCode && (
                <div className="space-y-1.5 rounded-2xl border border-teal-200 bg-[#f5fbf3] p-3">
                  <Label htmlFor="student-org-code" className="text-xs font-medium text-teal-700">
                    Student organization code
                  </Label>
                  <Input
                    id="student-org-code"
                    placeholder="PETRO-STUDENT"
                    className="h-10 rounded-full border-teal-200 bg-white font-mono uppercase shadow-none focus-visible:ring-teal-600"
                    value={studentOrgCode}
                    onChange={(e) => setStudentOrgCode(e.target.value.toUpperCase())}
                    disabled={loading}
                  />
                </div>
              )}

              {showOrgCode && (
                <div className="space-y-1.5 rounded-2xl border border-teal-200 bg-[#f5fbf3] p-3">
                  <Label htmlFor="org-code" className="text-xs font-medium text-teal-700">
                    Teacher organization code
                  </Label>
                  <Input
                    id="org-code"
                    placeholder="PETRO-DEMO"
                    className="h-10 rounded-full border-teal-200 bg-white font-mono uppercase shadow-none focus-visible:ring-teal-600"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                    disabled={loading}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-xs">
                <button
                  type="button"
                  className="font-semibold text-teal-700 hover:underline"
                  onClick={() => setShowStudentOrgCode((v) => !v)}
                >
                  {showStudentOrgCode ? "Hide student code" : "Have a student code?"}
                </button>
                <button
                  type="button"
                  className="font-semibold text-teal-700 hover:underline"
                  onClick={() => setShowOrgCode((v) => !v)}
                >
                  {showOrgCode ? "Hide teacher code" : "Have a teacher code?"}
                </button>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="h-11 w-full gap-2 rounded-full bg-slate-950 text-sm font-semibold text-white hover:bg-slate-900"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create account
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-teal-700 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </section>

          <AuthMarketingPanel
            title="Start learning, track progress, and grow with your organization."
            subtitle="Courses, certificates, and progress tracking in one place."
          />
        </div>
      </div>
    </div>
  )
}
