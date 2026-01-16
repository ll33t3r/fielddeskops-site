'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  const isActive = (path) => {
    return pathname === path
  }

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">F</span>
            </div>
            <span className="font-bold text-xl text-white">FieldDeskOps</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/dashboard"
              className={`${isActive('/dashboard') ? 'text-primary' : 'text-gray-300 hover:text-white'} transition-colors`}
            >
              Dashboard
            </Link>
            <Link 
              href="/pricing"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/auth/login"
              className="px-4 py-2 bg-primary hover:bg-orange-600 rounded-lg font-medium transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
