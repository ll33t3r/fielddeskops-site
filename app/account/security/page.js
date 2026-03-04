import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/server'
import SecuritySection from '../SecuritySection'

export const dynamic = 'force-dynamic'

export default async function AccountSecurityPage() {
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
    redirect(`/auth/login?redirectTo=${encodeURIComponent('/account/security')}&message=${message}`)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Link
          href="/account"
          className="inline-flex items-center rounded-xl border border-[#FF6700]/60 bg-[#FF6700]/15 px-4 py-2 text-sm font-bold text-[#FF6700] hover:bg-[#FF6700]/25 transition"
        >
          Back to Account
        </Link>
        <SecuritySection userEmail={user.email || ''} />
      </div>
    </div>
  )
}
