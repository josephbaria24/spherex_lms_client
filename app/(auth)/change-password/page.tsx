"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authChangePassword, authMe } from "@/lib/api"
import { completeAuthSession } from "@/lib/post-auth-redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SphereXLogo } from "@/components/logo"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function ChangePasswordPage() {
  const router = useRouter()
  const [forced, setForced] = useState(false)
  const [checking, setChecking] = useState(true)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    authMe()
      .then(({ user }) => {
        setForced(Boolean(user.must_change_password))
        setChecking(false)
      })
      .catch(() => {
        router.replace("/login")
      })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authChangePassword({
        current_password: forced ? undefined : currentPassword,
        new_password: newPassword,
      })
      if (forced) {
        await completeAuthSession()
      } else {
        router.push("/settings")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password")
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const inputClass =
    "h-11 rounded-full border-slate-300 bg-white pr-12 text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-teal-500 dark:bg-white dark:text-slate-950"

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e7e7e7] p-4 text-slate-950">
      <div className="w-full max-w-md rounded-[14px] border border-black/5 bg-white p-8 shadow-lg">
        <SphereXLogo className="mb-6 h-9 w-auto" />
        <h1 className="text-2xl font-bold text-slate-950">
          {forced ? "Set a new password" : "Change password"}
        </h1>
        {forced ? (
          <p className="mt-2 text-sm text-slate-500">
            Your account was created with a temporary password. Choose a new one to continue.
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!forced ? (
            <div className="space-y-2">
              <Label htmlFor="current" className="text-slate-700">
                Current password
              </Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showCurrent ? "text" : "password"}
                  required
                  className={inputClass}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? "Hide current password" : "Show current password"}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="new" className="text-slate-700">
              New password
            </Label>
            <div className="relative">
              <Input
                id="new"
                type={showNew ? "text" : "password"}
                minLength={8}
                required
                className={inputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-slate-700">
              Confirm new password
            </Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                minLength={8}
                required
                className={inputClass}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-900"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save password"}
          </Button>
        </form>
      </div>
    </div>
  )
}
