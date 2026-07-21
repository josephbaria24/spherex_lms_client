"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { useAuth } from "@/app/provider"
import { apiGet, apiPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  reference_id: string | null
  read_at: string | null
  created_at: string
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const diffSec = Math.round((Date.now() - then) / 1000)
  if (diffSec < 60) return "Just now"
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function NotificationBell() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    try {
      const data = await apiGet<{
        notifications: AppNotification[]
        unread_count: number
      }>("/notifications")
      setItems(data.notifications ?? [])
      setUnreadCount(data.unread_count ?? 0)
    } catch {
      // Keep last known state on poll errors
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setItems([])
      setUnreadCount(0)
      return
    }
    void refresh()
    const id = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(id)
  }, [user, refresh])

  useEffect(() => {
    if (open && user) void refresh()
  }, [open, user, refresh])

  if (authLoading || !user) return null

  const markRead = async (id: string) => {
    try {
      await apiPost(`/notifications/${id}/read`)
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n,
        ),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    }
  }

  const markAllRead = async () => {
    setLoading(true)
    try {
      await apiPost("/notifications/read-all")
      setItems((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      )
      setUnreadCount(0)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const onItemClick = async (n: AppNotification) => {
    if (!n.read_at) await markRead(n.id)
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-full border-border/80 bg-background/90 shadow-sm"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,22rem)] p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={() => void markAllRead()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="max-h-[min(60vh,22rem)] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-3 py-3 text-left transition-colors hover:bg-muted/60",
                      !n.read_at && "bg-teal-50/70 dark:bg-teal-950/20",
                    )}
                    onClick={() => void onItemClick(n)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{n.title}</span>
                      {!n.read_at ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                      ) : null}
                    </div>
                    {n.body ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    ) : null}
                    <span className="pt-0.5 text-[11px] text-muted-foreground/80">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t px-3 py-2">
          <Link
            href="/settings"
            className="text-xs font-medium text-teal-700 hover:underline dark:text-teal-400"
            onClick={() => setOpen(false)}
          >
            Notification preferences
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
