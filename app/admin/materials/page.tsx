// app/admin/materials/page.tsx
'use client'

import { useState, useEffect } from "react"
import { apiDelete, apiGet } from "@/lib/api"
import { UploadMaterialModal } from "@/components/admin/materials/upload-material-modal"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GrowHeader } from "@/components/grow-shell"
import { FileText, Search, Plus, MoreVertical, Edit, Trash2, Download, Upload } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Material {
  id: string
  title: string
  description: string
  type: string
  category: string
  tags: string[]
  file_url: string
  updated_at: string
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const fetchMaterials = async () => {
    try {
      const data = await apiGet<{ materials: Material[] }>("/materials")
      setMaterials(data.materials ?? [])
    } catch (error) {
      console.error("Failed to load materials:", error)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  const handleDownload = async (material: Material) => {
    try {
      // Get signed URL from your API
      const response = await fetch('/api/bunny/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: material.file_url,
          materialId: material.id,
        }),
      })

      const { url, error } = await response.json()
      
      if (error) {
        alert('Failed to generate download link')
        return
      }

      // Open in new tab
      window.open(url, '_blank')
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download file')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      await apiDelete(`/materials/${id}`)
      fetchMaterials()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <GrowHeader
          icon={FileText}
          title="E-learning materials"
          accent="fuel knowledge"
          description="Manage IELTS, TOEFL, and other learning resources"
          showDate={false}
        >
          <UploadMaterialModal onUploaded={fetchMaterials} />
        </GrowHeader>

        <div className="grow-toolbar relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            className="grow-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <TabsList>
            <TabsTrigger value="all">All Materials</TabsTrigger>
            <TabsTrigger value="IELTS">IELTS</TabsTrigger>
            <TabsTrigger value="TOEFL">TOEFL</TabsTrigger>
            <TabsTrigger value="Technical">Technical</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Material</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Type</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Category</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Tags</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Updated</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => (
                      <tr
                        key={material.id}
                        className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{material.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{material.description}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="default">{material.type}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-foreground">{material.category}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {material.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {material.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{material.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(material.updated_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(material)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(material.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Other tabs with filters */}
          {["IELTS", "TOEFL", "Technical"].map(type => (
            <TabsContent key={type} value={type} className="mt-6">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    {/* Same table structure, filtered by type */}
                    <tbody>
                      {filteredMaterials.filter(m => m.type === type).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No {type} materials yet</p>
                          </td>
                        </tr>
                      ) : (
                        filteredMaterials.filter(m => m.type === type).map(material => (
                          <tr key={material.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                            {/* Same row content as above */}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </GrowMainLayout>
  )
}