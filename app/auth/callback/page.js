'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthCallback() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

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
  
  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }
}
