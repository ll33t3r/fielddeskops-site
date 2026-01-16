'use client';

import { useState, useEffect } from 'react';
import { LogOut, Settings, Bell, Menu, X, Home, BarChart, Package, Camera, FileSignature, Check, Clock, User } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState({ name: 'Field Technician', role: 'Admin' });
  const [notifications, setNotifications] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Apps available in the platform
  const apps = [
    { 
      name: "ProfitLock", 
      icon: "💰", 
      status: "Available", 
      url: "/apps/profitlock", 
      description: "Bid Calculator & Quote Manager",
      color: "from-[#FF6700]/20 to-orange-500/10",
      borderColor: "border-[#FF6700]/30"
    },
    { 
      name: "LoadOut", 
      icon: "📦", 
      status: "Available", 
      url: "/apps/loadout", 
      description: "Van Inventory Tracker",
      color: "from-blue-500/20 to-cyan-500/10",
      borderColor: "border-blue-500/30"
    },
    { 
      name: "SiteSnap", 
      icon: "📸", 
      status: "Available", 
      url: "/apps/sitesnap", 
      description: "Photo Documentation",
      color: "from-purple-500/20 to-pink-500/10",
      borderColor: "border-purple-500/30"
    },
    { 
      name: "SignOff", 
      icon: "📝", 
      status: "Coming Soon", 
      url: "#", 
      description: "Digital Contracts & Signatures",
      color: "from-gray-500/20 to-gray-700/10",
      borderColor: "border-gray-500/30"
    }
  ];

  // Recent activity
  const recentActivity = [
    { 
      type: "quote", 
      action: "Accepted", 
      project: "Smith Residence Remodel", 
      amount: "$24,500", 
      time: "10 min ago",
      icon: Check,
      color: "bg-green-900/30",
      iconColor: "text-green-400"
    },
    { 
      type: "photo", 
      action: "Added", 
      project: "Johnson Office", 
      description: "Progress photos", 
      time: "25 min ago",
      icon: Camera,
      color: "bg-blue-900/30",
      iconColor: "text-blue-400"
    },
    { 
      type: "inventory", 
      action: "Updated", 
      project: "Van A", 
      description: "Restocked safety gear", 
      time: "1 hour ago",
      icon: Package,
      color: "bg-orange-900/30",
      iconColor: "text-orange-400"
    }
  ];

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-[#262626] border-b border-[#404040] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#404040] rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h1 className="font-oswald text-xl">FieldDeskOps</h1>
              <p className="text-xs text-gray-400">Field Operations Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#404040] rounded-lg relative">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-xs flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <button className="p-2 hover:bg-[#404040] rounded-lg">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 h-full bg-[#262626] border-r border-[#404040]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#404040]">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#FF6700] to-orange-500 mx-auto mb-4 flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <h3 className="text-center font-oswald text-xl">{user.name}</h3>
              <p className="text-center text-gray-400 text-sm">{user.role}</p>
            </div>
            <nav className="p-4">
              <a href="/dashboard" className="flex items-center gap-3 p-3 hover:bg-[#404040] rounded-lg mb-2">
                <Home size={20} />
                Dashboard
              </a>
              <a href="/reports" className="flex items-center gap-3 p-3 hover:bg-[#404040] rounded-lg mb-2">
                <BarChart size={20} />
                Reports
              </a>
              <a href="/apps" className="flex items-center gap-3 p-3 hover:bg-[#404040] rounded-lg mb-2">
                <Package size={20} />
                All Apps
              </a>
              <a href="/settings" className="flex items-center gap-3 p-3 hover:bg-[#404040] rounded-lg">
                <Settings size={20} />
                Settings
              </a>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#404040]">
              <button className="w-full flex items-center justify-center gap-2 p-3 bg-[#1a1a1a] hover:bg-[#404040] rounded-lg">
                <LogOut size={20} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="p-4 max-w-md mx-auto pb-24">
        {/* Welcome & Time */}
        <div className="mb-8">
          <h2 className="font-oswald text-2xl mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-400">{formatDate(currentTime)}</p>
          <div className="text-4xl font-bold mt-2 font-oswald">{formatTime(currentTime)}</div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#FF6700]/20 to-orange-500/10 border border-[#FF6700]/30 rounded-xl p-4">
            <div className="text-2xl font-bold">4</div>
            <div className="text-gray-400 text-sm">Active Apps</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="text-2xl font-bold">23</div>
            <div className="text-gray-400 text-sm">Projects Today</div>
          </div>
        </div>

        {/* Apps Grid */}
        <h3 className="font-oswald text-xl mb-4">Your Field Tools</h3>
        <div className="grid grid-cols-2 gap-4">
          {apps.map((app, index) => (
            <a
              key={index}
              href={app.url}
              className={`bg-[#262626] border rounded-xl p-4 hover:border-[#FF6700] transition-colors group ${app.url === '#' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={(e) => {
                if (app.url === '#') {
                  e.preventDefault();
                  alert(`${app.name} is coming soon!`);
                }
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{app.icon}</div>
                <div className="flex-1">
                  <h4 className="font-oswald text-lg group-hover:text-[#FF6700]">{app.name}</h4>
                  <div className={`text-xs px-2 py-1 rounded-full inline-block ${app.status === 'Available' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                    {app.status}
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">{app.description}</p>
            </a>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="font-oswald text-xl mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="bg-[#262626] border border-[#404040] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center`}>
                        <Icon size={16} className={activity.iconColor} />
                      </div>
                      <span className="font-semibold">{activity.action}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{activity.time}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{activity.project}</p>
                  {activity.description && (
                    <p className="text-gray-500 text-xs mt-1">{activity.description}</p>
                  )}
                  {activity.amount && (
                    <p className="text-green-400 text-sm mt-1 font-semibold">{activity.amount}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#262626] border-t border-[#404040] p-3 pb-safe">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          <a href="/dashboard" className="flex flex-col items-center p-2 text-white">
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </a>
          <a href="/apps" className="flex flex-col items-center p-2 text-gray-400 hover:text-white">
            <Package size={20} />
            <span className="text-xs mt-1">Apps</span>
          </a>
          <a href="/reports" className="flex flex-col items-center p-2 text-gray-400 hover:text-white">
            <BarChart size={20} />
            <span className="text-xs mt-1">Reports</span>
          </a>
          <a href="/settings" className="flex flex-col items-center p-2 text-gray-400 hover:text-white">
            <Settings size={20} />
            <span className="text-xs mt-1">Settings</span>
          </a>
        </div>
      </nav>

      {/* Add safe area CSS */}
      <style jsx global>{`
        .pb-safe {
          padding-bottom: calc(1rem + env(safe-area-inset-bottom));
        }
        .font-oswald {
          font-family: 'Oswald', sans-serif;
        }
      `}</style>
    </div>
  );
}
