"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/provider"
import { apiGet } from "@/lib/api"
import { isAdmin } from "@/lib/roles"
import { fetchTeacherWorkspaceOrgs } from "@/lib/teacher-orgs"
import type { OrgMembership } from "@/lib/org-types"
import {
  TEACHER_ORG_ID_STORAGE_KEY,
  TEACHER_ORG_SLUG_STORAGE_KEY,
  getTeacherOrgSlugFromPath,
  getTeacherSubpath,
  teacherRoute,
} from "@/lib/teacher-routes"

type TeacherOrgContextValue = {
  teachingOrgs: OrgMembership[]
  selectedOrgId: string | null
  selectedOrgSlug: string | null
  selectedOrg: OrgMembership | null
  setSelectedOrgId: (id: string) => void
  refreshOrgs: () => Promise<void>
  loadingOrgs: boolean
}

const TeacherOrgContext = createContext<TeacherOrgContextValue | undefined>(undefined)

export function TeacherOrgProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const urlSlug = getTeacherOrgSlugFromPath(pathname ?? "")
  const [teachingOrgs, setTeachingOrgs] = useState<OrgMembership[]>([])
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null)
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  const refreshOrgs = useCallback(async () => {
    setLoadingOrgs(true)
    try {
      const orgs = await fetchTeacherWorkspaceOrgs(isAdmin(user?.role))
      setTeachingOrgs(orgs)
    } catch {
      setTeachingOrgs([])
    } finally {
      setLoadingOrgs(false)
    }
  }, [user?.role])

  useEffect(() => {
    if (pathname?.startsWith("/teacher")) {
      refreshOrgs()
    }
  }, [pathname, refreshOrgs])

  useEffect(() => {
    if (teachingOrgs.length === 0 && !urlSlug) {
      setSelectedOrgIdState(null)
      return
    }

    if (urlSlug) {
      const fromUrl = teachingOrgs.find((o) => o.organization.slug === urlSlug)
      if (fromUrl) {
        setSelectedOrgIdState(fromUrl.organization_id)
        localStorage.setItem(TEACHER_ORG_ID_STORAGE_KEY, fromUrl.organization_id)
        localStorage.setItem(TEACHER_ORG_SLUG_STORAGE_KEY, fromUrl.organization.slug)
        return
      }

      // Platform admin: resolve org id from slug while org list loads
      if (isAdmin(user?.role) && !loadingOrgs) {
        apiGet<{ organization: { id: string; slug: string } }>(
          `/organizations/public/${urlSlug}`,
        )
          .then((data) => {
            if (data.organization?.id) {
              setSelectedOrgIdState(data.organization.id)
              localStorage.setItem(TEACHER_ORG_ID_STORAGE_KEY, data.organization.id)
              localStorage.setItem(TEACHER_ORG_SLUG_STORAGE_KEY, data.organization.slug)
            }
          })
          .catch(() => {})
      }
      return
    }

    setSelectedOrgIdState((prev) => {
      if (prev && teachingOrgs.some((o) => o.organization_id === prev)) return prev
      const storedId = localStorage.getItem(TEACHER_ORG_ID_STORAGE_KEY)
      if (storedId && teachingOrgs.some((o) => o.organization_id === storedId)) return storedId
      const storedSlug = localStorage.getItem(TEACHER_ORG_SLUG_STORAGE_KEY)
      const fromSlug = storedSlug
        ? teachingOrgs.find((o) => o.organization.slug === storedSlug)?.organization_id
        : null
      return fromSlug ?? teachingOrgs[0]?.organization_id ?? null
    })
  }, [teachingOrgs, urlSlug, user?.role, loadingOrgs])

  const setSelectedOrgId = useCallback(
    (id: string) => {
      const membership = teachingOrgs.find((o) => o.organization_id === id)
      if (!membership) return

      setSelectedOrgIdState(id)
      localStorage.setItem(TEACHER_ORG_ID_STORAGE_KEY, id)
      localStorage.setItem(TEACHER_ORG_SLUG_STORAGE_KEY, membership.organization.slug)

      if (urlSlug) {
        const subpath = getTeacherSubpath(pathname ?? "", urlSlug)
        router.push(teacherRoute(membership.organization.slug, subpath))
      } else {
        router.push(teacherRoute(membership.organization.slug))
      }
    },
    [teachingOrgs, urlSlug, pathname, router],
  )

  const selectedOrg = useMemo(
    () => teachingOrgs.find((o) => o.organization_id === selectedOrgId) ?? null,
    [teachingOrgs, selectedOrgId],
  )

  const selectedOrgSlug = selectedOrg?.organization.slug ?? urlSlug

  return (
    <TeacherOrgContext.Provider
      value={{
        teachingOrgs,
        selectedOrgId,
        selectedOrgSlug,
        selectedOrg,
        setSelectedOrgId,
        refreshOrgs,
        loadingOrgs,
      }}
    >
      {children}
    </TeacherOrgContext.Provider>
  )
}

export function useTeacherOrg() {
  const ctx = useContext(TeacherOrgContext)
  if (!ctx) throw new Error("useTeacherOrg must be used within TeacherOrgProvider")
  return ctx
}

export function useOptionalTeacherOrg() {
  return useContext(TeacherOrgContext) ?? null
}
