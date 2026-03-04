'use client'

import { useMemo, useState } from 'react'
import { signup } from './actions'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import AuthThemeToggle from '../../components/shared/AuthThemeToggle'
import FormField from '../../components/shared/FormField'
import PasswordStrengthMeter from '../../components/shared/PasswordStrengthMeter'
import { evaluatePasswordStrength } from '../../utils/passwordStrength'
import { buildFieldErrors, isEmail, isRequired } from '../../utils/validation'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [formValues, setFormValues] = useState({ email: '', password: '', confirmPassword: '' })
  const [passwordStrength, setPasswordStrength] = useState(() => evaluatePasswordStrength(''))
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [signupStartedTracked, setSignupStartedTracked] = useState(false)
  const [touched, setTouched] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const router = useRouter()

  const validate = useMemo(
    () => (values, agreed) =>
      buildFieldErrors({
        email: [
          { isValid: isRequired(values.email), message: 'Email is required.' },
          { isValid: isEmail(values.email), message: 'Enter a valid email address.' },
        ],
        password: [
          { isValid: isRequired(values.password), message: 'Password is required.' },
          {
            isValid: evaluatePasswordStrength(values.password).isAllowed,
            message: "Password doesn't meet requirements",
          },
        ],
        confirmPassword: [
          { isValid: isRequired(values.confirmPassword), message: 'Please confirm your password.' },
          { isValid: values.password === values.confirmPassword, message: 'Passwords do not match.' },
        ],
        terms: [{ isValid: agreed === true, message: 'You must agree to the Terms of Service to sign up.' }],
      }),
    []
  )

  const handleChange = (field) => (event) => {
    const { value } = event.target
    if (!signupStartedTracked) {
      track('signup_started')
      setSignupStartedTracked(true)
    }
    setFormValues((prev) => {
      const next = { ...prev, [field]: value }
      if (touched[field]) {
        setFieldErrors(validate(next, agreedToTerms))
      }
      return next
    })
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setFieldErrors(validate({ ...formValues, [field]: formValues[field] }, agreedToTerms))
  }

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signup(formData)

      if (result?.error) {
        setError(result.error)
        return
      }

      track('signup_completed')
      setFormValues({ email: '', password: '', confirmPassword: '' })
      setTouched({})
      setFieldErrors({})

      if (result?.autoConfirmed) {
        // If account created AND logged in -> Go to Dashboard
        router.refresh()
        router.push('/')
        return
      }

      // If account created but needs email check
      setCheckEmail(true)
    } catch {
      setError('Unable to create your account right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4 font-inter text-center">
        <div className="p-4 bg-green-900/20 border border-green-900 rounded-full mb-6">
          <ShieldAlert className="text-green-500" size={48} />
        </div>
        <h1 className="text-3xl font-oswald font-bold text-white mb-2">CHECK YOUR EMAIL</h1>
        <p className="text-gray-400 max-w-md">
          Confirmation required. Please check your inbox.
        </p>
        <Link href="/auth/login" className="mt-8 text-[#FF6700] hover:underline">
          Return to Login
        </Link>
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
      </div>

      <div className="w-full max-w-md industrial-card rounded-xl p-8 border border-[#FF6700]/30 shadow-[0_0_24px_rgba(255,103,0,0.18)] relative z-10">
          <form
          onSubmit={(event) => {
            event.preventDefault()
            const nextErrors = validate(formValues, agreedToTerms)
            setFieldErrors(nextErrors)
            setTouched({ email: true, password: true, confirmPassword: true, terms: true })
            if (Object.keys(nextErrors).length > 0) return
            handleSubmit(new FormData(event.currentTarget))
          }}
          className="space-y-4"
          noValidate
        >
          <FormField
            id="signup-email"
            label="Email Address"
            required
            error={touched.email ? fieldErrors.email : null}
          >
            <input
              id="signup-email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="user@example.com"
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
              aria-invalid={touched.email && fieldErrors.email ? 'true' : 'false'}
            />
          </FormField>

          <FormField
            id="signup-password"
            label="Password"
            required
            error={touched.password ? fieldErrors.password : null}
          >
            <div className="relative">
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formValues.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                placeholder="••••••••"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
                aria-invalid={touched.password && fieldErrors.password ? 'true' : 'false'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 my-auto text-[var(--text-sub)] hover:text-[#FF6700] transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FormField>

          <FormField
            id="signup-confirm-password"
            label="Confirm Password"
            required
            error={touched.confirmPassword ? fieldErrors.confirmPassword : null}
          >
            <div className="relative">
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formValues.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                placeholder="••••••••"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
                aria-invalid={touched.confirmPassword && fieldErrors.confirmPassword ? 'true' : 'false'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 my-auto text-[var(--text-sub)] hover:text-[#FF6700] transition"
                aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formValues.confirmPassword && formValues.password !== formValues.confirmPassword ? (
              <p className="text-xs text-red-400">Passwords do not match.</p>
            ) : null}
          </FormField>

          <PasswordStrengthMeter
            password={formValues.password}
            onStrengthChange={setPasswordStrength}
            checklistMode="weak-only"
            compact
          />

          <div className="flex items-start gap-3">
            <input
              id="signup-terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked)
                if (touched.terms) setFieldErrors(validate(formValues, e.target.checked))
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, terms: true }))
                setFieldErrors(validate(formValues, agreedToTerms))
              }}
              className="mt-1 self-start shrink-0 !h-3.5 !w-3.5 min-h-0 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[#FF6700] focus:ring-[#FF6700]"
              aria-invalid={touched.terms && fieldErrors.terms ? 'true' : 'false'}
            />
            <label htmlFor="signup-terms" className="text-sm text-[var(--text-sub)] leading-tight cursor-pointer">
              I agree to the{' '}
              <Link href="/legal/terms?from=%2Fauth%2Fsignup" target="_blank" rel="noopener noreferrer" className="text-[#FF6700] hover:opacity-90 underline-offset-2 hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/legal/privacy?from=%2Fauth%2Fsignup" target="_blank" rel="noopener noreferrer" className="text-[#FF6700] hover:opacity-90 underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              {' '}to create an account.
            </label>
          </div>
          {touched.terms && fieldErrors.terms && (
            <p className="text-red-400 text-sm" role="alert">{fieldErrors.terms}</p>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !agreedToTerms || !passwordStrength.isAllowed || formValues.password !== formValues.confirmPassword}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_0_rgba(255,103,0,0)] hover:shadow-[0_0_20px_rgba(255,103,0,0.45)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--text-sub)] text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#FF6700] hover:opacity-90 font-semibold">
              Sign In
            </Link>
          </p>
          <p className="text-[var(--text-sub)] text-xs mt-3">
            <Link href="/legal/terms?from=%2Fauth%2Fsignup" className="hover:text-[var(--text-main)]">Terms</Link>
            {" · "}
            <Link href="/legal/privacy?from=%2Fauth%2Fsignup" className="hover:text-[var(--text-main)]">Privacy</Link>
          </p>
        </div>
      </div>
      <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-center relative z-10">
        <span className="text-[var(--text-sub)] opacity-60">Powered by </span>
        <span className="text-[#FF6700]">FieldDeskOps</span>
      </p>
    </div>
  )
}
