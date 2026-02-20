import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import SubscriptionClient from './SubscriptionClient'

export default async function SubscriptionPage() {
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

  if (!session) {
    const message = encodeURIComponent('Please log in to continue.')
    redirect(
      `/auth/login?redirectTo=${encodeURIComponent('/dashboard/subscription')}&message=${message}`
    )
  }

  return <SubscriptionClient />
}
