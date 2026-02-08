import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import BillingPortalButton from './BillingPortalButton'

export const dynamic = 'force-dynamic'

// Map internal tier values to display names
function getPlanDisplay(tier, status) {
  if (status === 'paid' || tier === 'paid' || tier === 'pro') {
    return { label: 'Pro', emoji: '👑', color: 'text-orange-400' }
  }
  if (status === 'trial' || tier === 'trial') {
    return { label: 'Trial', emoji: '⏳', color: 'text-yellow-400' }
  }
  return { label: 'Free', emoji: '🔓', color: 'text-gray-400' }
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

  // Load profile with subscription data
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier, stripe_customer_id, stripe_subscription_id, created_at')
    .eq('id', session.user.id)
    .single()

  const subscriptionStatus = profile?.subscription_status || 'free'
  const subscriptionTier = profile?.subscription_tier || 'free'
  const hasStripeCustomer = !!profile?.stripe_customer_id
  const plan = getPlanDisplay(subscriptionTier, subscriptionStatus)
  const userEmail = session.user.email || 'Unknown'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  // Load usage data
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-primary hover:text-orange-400 mb-6"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Account Settings</h1>
              <p className="text-gray-400 mt-2">Manage your FieldDeskOps account</p>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription card */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Current Plan</p>
                  <p className={`text-2xl font-bold ${plan.color}`}>{plan.label}</p>
                </div>
                <div className="text-3xl">{plan.emoji}</div>
              </div>

              {subscriptionStatus === 'paid' && (
                <p className="mt-2 text-sm text-green-400">Active subscription</p>
              )}
              {subscriptionStatus === 'trial' && (
                <p className="mt-2 text-sm text-yellow-400">Trial period</p>
              )}
              {(subscriptionStatus === 'free' || subscriptionStatus === 'inactive') && (
                <p className="mt-2 text-sm text-gray-500">
                  Upgrade to Pro to unlock unlimited resources.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <BillingPortalButton hasStripeCustomer={hasStripeCustomer} />
                {!hasStripeCustomer && (
                  <Link
                    href="/welcome?upgrade=true#pricing"
                    className="inline-block px-6 py-3 bg-primary hover:bg-orange-600 rounded-lg font-medium transition-colors text-white"
                  >
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            </div>

            {/* Profile card */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-1">Email</label>
                  <p className="text-white">{userEmail}</p>
                </div>
                {memberSince && (
                  <div>
                    <label className="block text-gray-400 mb-1">Member Since</label>
                    <p className="text-white">{memberSince}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="block w-full text-center py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors text-white"
                >
                  Sign Out
                </Link>
                <Link
                  href="/legal/terms"
                  className="block w-full text-center py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-white"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/legal/privacy"
                  className="block w-full text-center py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-white"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            {/* Usage card */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Usage</h3>
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
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-xl font-bold text-white">{total} created</p>
    </div>
  )
}
