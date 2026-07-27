import { cn } from "@/lib/utils"

export function sidebarPrimaryNavLinkClass(active: boolean, collapsed = false) {
  return cn(
    "floating-nav-item transition-colors duration-200",
    collapsed ? "h-11 w-full justify-center gap-0 px-0" : "h-11 gap-3",
    active
      ? "bg-[#1a1f2e] font-semibold text-white shadow-sm dark:bg-[#12151f]"
      : "floating-nav-item-inactive",
  )
}

export function sidebarSectionLabelClass() {
  return "px-3 pb-2 pt-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
}
