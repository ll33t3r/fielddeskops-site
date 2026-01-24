'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Loader2, Bug } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [debugLog, setDebugLog] = useState([])
  const router = useRouter()

  // HARDCODED CLIENT
  const supabase = createBrowserClient(
    'https://itfjpyzywllsjipjtfrk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZmpweXp5d2xsc2ppcGp0ZnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjQ4OTgsImV4cCI6MjA4NDEwMDg5OH0.1K8LEPwpQnXPd1AIsshvada-vg37SoHOxfw5DIkYcA8'
  )

  const addLog = (msg) => {
    console.log(msg)
    setDebugLog(prev => [...prev, msg])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setDebugLog(['Starting Login Process...'])
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    addLog(`Target: ${email}`)

    try {
      addLog('Sending request to Supabase...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        addLog(`❌ ERROR: ${error.message}`)
        setLoading(false)
      } else {
        addLog('✅ SUCCESS! Session created.')
        addLog('Redirecting to Dashboard...')
        window.location.href = '/'
      }
    } catch (err) {
      addLog(`❌ CRASH: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-4 font-inter">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-oswald font-bold text-white tracking-wide">
          FIELD<span className="text-[#FF6700]">DESK</span>OPS
        </h1>
        <p className="text-gray-500 text-sm mt-2">DEBUG LOGIN MODE</p>
      </div>

      <div className="w-full max-w-md bg-[#262626] border border-[#333] rounded-xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-[#1a1a1a] rounded-full border border-[#333]">
            <Bug className="text-red-500" size={32} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#FF6700] transition-colors"
            />
          </div>

          <div className="bg-black/50 p-3 rounded text-xs font-mono text-green-400 min-h-[60px] border border-gray-800">
            {debugLog.length === 0 ? 'Waiting for input...' : debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FF6700] hover:bg-[#e65c00] text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'TRY LOGIN'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/signup" className="text-gray-500 hover:text-white text-sm">
             Back to Signup
          </Link>
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
