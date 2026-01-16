import Link from 'next/link'

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-primary hover:text-orange-400 mb-6"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Account Settings</h1>
              <p className="text-gray-400 mt-2">Manage your FieldDeskOps account</p>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400">Current Plan</p>
                  <p className="text-2xl font-bold text-white">Pro Tier</p>
                </div>
                <div className="text-3xl">👑</div>
              </div>
              <div className="mt-4">
                <Link 
                  href="/pricing"
                  className="inline-block px-6 py-3 bg-primary hover:bg-orange-600 rounded-lg font-medium"
                >
                  Manage Subscription
                </Link>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Email</label>
                  <p className="text-white">user@example.com</p>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Company</label>
                  <p className="text-white">Your Construction Co.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href="/auth/login"
                  className="block w-full text-center py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  Sign Out
                </Link>
                <button className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
                  Export Data
                </button>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Usage</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Credits Used</p>
                  <p className="text-xl font-bold text-white">0 / Unlimited</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Active Projects</p>
                  <p className="text-xl font-bold text-white">3 / 10</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
