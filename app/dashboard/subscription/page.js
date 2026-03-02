import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import SubscriptionClient from './SubscriptionClient'

export default async function SubscriptionPage() {
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

  if (!user) {
    const message = encodeURIComponent('Please log in to continue.')
    redirect(
      `/auth/login?redirectTo=${encodeURIComponent('/dashboard/subscription')}&message=${message}`
    )
  }

  return <SubscriptionClient />
}
