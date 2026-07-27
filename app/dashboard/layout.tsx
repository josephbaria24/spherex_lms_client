import { OrgAdminHomeRedirect } from "@/components/org/org-admin-home-redirect"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrgAdminHomeRedirect />
      {children}
    </>
  )
}
