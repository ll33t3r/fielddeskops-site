'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Shield, Zap, Users, BarChart, CreditCard, Clock, Wrench, Tool } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/auth/signup?plan=pro_trial');
  };

  const handleTryDemo = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white">
      {/* Navigation */}
      <nav className="px-4 py-6 border-b border-[#262626]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF6700] to-orange-500 flex items-center justify-center">
              <span className="font-bold">FD</span>
            </div>
            <span className="font-oswald text-xl">FieldDeskOps</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/auth/login" className="text-gray-400 hover:text-white">Login</a>
            <button 
              onClick={handleGetStarted}
              className="px-4 py-2 bg-[#FF6700] rounded-lg font-semibold hover:opacity-90"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="font-oswald text-5xl mb-6">
            <span className="bg-gradient-to-r from-[#FF6700] to-orange-500 bg-clip-text text-transparent">
              The Digital Toolbelt
            </span>
            <br />
            For Modern Tradesmen
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            All-in-one platform that transforms how field technicians work. Manage quotes, inventory, documentation, and contracts from one powerful dashboard.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button 
              onClick={handleGetStarted}
              className="px-8 py-3 bg-gradient-to-r from-[#FF6700] to-orange-500 rounded-xl font-semibold hover:opacity-90 flex items-center gap-2"
            >
              Start Free Trial <ArrowRight size={20} />
            </button>
            <button 
              onClick={handleTryDemo}
              className="px-8 py-3 bg-[#262626] border border-[#404040] rounded-xl font-semibold hover:border-[#FF6700]"
            >
              Try Live Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-[#FF6700]/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="text-[#FF6700]" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">ProfitLock</h3>
            <p className="text-gray-400 text-sm">Intelligent bid calculator that maximizes your profit margins</p>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <Tool className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">LoadOut</h3>
            <p className="text-gray-400 text-sm">Track van inventory and never run out of supplies</p>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">SiteSnap</h3>
            <p className="text-gray-400 text-sm">Document job progress with timestamped photos</p>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="text-green-400" size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">SignOff</h3>
            <p className="text-gray-400 text-sm">Digital contracts and e-signatures for instant approvals</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#262626] border border-[#404040] rounded-2xl p-8 text-center">
          <h2 className="font-oswald text-3xl mb-4">Ready to transform your field operations?</h2>
          <p className="text-gray-400 mb-6">Join contractors nationwide who save 10+ hours per week with FieldDeskOps</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleGetStarted}
              className="px-8 py-3 bg-gradient-to-r from-[#FF6700] to-orange-500 rounded-xl font-semibold hover:opacity-90"
            >
              Start 7-Day Pro Trial
            </button>
            <div className="text-gray-500 text-sm">
              No credit card required • Cancel anytime
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] px-4 py-8 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF6700] to-orange-500 flex items-center justify-center">
                <span className="font-bold text-sm">FD</span>
              </div>
              <span className="font-oswald">FieldDeskOps</span>
            </div>
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>© 2024 FieldDeskOps. All rights reserved.</p>
              <p className="mt-2">The digital toolbelt for modern tradesmen</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
