"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { apiGet, apiPost, apiPut } from "@/lib/api"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { GrowHeader } from "@/components/grow-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Award,
  ExternalLink,
  Search,
  Settings2,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

type CourseCertRow = {
  course_id: string
  course_title: string
  template_ready: boolean
  template_image: string | null
  issued_count: number
  serial_prefix: string | null
  serial_digits: number | null
  serial_next: number | null
  sample_serial: string | null
}

type Totals = {
  courses: number
  templates_ready: number
  issued_lms: number
  issued_legacy: number
  issued_ielts: number
  registry_total: number
}

type RegistryRow = {
  id?: string
  serial_number: string
  course_title: string
  learner_name: string
  learner_email?: string | null
  issued_at: string
  source: "lms" | "legacy" | "ielts"
}

export default function AdminCertificatesPage() {
  const [view, setView] = useState<"courses" | "registry">("courses")
  const [courses, setCourses] = useState<CourseCertRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [registry, setRegistry] = useState<RegistryRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [editing, setEditing] = useState<CourseCertRow | null>(null)
  const [prefix, setPrefix] = useState("")
  const [digits, setDigits] = useState(6)
  const [nextNumber, setNextNumber] = useState(1)
  const [savingSerial, setSavingSerial] = useState(false)

  const loadOverview = useCallback(async () => {
    const data = await apiGet<{ courses: CourseCertRow[]; totals: Totals }>(
      "/certificates/admin/overview",
    )
    setCourses(data.courses ?? [])
    setTotals(data.totals ?? null)
  }, [])

  const loadRegistry = useCallback(async (q = "") => {
    const params = new URLSearchParams()
    if (q.trim()) params.set("search", q.trim())
    params.set("limit", "200")
    const data = await apiGet<{ certificates: RegistryRow[] }>(
      `/certificates/admin/registry?${params.toString()}`,
    )
    setRegistry(data.certificates ?? [])
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      // Overview first so registry tables are created before the registry list loads.
      await loadOverview()
      await loadRegistry(search)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load certificates")
    } finally {
      setLoading(false)
    }
  }, [loadOverview, loadRegistry, search])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || view !== "courses") return courses
    return courses.filter(
      (c) =>
        c.course_title.toLowerCase().includes(q) ||
        (c.serial_prefix ?? "").toLowerCase().includes(q) ||
        (c.sample_serial ?? "").toLowerCase().includes(q),
    )
  }, [courses, search, view])

  function openSerialEditor(row: CourseCertRow) {
    setEditing(row)
    setPrefix(row.serial_prefix ?? suggestPrefix(row.course_title))
    setDigits(row.serial_digits ?? 6)
    setNextNumber(row.serial_next ?? 1)
  }

  async function saveSerial() {
    if (!editing) return
    setSavingSerial(true)
    try {
      const data = await apiPut<{ settings: unknown; sample: string }>(
        `/certificates/admin/serial/${editing.course_id}`,
        {
          prefix,
          digits,
          next_number: nextNumber,
        },
      )
      toast.success(`Serial saved · next ${data.sample}`)
      setEditing(null)
      await loadOverview()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save serial settings")
    } finally {
      setSavingSerial(false)
    }
  }

  async function importLegacy() {
    setImporting(true)
    try {
      const data = await apiPost<{ imported: number; skipped: number }>(
        "/certificates/admin/import-legacy",
        {},
      )
      toast.success(`Imported ${data.imported} legacy certificates (${data.skipped} skipped)`)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed")
    } finally {
      setImporting(false)
    }
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <GrowHeader
          icon={Award}
          title="Certificates"
          accent="setup & registry"
          description="Templates, serial codes, issued counts, and the public certificate tracker"
          showDate={false}
        >
          <Button variant="outline" asChild>
            <Link href="/certificates" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Public tracker
            </Link>
          </Button>
          <Button onClick={() => void importLegacy()} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importing…" : "Import legacy CSV"}
          </Button>
        </GrowHeader>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Courses" value={totals?.courses ?? 0} />
          <Stat label="Templates ready" value={totals?.templates_ready ?? 0} />
          <Stat label="LMS issued" value={totals?.issued_lms ?? 0} />
          <Stat
            label="Registry total"
            value={totals?.registry_total ?? 0}
            hint={`Legacy ${totals?.issued_legacy ?? 0} · IELTS ${totals?.issued_ielts ?? 0}`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "courses" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setView("courses")}
          >
            Course setup ({courses.length})
          </Button>
          <Button
            variant={view === "registry" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setView("registry")}
          >
            Registry ({totals?.registry_total ?? registry.length})
          </Button>
        </div>

        <div className="grow-toolbar">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                view === "courses"
                  ? "Search courses or serial codes…"
                  : "Search serial, learner, course, or email…"
              }
              className="grow-input pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && view === "registry") void loadRegistry(search)
              }}
            />
          </div>
          {view === "registry" ? (
            <Button variant="outline" onClick={() => void loadRegistry(search)}>
              Search
            </Button>
          ) : null}
        </div>

        {view === "courses" ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Course
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Template
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Issued
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Serial code
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Next serial
                    </th>
                    <th className="p-4 text-right text-sm font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        No courses found
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((row) => (
                      <tr
                        key={row.course_id}
                        className="border-b border-border last:border-0 hover:bg-accent/40"
                      >
                        <td className="p-4 font-medium">{row.course_title}</td>
                        <td className="p-4">
                          {row.template_ready ? (
                            <Badge className="gap-1 bg-emerald-600/90">
                              <CheckCircle2 className="h-3 w-3" />
                              Ready
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Not set
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 font-semibold">{row.issued_count}</td>
                        <td className="p-4 font-mono text-sm">
                          {row.serial_prefix ?? (
                            <span className="text-muted-foreground">Default SPX-CERT</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-sm">
                          {row.sample_serial ?? "—"}
                          {row.serial_digits != null ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {row.serial_digits} digits
                            </span>
                          ) : null}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => openSerialEditor(row)}
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                              Serial
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/courses/${row.course_id}/certificate`}>
                                Template
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Serial
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Learner
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Training
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Source
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-muted-foreground">
                      Issued
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registry.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">
                        {loading ? "Loading…" : "No certificates in the registry yet"}
                      </td>
                    </tr>
                  ) : (
                    registry.map((row) => (
                      <tr
                        key={`${row.serial_number}-${row.issued_at}`}
                        className="border-b border-border last:border-0 hover:bg-accent/40"
                      >
                        <td className="p-4">
                          <Link
                            href={`/verify/${encodeURIComponent(row.serial_number)}`}
                            className="font-mono text-sm font-semibold text-[#FF4B1A] hover:underline"
                          >
                            {row.serial_number}
                          </Link>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{row.learner_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.learner_email || "—"}
                          </p>
                        </td>
                        <td className="p-4">{row.course_title}</td>
                        <td className="p-4">
                          <Badge variant="outline">{row.source}</Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(row.issued_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {editing ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-md space-y-4 p-5">
              <div>
                <h2 className="text-lg font-semibold">Serial settings</h2>
                <p className="text-sm text-muted-foreground">{editing.course_title}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prefix">Serial code / prefix</Label>
                <Input
                  id="prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="PSI-ELA-LOTO"
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="digits">Digits</Label>
                  <Input
                    id="digits"
                    type="number"
                    min={3}
                    max={12}
                    value={digits}
                    onChange={(e) => setDigits(Number(e.target.value) || 6)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next">Starts / next number</Label>
                  <Input
                    id="next"
                    type="number"
                    min={1}
                    value={nextNumber}
                    onChange={(e) => setNextNumber(Number(e.target.value) || 1)}
                  />
                </div>
              </div>
              <p className="rounded-md border border-border bg-muted/20 px-3 py-2 font-mono text-sm">
                Next: {prefix || "PREFIX"}-{String(nextNumber).padStart(digits || 6, "0")}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={savingSerial}>
                  Cancel
                </Button>
                <Button onClick={() => void saveSerial()} disabled={savingSerial || !prefix.trim()}>
                  {savingSerial ? "Saving…" : "Save"}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </GrowMainLayout>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint?: string
}) {
  return (
    <div className="grow-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function suggestPrefix(title: string): string {
  const cleaned = title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
  const initials = cleaned.map((w) => w[0]).join("").slice(0, 8)
  return `PSI-ELA-${initials || "COURSE"}`
}
