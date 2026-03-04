'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, KeyRound } from 'lucide-react'
import { createClient } from '../utils/supabase/client'
import AuthThemeToggle from '../components/shared/AuthThemeToggle'
import { isEmail } from '../utils/validation'
import { logError } from '../../utils/logger'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isEmail(email)) {
      setError('Enter a valid email address.')
      return
    }

    if (!supabase) {
      setError('Unable to process request right now. Please try again.')
      return
    }

    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://fielddeskops.com/reset-password',
      })
      if (resetError) {
        logError('Forgot password reset link request failed', resetError)
      }
    } catch (requestError) {
      logError('Forgot password reset link request failed', requestError)
    } finally {
      setSubmitted(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-4 font-inter relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <AuthThemeToggle />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF6700] blur-3xl" />
      </div>

      <div className="mb-8 text-center relative z-10">
        <h1
          className="text-4xl font-oswald font-bold tracking-wide text-[#FF6700]"
          style={{ textShadow: '0 0 10px rgba(255,103,0,0.45), 0 0 22px rgba(255,103,0,0.25)' }}
        >
          FIELDDESKOPS
        </h1>
        <p className="text-[var(--text-sub)] text-sm mt-2">Reset your password</p>
      </div>

      <div className="w-full max-w-md industrial-card rounded-xl p-8 border border-[#FF6700]/30 shadow-[0_0_24px_rgba(255,103,0,0.18)] relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-[var(--bg-surface)] rounded-full border border-[#FF6700]/40">
            <KeyRound className="text-[#FF6700]" size={32} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="forgot-password-email" className="text-sm font-medium text-[var(--text-main)]">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
            />
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>

          {submitted ? (
            <div className="bg-green-900/20 p-3 rounded text-sm text-green-200 border border-green-500/40">
              If that email exists, a reset link has been sent.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_0_rgba(255,103,0,0)] hover:shadow-[0_0_20px_rgba(255,103,0,0.45)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send reset link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-[#FF6700] hover:opacity-90 text-sm font-semibold">
            Back to login
          </Link>
        </div>
      </div>
      <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-center relative z-10">
        <span className="text-[var(--text-sub)] opacity-60">Powered by </span>
        <span className="text-[#FF6700]">FieldDeskOps</span>
      </p>
    </div>
  )
}
