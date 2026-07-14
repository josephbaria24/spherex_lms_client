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
import { CreditCard, KeyRound, Loader2 } from "lucide-react"

interface Props {
  course: Course | null
  open: boolean
  onClose: () => void
  onEnroll: () => void
  isEnrolled?: boolean
}

export function CourseDetailsModal({ course, open, onClose, onEnroll, isEnrolled }: Props) {
  const [enrolling, setEnrolling] = useState(false)
  const [enrollCode, setEnrollCode] = useState("")
  const [showCodeField, setShowCodeField] = useState(false)
  const router = useRouter()

  const priceCents = course?.priceCents ?? 0
  const requiresCode = course?.requiresEnrollCode ?? false
  const isPaid = priceCents > 0
  const isOrgCourse = Boolean(course?.organizationName)
  const showCodeOption = isPaid || requiresCode || isOrgCourse

  async function enroll(options?: { payment_confirmed?: boolean; enroll_code?: string }) {
    if (!course) return
    setEnrolling(true)
    try {
      await apiPost("/enrollments", {
        course_id: course.id,
        payment_confirmed: options?.payment_confirmed,
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

  const handleFreeEnroll = () => void enroll()

  const handlePayEnroll = () => {
    void enroll({ payment_confirmed: true })
    toast.message("Payment simulated", {
      description: "Stripe integration can be connected here later.",
    })
  }

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
          ) : (
            <>
              {isPaid ? (
                <Button
                  className="w-full gap-2"
                  onClick={handlePayEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Pay {formatCoursePrice(priceCents)} & enroll
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
                        placeholder="ENR-XXXXXXXX"
                        className="h-10 rounded-full border-teal-200 bg-white font-mono uppercase shadow-none"
                        value={enrollCode}
                        onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                        disabled={enrolling}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-full border-teal-300"
                        onClick={handleCodeEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? "Verifying…" : "Redeem code & enroll"}
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
