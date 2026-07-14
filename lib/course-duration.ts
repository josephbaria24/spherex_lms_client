export type CourseDurationUnit = "minute" | "hour" | "day" | "week"

const UNIT_LABELS: Record<CourseDurationUnit, { singular: string; plural: string }> = {
  minute: { singular: "minute", plural: "minutes" },
  hour: { singular: "hour", plural: "hours" },
  day: { singular: "day", plural: "days" },
  week: { singular: "week", plural: "weeks" },
}

export const COURSE_DURATION_UNITS: CourseDurationUnit[] = ["minute", "hour", "day", "week"]

const DEFAULT_UNIT: CourseDurationUnit = "week"

export function normalizeDurationUnit(unit: string | null | undefined): CourseDurationUnit {
  if (unit && unit in UNIT_LABELS) {
    return unit as CourseDurationUnit
  }
  return DEFAULT_UNIT
}

export function formatCourseDuration(
  amount: number,
  unit: CourseDurationUnit | string | null | undefined,
): string {
  if (!Number.isFinite(amount) || amount <= 0) return ""
  const labels = UNIT_LABELS[normalizeDurationUnit(unit)]
  return `${amount} ${amount === 1 ? labels.singular : labels.plural}`
}

export function parseCourseDuration(
  raw: string | null | undefined,
): { amount: string; unit: CourseDurationUnit } {
  const trimmed = raw?.trim() ?? ""
  if (!trimmed) {
    return { amount: "", unit: "week" }
  }

  const normalized = trimmed.toLowerCase().replace(/\s+/g, " ")

  const patterns: { regex: RegExp; unit: CourseDurationUnit }[] = [
    { regex: /^(\d+)\s*(m|min|mins|minute|minutes)$/, unit: "minute" },
    { regex: /^(\d+)\s*(h|hr|hrs|hour|hours)$/, unit: "hour" },
    { regex: /^(\d+)\s*(d|day|days)$/, unit: "day" },
    { regex: /^(\d+)\s*(w|wk|wks|week|weeks)$/, unit: "week" },
    { regex: /^(\d+)$/, unit: "week" },
  ]

  for (const { regex, unit } of patterns) {
    const match = normalized.match(regex)
    if (match) {
      return { amount: match[1], unit }
    }
  }

  return { amount: "", unit: "week" }
}

export function courseDurationUnitLabel(
  unit: CourseDurationUnit | string | null | undefined,
  amount: number,
): string {
  const labels = UNIT_LABELS[normalizeDurationUnit(unit)]
  return amount === 1 ? labels.singular : labels.plural
}
