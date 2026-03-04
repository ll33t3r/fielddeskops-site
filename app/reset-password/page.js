'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '../utils/supabase/client'
import AuthThemeToggle from '../components/shared/AuthThemeToggle'
import PasswordStrengthMeter from '../components/shared/PasswordStrengthMeter'
import { evaluatePasswordStrength } from '../utils/passwordStrength'
import { logError } from '../../utils/logger'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const linkType = searchParams.get('type')
  const supabase = useMemo(() => createClient(), [])

  const [exchangeStatus, setExchangeStatus] = useState('loading')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(() => evaluatePasswordStrength(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let isMounted = true

    const setReady = () => {
      if (isMounted) setExchangeStatus('ready')
    }
    const setInvalid = () => {
      if (isMounted) setExchangeStatus('invalid')
    }

    async function exchangeCode() {
      if (!supabase) {
        setInvalid()
        return
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!isMounted) return

        if (exchangeError) {
          logError('Reset password code exchange failed', exchangeError)
          setInvalid()
        } else {
          setReady()
        }
        return
      }

      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        if (!isMounted) return

        if (verifyError) {
          logError('Reset password token verification failed', verifyError)
          setInvalid()
        } else {
          setReady()
        }
        return
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const hashType = hashParams.get('type')

      if (accessToken && refreshToken && hashType === 'recovery') {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!isMounted) return

        if (setSessionError) {
          logError('Reset password hash session setup failed', setSessionError)
          setInvalid()
        } else {
          setReady()
        }
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!isMounted) return
      if (session) {
        setReady()
        return
      }

      setInvalid()
    }

    exchangeCode().catch((exchangeError) => {
      logError('Reset password code exchange failed', exchangeError)
      setInvalid()
    })

    return () => {
      isMounted = false
    }
  }, [code, linkType, supabase, tokenHash])

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const canSubmit = passwordStrength.isAllowed && passwordsMatch && !loading

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!passwordStrength.isAllowed) {
      setError("Password doesn't meet requirements")
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    if (!supabase) {
      setError('Unable to update password right now. Please try again.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(updateError.message || 'Unable to update password right now. Please try again.')
        return
      }
      router.push('/dashboard')
    } catch (updateError) {
      logError('Reset password update failed', updateError)
      setError('Unable to update password right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (exchangeStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6700]" size={40} />
      </div>
    )
  }

  if (exchangeStatus === 'invalid') {
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
          <p className="text-[var(--text-sub)] text-sm mt-2">Password reset</p>
        </div>

        <div className="w-full max-w-md industrial-card rounded-xl p-8 border border-[#FF6700]/30 shadow-[0_0_24px_rgba(255,103,0,0.18)] relative z-10 text-center">
          <p className="text-red-300 mb-4">This link is invalid or has expired.</p>
          <Link href="/forgot-password" className="text-[#FF6700] hover:underline">
            Request a new reset link
          </Link>
          <p className="mt-4 text-xs text-[var(--text-sub)]">
            Need help? Contact support at{' '}
            <a href="mailto:hello@truffr.com" className="text-[#FF6700] hover:underline">
              hello@truffr.com
            </a>
            .
          </p>
        </div>
      </div>
    )
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
        <p className="text-[var(--text-sub)] text-sm mt-2">Set a new password</p>
      </div>

      <div className="w-full max-w-md industrial-card rounded-xl p-8 border border-[#FF6700]/30 shadow-[0_0_24px_rgba(255,103,0,0.18)] relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-sm font-medium text-[var(--text-main)]">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 my-auto text-[var(--text-sub)] hover:text-[#FF6700] transition"
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <PasswordStrengthMeter password={newPassword} onStrengthChange={setPasswordStrength} />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm-new-password" className="text-sm font-medium text-[var(--text-main)]">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 my-auto text-[var(--text-sub)] hover:text-[#FF6700] transition"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch ? <p className="text-xs text-red-400">Passwords do not match.</p> : null}
          </div>

          {error ? (
            <div className="bg-red-900/30 p-3 rounded text-xs text-red-200 border border-red-500/40">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_0_rgba(255,103,0,0)] hover:shadow-[0_0_20px_rgba(255,103,0,0.45)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update password'}
          </button>
        </form>
      </div>
      <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-center relative z-10">
        <span className="text-[var(--text-sub)] opacity-60">Powered by </span>
        <span className="text-[#FF6700]">FieldDeskOps</span>
      </p>
      <p className="mt-2 text-xs text-[var(--text-sub)] text-center relative z-10">
        Trouble resetting your password? Email{' '}
        <a href="mailto:hello@truffr.com" className="text-[#FF6700] hover:underline">
          hello@truffr.com
        </a>
        .
      </p>
    </div>
  )
}
