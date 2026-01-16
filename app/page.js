"use client";

import Link from 'next/link';
import { Calculator, ClipboardCheck, Camera, PenTool, Clock, ShieldAlert } from 'lucide-react';

export default function Home() {
  
  // THE APP GRID CONFIGURATION
  const apps = [
    {
      name: "ProfitLock",
      desc: "Bid Calculator & Margin Protection",
      icon: <Calculator size={32} color="#FF6700" />,
      href: "/apps/profitlock", 
      status: "Active"
    },
    {
      name: "LoadOut",
      desc: "Inventory & Tool Checklists",
      icon: <ClipboardCheck size={32} color="#FF6700" />,
      href: "/apps/loadout",
      status: "Active"
    },
    {
      name: "SiteSnap",
      desc: "Photo Documentation",
      icon: <Camera size={32} color="#FF6700" />,
      href: "/apps/sitesnap",
      status: "Active"
    },
    {
      name: "SignOff",
      desc: "Digital Contracts",
      icon: <PenTool size={32} color="#FF6700" />,
      href: "/apps/signoff",
      status: "Beta"
    },
    {
      name: "CrewClock",
      desc: "Time Tracking",
      icon: <Clock size={32} color="#404040" />,
      href: "/apps/crewclock",
      status: "Coming Soon" 
    },
    {
      name: "SafetyBrief",
      desc: "OSHA Logs",
      icon: <ShieldAlert size={32} color="#404040" />,
      href: "/apps/safetybrief",
      status: "Coming Soon"
    }
  ];

  return (
    <main className="min-h-screen p-4 md:p-8" style={{ backgroundColor: '#1a1a1a', fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER SECTION */}
      <div className="max-w-4xl mx-auto mb-10 pt-4 flex justify-between items-end border-b border-[#333] pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '1px' }}>
            FIELD<span style={{ color: '#FF6700' }}>DESK</span>OPS
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            The Operating System for the Trades.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-[#FF6700] font-bold font-mono">V2.0 LIVE</div>
        </div>
      </div>

      {/* APP GRID */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.map((app, index) => (
          <Link key={index} href={app.status === "Active" || app.status === "Beta" ? app.href : "#"} 
            className={`group relative p-6 rounded-xl border transition-all duration-300 ${
              app.status === "Coming Soon" 
                ? "border-[#333] bg-[#222] opacity-50 cursor-not-allowed" 
                : "border-[#404040] bg-[#262626] hover:border-[#FF6700] hover:shadow-[0_0_20px_rgba(255,103,0,0.1)] cursor-pointer"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#333] group-hover:border-[#FF6700] transition-colors">
                {app.icon}
              </div>
              {app.status === "Beta" && (
                <span className="px-2 py-1 rounded bg-blue-900/30 text-blue-400 text-xs font-bold uppercase border border-blue-800">
                  Beta
                </span>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
              {app.name}
            </h2>
            <p className="text-gray-400 text-sm">
              {app.desc}
            </p>

            {/* Hover Arrow (Desktop) */}
            {app.status !== "Coming Soon" && (
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-[#FF6700]">
                ➜
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* FOOTER */}
      <div className="max-w-4xl mx-auto mt-12 text-center text-gray-500 text-xs border-t border-[#333] pt-8">
        <p>&copy; 2026 FieldDeskOps. Built for speed.</p>
      </div>

      {/* GLOBAL FONT LOADER */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap');
      `}</style>

    </main>
  );
}
