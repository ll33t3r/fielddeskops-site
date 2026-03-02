import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // During build/prerender there is no browser context; avoid initializing Supabase there.
  if (typeof window === 'undefined') return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
