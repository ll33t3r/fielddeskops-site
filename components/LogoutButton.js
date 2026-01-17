'use client'

import { LogOut } from 'lucide-react'
// CHANGED: Using relative path instead of @
import { signout } from '../app/auth/signout/actions'
import { useState } from 'react'

export default function LogoutButton({ className = "" }) {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await signout()
  }

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className={`flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-[#ef4444] transition-colors ${className}`}
    >
      <LogOut size={18} />
      <span className="hidden md:inline">{loading ? '...' : 'SIGN OUT'}</span>
    </button>
  )
}
