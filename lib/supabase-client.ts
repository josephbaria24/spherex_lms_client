// lib/supabase-client.ts
import { createBrowserClient } from '@supabase/ssr'

/**
 * ⚠️ Do NOT use this directly in components!
 * Use `useSupabase()` hook from the provider instead.
 * 
 * This is only for backwards compatibility with existing code.
 */
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// For backward compatibility - but this creates a new instance each time
export const supabase = createClient()