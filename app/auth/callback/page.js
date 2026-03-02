'use server'

import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback() {
  const supabase = createClient()

  let session = null
  try {
    const {
      data: { session: activeSession },
      error,
    } = await supabase.auth.getSession()
    session = error ? null : activeSession
  } catch {
    session = null
  }

  if (session?.user?.id) {
    // Ensure profile exists (e.g. if trigger wasn't deployed or user confirmed email later)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()
    if (!existing) {
      await supabase.from('profiles').insert({
        id: session.user.id,
        email: session.user.email ?? null,
        subscription_status: 'inactive',
        subscription_tier: 'free',
      })
    }
  }

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }
}
