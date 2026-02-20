'use client'

import { useState } from 'react'
import { getPaymentLink } from '@/lib/stripePaymentLink'
import { track } from '@vercel/analytics'

export default function BillingPortalButton({ action = 'upgrade', label }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      const isBillingAction = action === 'billing'
      let res

      if (isBillingAction) {
        res = await fetch('/api/stripe/billing-portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } else {
        track('upgrade_clicked')
        const paymentLink = getPaymentLink() || undefined
        res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentLink }),
        })
      }

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }
      setError('Redirect link missing. Please try again.')
    } catch (err) {
      setError('Unable to continue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-6 py-3 text-sm font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Opening...' : (label || (action === 'billing' ? 'Manage Billing' : 'Upgrade Account'))}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
