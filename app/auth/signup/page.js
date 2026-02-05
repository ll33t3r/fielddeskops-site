'use client'

import { useMemo, useState } from 'react'
import { signup } from './actions'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import FormField from '../../components/shared/FormField'
import { buildFieldErrors, inRange, isEmail, isRequired } from '../../utils/validation'

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [formValues, setFormValues] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const router = useRouter()

  const validate = useMemo(
    () => (values) =>
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

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    
    const result = await signup(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.autoConfirmed) {
      setFormValues({ email: '', password: '' })
      setTouched({})
      setFieldErrors({})
      // If account created AND logged in -> Go to Dashboard
      router.refresh()
      router.push('/')
    } else {
      setFormValues({ email: '', password: '' })
      setTouched({})
      setFieldErrors({})
      // If account created but needs email check
      setCheckEmail(true)
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
            const nextErrors = validate(formValues)
            setFieldErrors(nextErrors)
            setTouched({ email: true, password: true })
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

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
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
        </div>
      </div>
       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-oswald { font-family: 'Oswald', sans-serif; }
      `}</style>
    </div>
  )
}
