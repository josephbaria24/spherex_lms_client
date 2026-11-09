"use client"

import { Spinner } from "@/components/ui/spinner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiPost, ApiError } from "@/lib/api"
import { useAuth } from "@/app/provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"

export type JoinOrganizationMode = "teacher" | "student"

export type RedeemedCourse = {
  id: string
  title: string
  created: boolean
}

type JoinOrganizationFormProps = {
  mode?: JoinOrganizationMode
  onSuccess?: (orgName: string) => void
  /** Student mode: called when a course enrollment code succeeds */
  onCourseEnrolled?: (course: RedeemedCourse) => void
  redirectTo?: string
  compact?: boolean
  dense?: boolean
}

export function JoinOrganizationForm({
  mode = "teacher",
  onSuccess,
  onCourseEnrolled,
  redirectTo,
  compact = false,
  dense = false,
}: JoinOrganizationFormProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { refresh } = useAuth()

  const isStudent = mode === "student"
  const joinPath = isStudent ? "/organizations/join/student" : "/organizations/join"
  const defaultRedirect = isStudent ? "/courses" : "/teacher"
  const resolvedRedirect = redirectTo ?? defaultRedirect

  async function redeemCourseCode(normalized: string): Promise<RedeemedCourse> {
    const data = await apiPost<{
      created: boolean
      course: { id: string; title: string }
    }>("/enrollments/redeem-code", { code: normalized })
    return {
      id: data.course.id,
      title: data.course.title,
      created: data.created,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const normalized = code.trim().toUpperCase()
    try {
      const data = await apiPost<{
        organization: { name: string }
        promoted_to_teacher?: boolean
      }>(joinPath, { code: normalized })
      setSuccess(`Joined ${data.organization.name}`)
      await refresh()
      onSuccess?.(data.organization.name)
      if (resolvedRedirect) {
        setTimeout(() => router.push(resolvedRedirect), 600)
      }
    } catch (orgErr) {
      if (!isStudent) {
        setError(orgErr instanceof Error ? orgErr.message : "Could not join organization")
        return
      }

      const orgNotFound =
        orgErr instanceof ApiError
          ? orgErr.status === 404
          : orgErr instanceof Error && /invalid|not found/i.test(orgErr.message)

      if (!orgNotFound) {
        setError(orgErr instanceof Error ? orgErr.message : "Could not join organization")
        return
      }

      try {
        const course = await redeemCourseCode(normalized)
        setCode("")
        setSuccess(
          course.created
            ? `Enrolled in ${course.title}`
            : `You're already enrolled in ${course.title}`,
        )
        onCourseEnrolled?.(course)
        if (!onCourseEnrolled && resolvedRedirect) {
          setTimeout(() => router.push(`/courses/${course.id}/learn`), 600)
        }
      } catch (courseErr) {
        setError(
          courseErr instanceof Error
            ? courseErr.message === "Invalid course code"
              ? "That code isn’t valid for an organization or a course"
              : courseErr.message
            : "Could not redeem code",
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const label = isStudent
    ? compact
      ? "Organization or course code"
      : "Enter an organization student code or a course access code"
    : compact
      ? "Teacher organization code"
      : "Enter the teacher code from your organization admin"

  const placeholder = isStudent ? "e.g. PETRO-STUDENT or ENR-…" : "e.g. PETRO-DEMO"

  if (dense) {
    return (
      <form onSubmit={handleSubmit} className="space-y-1.5">
        <div className="flex min-w-0 items-center gap-1 rounded-full border border-[#FFD0C2] bg-white p-1 pl-3 shadow-sm dark:border-[#FF4B1A]/30 dark:bg-background">
          <Input
            id={`org-join-code-${mode}`}
            aria-label={label}
            placeholder="Enter code"
            className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 font-mono text-xs uppercase tracking-wider shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={loading}
            required
            minLength={4}
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 shrink-0 rounded-full bg-[#FF4B1A] px-3.5 text-xs font-semibold text-white hover:bg-[#e84314]"
            disabled={loading || !code.trim()}
          >
            {loading ? <Spinner size={14} /> : "Join"}
          </Button>
        </div>
        {error ? <p className="text-[11px] leading-4 text-destructive">{error}</p> : null}
        {success ? <p className="text-[11px] leading-4 text-emerald-700 dark:text-emerald-400">{success}</p> : null}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className="space-y-2">
        {!compact && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-teal-600" />
            {isStudent ? "Organization or course code" : "Teacher organization code"}
          </div>
        )}
        <Label htmlFor={`org-join-code-${mode}`} className={compact ? "text-[11px] text-muted-foreground" : undefined}>
          {label}
        </Label>
        <Input
          id={`org-join-code-${mode}`}
          placeholder={placeholder}
          className="font-mono uppercase tracking-wider"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          disabled={loading}
          required
          minLength={4}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}

      <Button type="submit" className="w-full gap-2 rounded-xl" disabled={loading || !code.trim()}>
        {loading ? (
          <>
            <Spinner size={16} />
            Joining…
          </>
        ) : isStudent ? (
          "Join / unlock"
        ) : (
          "Join as teacher"
        )}
      </Button>
    </form>
  )
}
