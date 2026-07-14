/** Decode role from JWT payload (Edge-safe; API still enforces auth). */
export function getRoleFromSessionToken(token: string): string | null {
  try {
    const parts = token.split(".")
    if (parts.length < 2 || !parts[1]) return null

    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const pad = base64.length % 4
    if (pad) base64 += "=".repeat(4 - pad)

    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf8")

    const payload = JSON.parse(json) as { role?: string }
    return payload.role ?? null
  } catch {
    return null
  }
}
