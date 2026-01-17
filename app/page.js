"use client";

import Link from "next/link";
import {
  Calculator,
  ClipboardCheck,
  Camera,
  PenTool,
  Clock,
  ShieldAlert
} from "lucide-react";
import LogoutButton from "../components/LogoutButton";

export default function CommandCenter() {
  const tools = [
    { name: "ProfitLock", desc: "Bid Calculator & Margin Protection", icon: Calculator, href: "/apps/profitlock", status: "Beta" },
    { name: "LoadOut",    desc: "Inventory & Tool Checklists",       icon: ClipboardCheck, href: "/apps/loadout", status: "Beta" },
    { name: "SiteSnap",   desc: "Photo Documentation",               icon: Camera, href: "/apps/sitesnap", status: "Beta" },
    { name: "SignOff",    desc: "Digital Contracts",                 icon: PenTool, href: "/apps/signoff", status: "Beta" },
    { name: "CrewClock",  desc: "Time Tracking",                     icon: Clock, href: "#", status: "Coming Soon" },
    { name: "SafetyBrief",desc: "OSHA Logs",                         icon: ShieldAlert, href: "#", status: "Coming Soon" }
  ];

  return (
    <main className="min-h-screen bg-industrial-bg font-inter">
      {/* ===== HEADER ===== */}
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-oswald font-bold">
          FIELD<span className="text-industrial-orange">DESK</span>OPS
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300 hidden sm:block">user@example.com</span>
          <LogoutButton />
        </div>
      </header>

      {/* ===== TOOL GRID ===== */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((t) => {
            const disabled = t.status === "Coming Soon";
            return (
              <Link
                key={t.name}
                href={disabled ? "#" : t.href}
                className={`group relative bg-industrial-card border border-industrial-border rounded-xl p-6 transition-all duration-200
                  ${disabled ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-lg hover:border-industrial-orange"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-industrial-bg border border-industrial-border group-hover:border-industrial-orange transition-colors">
                    <t.icon className="w-8 h-8 text-industrial-orange" />
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${t.status === "Beta" ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-gray-800/50 text-gray-400 border-gray-700"}`}>
                    {t.status}
                  </span>
                </div>

                <h2 className="text-2xl font-oswald font-bold text-white">{t.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{t.desc}</p>

                {!disabled && (
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition text-industrial-orange">
                    ➜
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== FONT PRELOAD ===== */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-oswald { font-family: 'Oswald', sans-serif; }
      `}</style>
    </main>
  );
}