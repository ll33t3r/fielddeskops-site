import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import SubscriptionClient from './SubscriptionClient'

export default async function SubscriptionPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    const message = encodeURIComponent('Please log in to continue.')
    redirect(
      `/auth/login?redirectTo=${encodeURIComponent('/dashboard/subscription')}&message=${message}`
    )
  }

  return <SubscriptionClient />
}
