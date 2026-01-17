'use server'

import { createClient } from '../../../lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signup(formData) {
  const origin = headers().get('origin')
  const email = formData.get('email')
  const password = formData.get('password')
  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // We don't redirect here because we want to show the "Check Email" success message
  return { success: true }
}
