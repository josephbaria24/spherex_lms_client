"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, Lock } from "lucide-react"
import { IeltsAccessDialog, useIeltsAccess } from "@/components/ielts/ielts-access-dialog"
import { IeltsUkviRequestDialog } from "@/components/ielts/ielts-ukvi-request-dialog"
import { IeltsCompanyMaterials } from "@/components/ielts/ielts-company-materials"
import { IELTS_TRACKS } from "@/lib/ielts-tracks"
import {
  fetchPublicReviewerGroups,
  type PublicReviewerGroup,
} from "@/lib/public-reviewers"
import { cn } from "@/lib/utils"

export function IeltsTrainingCatalog() {
  const router = useRouter()
  const access = useIeltsAccess()
  const [groups, setGroups] = useState<PublicReviewerGroup[]>([])
  const [ukviOpen, setUkviOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPublicReviewerGroups({ exam_type: "IELTS" })
      .then((data) => {
        if (!cancelled) setGroups(data.groups ?? [])
      })
      .catch(() => {
        if (!cancelled) setGroups([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function openTraining(title: string, href: string) {
    if (access.unlocked) {
      router.push(href)
      return
    }
    access.ask(title)
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
        {IELTS_TRACKS.map((item) => {
          const unavailable = !item.available
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (unavailable) {
                  setUkviOpen(true)
                  return
                }
                openTraining(item.title, `/ielts?track=${item.id}`)
              }}
              className="group min-w-0 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white text-left shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-[#FFD8C8] sm:rounded-[1.5rem] dark:border-border dark:bg-card"
            >
              <span className="relative block aspect-[5/3] overflow-hidden bg-white sm:aspect-[4/3] dark:bg-muted">
                <img
                  src={encodeURI(item.image)}
                  alt={item.imageAlt}
                  className={cn(
                    "h-full w-full object-contain object-center p-2 sm:p-4",
                    unavailable && "opacity-35 grayscale",
                  )}
                />
                {unavailable ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[9px] font-semibold text-neutral-500 shadow-sm sm:px-2.5 sm:text-[10px] dark:bg-background/95 dark:text-muted-foreground">
                      <Ban className="h-3 w-3" />
                      Not available
                    </span>
                  </span>
                ) : !access.unlocked ? (
                  <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-neutral-950/85 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                    <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    Locked
                  </span>
                ) : null}
              </span>
              <span className={cn("block space-y-0.5 p-2 sm:space-y-1 sm:p-4", unavailable && "opacity-45")}>
                <span className="block text-xs font-semibold leading-4 text-neutral-950 sm:text-[15px] sm:leading-snug dark:text-foreground">
                  {item.title}
                </span>
                <span className="line-clamp-2 block text-[10px] leading-4 text-neutral-500 sm:text-sm sm:leading-5 dark:text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <IeltsCompanyMaterials unlocked={access.unlocked} onLocked={access.ask} />

      {groups.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-sm font-semibold text-[#1c1917] dark:text-foreground">Practice sets</h3>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => openTraining(group.title, `/ielts/${group.id}`)}
                className={cn(
                  "min-w-0 rounded-xl border border-neutral-200/80 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#FFD8C8] sm:rounded-2xl sm:p-4 dark:border-border dark:bg-card",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="line-clamp-2 text-xs font-semibold leading-4 text-neutral-950 sm:text-[15px] dark:text-foreground">
                    {group.title}
                  </span>
                  {!access.unlocked ? <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-500" /> : null}
                </span>
                <span className="mt-1 line-clamp-2 block text-[10px] leading-4 text-neutral-500 sm:text-sm dark:text-muted-foreground">
                  {group.description || `${group.quiz_count} practice sets`}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <IeltsUkviRequestDialog open={ukviOpen} onOpenChange={setUkviOpen} />
      <IeltsAccessDialog
        open={access.open}
        onOpenChange={access.setOpen}
        training={access.training}
        onUnlocked={access.markUnlocked}
      />
    </div>
  )
}
