'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../utils/supabase/client'
import { logError } from '../../utils/logger'
import {
  DollarSign,
  Camera,
  FileCheck,
  Package,
  Wrench,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  ClipboardCheck,
} from 'lucide-react'

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // Check if user is logged in - redirect to dashboard if they are
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const allowUpgrade = searchParams.get('upgrade') === 'true'
      if (user && !allowUpgrade) {
        router.replace('/dashboard')
      }
    }
    checkAuth()
  }, [router, supabase, searchParams])

  // Safety reset: if a previous route left body scroll locked, restore it on Welcome.
  useEffect(() => {
    const { body, documentElement } = document
    body.style.overflow = ''
    body.style.touchAction = ''
    documentElement.style.overflow = ''
  }, [])

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
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentLink: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }
      if (!data?.url || typeof data.url !== 'string') {
        throw new Error('Checkout URL missing from server response')
      }
      window.location.assign(data.url)
    } catch (error) {
      logError('Welcome checkout failed', error)
      alert(error.message || 'Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-y-auto hide-scrollbar bg-[var(--bg-main)] text-[var(--text-main)] font-inter">
      {/* NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#FF6700] font-oswald font-bold text-xl uppercase tracking-wide">
            FIELDDESKOPS
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors font-medium">How It Works</a>
              <a href="#pricing" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors font-medium">Pricing</a>
            </div>
            <Link href="/auth/login" className="px-3 py-2 md:px-4 text-sm md:text-base border border-[var(--border-color)] rounded-xl hover:border-[#FF6700] hover:text-[#FF6700] transition-all font-medium">Login</Link>
            <Link href="/auth/signup" className="px-4 py-2 md:px-5 md:py-2.5 bg-[#FF6700] text-black font-bold rounded-xl shadow-[0_0_15px_rgba(255,103,0,0.35)] hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] transition-all flex items-center gap-2 text-sm md:text-base">
              Sign Up Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF6700]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <p className="inline-block px-4 py-1.5 rounded-full bg-[#FF6700]/15 border border-[#FF6700]/40 text-[#FF6700] text-sm font-bold uppercase tracking-wider mb-6">
            Built for Contractors Who Want to Win
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-oswald font-black uppercase tracking-tight mb-6 leading-tight">
            Stop Leaving{' '}
            <span className="text-[#FF6700] drop-shadow-[0_0_30px_rgba(255,103,0,0.4)]">Money on the Table</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-sub)] mb-4 max-w-2xl mx-auto">
            One platform for estimates, photos, contracts, and inventory. Quote with confidence, document every job, get paid faster.
          </p>
          <p className="text-[var(--text-sub)] text-sm mb-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#FF6700]" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#FF6700]" /> Free plan available</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={16} className="text-[#FF6700]" /> Cancel anytime</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup" className="w-full sm:w-auto px-8 py-4 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.5)] transition-all flex items-center justify-center gap-2 text-lg">
              Create Free Account <ArrowRight size={20} />
            </Link>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 border-2 border-[#FF6700] text-[#FF6700] rounded-xl hover:bg-[#FF6700]/10 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="animate-spin" size={20} /> Loading...</> : 'Start 7-Day Pro Trial'}
            </button>
          </div>
          <div className="mt-14 h-[420px] sm:h-[500px] bg-gradient-to-br from-[#FF6700]/15 via-[#FF6700]/5 to-transparent rounded-2xl border border-[#FF6700]/20 shadow-[0_0_60px_rgba(255,103,0,0.15)] flex items-center justify-center">
            <div className="text-center px-4">
              <Zap size={48} className="text-[#FF6700] mx-auto mb-4 opacity-90" />
              <p className="text-[var(--text-sub)] text-sm uppercase tracking-wider font-medium">All your jobs. One dashboard. Real profit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / AGITATE */}
      <section className="py-16 px-6 border-y border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-oswald font-bold mb-6 uppercase text-[var(--text-main)]">
            Sound Familiar?
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-[var(--text-sub)]">
            {[
              'You underbid jobs because you guessed on materials and labor.',
              'Photos are scattered in your phone—good luck finding that "before" shot.',
              'Paperwork gets lost; customers forget they signed; you eat the cost.',
              'Tools and inventory are a black hole. You buy twice because you forgot what you had.',
            ].map((line, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-[#FF6700] font-bold shrink-0">×</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-lg text-[var(--text-main)] font-medium">
            FieldDeskOps fixes that. One place for quotes, docs, photos, and gear.
          </p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold text-center mb-4 uppercase text-[var(--text-main)]">
            Everything You Need to Run Jobs Profitably
          </h2>
          <p className="text-center text-[var(--text-sub)] mb-12 max-w-2xl mx-auto">
            Four powerful apps in one platform. No more juggling spreadsheets, notes, and lost paperwork.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,103,0,0.15)] transition-all group">
              <DollarSign size={48} className="text-[#FF6700] mb-4 group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all" />
              <h3 className="text-xl font-oswald font-bold mb-2">ProfitLock — Smart Estimates</h3>
              <p className="text-[var(--text-sub)] mb-4">
                Build accurate quotes in minutes. Track parts, labor, and margins so you never underbid again. Turn estimates into invoices and get paid.
              </p>
              <p className="text-sm text-[#FF6700] font-semibold">Stop guessing. Start winning bids.</p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,103,0,0.15)] transition-all group">
              <Camera size={48} className="text-[#FF6700] mb-4 group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all" />
              <h3 className="text-xl font-oswald font-bold mb-2">SiteSnap — Photo Documentation</h3>
              <p className="text-[var(--text-sub)] mb-4">
                Before/after, damage, progress—all tied to the job. Organize by project and share with clients in one click. Your proof, always ready.
              </p>
              <p className="text-sm text-[#FF6700] font-semibold">Every job. Every photo. One place.</p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,103,0,0.15)] transition-all group">
              <FileCheck size={48} className="text-[#FF6700] mb-4 group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all" />
              <h3 className="text-xl font-oswald font-bold mb-2">SignOff — Digital Contracts</h3>
              <p className="text-[var(--text-sub)] mb-4">
                Get signatures on-site with professional templates. No more lost paperwork or "I never signed that." Legal-ready, client-ready.
              </p>
              <p className="text-sm text-[#FF6700] font-semibold">Sign once. Protected forever.</p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-8 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,103,0,0.15)] transition-all group">
              <Wrench size={48} className="text-[#FF6700] mb-4 group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all" />
              <h3 className="text-xl font-oswald font-bold mb-2">LoadOut — Inventory & Tools</h3>
              <p className="text-[var(--text-sub)] mb-4">
                Track stock, rigs, and tools. Know what you have, who has it, and what's broken. Fewer duplicate buys, fewer lost assets.
              </p>
              <p className="text-sm text-[#FF6700] font-semibold">One rig. One list. Zero guesswork.</p>
            </div>
          </div>
          <div className="mt-10 text-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6700]/15 border border-[#FF6700]/40 text-[#FF6700] font-bold rounded-xl hover:bg-[#FF6700]/25 transition-all">
              Try all four apps free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 bg-[var(--bg-card)]/40 border-y border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold text-center mb-4 uppercase text-[var(--text-main)]">
            From Sign-Up to First Job in Minutes
          </h2>
          <p className="text-center text-[var(--text-sub)] mb-12 max-w-xl mx-auto">
            No long onboarding. No IT. Just you and one dashboard that actually works.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Sign up free', desc: 'Create your account. No credit card. Start on the free plan or begin a 7-day Pro trial.', icon: ClipboardCheck },
              { step: 2, title: 'Add your first job', desc: 'Name the job, assign it to a rig if you use LoadOut. One click and you\'re live.', icon: Zap },
              { step: 3, title: 'Run the job', desc: 'Quote with ProfitLock, snap photos with SiteSnap, get signatures with SignOff. All from one place.', icon: Shield },
              { step: 4, title: 'Get paid & scale', desc: 'Invoices and docs are ready. Add more jobs, more rigs, more team—without the chaos.', icon: DollarSign },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#FF6700]/20 border-2 border-[#FF6700]/50 flex items-center justify-center mx-auto mb-4 relative">
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF6700] text-black font-black text-xs flex items-center justify-center">{step}</span>
                  <Icon size={28} className="text-[#FF6700]" />
                </div>
                <h3 className="text-lg font-oswald font-bold mb-2 uppercase text-[var(--text-main)]">{title}</h3>
                <p className="text-sm text-[var(--text-sub)]">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.35)] hover:shadow-[0_0_30px_rgba(255,103,0,0.5)] transition-all text-lg">
              Get started now <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold mb-4 uppercase text-[var(--text-main)]">
            Built for Contractors Who Mean Business
          </h2>
          <p className="text-[var(--text-sub)] mb-10 max-w-xl mx-auto">
            Join field pros who stopped losing money on bad estimates and messy paperwork.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
              <p className="text-[var(--text-main)] italic mb-4">&ldquo;Finally one app for quotes, photos, and getting the customer to sign. No more digging through my phone or losing a contract.&rdquo;</p>
              <p className="text-[#FF6700] font-bold">— Field contractor</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
              <p className="text-[var(--text-main)] italic mb-4">&ldquo;I was underbidding jobs because I had no system. Now I know my numbers before I say a price. Game changer.&rdquo;</p>
              <p className="text-[#FF6700] font-bold">— Small crew owner</p>
            </div>
          </div>
          <p className="mt-8 text-sm text-[var(--text-sub)]">
            Start free. Upgrade when you&apos;re ready. No lock-in.
          </p>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-oswald font-bold text-center mb-2 uppercase text-[var(--text-main)]">
            Simple Pricing. No Surprises.
          </h2>
          <p className="text-center text-[var(--text-sub)] mb-8">
            Start free. Upgrade when you need more jobs, photos, and power.
          </p>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-6 right-6 bg-[#FF6700] text-black text-xs font-bold px-3 py-1 rounded-full">
              EARLY ACCESS
            </div>

            <h3 className="text-2xl font-oswald font-bold mb-4 uppercase text-[var(--text-main)]">
              FieldDeskOps Pro
            </h3>

            <div className="mb-6">
              <span className="text-5xl md:text-6xl font-oswald font-black text-[#FF6700]">$19.99</span>
              <span className="text-xl text-[var(--text-sub)] ml-2">/month</span>
            </div>

            <div className="bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-xl p-4 mb-8">
              <p className="text-[#FF6700] font-bold">7-Day Free Trial · No Credit Card Required</p>
            </div>

            <div className="space-y-4 mb-8 text-left">
              {[
                'All 4 apps: ProfitLock, SiteSnap, SignOff, LoadOut',
                'Unlimited jobs & estimates',
                'Unlimited photos & documentation',
                'Professional contract templates',
                'Inventory & tool tracking',
                'Email support · Cancel anytime',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-[#FF6700] shrink-0" />
                  <span className="text-[var(--text-main)]">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/auth/signup" className="flex-1 px-8 py-4 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.5)] transition-all flex items-center justify-center gap-2 text-lg">
                Sign Up Free <ArrowRight size={20} />
              </Link>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex-1 px-8 py-4 border-2 border-[#FF6700] text-[#FF6700] font-bold rounded-xl hover:bg-[#FF6700]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {loading ? <><Loader2 className="animate-spin" size={20} /> Loading...</> : 'Start 7-Day Pro Trial'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 px-6 bg-[#FF6700]/5 border-t border-[#FF6700]/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-oswald font-black mb-4 uppercase text-[var(--text-main)]">
            You Deserve to Get Paid What You&apos;re Worth
          </h2>
          <p className="text-xl text-[var(--text-sub)] mb-8 max-w-2xl mx-auto">
            Stop leaving money on the table. One platform. Better quotes. Fewer headaches. More profit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup" className="w-full sm:w-auto px-10 py-5 bg-[#FF6700] text-black font-black rounded-xl shadow-[0_0_25px_rgba(255,103,0,0.4)] hover:shadow-[0_0_35px_rgba(255,103,0,0.5)] transition-all flex items-center justify-center gap-2 text-xl">
              Create Free Account <ArrowRight size={24} />
            </Link>
            <a href="#pricing" className="w-full sm:w-auto px-10 py-5 border-2 border-[var(--border-color)] rounded-xl hover:border-[#FF6700] hover:text-[#FF6700] transition-all font-bold text-xl text-center">
              See Pricing
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border-color)] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="text-[#FF6700] font-oswald font-bold text-lg uppercase tracking-wide">
              FIELDDESKOPS
            </Link>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#features" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm">Features</a>
              <a href="#how-it-works" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm">How It Works</a>
              <a href="#pricing" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm">Pricing</a>
              <Link href="/auth/login" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm">Login</Link>
              <Link href="/auth/signup" className="text-[#FF6700] font-semibold hover:underline text-sm">Sign Up</Link>
              <Link href="/legal/terms?from=%2Fwelcome" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm">Terms</Link>
              <Link href="/legal/privacy?from=%2Fwelcome" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors text-sm">Privacy</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-[var(--text-sub)] text-sm">
            © {new Date().getFullYear()} FieldDeskOps. Built for contractors, by contractors.
          </div>
        </div>
      </footer>
    </div>
  )
}
