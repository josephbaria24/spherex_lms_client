"use client"

import { useState } from "react"
import { LifeBuoy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiPost } from "@/lib/api"
import { cn } from "@/lib/utils"

type LessonConcernButtonProps = {
  courseId: string
  lessonId: string
  className?: string
  /** Dark overlay styling for the fullscreen lesson player */
  overlay?: boolean
}

export function LessonConcernButton({
  courseId,
  lessonId,
  className,
  overlay = false,
}: LessonConcernButtonProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const concern = message.trim()
    if (concern.length < 10) {
      toast.error("Describe the problem in at least a few words")
      return
    }
    setSending(true)
    try {
      await apiPost(`/learn/courses/${courseId}/lessons/${lessonId}/support`, {
        message: concern,
      })
      toast.success("Your concern was sent to support")
      setMessage("")
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your concern")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={overlay ? "secondary" : "outline"}
        size="sm"
        className={cn(
          "gap-1.5",
          overlay && "bg-black/60 text-white hover:bg-black/80",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <LifeBuoy className="h-3.5 w-3.5" />
        Report a problem
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report a problem</DialogTitle>
            <DialogDescription>
              Tell us what went wrong in this lesson. Your message is emailed to support, and they
              can reply to you directly.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void submit(event)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="lesson-concern">What happened?</Label>
              <Textarea
                id="lesson-concern"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Example: the video will not play, or the Next button is missing."
                rows={5}
                maxLength={2000}
                required
                disabled={sending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={sending || message.trim().length < 10}>
              {sending ? "Sending…" : "Send to support"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
