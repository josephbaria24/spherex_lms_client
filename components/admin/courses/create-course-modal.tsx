"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CourseDurationFields } from "@/components/admin/courses/course-duration-fields"
import { CoursePriceFields } from "@/components/admin/courses/course-price-fields"
import { apiGet, apiPost } from "@/lib/api"
import { Plus } from "lucide-react"
import { toast } from "sonner"

type Organization = { id: string; name: string; slug: string }

interface Props {
  onCreated: () => void
  defaultOrganizationId?: string
}

export function CreateCourseModal({ onCreated, defaultOrganizationId }: Props) {
  const [open, setOpen] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [formData, setFormData] = useState({
    organization_id: defaultOrganizationId ?? "",
    title: "",
    description: "",
    category: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced" | "",
    duration: "",
    price_cents: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingOrgs(true)
    apiGet<{ organizations: Organization[] }>("/admin/organizations")
      .then((data) => {
        const orgs = data.organizations ?? []
        setOrganizations(orgs)
        if (!formData.organization_id && orgs[0]) {
          setFormData((f) => ({
            ...f,
            organization_id: defaultOrganizationId ?? orgs[0].id,
          }))
        }
      })
      .catch(() => toast.error("Could not load organizations"))
      .finally(() => setLoadingOrgs(false))
  }, [open, defaultOrganizationId])

  useEffect(() => {
    if (defaultOrganizationId) {
      setFormData((f) => ({ ...f, organization_id: defaultOrganizationId }))
    }
  }, [defaultOrganizationId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.organization_id) {
      toast.error("Select an organization")
      return
    }
    setLoading(true)
    try {
      await apiPost("/courses", {
        organization_id: formData.organization_id,
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category || undefined,
        level: formData.level || undefined,
        duration: formData.duration || undefined,
        price_cents: formData.price_cents,
      })
      toast.success("Course created")
      setOpen(false)
      setFormData({
        organization_id: defaultOrganizationId ?? organizations[0]?.id ?? "",
        title: "",
        description: "",
        category: "",
        level: "beginner",
        duration: "",
        price_cents: 0,
      })
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create course")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Organization</Label>
            <Select
              value={formData.organization_id}
              onValueChange={(v) => setFormData((f) => ({ ...f, organization_id: v }))}
              disabled={loadingOrgs || organizations.length === 0}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingOrgs ? "Loading…" : "Select organization"} />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Course will belong to this organization and appear in its teacher portal.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required value={formData.title} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" value={formData.category} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label>Level</Label>
            <Select
              value={formData.level}
              onValueChange={(v) =>
                setFormData((f) => ({ ...f, level: v as typeof formData.level }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CourseDurationFields
            idPrefix="create-duration"
            resetKey={open ? "create-open" : "create-closed"}
            value={formData.duration}
            onChange={(duration) => setFormData((f) => ({ ...f, duration }))}
          />
          <CoursePriceFields
            idPrefix="create-course"
            resetKey={open ? "create-open" : "create-closed"}
            priceCents={formData.price_cents}
            onPriceCentsChange={(price_cents) => setFormData((f) => ({ ...f, price_cents }))}
          />
          <Button type="submit" disabled={loading || !formData.organization_id} className="w-full">
            {loading ? "Creating…" : "Create Course"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
