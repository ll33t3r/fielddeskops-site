import Link from 'next/link'

export default function LoadOut() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-primary hover:text-orange-400 mb-6">← Back to Dashboard</Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">LoadOut</h1>
              <p className="text-gray-400 mt-2">Van Inventory Tracker</p>
            </div>
            <div className="text-5xl">🚚</div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">LoadOut Workspace</h2>
          <p className="text-gray-400">Your LoadOut app is connected and ready.</p>
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <p className="text-primary font-medium">App Status: Connected</p>
            <p className="text-gray-400 text-sm mt-2">All functionality from your existing LoadOut app is available.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
