"use client";

import Link from 'next/link';
import {
  Calculator,
  ClipboardCheck,
  Camera,
  PenTool,
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function Home() {
  const apps = [
    {
      name: 'ProfitLock',
      desc: 'Bid Calculator & Margin Protection',
      icon: Calculator,
      href: '/apps/profitlock',
      status: 'Beta'
    },
    {
      name: 'LoadOut',
      desc: 'Inventory & Tool Checklists',
      icon: ClipboardCheck,
      href: '/apps/loadout',
      status: 'Beta'
    },
    {
      name: 'SiteSnap',
      desc: 'Photo Documentation',
      icon: Camera,
      href: '/apps/sitesnap',
      status: 'Beta'
    },
    {
      name: 'SignOff',
      desc: 'Digital Contracts',
      icon: PenTool,
      href: '/apps/signoff',
      status: 'Beta'
    },
    {
      name: 'CrewClock',
      desc: 'Time Tracking',
      icon: Clock,
      href: '/apps/crewclock',
      status: 'Coming Soon'
    },
    {
      name: 'SafetyBrief',
      desc: 'OSHA Logs',
      icon: ShieldAlert,
      href: '/apps/safetybrief',
      status: 'Coming Soon'
    }
  ];

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white font-inter px-6 py-10">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-12 border-b border-[#333] pb-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-5xl font-oswald font-bold">
              FIELD<span className="text-[#FF6700]">DESK</span>OPS
            </h1>
            <p className="text-gray-400 mt-1">The Operating System for the Trades.</p>
          </div>
          <div className="hidden md:block text-right font-mono text-sm text-[#FF6700]">
            V2.0 LIVE
          </div>
        </div>
      </div>

      {/* APP GRID */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
        {apps.map((app) => {
          const isDisabled = app.status === 'Coming Soon';
          return (
            <Link
              key={app.name}
              href={isDisabled ? '#' : app.href}
              className={`group relative p-6 rounded-xl border transition-all duration-300
                ${
                  isDisabled
                    ? 'border-[#333] bg-[#222] opacity-50 cursor-not-allowed'
                    : 'border-[#404040] bg-[#262626] hover:border-[#FF6700] hover:shadow-[0_0_24px_rgba(255,103,0,.25)]'
                }`}
            >
              {/* Icon + status badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#333] group-hover:border-[#FF6700] transition-colors">
                  <app.icon size={32} className="text-[#FF6700]" />
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase border
                    ${app.status === 'Beta'
                      ? 'bg-blue-900/30 text-blue-400 border-blue-800'
                      : 'bg-gray-800/50 text-gray-400 border-gray-700'
                    }`}
                >
                  {app.status}
                </span>
              </div>

              {/* Title & desc */}
              <h2 className="text-2xl font-oswald font-bold mb-1">{app.name}</h2>
              <p className="text-sm text-gray-400">{app.desc}</p>

              {/* Hover arrow */}
              {!isDisabled && (
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition text-[#FF6700]">
                  ➜
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* FOOTER */}
      <footer className="max-w-5xl mx-auto mt-16 text-center text-xs text-gray-500 border-t border-[#333] pt-8">
        &copy; 2026 FieldDeskOps. Built for speed.
      </footer>

      {/* FONT PRELOAD */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-oswald { font-family: 'Oswald', sans-serif; }
      `}</style>
    </main>
  );
}