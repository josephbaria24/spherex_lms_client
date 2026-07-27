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
import { apiGet } from "@/lib/api"
import type { OrgAdminOrganization } from "@/lib/org-types"
import {
  ORG_ID_STORAGE_KEY,
  ORG_SLUG_STORAGE_KEY,
  getOrgSlugFromPath,
  getOrgSubpath,
  orgRoute,
} from "@/lib/org-routes"

type OrgContextValue = {
  orgAdminOrgs: OrgAdminOrganization[]
  selectedOrgId: string | null
  selectedOrgSlug: string | null
  selectedOrg: OrgAdminOrganization | null
  setSelectedOrgId: (id: string) => void
  refreshOrgs: () => Promise<void>
  loadingOrgs: boolean
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined)

export function OrgProvider({
  children,
  enabled,
}: {
  children: React.ReactNode
  enabled: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const urlSlug = getOrgSlugFromPath(pathname ?? "")
  const [orgAdminOrgs, setOrgAdminOrgs] = useState<OrgAdminOrganization[]>([])
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null)
  const [loadingOrgs, setLoadingOrgs] = useState(enabled)

  const refreshOrgs = useCallback(async () => {
    if (!enabled) {
      setOrgAdminOrgs([])
      setLoadingOrgs(false)
      return
    }
    setLoadingOrgs(true)
    try {
      const data = await apiGet<{ organizations: OrgAdminOrganization[] }>("/org-admin/mine")
      setOrgAdminOrgs(data.organizations ?? [])
    } catch {
      setOrgAdminOrgs([])
    } finally {
      setLoadingOrgs(false)
    }
  }, [enabled])

  useEffect(() => {
    if (enabled) refreshOrgs()
  }, [enabled, refreshOrgs, pathname])

  useEffect(() => {
    if (!enabled) {
      setSelectedOrgIdState(null)
      return
    }
    if (loadingOrgs) return
    if (orgAdminOrgs.length === 0) {
      setSelectedOrgIdState(null)
      return
    }

    if (urlSlug) {
      const fromUrl = orgAdminOrgs.find((o) => o.slug === urlSlug)
      if (fromUrl) {
        setSelectedOrgIdState(fromUrl.id)
        localStorage.setItem(ORG_ID_STORAGE_KEY, fromUrl.id)
        localStorage.setItem(ORG_SLUG_STORAGE_KEY, fromUrl.slug)
        return
      }
    }

    setSelectedOrgIdState((prev) => {
      if (prev && orgAdminOrgs.some((o) => o.id === prev)) return prev
      const storedId = localStorage.getItem(ORG_ID_STORAGE_KEY)
      if (storedId && orgAdminOrgs.some((o) => o.id === storedId)) return storedId
      const storedSlug = localStorage.getItem(ORG_SLUG_STORAGE_KEY)
      const fromSlug = storedSlug
        ? orgAdminOrgs.find((o) => o.slug === storedSlug)?.id
        : null
      return fromSlug ?? orgAdminOrgs[0]?.id ?? null
    })
  }, [enabled, orgAdminOrgs, urlSlug, loadingOrgs])

  const setSelectedOrgId = useCallback(
    (id: string) => {
      const org = orgAdminOrgs.find((o) => o.id === id)
      if (!org) return

      setSelectedOrgIdState(id)
      localStorage.setItem(ORG_ID_STORAGE_KEY, id)
      localStorage.setItem(ORG_SLUG_STORAGE_KEY, org.slug)

      if (urlSlug) {
        const subpath = getOrgSubpath(pathname ?? "", urlSlug)
        router.push(orgRoute(org.slug, subpath))
      } else {
        router.push(orgRoute(org.slug))
      }
    },
    [orgAdminOrgs, urlSlug, pathname, router],
  )

  const selectedOrg = useMemo(
    () => orgAdminOrgs.find((o) => o.id === selectedOrgId) ?? null,
    [orgAdminOrgs, selectedOrgId],
  )

  const selectedOrgSlug = selectedOrg?.slug ?? urlSlug

  return (
    <OrgContext.Provider
      value={{
        orgAdminOrgs,
        selectedOrgId,
        selectedOrgSlug,
        selectedOrg,
        setSelectedOrgId,
        refreshOrgs,
        loadingOrgs,
      }}
    >
      {children}
    </OrgContext.Provider>
  )
}

export function useOrgAdmin() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error("useOrgAdmin must be used within OrgProvider")
  return ctx
}

export function useOptionalOrgAdmin() {
  return useContext(OrgContext) ?? null
}
