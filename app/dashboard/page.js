import Link from 'next/link'
import LogoutButton from '../../components/LogoutButton'

export default function Dashboard() {
  const apps = [
    {
      name: 'ProfitLock',
      description: 'Bid Calculator & Quote Manager',
      icon: '💰',
      href: '/apps/profitlock',
    },
    {
      name: 'LoadOut',
      description: 'Van Inventory Tracker',
      icon: '🚚',
      href: '/apps/loadout',
    },
    {
      name: 'SiteSnap',
      description: 'Photo Documentation System',
      icon: '📸',
      href: '/apps/sitesnap',
    },
    {
      name: 'SignOff',
      description: 'Digital Contracts & Signatures',
      icon: '📝',
      href: '/apps/signoff',
    },
    {
      name: 'CrewClock',
      description: 'Time Tracking & Payroll',
      icon: '⏰', 
      href: '/apps/crewclock',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 md:p-8">
      {/* Header with Account and Sign Out buttons */}
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Your Digital Toolbelt
            </h1>
            <p className="text-gray-400 mt-2">
              All your field tools in one place
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/account"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
            >
              Account
            </Link>
            <Link 
              href="/auth/login"
              className="px-4 py-2 bg-primary hover:bg-orange-600 rounded-lg font-medium transition-colors text-white"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Stats/Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Subscription</p>
              <p className="text-xl font-semibold text-white">Pro Tier</p>
            </div>
            <div className="text-3xl">👷</div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Credits Remaining</p>
              <p className="text-xl font-semibold text-white">Unlimited</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Projects</p>
              <p className="text-xl font-semibold text-white">3 of 10</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Your Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {apps.map((app) => (
            <Link
              key={app.name}
              href={app.href}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-6 border border-gray-700 hover:border-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{app.icon}</span>
                  <span className="text-primary font-semibold">→</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {app.name}
                </h3>
                
                <p className="text-gray-400 text-sm">
                  {app.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span>💰</span>
              </div>
              <div>
                <p className="font-medium text-white">New Quote Created</p>
                <p className="text-sm text-gray-400">ProfitLock • 2 hours ago</p>
              </div>
            </div>
            <span className="text-primary font-medium">$2,450</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span>🚚</span>
              </div>
              <div>
                <p className="font-medium text-white">Inventory Updated</p>
                <p className="text-sm text-gray-400">LoadOut • 5 hours ago</p>
              </div>
            </div>
            <span className="text-blue-400 font-medium">+12 items</span>
          </div>
        </div>
      </div>
    </div>
  )
}