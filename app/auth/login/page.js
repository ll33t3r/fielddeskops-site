'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Bug } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '../../utils/supabase/client'
import { logError } from '../../../utils/logger'
import FormField from '../../components/shared/FormField'
import { buildFieldErrors, isEmail, isRequired } from '../../utils/validation'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formValues, setFormValues] = useState({ email: '', password: '' })
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
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4 font-inter">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-oswald font-bold text-white tracking-wide">
          FIELD<span className="text-[#FF6700]">DESK</span>OPS
        </h1>
        <p className="text-gray-500 text-sm mt-2">Sign in to your account</p>
      </div>

      <div className="w-full max-w-md bg-[#262626] border border-[#333] rounded-xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-[#1a1a1a] rounded-full border border-[#333]">
            <Bug className="text-red-500" size={32} />
          </div>
        </div>

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
              className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
              aria-invalid={touched.email && fieldErrors.email ? 'true' : 'false'}
            />
          </FormField>

          <FormField
            id="login-password"
            label="Password"
            required
            error={touched.password ? fieldErrors.password : null}
          >
            <input
              id="login-password"
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

          {errorMessage ? (
            <div className="bg-red-900/30 p-3 rounded text-xs text-red-200 border border-red-500/40">
              {errorMessage}
            </div>
          ) : null}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/signup" className="text-gray-500 hover:text-white text-sm">
            Create an account
          </Link>
          <p className="text-gray-500 text-xs mt-3">
            <Link href="/legal/terms?from=%2Fauth%2Flogin" className="hover:text-white">Terms</Link>
            {" · "}
            <Link href="/legal/privacy?from=%2Fauth%2Flogin" className="hover:text-white">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
