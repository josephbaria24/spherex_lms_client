"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Course } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/provider"
import { apiPost, ApiError } from "@/lib/api"
import { formatCoursePrice } from "@/lib/course-pricing"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Building2, Clock, KeyRound, Loader2, Mail, Signal } from "lucide-react"

interface Props {
  course: Course | null
  open: boolean
  onClose: () => void
  onEnroll: () => void
  isEnrolled?: boolean
}

export function CourseDetailsModal({ course, open, onClose, onEnroll, isEnrolled }: Props) {
  const { user } = useAuth()
  const [enrolling, setEnrolling] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [enrollCode, setEnrollCode] = useState("")
  const [showCodeField, setShowCodeField] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [descriptionOverflows, setDescriptionOverflows] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const router = useRouter()

  useLayoutEffect(() => {
    setDescriptionOpen(false)
  }, [course?.id])

  useLayoutEffect(() => {
    const el = descriptionRef.current
    if (!el || descriptionOpen) return
    setDescriptionOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [course?.description, descriptionOpen, open])

  const priceCents = course?.priceCents ?? 0
  const requiresCode = course?.requiresEnrollCode ?? false
  const isPaid = priceCents > 0
  const isOrgCourse = Boolean(course?.organizationName)
  const showCodeOption = isPaid || requiresCode || isOrgCourse

  const signedIn = Boolean(user)
  const accountNext = `/login?next=${encodeURIComponent("/courses")}`

  async function enroll(options?: { enroll_code?: string }) {
    if (!course) return
    if (!signedIn) {
      router.push(accountNext)
      return
    }
    setEnrolling(true)
    try {
      await apiPost("/enrollments", {
        course_id: course.id,
        enroll_code: options?.enroll_code?.trim() || undefined,
      })
      toast.success("Enrolled successfully")
      onEnroll()
      onClose()
      setEnrollCode("")
      setShowCodeField(false)
      router.push(`/courses/${course.id}/learn`)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to enroll"
      toast.error(message)
    } finally {
      setEnrolling(false)
    }
  }

  async function submitPaymentRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!course) return
    setRequesting(true)
    try {
      const res = await apiPost<{
        payment_request: { transaction_number: string }
        message: string
      }>("/payment-requests", {
        course_id: course.id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      })
      toast.success(res.message || "Check your email for next steps", {
        description: `Transaction ${res.payment_request.transaction_number}`,
        duration: 8000,
      })
      setShowPayForm(false)
      setFullName("")
      setEmail("")
      setPhone("")
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit payment request")
    } finally {
      setRequesting(false)
    }
  }

  const handleFreeEnroll = () => void enroll()

  const handleCodeEnroll = () => {
    if (!enrollCode.trim()) {
      toast.error("Enter an enrollment code")
      return
    }
    void enroll({ enroll_code: enrollCode })
  }

  if (!course) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setEnrollCode("")
          setShowCodeField(false)
          setShowPayForm(false)
          setDescriptionOpen(false)
        }
        onClose()
      }}
    >
      <DialogContent className="max-h-[min(92dvh,760px)] max-w-lg gap-0 overflow-y-auto p-0 [&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-black/55 [&_[data-slot=dialog-close]]:p-1.5 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:hover:bg-black/70">
        <div className="p-3 pb-0">
          <div className="relative h-44 overflow-hidden rounded-2xl sm:h-52">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#7c6cf0] via-[#5b4db8] to-[#1a1f2e]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2e]/80 via-[#1a1f2e]/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-12 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1c1917]">
                {course.category}
              </span>
              <span className="rounded-full bg-[#e85d4a] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                {formatCoursePrice(priceCents)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight">{course.title}</DialogTitle>
            {course.organizationName ? (
              <p className="flex items-center gap-1.5 text-sm text-[#6b5c4f] dark:text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-[#7c6cf0]" />
                {course.organizationName}
              </p>
            ) : null}
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#ebe4f8] px-3 py-2 dark:bg-violet-950/40">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#5c4d8a] dark:text-violet-200">
                <Signal className="h-3 w-3" />
                Level
              </p>
              <p className="mt-0.5 text-sm font-semibold capitalize text-[#1c1917] dark:text-foreground">
                {course.level}
              </p>
            </div>
            <div className="rounded-xl bg-[#e7f6f3] px-3 py-2 dark:bg-teal-950/40">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                <Clock className="h-3 w-3" />
                Duration
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#1c1917] dark:text-foreground">
                {course.duration}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#faf8f5] p-3 dark:bg-muted/40">
            <p
              ref={descriptionRef}
              className={cn(
                "whitespace-pre-line text-sm leading-relaxed text-[#5c5368] dark:text-muted-foreground",
                !descriptionOpen && "max-h-24 overflow-hidden",
              )}
            >
              {course.description}
            </p>
            {descriptionOverflows || descriptionOpen ? (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[#7c6cf0] hover:underline"
                onClick={() => setDescriptionOpen((open) => !open)}
              >
                {descriptionOpen ? "Show less" : "Show more"}
              </button>
            ) : null}
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-border/60 px-4 py-4 sm:flex-col">
          {isEnrolled ? (
            <Button asChild className="w-full">
              <Link href={`/courses/${course.id}/learn`}>Continue learning</Link>
            </Button>
          ) : showPayForm && isPaid ? (
            <form onSubmit={submitPaymentRequest} className="w-full space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter your details. We will email a transaction number and a link to upload your
                payment receipt.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="pay-name">Full name</Label>
                <Input
                  id="pay-name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={requesting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-email">Email</Label>
                <Input
                  id="pay-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={requesting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-phone">Phone / mobile</Label>
                <Input
                  id="pay-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={requesting}
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={requesting}>
                {requesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Request access — {formatCoursePrice(priceCents)}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={requesting}
                onClick={() => setShowPayForm(false)}
              >
                Back
              </Button>
            </form>
          ) : (
            <>
              {isPaid ? (
                <Button className="w-full gap-2" onClick={() => setShowPayForm(true)}>
                  <Mail className="h-4 w-4" />
                  Request access — {formatCoursePrice(priceCents)}
                </Button>
              ) : signedIn ? (
                <Button className="w-full" onClick={handleFreeEnroll} disabled={enrolling}>
                  {enrolling ? "Enrolling…" : "Enroll for free"}
                </Button>
              ) : (
                <Button className="w-full" asChild>
                  <Link href={accountNext}>Sign in to enroll</Link>
                </Button>
              )}

              {(showCodeOption || isPaid) && signedIn && (
                <div className="w-full space-y-2 rounded-2xl border border-teal-100 bg-teal-50/60 p-3">
                  {!showCodeField ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 text-sm font-medium text-teal-800 hover:underline"
                      onClick={() => setShowCodeField(true)}
                    >
                      <KeyRound className="h-4 w-4" />
                      Have an enrollment code?
                    </button>
                  ) : (
                    <>
                      <Label htmlFor="enroll-code" className="text-xs font-medium text-teal-900">
                        Enrollment code from your admin
                      </Label>
                      <Input
                        id="enroll-code"
                        className="font-mono uppercase"
                        value={enrollCode}
                        onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                        disabled={enrolling}
                      />
                      <Button
                        className="w-full"
                        onClick={handleCodeEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? "Enrolling…" : "Enroll with code"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
