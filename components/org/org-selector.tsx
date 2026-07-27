"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useOrgAdmin } from "@/components/org/org-provider"

export function OrgSelector({ className }: { className?: string }) {
  const { orgAdminOrgs, selectedOrgId, setSelectedOrgId } = useOrgAdmin()

  if (orgAdminOrgs.length <= 1) {
    const org = orgAdminOrgs[0]
    if (!org) return null
    return (
      <div
        className={cn(
          "rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm font-medium text-[#0f172a]",
          className,
        )}
      >
        {org.name}
      </div>
    )
  }

  return (
    <Select value={selectedOrgId ?? undefined} onValueChange={setSelectedOrgId}>
      <SelectTrigger
        className={cn(
          "h-10 w-[220px] rounded-lg border-[#e2e8f0] bg-white text-sm shadow-none",
          className,
        )}
      >
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
