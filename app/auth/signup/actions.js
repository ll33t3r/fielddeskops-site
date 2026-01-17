'use server'

import { createClient } from '../../../lib/supabase/server'
import { headers } from 'next/headers'

export async function signup(formData) {
  const origin = headers().get('origin')
  const email = formData.get('email')
  const password = formData.get('password')
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Check if we have an active session immediately (Auto-Confirm ON)
  if (data?.session) {
    return { success: true, autoConfirmed: true }
  }

  // No session yet (Auto-Confirm OFF)
  return { success: true, autoConfirmed: false }
}
