"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiPost } from "@/lib/api"
import { useAuth } from "@/app/provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Loader2 } from "lucide-react"

export type JoinOrganizationMode = "teacher" | "student"

type JoinOrganizationFormProps = {
  mode?: JoinOrganizationMode
  onSuccess?: (orgName: string) => void
  redirectTo?: string
  compact?: boolean
}

export function JoinOrganizationForm({
  mode = "teacher",
  onSuccess,
  redirectTo,
  compact = false,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const data = await apiPost<{
        organization: { name: string }
        promoted_to_teacher?: boolean
      }>(joinPath, { code: code.trim() })
      setSuccess(`Joined ${data.organization.name}`)
      await refresh()
      onSuccess?.(data.organization.name)
      if (resolvedRedirect) {
        setTimeout(() => router.push(resolvedRedirect), 600)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join organization")
    } finally {
      setLoading(false)
    }
  }

  const label = isStudent
    ? compact
      ? "Student organization code"
      : "Enter the student code from your organization"
    : compact
      ? "Teacher organization code"
      : "Enter the teacher code from your organization admin"

  const placeholder = isStudent ? "e.g. PETRO-STUDENT" : "e.g. PETRO-DEMO"

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className="space-y-2">
        {!compact && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <Building2 className="h-4 w-4 text-teal-600" />
            {isStudent ? "Student organization code" : "Teacher organization code"}
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
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining…
          </>
        ) : (
          `Join as ${isStudent ? "student" : "teacher"}`
        )}
      </Button>
    </form>
  )
}
