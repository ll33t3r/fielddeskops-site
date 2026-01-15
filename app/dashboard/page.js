'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = {
    name: "Demo User",
    plan: "FieldDeskOps Elite",
    status: "Active Trial",
    renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
  };

  const apps = [
    { 
      id: 1, 
      name: "LoadOut", 
      icon: "??", 
      description: "Van Inventory & Tool Tracker", 
      status: "Coming Soon",
      url: "/apps/loadout"
    },
    { 
      id: 2, 
      name: "ProfitLock", 
      icon: "??", 
      description: "Instant Bid Calculator", 
      status: "Available",
      url: "/apps/profitlock"
    },
    { 
      id: 3, 
      name: "SiteSnap", 
      icon: "??", 
      description: "GPS Job Photos", 
      status: "Coming Soon",
      url: "/apps/loadout"
    },
    { 
      id: 4, 
      name: "SignOff", 
      icon: "??", 
      description: "Digital Contracts", 
      status: "Coming Soon",
      url: "/apps/loadout"
    }
  ];

  const recentActivity = [
    { id: 1, app: "ProfitLock", action: "Created quote #1042", time: "2 hours ago", amount: "$1,850.00" },
    { id: 2, app: "SiteSnap", action: "Uploaded job photos", time: "Yesterday", amount: null },
    { id: 3, app: "SignOff", action: "Contract signed", time: "2 days ago", amount: null },
    { id: 4, app: "LoadOut", action: "Low stock alert", time: "3 days ago", amount: null }
  ];

  useEffect(() => {
    // Simple login check - for demo, auto-login after 1 second
    const timer = setTimeout(() => {
      setIsLoggedIn(true);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-2">Loading Dashboard...</div>
          <div className="w-48 h-2 bg-[#262626] rounded-full overflow-hidden">
            <div className="h-full bg-[#FF6700] animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#262626] border border-[#333] rounded-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Account Required</h1>
          <p className="text-[#A3A3A3] mb-6">
            Please create an account or log in to access your FieldDeskOps dashboard.
          </p>
          <div className="space-y-3">
            <a 
              href="/signup"
              className="bg-[#FF6700] hover:bg-[#e55c00] text-white font-bold py-3 rounded-lg w-full block"
            >
              Create Account
            </a>
            <a 
              href="/login"
              className="border border-[#FF6700] text-[#FF6700] hover:bg-[#FF6700]/10 font-bold py-3 rounded-lg w-full block"
            >
              Log In
            </a>
            <button 
              onClick={() => setIsLoggedIn(true)}
              className="bg-[#262626] border border-[#404040] text-white hover:border-[#FF6700] font-bold py-3 rounded-lg w-full"
            >
              Try Demo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Dashboard Header */}
      <div className="bg-[#262626] border-b border-[#404040]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">FieldDeskOps Dashboard</h1>
              <p className="text-[#A3A3A3]">Welcome back, {user.name}</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="bg-[#1a1a1a] border border-[#404040] rounded-lg px-4 py-2">
                <div className="text-sm text-[#A3A3A3]">Plan</div>
                <div className="text-white font-bold">{user.plan}</div>
              </div>
              <button 
                onClick={() => window.location.href = "/"}
                className="bg-[#262626] border border-[#404040] text-white hover:border-[#FF6700] font-bold py-2 px-4 rounded-lg"
              >
                Account Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="text-[#A3A3A3] text-sm">Active Apps</div>
            <div className="text-2xl font-bold text-white">1/4</div>
          </div>
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="text-[#A3A3A3] text-sm">Monthly Cost</div>
            <div className="text-2xl font-bold text-white">$9.99</div>
          </div>
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="text-[#A3A3A3] text-sm">Trial Ends</div>
            <div className="text-2xl font-bold text-white">{user.renewalDate}</div>
          </div>
          <div className="bg-[#262626] border border-[#333] rounded-xl p-4">
            <div className="text-[#A3A3A3] text-sm">Status</div>
            <div className="text-2xl font-bold text-[#FF6700]">{user.status}</div>
          </div>
        </div>

        {/* Your Apps Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-6">Your Digital Toolbelt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {apps.map((app) => (
              <div 
                key={app.id}
                className="bg-[#262626] border border-[#333] rounded-xl p-6 hover:border-[#FF6700] transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-4xl">{app.icon}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${app.status === 'Available' ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {app.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{app.name}</h3>
                <p className="text-[#A3A3A3] text-sm mb-6">{app.description}</p>
                {app.status === 'Available' ? (
                  <a 
                    href={app.url}
                    className="bg-[#FF6700] hover:bg-[#e55c00] text-white font-bold py-3 rounded-lg w-full block text-center"
                  >
                    Launch App
                  </a>
                ) : (
                  <button
                    disabled
                    className="bg-[#1a1a1a] border border-[#404040] text-gray-500 font-bold py-3 rounded-lg w-full cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity & Billing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <div className="bg-[#262626] border border-[#333] rounded-xl overflow-hidden">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="border-b border-[#404040] last:border-b-0 p-4 hover:bg-[#1f1f1f]"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center">
                        <span className="font-bold text-white">{activity.app}</span>
                        <span className="mx-2 text-[#A3A3A3]">•</span>
                        <span className="text-[#A3A3A3]">{activity.action}</span>
                      </div>
                      <div className="text-sm text-[#A3A3A3] mt-1">{activity.time}</div>
                    </div>
                    {activity.amount && (
                      <div className="text-[#FF6700] font-bold">{activity.amount}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing & Support */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Billing & Support</h2>
            <div className="bg-[#262626] border border-[#333] rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-white font-bold mb-3">Current Plan</h3>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-white font-bold">{user.plan}</div>
                    <div className="text-[#A3A3A3] text-sm">Trial ends {user.renewalDate}</div>
                  </div>
                  <div className="text-2xl font-bold text-white">$9.99<span className="text-lg text-[#A3A3A3]">/month</span></div>
                </div>
                <a 
                  href="https://buy.stripe.com/14A28r60t5nIdMz9vyaIM0c"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-[#FF6700] text-[#FF6700] hover:bg-[#FF6700]/10 font-bold py-2 px-4 rounded-lg w-full block text-center"
                >
                  Start Free Trial
                </a>
              </div>
              
              <div className="pt-6 border-t border-[#404040]">
                <h3 className="text-white font-bold mb-3">Need Help?</h3>
                <div className="space-y-3">
                  <button className="bg-[#262626] border border-[#404040] text-white hover:border-[#FF6700] font-bold py-3 rounded-lg w-full">
                    View Tutorials
                  </button>
                  <button className="bg-[#262626] border border-[#404040] text-white hover:border-[#FF6700] font-bold py-3 rounded-lg w-full">
                    Contact Support
                  </button>
                  <button className="bg-[#262626] border border-[#404040] text-white hover:border-[#FF6700] font-bold py-3 rounded-lg w-full">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
