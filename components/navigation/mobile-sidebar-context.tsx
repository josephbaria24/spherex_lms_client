"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type MobileSidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const MobileSidebarContext = createContext<MobileSidebarContextValue | null>(null)

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((value) => !value), [])
  const value = useMemo(
    () => ({ open, setOpen, toggle }),
    [open, toggle],
  )

  return (
    <MobileSidebarContext.Provider value={value}>{children}</MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext)
  if (!context) {
    throw new Error("useMobileSidebar must be used within MobileSidebarProvider")
  }
  return context
}
