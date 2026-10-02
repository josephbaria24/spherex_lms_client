/** Decode session claims from JWT payload (Edge-safe; API still enforces auth). */
export function getSessionClaims(token: string): {
  role: string | null
  email_verified: boolean | null
} {
  try {
    const parts = token.split(".")
    if (parts.length < 2 || !parts[1]) return { role: null, email_verified: null }

    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const pad = base64.length % 4
    if (pad) base64 += "=".repeat(4 - pad)

    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf8")

    const payload = JSON.parse(json) as { role?: string; email_verified?: boolean }
    return {
      role: payload.role ?? null,
      email_verified: typeof payload.email_verified === "boolean" ? payload.email_verified : null,
    }
  } catch {
    return { role: null, email_verified: null }
  }
}

export function getRoleFromSessionToken(token: string): string | null {
  return getSessionClaims(token).role
}
