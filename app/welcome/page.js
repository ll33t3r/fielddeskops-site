'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  DollarSign,
  Camera,
  FileCheck,
  Package,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [stripePromise] = useState(() =>
    loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  )

  // Smooth scroll for anchor links
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const href = e.target.getAttribute('href')
      if (href && href.startsWith('#')) {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [])

  const handleCheckout = async () => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
      alert('Stripe price ID not configured')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert(error.message || 'Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-inter">
      {/* NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-[#FF6700] font-oswald font-bold text-xl uppercase tracking-wide">
            FIELDDESKOPS
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors font-medium"
            >
              Pricing
            </a>
            <Link
              href="/auth/login"
              className="px-4 py-2 border border-[var(--border-color)] rounded-xl hover:border-[#FF6700] hover:text-[#FF6700] transition-all font-medium"
            >
              Login
            </Link>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="px-6 py-2 bg-[#FF6700] text-black font-bold rounded-xl shadow-[0_0_15px_rgba(255,103,0,0.4)] hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Loading...
                </>
              ) : (
                'Start Free Trial'
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-oswald font-black uppercase tracking-tight mb-6">
            Stop Losing Money on{' '}
            <span className="text-[#FF6700]">Bad Estimates</span>
          </h1>
          <p className="text-xl text-[var(--text-sub)] mb-12 max-w-2xl mx-auto">
            The all-in-one job management system built for field contractors
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="px-8 py-4 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Loading...
                </>
              ) : (
                'Start 7-Day Free Trial'
              )}
            </button>
            <a
              href="#pricing"
              className="px-8 py-4 border-2 border-[var(--border-color)] rounded-xl hover:border-[#FF6700] hover:text-[#FF6700] transition-all font-bold text-lg"
            >
              View Pricing
            </a>
          </div>
          {/* Hero Visual Placeholder */}
          <div className="mt-16 h-[600px] bg-gradient-to-br from-[#FF6700]/20 via-[#FF6700]/10 to-transparent rounded-2xl border border-[#FF6700]/30 shadow-[0_0_40px_rgba(255,103,0,0.2)] flex items-center justify-center">
            <div className="text-center">
              <div className="text-[#FF6700] text-6xl mb-4">📊</div>
              <p className="text-[var(--text-sub)] text-sm uppercase tracking-wider">
                Product Preview
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-oswald font-bold text-center mb-12 uppercase">
            Everything You Need to Run Jobs Profitably
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature Card 1 - ProfitLock */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,103,0,0.15)] transition-all group">
              <DollarSign
                size={48}
                className="text-[#FF6700] mb-4 group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all"
              />
              <h3 className="text-xl font-oswald font-bold mb-2">Smart Estimates</h3>
              <p className="text-[var(--text-sub)]">
                Calculate accurate quotes in minutes with parts, labor, and profit
                margin tracking
              </p>
            </div>

            {/* Feature Card 2 - SiteSnap */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,103,0,0.15)] transition-all group">
              <Camera
                size={48}
                className="text-[#FF6700] mb-4 group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all"
              />
              <h3 className="text-xl font-oswald font-bold mb-2">
                Photo Documentation
              </h3>
              <p className="text-[var(--text-sub)]">
                Capture before/after photos with AI organization and instant client
                sharing
              </p>
            </div>

            {/* Feature Card 3 - SignOff */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,103,0,0.15)] transition-all group">
              <FileCheck
                size={48}
                className="text-[#FF6700] mb-4 group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all"
              />
              <h3 className="text-xl font-oswald font-bold mb-2">
                Digital Contracts
              </h3>
              <p className="text-[var(--text-sub)]">
                Get customer signatures on-site with smart templates and legal
                protection
              </p>
            </div>

            {/* Feature Card 4 - LoadOut */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,103,0,0.15)] transition-all group relative">
              <div className="absolute top-4 right-4 bg-[#FF6700] text-black text-xs font-bold px-2 py-1 rounded">
                COMING SOON
              </div>
              <Package
                size={48}
                className="text-[#FF6700] mb-4 group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all"
              />
              <h3 className="text-xl font-oswald font-bold mb-2">
                Inventory Tracking
              </h3>
              <p className="text-[var(--text-sub)]">
                Track materials, costs, and returns in real-time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Badge */}
            <div className="absolute top-6 right-6 bg-[#FF6700] text-black text-xs font-bold px-3 py-1 rounded-full">
              EARLY ACCESS PRICING
            </div>

            <h2 className="text-3xl font-oswald font-bold mb-4 uppercase">
              FieldDeskOps Complete
            </h2>

            <div className="mb-6">
              <span className="text-6xl font-oswald font-black text-[#FF6700]">
                $19.99
              </span>
              <span className="text-xl text-[var(--text-sub)] ml-2">/month</span>
            </div>

            {/* Highlight Box */}
            <div className="bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-xl p-4 mb-8">
              <p className="text-[#FF6700] font-bold">
                7-Day Free Trial - No Credit Card Required
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-4 mb-8 text-left">
              {[
                'All 4 apps included',
                'Unlimited jobs',
                'Unlimited photos',
                'Smart templates',
                'Email support',
                'Cancel anytime',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-[#FF6700] shrink-0" />
                  <span className="text-[var(--text-main)]">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full px-8 py-4 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Loading...
                </>
              ) : (
                'Start Free Trial'
              )}
            </button>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-oswald font-bold mb-4 uppercase">
            Ready to Take Control of Your Business?
          </h2>
          <p className="text-xl text-[var(--text-sub)] mb-8">
            Join contractors who are making more profit per job
          </p>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="px-10 py-5 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_25px_rgba(255,103,0,0.4)] hover:shadow-[0_0_35px_rgba(255,103,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto text-xl"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Loading...
              </>
            ) : (
              'Start Your Free Trial'
            )}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border-color)] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[#FF6700] font-oswald font-bold text-lg uppercase tracking-wide">
              FIELDDESKOPS
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                href="#features"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors"
              >
                Pricing
              </a>
              <Link
                href="/auth/login"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-[var(--text-sub)] text-sm">
            © 2026 FieldDeskOps. Built for contractors, by contractors.
          </div>
        </div>
      </footer>
    </div>
  )
}
