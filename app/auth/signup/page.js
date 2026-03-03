'use client'

import { useMemo, useState } from 'react'
import { signup } from './actions'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import FormField from '../../components/shared/FormField'
import { buildFieldErrors, inRange, isEmail, isRequired } from '../../utils/validation'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [formValues, setFormValues] = useState({ email: '', password: '' })
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
            isValid: inRange((values.password || '').length, 8),
            message: 'Password must be at least 8 characters.',
          },
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
      setFormValues({ email: '', password: '' })
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
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4 font-inter">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-oswald font-bold text-white tracking-wide">
          FIELD<span className="text-[#FF6700]">DESK</span>OPS
        </h1>
        <p className="text-gray-500 text-sm mt-2">CREATE ACCOUNT</p>
      </div>

      <div className="w-full max-w-md bg-[#262626] border border-[#333] rounded-xl p-8 shadow-2xl">
          <form
          onSubmit={(event) => {
            event.preventDefault()
            const nextErrors = validate(formValues, agreedToTerms)
            setFieldErrors(nextErrors)
            setTouched({ email: true, password: true, terms: true })
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
              className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
              aria-invalid={touched.email && fieldErrors.email ? 'true' : 'false'}
            />
          </FormField>

          <FormField
            id="signup-password"
            label="Password"
            required
            error={touched.password ? fieldErrors.password : null}
          >
            <input
              id="signup-password"
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              placeholder="••••••••"
              className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
              aria-invalid={touched.password && fieldErrors.password ? 'true' : 'false'}
            />
          </FormField>

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
              className="mt-1 h-4 w-4 rounded border-[#333] bg-[#1a1a1a] text-[#FF6700] focus:ring-[#FF6700]"
              aria-invalid={touched.terms && fieldErrors.terms ? 'true' : 'false'}
            />
            <label htmlFor="signup-terms" className="text-sm text-gray-400 leading-tight cursor-pointer">
              I agree to the{' '}
              <Link href="/legal/terms?from=%2Fauth%2Fsignup" target="_blank" rel="noopener noreferrer" className="text-[#FF6700] hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/legal/privacy?from=%2Fauth%2Fsignup" target="_blank" rel="noopener noreferrer" className="text-[#FF6700] hover:underline">
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
            disabled={loading || !agreedToTerms}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#FF6700] hover:underline">
              Sign In
            </Link>
          </p>
          <p className="text-gray-500 text-xs mt-3">
            <Link href="/legal/terms?from=%2Fauth%2Fsignup" className="hover:text-white">Terms</Link>
            {" · "}
            <Link href="/legal/privacy?from=%2Fauth%2Fsignup" className="hover:text-white">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
