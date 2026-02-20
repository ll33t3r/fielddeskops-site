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
    redirect(`/auth/login?redirectTo=${encodeURIComponent('/account')}&message=${message}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier, stripe_customer_id, stripe_subscription_id, created_at')
    .eq('id', session.user.id)
    .single()

  const subscriptionStatus = profile?.subscription_status || 'free'
  const subscriptionTier = profile?.subscription_tier || 'free'
  const hasStripeCustomer = !!profile?.stripe_customer_id
  const isActiveSubscription = subscriptionStatus === 'paid' || subscriptionStatus === 'trial'
  const hasPastSubscription = Boolean(profile?.stripe_customer_id)
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
    <div className="h-screen overflow-y-auto hide-scrollbar bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="max-w-6xl mx-auto p-4 md:p-8 pb-10">
        <div className="mb-8 industrial-card rounded-2xl p-5 md:p-6 border border-[#FF6700]/30 shadow-[0_0_28px_rgba(255,103,0,0.15)]">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-xl border border-[#FF6700]/60 bg-[#FF6700]/15 px-4 py-2 text-sm font-bold text-[#FF6700] shadow-[0_0_18px_rgba(255,103,0,0.25)] hover:bg-[#FF6700]/25 hover:shadow-[0_0_24px_rgba(255,103,0,0.45)] transition mb-5"
          >
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-4xl md:text-5xl font-oswald font-black uppercase tracking-wide">
              Account Command
            </h1>
            <p className="text-[var(--text-sub)] mt-2">Manage billing, subscription, and usage in one place.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="industrial-card rounded-2xl p-6 border border-[var(--border-color)]">
              <h2 className="text-xl font-oswald font-bold uppercase tracking-wide mb-4">Subscription</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-sub)]">Current Plan</p>
                  <p className={`text-3xl font-oswald font-bold ${plan.color}`}>{plan.label}</p>
                </div>
                <span className="rounded-full border border-[#FF6700]/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#FF6700]">
                  {subscriptionStatus}
                </span>
              </div>

              {isActiveSubscription ? (
                <p className="mt-2 text-sm font-extrabold text-green-400">Pro Active</p>
              ) : (
                <p className="mt-2 text-sm font-bold text-[#FF6700]">Not Active</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {isActiveSubscription && hasStripeCustomer ? (
                  <BillingPortalButton action="billing" label="Manage Billing" />
                ) : (
                  <BillingPortalButton
                    action="upgrade"
                    label={hasPastSubscription ? 'Renew / Resubscribe' : 'Upgrade'}
                  />
                )}
              </div>
              <p className="mt-3 text-xs text-[var(--text-sub)]">
                Use billing to cancel or manage your subscription.
              </p>
            </div>

            <div className="industrial-card rounded-2xl p-6 border border-[var(--border-color)]">
              <h2 className="text-xl font-oswald font-bold uppercase tracking-wide mb-4">Profile</h2>
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
            <div className="industrial-card rounded-2xl p-6 border border-[var(--border-color)]">
              <h3 className="text-lg font-oswald font-bold uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full text-center py-3 rounded-lg font-bold transition border border-red-500/40 bg-red-900/20 hover:bg-red-900/40 text-red-300"
                >
                  Sign Out
                </Link>
                <Link
                  href="/legal/terms?from=%2Faccount"
                  className="block w-full text-center py-3 rounded-lg font-bold transition-colors border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[#FF6700]/60"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/legal/privacy?from=%2Faccount"
                  className="block w-full text-center py-3 rounded-lg font-bold transition-colors border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[#FF6700]/60"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            <div className="industrial-card rounded-2xl p-6 border border-[var(--border-color)]">
              <h3 className="text-lg font-oswald font-bold uppercase tracking-wide mb-4">Usage Tracking</h3>
              <div className="space-y-2">
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
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 flex items-center justify-between">
      <p className="text-[var(--text-sub)] text-sm">{label}</p>
      <p className="text-base font-bold text-[var(--text-main)]">{total} created</p>
    </div>
  )
}
