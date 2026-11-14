"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ApiError, apiPost } from "@/lib/api"
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

export function IeltsAnnouncePanel() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [audience, setAudience] = useState<"granted" | "active" | "all_learners">("granted")
  const [sending, setSending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (subject.trim().length < 3 || message.trim().length < 3) {
      toast.error("Add a subject and message")
      return
    }
    setSending(true)
    try {
      const data = await apiPost<{ recipients: number; sent: number; skipped: number }>(
        "/reviewers/ielts/announce",
        { subject: subject.trim(), message: message.trim(), audience },
      )
      toast.success(
        `Announcement queued for ${data.recipients} learner${data.recipients === 1 ? "" : "s"} (${data.sent} sent)`,
      )
      setSubject("")
      setMessage("")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send announcement")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grow-card max-w-2xl space-y-4 p-4 md:p-5">
      <div>
        <p className="text-sm font-semibold">Email announcement</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Notify IELTS learners about mock sessions, schedule changes, or reminders.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Audience</Label>
        <Select
          value={audience}
          onValueChange={(value) =>
            setAudience(value as "granted" | "active" | "all_learners")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="granted">Learners with IELTS access</SelectItem>
            <SelectItem value="active">Learners with practice activity</SelectItem>
            <SelectItem value="all_learners">Access + activity combined</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ielts-announce-subject">Subject</Label>
        <Input
          id="ielts-announce-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Mock exam starts tomorrow at 9:00"
          maxLength={160}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ielts-announce-message">Message</Label>
        <textarea
          id="ielts-announce-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={7}
          maxLength={5000}
          className="flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          placeholder="Write the announcement students will receive by email…"
        />
      </div>
      <Button type="submit" disabled={sending}>
        {sending ? "Sending…" : "Send announcement"}
      </Button>
    </form>
  )
}
