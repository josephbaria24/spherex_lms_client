"use client"

import Link from "next/link"
import { landingCategoryGroups, type LandingCategory } from "@/lib/landing-categories"
import { cn } from "@/lib/utils"

const OFFERING_IMAGES: Record<string, string> = {
  "self-paced":
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=520&fit=crop",
  blended: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=520&fit=crop",
  nle: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=520&fit=crop",
  cse: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=520&fit=crop",
  ielts: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=520&fit=crop",
  petrosphere:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=520&fit=crop",
  tesda: "/tesda-logo.png",
}

type Offering = LandingCategory & { groupLabel: string }

const offerings: Offering[] = landingCategoryGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupLabel: group.label })),
)

const TOTAL = offerings.length

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function offeringStat(item: Offering) {
  if (item.count != null) return `${item.count}+ courses`
  if (item.badge) return item.badge
  return "Explore"
}

function OfferingCard({ item, index }: { item: Offering; index: number }) {
  const Icon = item.icon
  const isComingSoon = item.badge?.toLowerCase().includes("coming")

  const cell = (
    <>
      <div className="flex items-start justify-between">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-slate-200/80">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-sm bg-[#c9a227]" />
        </div>
        <span className="text-sm font-medium tabular-nums text-slate-300">{pad(index + 1)}</span>
      </div>

      <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-xl bg-white">
        <img
          src={OFFERING_IMAGES[item.id] ?? OFFERING_IMAGES["self-paced"]}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full transition duration-700",
            item.id === "tesda"
              ? "object-contain object-center scale-[1.12] group-hover:scale-[1.12]"
              : "object-cover group-hover:scale-[1.03]",
          )}
        />
        {item.id !== "tesda" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white to-transparent" />
        ) : null}
      </div>

      <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900 sm:text-[1.35rem]">
        {item.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{item.description}</p>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
        <span className="inline-flex items-center gap-2 font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c9a227]" />
          {item.groupLabel}
        </span>
        <span className="shrink-0 text-slate-400">{offeringStat(item)}</span>
      </div>
    </>
  )

  const className =
    "group flex h-full flex-col bg-white px-5 py-7 transition hover:bg-slate-50/80 sm:px-7 sm:py-8"

  if (isComingSoon) {
    return (
      <div className={cn(className, "opacity-70")} aria-disabled>
        {cell}
      </div>
    )
  }

  return (
    <Link href={item.href} className={className}>
      {cell}
    </Link>
  )
}

export function WhatSphereXOffersSection() {
  return (
    <section id="categories" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[100rem] px-3 sm:px-4 lg:px-5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            A complete learning system.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
            More than just courses. A unified approach to managing organizational risk, standardizing
            procedures, and elevating team capabilities across partner organizations.
          </p>
        </div>

        <div className="mt-12 w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:mt-14 sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a227]" />
              Platform capabilities
            </span>
            <span className="text-xs tabular-nums text-slate-400">
              {TOTAL} / {TOTAL}
            </span>
          </div>

          <div className="grid gap-px bg-slate-200/80 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map((item, index) => (
              <OfferingCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
