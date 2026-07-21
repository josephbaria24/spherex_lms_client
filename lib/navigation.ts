import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  BookOpen,
  ListOrdered,
  Users,
  ClipboardCheck,
  FileText,
  CalendarDays,
  Settings,
  Building2,
  Trophy,
  CreditCard,
} from "lucide-react"

export interface NavItem {
  label: string
  icon: LucideIcon
  href: string
}

export const studentNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Courses", icon: BookOpen, href: "/courses" },
  { label: "Achievements", icon: Trophy, href: "/achievements" },
  { label: "Training Sessions", icon: CalendarDays, href: "/training" },
  { label: "Materials", icon: FileText, href: "/materials" },
]

/** @deprecated Use buildTeacherNav(orgSlug) for org-scoped teacher links. */
export const teacherNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/teacher" },
  { label: "My Courses", icon: BookOpen, href: "/teacher" },
  { label: "Lessons", icon: ListOrdered, href: "/teacher" },
  { label: "Students", icon: Users, href: "/teacher" },
  { label: "Evaluations", icon: ClipboardCheck, href: "/teacher" },
  { label: "Materials", icon: FileText, href: "/teacher" },
  { label: "Sessions", icon: CalendarDays, href: "/teacher" },
] satisfies NavItem[]

/** @deprecated Use buildOrgAdminNav(orgSlug) for org-scoped links. */
export const orgAdminNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/org" },
  { label: "Members", icon: Users, href: "/org/members" },
  { label: "Courses", icon: BookOpen, href: "/org/courses" },
  { label: "Settings", icon: Settings, href: "/org/settings" },
]

export const adminNav: NavItem[] = [
  { label: "Admin Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Organizations", icon: Building2, href: "/admin/organizations" },
  { label: "Manage Courses", icon: BookOpen, href: "/admin/courses" },
  { label: "Payment requests", icon: CreditCard, href: "/admin/payment-requests" },
  { label: "E-Learning Materials", icon: FileText, href: "/admin/materials" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Analytics", icon: LayoutDashboard, href: "/admin/analytics" },
]
