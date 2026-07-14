import { requireAdminUser } from "@/lib/server-api"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminUser()
  return <>{children}</>
}
