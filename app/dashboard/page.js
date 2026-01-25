'use client'

import Link from 'next/link'
import { Wallet, Truck, Camera, FileSignature, LogOut, UserCircle, BarChart3, Zap, ShieldCheck } from 'lucide-react'

export default function Dashboard() {
  const apps = [
    {
      name: 'PROFITLOCK',
      description: 'Bids & Invoices',
      icon: <Wallet className="w-10 h-10 md:w-16 md:h-16" />,
      href: '/apps/profitlock',
      color: 'text-green-500', 
      border: 'hover:border-green-500',
      bg: 'hover:bg-green-500/10'
    },
    {
      name: 'LOADOUT',
      description: 'Inventory',
      icon: <Truck className="w-10 h-10 md:w-16 md:h-16" />,
      href: '/apps/loadout',
      color: 'text-blue-500',
      border: 'hover:border-blue-500',
      bg: 'hover:bg-blue-500/10'
    },
    {
      name: 'SITESNAP',
      description: 'Photos',
      icon: <Camera className="w-10 h-10 md:w-16 md:h-16" />,
      href: '/apps/sitesnap',
      color: 'text-purple-500',
      border: 'hover:border-purple-500',
      bg: 'hover:bg-purple-500/10'
    },
    {
      name: 'SIGNOFF',
      description: 'Contracts',
      icon: <FileSignature className="w-10 h-10 md:w-16 md:h-16" />,
      href: '/apps/signoff',
      color: 'text-[#FF6700]',
      border: 'hover:border-[#FF6700]',
      bg: 'hover:bg-[#FF6700]/10'
    },
  ]

  return (
    // h-screen locks the height to the viewport (no scrolling)
    <div className="h-screen bg-[#0a0a0a] flex flex-col p-4 md:p-6 overflow-hidden font-sans">
      
      {/* 1. HEADER */}
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide font-oswald">
            FIELDDESK<span className="text-[#FF6700]">OPS</span>
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/account" className="p-2 text-gray-400 hover:text-white transition-colors">
            <UserCircle size={28} />
          </Link>
          <Link href="/auth/login" className="p-2 text-gray-400 hover:text-[#FF6700] transition-colors">
            <LogOut size={28} />
          </Link>
        </div>
      </header>

      {/* 2. STATS BAR (Kept at top) */}
      <div className="grid grid-cols-3 gap-3 mb-4 shrink-0">
        <div className="bg-[#151515] rounded-xl p-3 border border-white/5 flex flex-col justify-center items-center text-center">
          <ShieldCheck size={20} className="text-[#FF6700] mb-1"/>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Plan</p>
          <p className="text-lg font-bold text-white">PRO</p>
        </div>
        <div className="bg-[#151515] rounded-xl p-3 border border-white/5 flex flex-col justify-center items-center text-center">
          <Zap size={20} className="text-yellow-500 mb-1"/>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Credits</p>
          <p className="text-lg font-bold text-white">∞</p>
        </div>
        <div className="bg-[#151515] rounded-xl p-3 border border-white/5 flex flex-col justify-center items-center text-center">
          <BarChart3 size={20} className="text-blue-500 mb-1"/>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Projects</p>
          <p className="text-lg font-bold text-white">3/10</p>
        </div>
      </div>

      {/* 3. CORE 4 GRID (Fills remaining space) */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
        {apps.map((app) => (
          <Link
            key={app.name}
            href={app.href}
            className={`
              group relative flex flex-col items-center justify-center p-4 
              bg-[#121212] rounded-2xl border-2 border-white/5
              transition-all duration-300 active:scale-95 shadow-xl
              ${app.border} ${app.bg}
            `}
          >
            {/* Icon Circle */}
            <div className={`mb-3 p-4 rounded-full bg-black/40 ${app.color} ring-1 ring-white/5 group-hover:scale-110 transition-transform`}>
              {app.icon}
            </div>
            
            <h3 className="text-xl md:text-3xl font-bold text-white mb-1 tracking-wide font-oswald">
              {app.name}
            </h3>
            
            <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest font-bold group-hover:text-gray-300 transition-colors">
              {app.description}
            </p>
          </Link>
        ))}
      </div>

      {/* 4. ACTIVITY FOOTER (Compact at bottom) */}
      <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-500 px-2">
            <span className="uppercase tracking-widest font-bold">Recent Activity</span>
            <span>View All</span>
        </div>
        <div className="mt-2 flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-300">New Quote Created #1024</span>
            <span className="ml-auto text-xs text-gray-600">2h ago</span>
        </div>
      </div>
      
    </div>
  )
}
