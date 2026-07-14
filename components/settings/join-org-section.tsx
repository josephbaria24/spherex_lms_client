"use client"

import { useEffect, useState } from "react"
import { apiGet } from "@/lib/api"
import type { OrgMembership } from "@/lib/org-types"
import {
  getStudentMemberships,
  hasAnyOrganization,
  hasTeachingOrganization,
} from "@/lib/org-membership"
import { JoinOrganizationForm } from "@/components/org/join-organization-form"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/provider"
import { isStudent, isAdmin } from "@/lib/roles"
import { cn } from "@/lib/utils"

type JoinOrgSectionProps = {
  /** @deprecated Use variant="grow" */
  variant?: "default" | "student" | "grow"
}

export function JoinOrgSection({ variant = "default" }: JoinOrgSectionProps) {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [loading, setLoading] = useState(true)
  const isGrowStyle = variant === "grow" || variant === "student"

  useEffect(() => {
    apiGet<{ memberships: OrgMembership[] }>("/organizations/me")
      .then((data) => setMemberships(data.memberships ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  if (isAdmin(user?.role) && !hasAnyOrganization(memberships)) {
    return null
  }

  const shellClass = isGrowStyle
    ? "grow-card p-6"
    : "rounded-xl border border-border bg-card p-6 shadow-none"

  if (hasAnyOrganization(memberships)) {
    return (
      <section className={cn(isGrowStyle ? "grow-card-lime p-6" : shellClass)}>
        <h2 className="text-xl font-semibold text-[#1c1917] dark:text-foreground">
          Organizations
        </h2>
        <ul className="mt-4 space-y-2">
          {memberships.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-2xl bg-white/60 px-3 py-2 text-sm dark:bg-white/10"
            >
              <span className="font-medium text-[#1c1917] dark:text-foreground">
                {m.organization.name}
              </span>
              <Badge className="grow-badge">{m.role}</Badge>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  const showStudentJoin = isStudent(user?.role)
  const showTeacherJoin = !showStudentJoin && !isAdmin(user?.role)

  if (!showStudentJoin && !showTeacherJoin) return null

  return (
    <section
      className={cn(
        isGrowStyle
          ? "grow-card-accent border border-dashed border-[#c9bfd8] p-6 dark:border-violet-500/30"
          : shellClass,
      )}
    >
      <h2 className="text-xl font-semibold text-[#1c1917] dark:text-foreground">
        Join an organization
      </h2>
      <p className="mt-1 text-sm text-[#6b5c4f] dark:text-muted-foreground">
        {showStudentJoin
          ? "Enter the student code from your training provider to access their courses."
          : "Have a teacher code from your organization? Enter it below to join as an instructor."}
      </p>
      <div className="mt-4 max-w-sm">
        <JoinOrganizationForm
          mode={showStudentJoin ? "student" : "teacher"}
          compact
          redirectTo={showStudentJoin ? "/courses" : "/teacher"}
        />
      </div>
    </section>
  )
}

export function StudentJoinBanner() {
  const { user } = useAuth()
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isStudent(user?.role)) {
      setLoading(false)
      return
    }
    apiGet<{ memberships: OrgMembership[] }>("/organizations/me")
      .then((data) => setMemberships(data.memberships ?? []))
      .finally(() => setLoading(false))
  }, [user?.role])

  if (loading || !isStudent(user?.role) || getStudentMemberships(memberships).length > 0) {
    return null
  }

  if (hasTeachingOrganization(memberships)) return null

  return (
    <section className="grow-card-lime border border-dashed border-[#a8c97a] p-6 dark:border-lime-500/30">
      <h2 className="text-lg font-bold text-[#1c1917] dark:text-foreground">
        Join your training organization
      </h2>
      <p className="mt-1 text-sm text-[#4a5c3a] dark:text-muted-foreground">
        Join your organization to unlock free org courses, or use an enrollment code / payment when
        enrolling from the catalog.
      </p>
      <div className="mt-4 max-w-md">
        <JoinOrganizationForm mode="student" compact redirectTo="/courses" />
      </div>
    </section>
  )
}
