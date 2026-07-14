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

  if (teachingOrgs.length === 1) {
    const org = teachingOrgs[0]!
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 text-teal-600" />
        <span className="font-medium text-foreground">{org.organization.name}</span>
      </div>
    )
  }

  return (
    <Select value={selectedOrgId ?? undefined} onValueChange={setSelectedOrgId}>
      <SelectTrigger className="h-9 w-[220px]">
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
