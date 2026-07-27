export function formatCoursePrice(priceCents: number): string {
  if (priceCents <= 0) return "Free"
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(priceCents / 100)
}
