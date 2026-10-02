"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FileUp, Loader2 } from "lucide-react"

type ImportResult = {
  ok: boolean
  quiz_count: number
  question_count: number
  group_count: number
  source: string
  message: string
}

type ImportReviewerPdfModalProps = {
  onImported: () => void
}

export function ImportReviewerPdfModal({ onImported }: ImportReviewerPdfModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport() {
    if (!file) {
      setError("Choose a PDF first")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append("pdf", file)
      formData.append("replace_existing", replaceExisting ? "true" : "false")
      const res = await fetch("/api/lms/reviewers/import/pdf", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      const data = (await res.json()) as ImportResult & { error?: string }
      if (!res.ok) {
        throw new Error(data.error || "Import failed")
      }
      setResult(data)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setFile(null)
          setResult(null)
          setError(null)
          setLoading(false)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="mr-2 h-4 w-4" />
          Import PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import reviewer PDF</DialogTitle>
          <DialogDescription>
            Upload a CSE-style reviewer PDF (correct answers in red). The server extracts questions
            and auto-creates subject cards + practice parts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>PDF file</Label>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setResult(null)
                setError(null)
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {file ? file.name : "Choose PDF…"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Requires Python + pymupdf on the server. Large PDFs may take 1–3 minutes.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <Label>Replace existing CSE Reviewer parts</Label>
              <p className="text-xs text-muted-foreground">
                Deletes previous auto-imported CSE quizzes, then rebuilds subjects
              </p>
            </div>
            <Switch
              checked={replaceExisting}
              onCheckedChange={setReplaceExisting}
              disabled={loading}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {result.message}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Close
            </Button>
            <Button type="button" onClick={handleImport} disabled={loading || !file}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? "Extracting…" : "Import & create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
