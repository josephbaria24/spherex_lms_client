"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatCoursePrice } from "@/lib/course-pricing"

interface CoursePriceFieldsProps {
  priceCents: number
  onPriceCentsChange: (cents: number) => void
  idPrefix?: string
  showPaidHint?: boolean
  /** Change when the surrounding form resets (e.g. course id or dialog open). */
  resetKey?: string
}

function centsToPhpInput(cents: number): string {
  return String(Math.max(0, Math.round(cents / 100)))
}

function parsePhpInput(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  const n = Number(trimmed)
  if (Number.isNaN(n) || n < 0) return 0
  return Math.round(n * 100)
}

export function CoursePriceFields({
  priceCents,
  onPriceCentsChange,
  idPrefix = "course-price",
  showPaidHint = true,
  resetKey,
}: CoursePriceFieldsProps) {
  const [freeCourse, setFreeCourse] = useState(() => priceCents <= 0)
  const [priceInput, setPriceInput] = useState(() => centsToPhpInput(priceCents))

  useEffect(() => {
    setFreeCourse(priceCents <= 0)
    setPriceInput(centsToPhpInput(priceCents))
  }, [resetKey])

  function handleFreeToggle(checked: boolean) {
    setFreeCourse(checked)
    if (checked) {
      onPriceCentsChange(0)
      return
    }
    const nextInput = priceCents > 0 ? centsToPhpInput(priceCents) : "0"
    setPriceInput(nextInput)
    onPriceCentsChange(parsePhpInput(nextInput))
  }

  function handlePriceChange(raw: string) {
    const sanitized = raw.replace(/[^\d]/g, "")
    setPriceInput(sanitized)
    onPriceCentsChange(parsePhpInput(sanitized))
  }

  function handlePriceBlur() {
    if (freeCourse) return
    if (priceInput.trim() === "") {
      setPriceInput("0")
      onPriceCentsChange(0)
    }
  }

  const listedPrice = freeCourse
    ? "Free"
    : priceCents <= 0
      ? "₱0"
      : formatCoursePrice(priceCents)

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-free`}>Free course</Label>
          <p className="text-xs text-muted-foreground">
            {freeCourse
              ? "Learners can enroll without payment."
              : `Listed at ${listedPrice}.`}
          </p>
        </div>
        <Switch
          id={`${idPrefix}-free`}
          checked={freeCourse}
          onCheckedChange={handleFreeToggle}
        />
      </div>

      {!freeCourse ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-amount`}>Price (PHP)</Label>
          <Input
            id={`${idPrefix}-amount`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={priceInput}
            onChange={(e) => handlePriceChange(e.target.value)}
            onBlur={handlePriceBlur}
          />
          {showPaidHint ? (
            <p className="text-xs text-muted-foreground">
              Paid courses require payment or a valid enrollment code to enroll.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
