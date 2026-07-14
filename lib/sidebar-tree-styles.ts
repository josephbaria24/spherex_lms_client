import { cn } from "@/lib/utils"

export function sidebarPrimaryNavLinkClass(active: boolean, collapsed = false) {
  return cn(
    "floating-nav-item transition-colors duration-200",
    collapsed ? "h-9 w-full justify-center gap-0 px-0" : "h-9 gap-2.5",
    active
      ? "bg-[#1a1f2e] font-semibold text-white shadow-sm dark:bg-[#12151f]"
      : "floating-nav-item-inactive",
  )
}

export function sidebarSectionLabelClass() {
  return "px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
}
