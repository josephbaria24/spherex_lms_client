"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Award, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { CertificateTemplateEditor } from "@/components/admin/certificates/certificate-template-editor"
import { apiGet } from "@/lib/api"

type CourseDetail = {
  id: string
  title: string
}

export default function AdminCourseCertificatePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return
    setLoading(true)
    apiGet<{ course: CourseDetail }>(`/courses/${courseId}`)
      .then((data) => setCourse(data.course))
      .catch(() => toast.error("Could not load course"))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return (
      <GrowMainLayout>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </GrowMainLayout>
    )
  }

  if (!course) {
    return (
      <GrowMainLayout>
        <div className="space-y-4">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/admin/courses">
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">This course could not be found.</p>
        </div>
      </GrowMainLayout>
    )
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Award}
          title="Certificate template"
          accent="design the layout"
          description={course.title}
        >
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/admin/courses">
              <ArrowLeft className="h-4 w-4" />
              Back to courses
            </Link>
          </Button>
        </PageHeader>
        <CertificateTemplateEditor courseId={course.id} courseTitle={course.title} />
      </div>
    </GrowMainLayout>
  )
}
