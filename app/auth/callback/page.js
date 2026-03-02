'use server'

import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback() {
  const supabase = createClient()

  let user = null
  try {
    const {
      data: { user: activeUser },
      error,
    } = await supabase.auth.getUser()
    user = error ? null : activeUser
  } catch {
    user = null
  }

  if (user?.id) {
    // Ensure profile exists (e.g. if trigger wasn't deployed or user confirmed email later)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    if (!existing) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email ?? null,
        subscription_status: 'inactive',
        subscription_tier: 'free',
      })
    }
  }

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }
}
