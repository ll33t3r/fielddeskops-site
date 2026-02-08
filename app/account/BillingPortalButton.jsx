'use client'

import { useState } from 'react'

export default function BillingPortalButton({ hasStripeCustomer }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/billing-portal', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError('Unable to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasStripeCustomer) {
    return (
      <p className="text-sm text-gray-500 italic">
        No billing account yet. Subscribe to a paid plan to manage billing.
      </p>
    )
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-block px-6 py-3 bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white"
      >
        {loading ? 'Opening...' : 'Manage Billing'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
