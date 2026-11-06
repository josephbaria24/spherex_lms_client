"use client"

import { useCallback, useEffect, useState } from "react"
import { ApiError, apiGet } from "@/lib/api"

type UkviRequest = {
  id: string
  name: string
  email: string
  created_at: string
}

export function IeltsUkviRequests() {
  const [requests, setRequests] = useState<UkviRequest[]>([])
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ count?: number; requests?: UkviRequest[] }>(
        "/reviewers/ielts/track-interest",
      )
      setRequests(data.requests ?? [])
      setCount(data.count ?? data.requests?.length ?? 0)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load UKVI requests")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="grow-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">UKVI requests</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Learners who asked for IELTS for UKVI Life Skills.
          </p>
        </div>
        <p className="text-2xl font-bold tabular-nums">{count}</p>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {requests.length > 0 ? (
        <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
          {requests.map((request) => (
            <li key={request.id} className="text-sm">
              <span className="font-medium">{request.name}</span>
              <span className="text-muted-foreground"> · {request.email}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No requests yet.</p>
      )}
    </div>
  )
}
