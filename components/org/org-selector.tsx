"use client"

import { Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOrgAdmin } from "@/components/org/org-provider"

export function OrgSelector() {
  const { orgAdminOrgs, selectedOrgId, setSelectedOrgId } = useOrgAdmin()

  if (orgAdminOrgs.length <= 1) {
    const org = orgAdminOrgs[0]
    if (!org) return null
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4 text-teal-600" />
        <span className="font-medium text-foreground">{org.name}</span>
      </div>
    )
  }

  return (
    <Select value={selectedOrgId ?? undefined} onValueChange={setSelectedOrgId}>
      <SelectTrigger className="h-9 w-[220px]">
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {orgAdminOrgs.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
