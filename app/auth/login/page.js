'use client'

import { useState } from 'react'
import { login } from './actions'
import { Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    
    // We wrap the server action to catch errors
    const result = await login(formData)
    
    // If we get here and there is a result with error, display it
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4 font-inter">
      
      {/* BRANDING */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-oswald font-bold text-white tracking-wide">
          FIELD<span className="text-[#FF6700]">DESK</span>OPS
        </h1>
        <p className="text-gray-500 text-sm mt-2">SECURE LOGIN</p>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-[#262626] border border-[#333] rounded-xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-[#1a1a1a] rounded-full border border-[#333]">
            <ShieldCheck className="text-[#FF6700]" size={32} />
          </div>
        </div>

        <form action={handleSubmit} className="space-y-4">
          
          {/* EMAIL */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email Address</label>
            <input 
              name="email"
              type="email" 
              required
              placeholder="user@example.com"
              className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="........"
              className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
            />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'ACCESS DASHBOARD'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-[#FF6700] hover:underline">
              Create one
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
