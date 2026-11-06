"use client"

import { useCallback, useEffect, useState } from "react"
import { apiGet, apiPost, ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type AccessRequest = {
  id: string
  training: string
  full_name: string
  email: string
  phone: string
  status: "pending" | "accepted" | "rejected" | string
  created_at: string
}

export function IeltsAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<{ requests: AccessRequest[] }>("/reviewers/ielts/access-requests")
      setRequests(data.requests ?? [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load access requests")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function decide(id: string, action: "accept" | "reject") {
    setBusyId(id)
    setError(null)
    try {
      await apiPost(`/reviewers/ielts/access-requests/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update that request")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading access requests…</p>
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No IELTS access requests yet.</p>
      ) : (
        requests.map((request) => (
          <article key={request.id} className="grow-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{request.full_name}</p>
                <Badge variant="secondary" className="rounded-full capitalize">
                  {request.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.training} · {request.email} · {request.phone}
              </p>
            </div>
            {request.status === "pending" ? (
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  className="rounded-full bg-[#FF4B1A] hover:bg-[#e84314]"
                  disabled={busyId === request.id}
                  onClick={() => void decide(request.id, "accept")}
                >
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={busyId === request.id}
                  onClick={() => void decide(request.id, "reject")}
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </article>
        ))
      )}
    </div>
  )
}
