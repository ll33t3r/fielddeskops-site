'use client'

import { useState } from 'react'
import { login } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await login(formData)
      
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Login form error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF6700] to-[#cc5200] rounded-full mb-4 shadow-lg shadow-[#FF6700]/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-['Oswald'] tracking-wide">
            FIELD DESK OPS
          </h1>
          <p className="text-gray-400 text-sm uppercase tracking-wider">
            Industrial-Grade Field Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#2a2a2a] border border-[#333333] rounded-xl p-8 shadow-2xl shadow-black/50">
          <h2 className="text-2xl font-bold text-white mb-6 text-center font-['Oswald'] tracking-wider">
            ACCESS YOUR TOOLBELT
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[#331111] border border-[#662222] rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-[#ff4444] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[#ff8888] text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">
                Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="foreman@construction.co"
                className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent transition-all duration-200"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Security Code
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-400 hover:text-[#FF6700] transition-colors"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF6700] focus:border-transparent transition-all duration-200"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 bg-[#1a1a1a] border-[#333333] rounded focus:ring-[#FF6700] focus:ring-offset-0"
                  disabled={loading}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-400">
                  Remember this device
                </label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-[#FF6700] hover:text-[#ff8533] transition-colors">
                Forgot code?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FF6700] to-[#e55c00] hover:from-[#ff8533] hover:to-[#ff6700] text-white font-bold py-4 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ACCESSING TOOLBELT...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  ACCESS TOOLBELT
                </>
              )}
            </button>
          </form>

          {/* Demo Access Option */}
          <div className="mt-8 pt-8 border-t border-[#333333]">
            <button
              onClick={() => {
                // Auto-fill demo credentials
                const emailInput = document.getElementById('email')
                const passwordInput = document.getElementById('password')
                if (emailInput && passwordInput) {
                  emailInput.value = 'demo@fielddeskops.com'
                  passwordInput.value = 'demo12345'
                  setError('Demo mode: Click "ACCESS TOOLBELT" to continue')
                }
              }}
              className="w-full bg-[#1a1a1a] border border-[#333333] hover:border-[#555555] text-gray-300 hover:text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              USE DEMO ACCOUNT
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Experience all features with our demo account
            </p>
          </div>

          {/* Signup Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have a crew account?{' '}
              <Link href="/auth/signup" className="text-[#FF6700] hover:text-[#ff8533] font-medium transition-colors">
                REQUEST ACCESS
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Secured with industrial-grade encryption • Built for tradesmen
          </p>
          <div className="mt-4 flex items-center justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-400">System Status: Online</span>
            </div>
            <div className="text-xs text-gray-500">v2.4.1 • 2024</div>
          </div>
        </div>
      </div>
    </div>
  )
}
