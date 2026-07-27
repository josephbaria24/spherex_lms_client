"use client"

import { Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"

export function TeacherOrgSelector() {
  const { teachingOrgs, selectedOrgId, setSelectedOrgId, loadingOrgs } = useTeacherOrg()

  if (loadingOrgs) {
    return <span className="text-sm text-muted-foreground">Loading…</span>
  }

  if (teachingOrgs.length === 0) return null

  return (
    <Select value={selectedOrgId ?? undefined} onValueChange={setSelectedOrgId}>
      <SelectTrigger className="h-9 min-w-[220px] gap-2 border-[#e5e8ee] bg-white text-[#0f172a] shadow-none">
        <Building2 className="h-4 w-4 shrink-0 text-teal-600" />
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {teachingOrgs.map((membership) => (
          <SelectItem key={membership.organization_id} value={membership.organization_id}>
            {membership.organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
