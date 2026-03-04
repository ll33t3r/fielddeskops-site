'use client'

import { useMemo, useState } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '../utils/supabase/client'
import PasswordStrengthMeter from '../components/shared/PasswordStrengthMeter'
import Toast from '../components/shared/Toast'
import { evaluatePasswordStrength } from '../utils/passwordStrength'
import { logError } from '../../utils/logger'

export default function SecuritySection({ userEmail }) {
  const supabase = useMemo(() => createClient(), [])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(() => evaluatePasswordStrength(''))
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword
  const canSubmit =
    currentPassword.length > 0 &&
    passwordStrength.isAllowed &&
    passwordsMatch &&
    !loading

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!passwordStrength.isAllowed) {
      setError("Password doesn't meet requirements")
      return
    }

    if (!passwordsMatch) {
      setError('New passwords do not match.')
      return
    }

    if (!supabase || !userEmail) {
      setError('Unable to update password right now.')
      return
    }

    setLoading(true)

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      })

      if (reauthError) {
        setError('Current password is incorrect')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(updateError.message || 'Unable to update password right now.')
        return
      }

      setToast({ message: 'Password updated successfully.', type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordStrength(evaluatePasswordStrength(''))
    } catch (updateError) {
      logError('Change password failed', updateError)
      setError('Unable to update password right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="industrial-card rounded-2xl p-6 border border-[var(--border-color)]">
        <h2 className="text-xl font-oswald font-bold uppercase tracking-wide mb-4">Security</h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="current-password" className="text-sm font-medium text-[var(--text-main)]">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 my-auto text-[var(--text-sub)] hover:text-[#FF6700] transition"
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="new-password-account" className="text-sm font-medium text-[var(--text-main)]">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="new-password-account"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
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
            <label htmlFor="confirm-password-account" className="text-sm font-medium text-[var(--text-main)]">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-password-account"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
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
            {confirmNewPassword && !passwordsMatch ? (
              <p className="text-xs text-red-500">New passwords do not match.</p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF6700] px-5 py-3 font-bold text-white hover:bg-[#e65c00] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Change Password'}
          </button>
        </form>
      </div>
    </>
  )
}
