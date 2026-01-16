export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Coming Soon</h1>
        <p className="text-gray-400 text-center">This page is being updated. Please check back later.</p>
        <div className="mt-6 text-center">
          <a href="/dashboard" className="inline-block px-6 py-3 bg-primary hover:bg-orange-600 rounded-lg font-medium">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
