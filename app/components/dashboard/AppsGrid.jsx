"use client";

import Link from "next/link";
import { Calculator, Package, Camera, PenTool } from "lucide-react";

function AppCard({ href, label, sub, icon, active }) {
  return (
    <Link
      href={href}
      className={`bg-[var(--bg-card)] backdrop-blur-xl border p-6 rounded-2xl hover:bg-[var(--bg-surface)] active:scale-95 transition-all group relative overflow-hidden ${
        active ? "border-[#FF6700] shadow-[0_0_15px_rgba(255,103,0,0.2)]" : "border-[var(--border-color)]"
      }`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500 pointer-events-none"></div>
      <div className="relative z-10">
        <div className="mb-4 text-[#FF6700] group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all">
          {icon}
        </div>
        <h2 className="text-base font-oswald font-bold text-[var(--text-main)] group-hover:text-[#FF6700] transition-colors mb-1">{label}</h2>
        <p className="text-[10px] text-[var(--text-sub)] uppercase tracking-wide">{sub}</p>
      </div>
    </Link>
  );
}

export default function AppsGrid({ activeJob }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
      <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Bids & Invoices" icon={<Calculator size={28} />} active={activeJob} />
      <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={28} />} active={activeJob} />
      <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Photos" icon={<Camera size={28} />} active={activeJob} />
      <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={28} />} active={activeJob} />
    </div>
  );
}
