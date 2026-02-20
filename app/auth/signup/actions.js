'use server'

import { createClient } from '../../../lib/supabase/server'
import { headers } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/email'
import { logError } from '../../../utils/logger'

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

  // Scaffolded transactional email path:
  // this only sends when RESEND_API_KEY is configured.
  try {
    if (typeof email === 'string' && email.trim()) {
      await sendWelcomeEmail({ to: email.trim() })
    }
  } catch (emailError) {
    logError('Signup welcome email failed', emailError, { email })
  }

  // Check if we have an active session immediately (Auto-Confirm ON)
  if (data?.session) {
    return { success: true, autoConfirmed: true }
  }

  // No session yet (Auto-Confirm OFF)
  return { success: true, autoConfirmed: false }
}
