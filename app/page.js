export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white p-8">
      <nav className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF6700] to-orange-500 flex items-center justify-center">
            <span className="font-bold">FD</span>
          </div>
          <span className="text-xl font-bold">FieldDeskOps</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/auth/login" className="text-gray-400 hover:text-white">Login</a>
          <a href="/auth/signup" className="px-4 py-2 bg-[#FF6700] rounded-lg font-semibold hover:opacity-90">
            Get Started
          </a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold mb-6">
            <span className="text-[#FF6700]">The Digital Toolbelt</span>
            <br />
            For Modern Tradesmen
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            All-in-one platform that transforms how field technicians work.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a 
              href="/auth/signup?plan=pro_trial"
              className="px-8 py-3 bg-gradient-to-r from-[#FF6700] to-orange-500 rounded-xl font-semibold hover:opacity-90"
            >
              Start Free Trial
            </a>
            <a 
              href="/auth/login"
              className="px-8 py-3 bg-[#262626] border border-[#404040] rounded-xl font-semibold hover:border-[#FF6700]"
            >
              Try Live Demo
            </a>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-lg font-bold mb-2">ProfitLock</h3>
            <p className="text-gray-400 text-sm">Intelligent bid calculator</p>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-lg font-bold mb-2">LoadOut</h3>
            <p className="text-gray-400 text-sm">Van inventory tracker</p>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <div className="text-3xl mb-4">📸</div>
            <h3 className="text-lg font-bold mb-2">SiteSnap</h3>
            <p className="text-gray-400 text-sm">Photo documentation</p>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-lg font-bold mb-2">SignOff</h3>
            <p className="text-gray-400 text-sm">Digital contracts</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#262626] border border-[#404040] rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your field operations?</h2>
          <p className="text-gray-400 mb-6">Join contractors nationwide</p>
          <a 
            href="/auth/signup?plan=pro_trial"
            className="px-8 py-3 bg-gradient-to-r from-[#FF6700] to-orange-500 rounded-xl font-semibold hover:opacity-90 inline-block"
          >
            Start 7-Day Pro Trial
          </a>
          <p className="text-gray-500 text-sm mt-4">No credit card required • Cancel anytime</p>
        </div>
      </main>

      <footer className="border-t border-[#262626] mt-16 pt-8 text-center text-gray-400">
        <p>© 2024 FieldDeskOps. All rights reserved.</p>
      </footer>
    </div>
  );
}
