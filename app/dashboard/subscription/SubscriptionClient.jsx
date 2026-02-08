'use client'

import { useState } from 'react'
import { ShieldCheck, Loader2, ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'
import { getPaymentLink } from '@/lib/stripePaymentLink'

export default function SubscriptionClient() {
  const [loading, setLoading] = useState(false)

  const handleToStripe = async () => {
    setLoading(true)
    try {
      const paymentLink = getPaymentLink() || undefined
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentLink }),
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        alert(data?.error || 'Checkout failed')
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      alert('Checkout link missing. Try again.')
    } catch (e) {
      alert('Unable to start checkout. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-6">
      <Link
        href="/dashboard"
        className="absolute top-6 left-6 flex items-center gap-2 font-bold text-[var(--text-sub)] hover:text-[#FF6700]"
      >
        <ArrowLeft size={20} /> BACK
      </Link>

      <div className="industrial-card rounded-2xl p-8 max-w-md w-full text-center border-2 border-[#FF6700]">
        <h1 className="text-4xl font-oswald font-bold mb-2">PRO PLAN</h1>
        <div className="text-5xl font-oswald font-bold mb-6">
          $9.99<span className="text-lg text-[var(--text-sub)]">/mo</span>
        </div>

        <div className="bg-[#FF6700]/10 border border-[#FF6700] rounded p-3 mb-8">
          <p className="text-[#FF6700] font-bold flex justify-center gap-2">
            <Zap size={20} /> 7-Day Free Trial
          </p>
          <p className="text-xs mt-1">You won't be charged today.</p>
        </div>

        <button
          onClick={handleToStripe}
          disabled={loading}
          className="w-full bg-[#FF6700] text-black font-bold py-4 rounded-xl text-lg hover:scale-[1.02] transition shadow-lg flex justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={24} />}{' '}
          START TRIAL
        </button>
      </div>
    </div>
  )
}
