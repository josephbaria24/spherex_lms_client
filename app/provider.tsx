"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { apiGet, authLogout, authMe, type AuthUser } from "@/lib/api"
import { canAccessOrgAdminPanel, isAdmin } from "@/lib/roles"

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  orgAdminCount: number
  canAccessOrgAdmin: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const Context = createContext<AuthContextValue | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [orgAdminCount, setOrgAdminCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user: nextUser } = await authMe()
      setUser(nextUser)
      try {
        const data = await apiGet<{ organizations: unknown[] }>("/org-admin/mine")
        setOrgAdminCount(data.organizations?.length ?? 0)
      } catch {
        setOrgAdminCount(0)
      }
    } catch {
      setUser(null)
      setOrgAdminCount(0)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
    window.location.href = "/login"
  }, [])

  return (
    <Context.Provider
      value={{
        user,
        loading,
        isAdmin: isAdmin(user?.role),
        orgAdminCount,
        canAccessOrgAdmin: canAccessOrgAdminPanel(user?.role, orgAdminCount),
        refresh,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useAuth() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error("useAuth must be used inside Providers")
  }
  return context
}

/** @deprecated Use useAuth instead */
export const useSupabase = () => {
  const { user, loading, logout } = useAuth()
  return {
    user: user
      ? { id: user.id, email: user.email, role: user.role }
      : null,
    loading,
    supabase: null,
    logout,
  }
}
