'use client'

import { useState } from 'react'

export default function LogoutButton({ className = '' }) {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    if (loading) return
    
    setLoading(true)
    
    try {
      // Direct fetch to server action endpoint
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      })
      
      if (response.ok) {
        window.location.href = '/auth/login'
      } else {
        throw new Error('Sign out failed')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.href = '/auth/login'
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={`px-4 py-2 bg-primary hover:bg-orange-600 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  )
}
