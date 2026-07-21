"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { GrowMainLayout } from "@/components/layouts/grow-main-layout"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { apiGet, apiPost, ApiError } from "@/lib/api"
import { assetUrl } from "@/lib/asset-url"
import { formatCoursePrice } from "@/lib/course-pricing"
import { CreditCard, Check, X } from "lucide-react"
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

export default function AdminPaymentRequestsPage() {
  const [items, setItems] = useState<PaymentRequest[]>([])
  const [status, setStatus] = useState("receipt_uploaded")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PaymentRequest | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [acting, setActing] = useState(false)

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

  async function approve(id: string) {
    setActing(true)
    try {
      await apiPost(`/payment-requests/${id}/approve`)
      toast.success("Approved — learner notified by email")
      setSelected(null)
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
        >
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receipt_uploaded">Receipt uploaded</SelectItem>
              <SelectItem value="pending_payment">Pending payment</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </PageHeader>

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
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{item.status.replace(/_/g, " ")}</Badge>
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={assetUrl(selected.receipt_path)}
                      alt="Payment receipt"
                      className="max-h-64 w-full rounded-lg border object-contain"
                    />
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
            ) : (
              <Button asChild variant="outline">
                <Link href="/admin/payment-requests">Close</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GrowMainLayout>
  )
}
