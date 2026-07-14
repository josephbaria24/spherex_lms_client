"use client"

import { useCallback, useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, ExternalLink } from "lucide-react"
import { apiGet } from "@/lib/api"
import { TeacherPageHeader } from "@/components/teacher/teacher-page-header"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { teacherApiPath } from "@/lib/teacher-api"

type Material = {
  id: string
  title: string
  description?: string | null
  file_url?: string | null
  file_type?: string | null
  course_title?: string | null
  updated_at: string
}

export default function TeacherMaterialsPage() {
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setMaterials([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<{ materials: Material[] }>(teacherApiPath(selectedOrgId, "/materials"))
      setMaterials(data.materials ?? [])
    } finally {
      setLoading(false)
    }
  }, [selectedOrgId, loadingOrgs])

  useEffect(() => {
    load()
  }, [load])

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <TeacherPageHeader
          icon={FileText}
          title="Materials"
          accent="share resources"
          description="Learning resources linked to your courses"
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading materials…</p>
        ) : materials.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No materials yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Materials uploaded for your courses will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((m) => (
              <Card key={m.id} className="premium-card border border-border shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                      <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium leading-tight">{m.title}</h3>
                      {m.course_title && (
                        <p className="mt-1 text-xs text-muted-foreground">{m.course_title}</p>
                      )}
                      {m.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {m.file_type && <Badge variant="outline">{m.file_type}</Badge>}
                        {m.file_url && (
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </GrowMainLayout>
  )
}
