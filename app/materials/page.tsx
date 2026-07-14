"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { GrowShell, GrowHeader } from "@/components/grow-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, FileText, BookOpen } from "lucide-react"
import { apiGet } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Material {
  id: string
  title: string
  description?: string
  type?: string
  tags?: string[]
  file_url?: string
}

const TYPE_ACCENTS: Record<string, string> = {
  IELTS: "grow-card-accent",
  TOEFL: "grow-card-lime",
  Technical: "grow-card-muted",
}

function materialCardClass(type?: string) {
  return TYPE_ACCENTS[type ?? ""] ?? "grow-card"
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const data = await apiGet<{ materials: Material[] }>("/materials")
        setMaterials(data.materials ?? [])
      } catch (error) {
        console.error("Failed to load materials:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  const filteredMaterials = materials.filter(
    (material) =>
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const renderCard = (material: Material) => (
    <article key={material.id} className={cn("grow-card p-5", materialCardClass(material.type))}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/50 bg-white/40 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10">
          {material.type === "IELTS" || material.type === "TOEFL" ? (
            <BookOpen className="h-6 w-6 text-[#5c4d8a] dark:text-violet-200" />
          ) : (
            <FileText className="h-6 w-6 text-[#5c4d8a] dark:text-violet-200" />
          )}
        </div>
        <Badge
          variant="secondary"
          className="rounded-full border-0 bg-white/70 text-[10px] font-semibold uppercase dark:bg-white/10"
        >
          {material.type || "Other"}
        </Badge>
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="line-clamp-1 text-lg font-bold text-[#1c1917] dark:text-foreground">
          {material.title}
        </h3>
        <p className="line-clamp-2 text-sm text-[#6b5c4f] dark:text-muted-foreground">
          {material.description}
        </p>
      </div>
      {material.tags && material.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {material.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="grow-badge">
              {tag}
            </span>
          ))}
          {material.tags.length > 3 ? (
            <span className="grow-badge">+{material.tags.length - 3}</span>
          ) : null}
        </div>
      ) : null}
      <a href={material.file_url} download target="_blank" rel="noopener noreferrer" className="mt-4 block">
        <Button variant="outline" className="grow-btn-outline w-full gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </a>
    </article>
  )

  const renderGrid = (items: Material[]) => {
    if (loading) {
      return (
        <p className="text-sm text-[#6b5c4f] dark:text-muted-foreground">Loading materials…</p>
      )
    }
    if (items.length === 0) {
      return (
        <div className="grow-empty">
          <FileText className="mx-auto h-10 w-10 text-[#c9bfb0] dark:text-muted-foreground" />
          <p className="mt-3 text-sm text-[#6b5c4f] dark:text-muted-foreground">No materials found.</p>
        </div>
      )
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((material) => renderCard(material))}
      </div>
    )
  }

  return (
    <MainLayout>
      <GrowShell>
        <GrowHeader
          title="Study materials"
          accent="your library"
          description="Access guides, resources, and reference documents"
        />

        <div className="grow-toolbar">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search materials…"
              className="grow-input pl-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grow-card-dark p-5">
            <p className="text-sm text-white/70">Total resources</p>
            <p className="mt-2 text-4xl font-bold">{materials.length}</p>
          </div>
          <div className="grow-card-accent p-5">
            <p className="text-sm text-[#6b5c7a] dark:text-violet-300/80">IELTS</p>
            <p className="mt-2 text-4xl font-bold text-[#1c1917] dark:text-foreground">
              {materials.filter((m) => m.type === "IELTS").length}
            </p>
          </div>
          <div className="grow-card-lime p-5">
            <p className="text-sm font-medium text-[#3d4f2f] dark:text-lime-200/90">Technical</p>
            <p className="mt-2 text-4xl font-bold text-[#1c1917] dark:text-foreground">
              {materials.filter((m) => m.type === "Technical").length}
            </p>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="grow-tabs-list">
            <TabsTrigger value="all" className="grow-tab-trigger">
              All
            </TabsTrigger>
            <TabsTrigger value="IELTS" className="grow-tab-trigger">
              IELTS
            </TabsTrigger>
            <TabsTrigger value="TOEFL" className="grow-tab-trigger">
              TOEFL
            </TabsTrigger>
            <TabsTrigger value="Technical" className="grow-tab-trigger">
              Technical
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-5">
            {renderGrid(filteredMaterials)}
          </TabsContent>

          {["IELTS", "TOEFL", "Technical"].map((type) => (
            <TabsContent value={type} key={type} className="mt-5">
              {renderGrid(
                materials
                  .filter((m) => m.type === type)
                  .filter(
                    (m) =>
                      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      m.description?.toLowerCase().includes(searchTerm.toLowerCase()),
                  ),
              )}
            </TabsContent>
          ))}
        </Tabs>
      </GrowShell>
    </MainLayout>
  )
}
