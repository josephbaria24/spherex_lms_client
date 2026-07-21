"use client"

import { useState } from "react"
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
import { apiPost, ApiError } from "@/lib/api"
import { formatCoursePrice } from "@/lib/course-pricing"
import { toast } from "sonner"
import { KeyRound, Loader2, Mail } from "lucide-react"

interface Props {
  course: Course | null
  open: boolean
  onClose: () => void
  onEnroll: () => void
  isEnrolled?: boolean
}

export function CourseDetailsModal({ course, open, onClose, onEnroll, isEnrolled }: Props) {
  const [enrolling, setEnrolling] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [enrollCode, setEnrollCode] = useState("")
  const [showCodeField, setShowCodeField] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const router = useRouter()

  const priceCents = course?.priceCents ?? 0
  const requiresCode = course?.requiresEnrollCode ?? false
  const isPaid = priceCents > 0
  const isOrgCourse = Boolean(course?.organizationName)
  const showCodeOption = isPaid || requiresCode || isOrgCourse

  async function enroll(options?: { enroll_code?: string }) {
    if (!course) return
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
        }
        onClose()
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{course.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {course.organizationName ? (
            <p>
              <strong>Organization:</strong> {course.organizationName}
            </p>
          ) : null}
          <p>
            <strong>Category:</strong> {course.category}
          </p>
          <p>
            <strong>Level:</strong> {course.level}
          </p>
          <p>
            <strong>Duration:</strong> {course.duration}
          </p>
          <p>
            <strong>Price:</strong> {formatCoursePrice(priceCents)}
          </p>
          <p className="whitespace-pre-line text-muted-foreground">{course.description}</p>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
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
              ) : (
                <Button className="w-full" onClick={handleFreeEnroll} disabled={enrolling}>
                  {enrolling ? "Enrolling…" : "Enroll for free"}
                </Button>
              )}

              {(showCodeOption || isPaid) && (
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
