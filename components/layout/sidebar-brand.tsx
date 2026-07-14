"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SphereXLogo } from "@/components/logo"
import { OrgLogo } from "@/components/org/org-logo"
import { useOptionalOrgAdmin } from "@/components/org/org-provider"
import { useOptionalTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { APP_NAME } from "@/lib/constants"
import { useAuth } from "@/app/provider"
import { orgAdminHomeFromStorage } from "@/lib/home-route"

type Props = {
  collapsed: boolean
}

export function SidebarBrand({ collapsed }: Props) {
  const { user, isAdmin, canAccessOrgAdmin } = useAuth()
  const orgContext = useOptionalOrgAdmin()
  const teacherOrgContext = useOptionalTeacherOrg()
  const selectedOrg = orgContext?.selectedOrg
  const teacherOrg = teacherOrgContext?.selectedOrg?.organization
  const brandOrg = selectedOrg
    ? {
        name: selectedOrg.name,
        logo: selectedOrg.logo,
        brand_primary: selectedOrg.brand_primary,
        logo_padding: selectedOrg.logo_padding,
        logo_position_x: selectedOrg.logo_position_x,
        logo_position_y: selectedOrg.logo_position_y,
      }
    : teacherOrg
      ? {
          name: teacherOrg.name,
          logo: teacherOrg.logo,
          brand_primary: teacherOrg.brand_primary,
          logo_padding: teacherOrg.logo_padding,
          logo_position_x: teacherOrg.logo_position_x,
          logo_position_y: teacherOrg.logo_position_y,
        }
      : null
  const [homeHref, setHomeHref] = useState("/dashboard")

  useEffect(() => {
    if (isAdmin) {
      setHomeHref("/admin")
      return
    }
    if (canAccessOrgAdmin) {
      setHomeHref(orgAdminHomeFromStorage())
      return
    }
    if (user?.role === "teacher") {
      setHomeHref("/teacher")
      return
    }
    setHomeHref("/dashboard")
  }, [user?.role, isAdmin, canAccessOrgAdmin])

  const logo = brandOrg ? (
    <OrgLogo
      logo={brandOrg.logo}
      name={brandOrg.name}
      brandColor={brandOrg.brand_primary}
      className={cn("rounded-xl", collapsed ? "h-9 w-9" : "h-8 w-8 sm:h-9 sm:w-9")}
      logo_padding={brandOrg.logo_padding}
      logo_position_x={brandOrg.logo_position_x}
      logo_position_y={brandOrg.logo_position_y}
    />
  ) : (
    <SphereXLogo
      className={cn(collapsed ? "h-9 px-0" : "h-8 w-auto px-[13px] sm:h-9")}
      priority
      alt=""
    />
  )

  const brand = (
    <Link
      href={homeHref}
      className={cn(
        "group flex min-w-0 items-center rounded-xl outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2",
        collapsed ? "justify-center" : "gap-1",
      )}
      aria-label={collapsed ? APP_NAME : undefined}
    >
      {logo}

      <div
        className={cn(
          "min-w-0 flex-1 space-y-px transition-all duration-300 ease-out",
          collapsed
            ? "max-w-0 -translate-x-1 overflow-hidden opacity-0"
            : "max-w-[9.5rem] translate-x-0 opacity-100 sm:max-w-[10.5rem]",
        )}
      >
        <p
          className="line-clamp-2 text-[12px] font-bold leading-none tracking-tight text-foreground sm:text-[13px]"
          title={brandOrg?.name ?? APP_NAME}
        >
          {brandOrg?.name ?? APP_NAME}
        </p>
        <p className="truncate text-[10px] font-medium leading-none text-muted-foreground">
          {brandOrg ? "Organization Workspace" : "Learning Management"}
        </p>
      </div>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{brand}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-[14rem]">
          <p className="font-semibold leading-snug">{brandOrg?.name ?? APP_NAME}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {brandOrg ? "Organization Workspace" : "Learning Management"}
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return brand
}
