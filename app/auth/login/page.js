'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '../../utils/supabase/client'
import { logError } from '../../../utils/logger'
import AuthThemeToggle from '../../components/shared/AuthThemeToggle'
import FormField from '../../components/shared/FormField'
import { buildFieldErrors, isEmail, isRequired } from '../../utils/validation'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formValues, setFormValues] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const router = useRouter()

  const supabase = createClient()

  const validate = useMemo(
    () => (values) =>
      buildFieldErrors({
        email: [
          { isValid: isRequired(values.email), message: 'Email is required.' },
          { isValid: isEmail(values.email), message: 'Enter a valid email address.' },
        ],
        password: [{ isValid: isRequired(values.password), message: 'Password is required.' }],
      }),
    []
  )

  const handleChange = (field) => (event) => {
    const { value } = event.target
    setFormValues((prev) => {
      const next = { ...prev, [field]: value }
      if (touched[field]) {
        setFieldErrors(validate(next))
      }
      return next
    })
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setFieldErrors(validate({ ...formValues, [field]: formValues[field] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate(formValues)
    setFieldErrors(nextErrors)
    setTouched({ email: true, password: true })
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setErrorMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formValues.email,
        password: formValues.password,
      })

      if (error) {
        setErrorMessage(error.message || 'Unable to log in. Please try again.')
        logError('Login failed', error)
      } else {
        setFormValues({ email: '', password: '' })
        setTouched({})
        setFieldErrors({})
        router.push('/dashboard')
      }
    } catch (err) {
      setErrorMessage('Unable to log in. Please try again.')
      logError('Login failed', err)
    } finally {
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
      </div>

      <div className="w-full max-w-md industrial-card rounded-xl p-8 border border-[#FF6700]/30 shadow-[0_0_24px_rgba(255,103,0,0.18)] relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="login-email"
            label="Email Address"
            required
            error={touched.email ? fieldErrors.email : null}
          >
            <input
              id="login-email"
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
            id="login-password"
            label="Password"
            required
            error={touched.password ? fieldErrors.password : null}
          >
            <div className="relative">
              <input
                id="login-password"
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

          <div className="text-right -mt-2">
            <Link href="/forgot-password" className="text-sm text-[var(--text-sub)] hover:text-[#FF6700]">
              Forgot password?
            </Link>
          </div>

          {errorMessage ? (
            <div className="bg-red-900/30 p-3 rounded text-xs text-red-200 border border-red-500/40">
              {errorMessage}
            </div>
          ) : null}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_0_rgba(255,103,0,0)] hover:shadow-[0_0_20px_rgba(255,103,0,0.45)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/signup" className="text-[#FF6700] hover:opacity-90 text-sm font-semibold">
            Create an account
          </Link>
          <p className="text-[var(--text-sub)] text-xs mt-3">
            <Link href="/legal/terms?from=%2Fauth%2Flogin" className="hover:text-[var(--text-main)]">Terms</Link>
            {" · "}
            <Link href="/legal/privacy?from=%2Fauth%2Flogin" className="hover:text-[var(--text-main)]">Privacy</Link>
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
