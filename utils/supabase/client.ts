import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // During build/prerender there is no browser context; avoid initializing Supabase there.
  if (typeof window === 'undefined') return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase client env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
