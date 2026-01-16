"use client";
import Link from 'next/link'

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="font-bold text-white text-xl">F</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Sign in to your FieldDeskOps account</p>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-primary hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Go to Dashboard (Demo)
          </button>
          
          <div className="text-center text-gray-400 text-sm">
            <p>Demo mode active. Full authentication coming soon.</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/" className="text-primary hover:text-orange-400">
              Start Free Trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
