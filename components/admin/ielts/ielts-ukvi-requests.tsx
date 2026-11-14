"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { ApiError, apiGet } from "@/lib/api"
import { cn } from "@/lib/utils"

type UkviRequest = {
  id: string
  name: string
  email: string
  created_at: string
}

export function IeltsUkviRequests({ className }: { className?: string }) {
  const [requests, setRequests] = useState<UkviRequest[]>([])
  const [count, setCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

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
    <div className={cn("min-w-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            UKVI
          </p>
          <p className="mt-1 text-sm font-semibold leading-tight">Life Skills interest</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {count === 0 ? "No requests yet" : `${count} learner${count === 1 ? "" : "s"} waiting`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold tabular-nums leading-none">{count}</span>
          {requests.length > 0 ? (
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-expanded={open}
              aria-label={open ? "Hide UKVI requests" : "Show UKVI requests"}
              onClick={() => setOpen((value) => !value)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  open && "rotate-180",
                )}
              />
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {requests.length > 0 ? (
        <div className="admin-expand" data-open={open ? "true" : "false"}>
          <div className="admin-expand-panel">
            <ul className="admin-expand-inner mt-3 max-h-36 space-y-1.5 overflow-y-auto border-t border-border/60 pt-2">
              {requests.map((request) => (
                <li key={request.id} className="truncate text-xs">
                  <span className="font-medium text-foreground">{request.name}</span>
                  <span className="text-muted-foreground"> · {request.email}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}
