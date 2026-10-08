"use client"

import { useCallback, useEffect, useState } from "react"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiGet, apiPost, ApiError } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { formatCoursePrice } from "@/lib/course-pricing"
import { cn } from "@/lib/utils"
import { CreditCard, Check, X, Maximize2, ZoomIn, ZoomOut } from "lucide-react"
import { toast } from "sonner"

type PaymentRequest = {
  id: string
  transaction_number: string
  course_id: string
  course_title: string
  full_name: string
  email: string
  phone: string
  amount_cents: number
  status: string
  receipt_path: string | null
  created_at: string
  admin_note: string | null
  email_exists?: boolean
}

const STATUS_FILTERS = [
  { value: "open", label: "Requested" },
  { value: "pending_payment", label: "Waiting for receipt" },
  { value: "receipt_uploaded", label: "Receipt uploaded" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
] as const

function statusLabel(status: string): string {
  if (status === "pending_payment") return "Requested"
  if (status === "receipt_uploaded") return "Receipt uploaded"
  return status.replace(/_/g, " ")
}

export default function AdminPaymentRequestsPage() {
  const [items, setItems] = useState<PaymentRequest[]>([])
  const [status, setStatus] = useState("open")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PaymentRequest | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [acting, setActing] = useState(false)
  const [confirmGrant, setConfirmGrant] = useState(false)
  const [receiptFullscreen, setReceiptFullscreen] = useState(false)
  const [receiptZoom, setReceiptZoom] = useState(1)

  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 4
  const ZOOM_STEP = 0.25

  function openReceiptFullscreen() {
    setReceiptZoom(1)
    setReceiptFullscreen(true)
  }

  function adjustReceiptZoom(delta: number) {
    setReceiptZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((z + delta) * 100) / 100)))
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = status === "all" ? "" : `?status=${status}`
      const data = await apiGet<{ payment_requests: PaymentRequest[] }>(
        `/payment-requests${q}`,
      )
      setItems(data.payment_requests ?? [])
    } catch {
      toast.error("Failed to load payment requests")
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  async function approve(id: string, withoutReceipt = false) {
    setActing(true)
    try {
      await apiPost(
        `/payment-requests/${id}/approve`,
        withoutReceipt ? { without_receipt: true } : undefined,
      )
      toast.success("Approved — learner notified by email")
      setSelected(null)
      setReceiptFullscreen(false)
      setConfirmGrant(false)
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Approve failed")
    } finally {
      setActing(false)
    }
  }

  async function reject(id: string) {
    setActing(true)
    try {
      await apiPost(`/payment-requests/${id}/reject`, {
        admin_note: rejectNote.trim() || undefined,
      })
      toast.success("Request rejected")
      setSelected(null)
      setReceiptFullscreen(false)
      setRejectNote("")
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Reject failed")
    } finally {
      setActing(false)
    }
  }

  return (
    <GrowMainLayout>
      <div className="space-y-6">
        <PageHeader
          icon={CreditCard}
          title="Payment requests"
          accent="manual enrollments"
          description="Review receipts and grant course access"
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {STATUS_FILTERS.map((filter) => {
            const active = status === filter.value
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatus(filter.value)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests in this filter.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Txn</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{item.transaction_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.full_name}</div>
                      <div className="text-xs text-muted-foreground">{item.email}</div>
                      <div className="text-xs text-muted-foreground">{item.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      {item.email_exists ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Existing email
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          New email
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.course_title}</td>
                    <td className="px-4 py-3">{formatCoursePrice(item.amount_cents)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{statusLabel(item.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
            setReceiptFullscreen(false)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review payment</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-3 text-sm">
              <p>
                <strong>{selected.transaction_number}</strong> · {selected.course_title}
              </p>
              <p>
                {selected.full_name} · {selected.email} · {selected.phone}
              </p>
              <p>
                Account:{" "}
                {selected.email_exists ? (
                  <span className="font-medium text-emerald-700">Existing email — uses current password</span>
                ) : (
                  <span className="font-medium text-amber-700">New email — temp password emailed on approve</span>
                )}
              </p>
              <p>{formatCoursePrice(selected.amount_cents)}</p>
              {selected.receipt_path ? (
                <div className="space-y-2">
                  <Label>Receipt</Label>
                  {selected.receipt_path.toLowerCase().endsWith(".pdf") ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={assetUrl(selected.receipt_path)} target="_blank" rel="noreferrer">
                        Open PDF receipt
                      </a>
                    </Button>
                  ) : (
                    <div className="relative overflow-hidden rounded-lg border bg-muted/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl(selected.receipt_path)}
                        alt="Payment receipt"
                        className="max-h-64 w-full object-contain"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute right-2 top-2 h-8 w-8 rounded-full border bg-background/95 shadow-sm"
                        aria-label="View receipt fullscreen"
                        onClick={openReceiptFullscreen}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-amber-700">No receipt uploaded yet.</p>
              )}
              {selected.status === "receipt_uploaded" ? (
                <div className="space-y-2">
                  <Label htmlFor="reject-note">Reject note (optional)</Label>
                  <Input
                    id="reject-note"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Reason shown in email"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-between">
            {selected?.status === "receipt_uploaded" ? (
              <>
                <Button
                  variant="destructive"
                  disabled={acting}
                  onClick={() => selected && void reject(selected.id)}
                >
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button disabled={acting || !selected.receipt_path} onClick={() => selected && void approve(selected.id)}>
                  <Check className="mr-1 h-4 w-4" />
                  Approve & enroll
                </Button>
              </>
            ) : selected?.status === "pending_payment" ? (
              <>
                <Button variant="outline" disabled={acting} onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button disabled={acting} onClick={() => setConfirmGrant(true)}>
                  <Check className="mr-1 h-4 w-4" />
                  Grant access
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmGrant} onOpenChange={setConfirmGrant}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grant this course without a receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected
                ? `${selected.full_name} has not uploaded a payment receipt for ${selected.course_title}. Confirming will enroll them and send the access email.`
                : "No receipt has been uploaded. Confirming will still enroll the learner."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={acting || !selected}
              onClick={(event) => {
                event.preventDefault()
                if (selected) void approve(selected.id, true)
              }}
            >
              Grant access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={receiptFullscreen}
        onOpenChange={(open) => {
          setReceiptFullscreen(open)
          if (!open) setReceiptZoom(1)
        }}
      >
        <DialogContent
          className="flex max-h-[95vh] max-w-[min(96vw,56rem)] flex-col gap-2 border-none bg-black/95 p-3 text-white sm:rounded-xl"
          aria-describedby={undefined}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Receipt fullscreen</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 pr-8">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              aria-label="Zoom out"
              disabled={receiptZoom <= MIN_ZOOM}
              onClick={() => adjustReceiptZoom(-ZOOM_STEP)}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 min-w-14 rounded-full px-3 text-xs font-medium"
              onClick={() => setReceiptZoom(1)}
            >
              {Math.round(receiptZoom * 100)}%
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full"
              aria-label="Zoom in"
              disabled={receiptZoom >= MAX_ZOOM}
              onClick={() => adjustReceiptZoom(ZOOM_STEP)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          {selected?.receipt_path && !selected.receipt_path.toLowerCase().endsWith(".pdf") ? (
            <div
              className="min-h-0 flex-1 overflow-auto rounded-lg"
              onWheel={(e) => {
                if (!e.ctrlKey && !e.metaKey) return
                e.preventDefault()
                adjustReceiptZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(selected.receipt_path)}
                alt="Payment receipt fullscreen"
                className="mx-auto max-h-[80vh] origin-center object-contain transition-transform duration-150"
                style={{ transform: `scale(${receiptZoom})` }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </GrowMainLayout>
  )
}
