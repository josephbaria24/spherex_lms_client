"use client"

import { useCallback, useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Clock } from "lucide-react"
import { apiGet } from "@/lib/api"
import { TeacherPageHeader } from "@/components/teacher/teacher-page-header"
import { useTeacherOrg } from "@/components/teacher/teacher-org-provider"
import { teacherApiPath } from "@/lib/teacher-api"

type Session = {
  id: string
  title: string
  description?: string | null
  scheduled_date: string
  duration_minutes?: number | null
  location?: string | null
  status?: string | null
  course_title?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function TeacherSessionsPage() {
  const { selectedOrgId, loadingOrgs } = useTeacherOrg()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!selectedOrgId) {
      setSessions([])
      setLoading(loadingOrgs)
      return
    }
    setLoading(true)
    try {
      const data = await apiGet<{ sessions: Session[] }>(teacherApiPath(selectedOrgId, "/sessions"))
      setSessions(data.sessions ?? [])
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
          icon={CalendarDays}
          title="Training sessions"
          accent="connect live"
          description="Scheduled live or virtual sessions for your courses"
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <Card className="premium-card border border-border shadow-none">
            <CardContent className="p-8 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No sessions scheduled</p>
              <p className="mt-1 text-sm text-muted-foreground">Upcoming training sessions for your courses will show here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.id} className="premium-card border border-border shadow-none">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{s.title}</h3>
                      {s.course_title && (
                        <p className="text-sm text-muted-foreground">{s.course_title}</p>
                      )}
                    </div>
                    {s.status && <Badge variant="secondary">{s.status}</Badge>}
                  </div>
                  {s.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(s.scheduled_date)}
                    </span>
                    {s.duration_minutes != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {s.duration_minutes} min
                      </span>
                    )}
                    {s.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {s.location}
                      </span>
                    )}
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
