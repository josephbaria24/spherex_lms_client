"use client"

import { useEffect, useState } from "react"
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
  COURSE_DURATION_UNITS,
  courseDurationUnitLabel,
  formatCourseDuration,
  normalizeDurationUnit,
  parseCourseDuration,
  type CourseDurationUnit,
} from "@/lib/course-duration"

interface CourseDurationFieldsProps {
  value: string
  onChange: (duration: string) => void
  idPrefix?: string
  resetKey?: string
}

export function CourseDurationFields({
  value,
  onChange,
  idPrefix = "course-duration",
  resetKey,
}: CourseDurationFieldsProps) {
  const [amount, setAmount] = useState(() => parseCourseDuration(value).amount)
  const [unit, setUnit] = useState<CourseDurationUnit>(() =>
    normalizeDurationUnit(parseCourseDuration(value).unit),
  )

  useEffect(() => {
    const parsed = parseCourseDuration(value)
    setAmount(parsed.amount)
    setUnit(normalizeDurationUnit(parsed.unit))
  }, [resetKey, value])

  function emit(nextAmount: string, nextUnit: CourseDurationUnit) {
    const n = Number(nextAmount)
    if (!nextAmount.trim() || Number.isNaN(n) || n <= 0) {
      onChange("")
      return
    }
    onChange(formatCourseDuration(n, nextUnit))
  }

  function handleAmountChange(raw: string) {
    const sanitized = raw.replace(/[^\d]/g, "")
    setAmount(sanitized)
    emit(sanitized, unit)
  }

  function handleAmountBlur() {
    if (amount.trim() === "") return
    emit(amount, unit)
  }

  function handleUnitChange(nextUnit: string) {
    const normalized = normalizeDurationUnit(nextUnit)
    setUnit(normalized)
    emit(amount, normalized)
  }

  const preview =
    amount.trim() && Number(amount) > 0
      ? formatCourseDuration(Number(amount), unit)
      : "No duration set"

  return (
    <div className="space-y-2">
      <Label htmlFor={`${idPrefix}-amount`}>Duration</Label>
      <div className="flex gap-2">
        <Input
          id={`${idPrefix}-amount`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 4"
          className="w-28 shrink-0"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          onBlur={handleAmountBlur}
        />
        <Select value={unit} onValueChange={handleUnitChange}>
          <SelectTrigger id={`${idPrefix}-unit`} className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COURSE_DURATION_UNITS.map((option) => (
              <SelectItem key={option} value={option}>
                {courseDurationUnitLabel(option, Number(amount) || 2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">Saved as: {preview}</p>
    </div>
  )
}
