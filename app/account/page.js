import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import BillingPortalButton from './BillingPortalButton'

export const dynamic = 'force-dynamic'

function getPlanDisplay(tier, status) {
  if (status === 'paid' || tier === 'paid' || tier === 'pro') {
    return { label: 'Pro', color: 'text-[#FF6700]' }
  }
  if (status === 'trial' || tier === 'trial') {
    return { label: 'Trial', color: 'text-yellow-400' }
  }
  return { label: 'Free', color: 'text-[var(--text-sub)]' }
}

export default async function AccountPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    const message = encodeURIComponent('Please log in to continue.')
    redirect(`/auth/login?redirectTo=${encodeURIComponent('/account')}&message=${message}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier, stripe_customer_id, stripe_subscription_id, created_at')
    .eq('id', session.user.id)
    .single()

  const subscriptionStatus = profile?.subscription_status || 'free'
  const subscriptionTier = profile?.subscription_tier || 'free'
  const plan = getPlanDisplay(subscriptionTier, subscriptionStatus)
  const userEmail = session.user.email || 'Unknown'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  const { data: usageRows } = await supabase
    .from('usage_tracking')
    .select('resource_type, total_created')
    .eq('user_id', session.user.id)

  const usageMap = {}
  if (usageRows) {
    for (const row of usageRows) {
      usageMap[row.resource_type] = row.total_created
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 md:p-8 text-[var(--text-main)]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-[var(--text-sub)] hover:text-[#FF6700] mb-6 font-semibold"
          >
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-oswald font-bold">Account Settings</h1>
              <p className="text-[var(--text-sub)] mt-2">Manage your FieldDeskOps account</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="industrial-card rounded-2xl p-6">
              <h2 className="text-xl font-oswald font-semibold mb-4">Subscription</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-sub)]">Current Plan</p>
                  <p className={`text-2xl font-bold ${plan.color}`}>{plan.label}</p>
                </div>
                <span className="rounded-full border border-[#FF6700]/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6700]">
                  {subscriptionStatus}
                </span>
              </div>

              {subscriptionStatus === 'paid' && (
                <p className="mt-2 text-sm text-green-400">Active subscription</p>
              )}
              {subscriptionStatus === 'trial' && (
                <p className="mt-2 text-sm text-yellow-400">Trial period</p>
              )}
              {(subscriptionStatus === 'free' || subscriptionStatus === 'inactive') && (
                <p className="mt-2 text-sm text-[var(--text-sub)]">
                  Upgrade to Pro to unlock unlimited resources.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <BillingPortalButton />
              </div>
            </div>

            <div className="industrial-card rounded-2xl p-6">
              <h2 className="text-xl font-oswald font-semibold mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[var(--text-sub)] mb-1">Email</label>
                  <p>{userEmail}</p>
                </div>
                {memberSince && (
                  <div>
                    <label className="block text-[var(--text-sub)] mb-1">Member Since</label>
                    <p>{memberSince}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="industrial-card rounded-2xl p-6">
              <h3 className="text-lg font-oswald font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full text-center py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors text-white"
                >
                  Sign Out
                </Link>
                <Link
                  href="/legal/terms"
                  className="block w-full text-center py-3 rounded-lg font-medium transition-colors border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[#FF6700]/50"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/legal/privacy"
                  className="block w-full text-center py-3 rounded-lg font-medium transition-colors border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[#FF6700]/50"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            <div className="industrial-card rounded-2xl p-6">
              <h3 className="text-lg font-oswald font-semibold mb-4">Usage</h3>
              <div className="space-y-3">
                <UsageStat label="Jobs" count={usageMap.jobs} />
                <UsageStat label="Estimates" count={usageMap.estimates} />
                <UsageStat label="Photos" count={usageMap.photos} />
                <UsageStat label="Contracts" count={usageMap.signoff_docs} />
                <UsageStat label="Inventory Items" count={usageMap.items} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsageStat({ label, count }) {
  const total = count ?? 0
  return (
    <div>
      <p className="text-[var(--text-sub)] text-sm">{label}</p>
      <p className="text-xl font-bold">{total} created</p>
    </div>
  )
}
