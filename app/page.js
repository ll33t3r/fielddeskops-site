"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { 
  Calculator, Package, Camera, PenTool, Clock, ShieldAlert,
  AlertTriangle, Wrench, Users, LogOut, Plus, Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // STATE
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("GOOD MORNING");
  const [metrics, setMetrics] = useState({
    activeJobs: 0,
    pipelineRevenue: 0,
    lowStockCount: 0,
    totalItems: 0
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  // 1. DATA ENGINE
  useEffect(() => {
    const init = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.replace("/auth/login");
        return;
      }

      // Time-based Greeting
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("GOOD MORNING");
      else if (hour < 18) setGreeting("GOOD AFTERNOON");
      else setGreeting("GOOD EVENING");

      // Fetch Real Metrics
      const { data: bids } = await supabase.from("bids").select("sale_price");
      const activeJobs = bids ? bids.length : 0;
      const revenue = bids ? bids.reduce((sum, bid) => sum + Number(bid.sale_price), 0) : 0;

      const { data: inventory } = await supabase.from("inventory").select("quantity");
      const totalItems = inventory ? inventory.length : 0;
      const lowStock = inventory ? inventory.filter(i => i.quantity < 2).length : 0;

      setMetrics({ activeJobs, pipelineRevenue: revenue, lowStockCount: lowStock, totalItems });
      setLoading(false);
    };

    init();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#FF6700]" size={48} />
        <p className="text-gray-500 font-oswald tracking-widest text-sm animate-pulse">STARTING ENGINES...</p>
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
          .font-oswald { font-family: "Oswald", sans-serif; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter overflow-hidden flex flex-col">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
        .font-oswald { font-family: "Oswald", sans-serif; }
      `}</style>

      {/* HEADER */}
      <header className="px-4 pt-6 pb-2 bg-[#1a1a1a] border-b border-[#333]">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[#FF6700] font-bold text-xs tracking-widest uppercase mb-1">FieldDeskOps</p>
                <h1 className="text-3xl font-oswald font-bold text-white leading-none">{greeting}.</h1>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors p-2">
                <LogOut size={20} />
            </button>
        </div>

        {/* COMPACT METRICS BAR */}
        <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-[#262626] rounded-lg p-2 border border-[#404040] text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Revenue</p>
                <p className="text-[#22c55e] font-oswald text-lg">${metrics.pipelineRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-[#262626] rounded-lg p-2 border border-[#404040] text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Jobs</p>
                <p className="text-white font-oswald text-lg">{metrics.activeJobs}</p>
            </div>
            <div className={`bg-[#262626] rounded-lg p-2 border text-center ${metrics.lowStockCount > 0 ? "border-red-900" : "border-[#404040]"}`}>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Alerts</p>
                <p className={`${metrics.lowStockCount > 0 ? "text-red-500" : "text-gray-400"} font-oswald text-lg`}>{metrics.lowStockCount}</p>
            </div>
        </div>
      </header>

      {/* APP GRID (The 8-Pack) */}
      <main className="flex-1 p-4 overflow-y-auto">
         <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto pb-20">
            
            {/* 1. PROFITLOCK */}
            <Link href="/apps/profitlock" className="bg-[#262626] p-4 rounded-xl border border-[#404040] hover:border-[#FF6700] group transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-[#333] p-2 rounded-lg group-hover:bg-[#FF6700] group-hover:text-black transition-colors"><Calculator size={20} /></div>
                    {metrics.activeJobs > 0 && <span className="text-[10px] text-[#22c55e] font-bold bg-[#22c55e]/10 px-1.5 py-0.5 rounded">Active</span>}
                </div>
                <h2 className="text-lg font-oswald font-bold text-gray-200">PROFITLOCK</h2>
                <p className="text-xs text-gray-500 leading-tight">Bids & Invoicing</p>
            </Link>

            {/* 2. LOADOUT */}
            <Link href="/apps/loadout" className="bg-[#262626] p-4 rounded-xl border border-[#404040] hover:border-[#FF6700] group transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-[#333] p-2 rounded-lg group-hover:bg-[#FF6700] group-hover:text-black transition-colors"><Package size={20} /></div>
                </div>
                <h2 className="text-lg font-oswald font-bold text-gray-200">LOADOUT</h2>
                <p className="text-xs text-gray-500 leading-tight">Inventory Manager</p>
            </Link>

            {/* 3. SITESNAP */}
            <Link href="/apps/sitesnap" className="bg-[#262626] p-4 rounded-xl border border-[#404040] hover:border-[#FF6700] group transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-[#333] p-2 rounded-lg group-hover:bg-[#FF6700] group-hover:text-black transition-colors"><Camera size={20} /></div>
                </div>
                <h2 className="text-lg font-oswald font-bold text-gray-200">SITESNAP</h2>
                <p className="text-xs text-gray-500 leading-tight">Photo Documentation</p>
            </Link>

            {/* 4. SIGNOFF */}
            <Link href="/apps/signoff" className="bg-[#262626] p-4 rounded-xl border border-[#404040] hover:border-[#FF6700] group transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-[#333] p-2 rounded-lg group-hover:bg-[#FF6700] group-hover:text-black transition-colors"><PenTool size={20} /></div>
                </div>
                <h2 className="text-lg font-oswald font-bold text-gray-200">SIGNOFF</h2>
                <p className="text-xs text-gray-500 leading-tight">Digital Contracts</p>
            </Link>

            {/* 5. CREWCLOCK */}
            <Link href="/apps/crewclock" className="bg-[#262626] p-4 rounded-xl border border-[#404040] hover:border-[#FF6700] group transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-[#333] p-2 rounded-lg group-hover:bg-[#FF6700] group-hover:text-black transition-colors"><Clock size={20} /></div>
                </div>
                <h2 className="text-lg font-oswald font-bold text-gray-200">CREWCLOCK</h2>
                <p className="text-xs text-gray-500 leading-tight">GPS Time Tracking</p>
            </Link>

            {/* 6. SAFETYBRIEF */}
            <Link href="/apps/safetybrief" className="bg-[#262626] p-4 rounded-xl border border-[#404040] hover:border-[#FF6700] group transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-[#333] p-2 rounded-lg group-hover:bg-[#FF6700] group-hover:text-black transition-colors"><ShieldAlert size={20} /></div>
                </div>
                <h2 className="text-lg font-oswald font-bold text-gray-200">SAFETYBRIEF</h2>
                <p className="text-xs text-gray-500 leading-tight">Safety Compliance</p>
            </Link>

            {/* 7. TOOLSHED */}
            <Link href="/apps/toolshed" className="bg-[#262626] p-4 rounded-xl border border-[#404040] hover:border-[#FF6700] group transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-[#333] p-2 rounded-lg group-hover:bg-[#FF6700] group-hover:text-black transition-colors"><Wrench size={20} /></div>
                </div>
                <h2 className="text-lg font-oswald font-bold text-gray-200">TOOLSHED</h2>
                <p className="text-xs text-gray-500 leading-tight">Asset Tracking</p>
            </Link>

            {/* 8. SUBHUB */}
            <Link href="/apps/subhub" className="bg-[#262626] p-4 rounded-xl border border-[#404040] hover:border-[#FF6700] group transition-all">
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-[#333] p-2 rounded-lg group-hover:bg-[#FF6700] group-hover:text-black transition-colors"><Users size={20} /></div>
                </div>
                <h2 className="text-lg font-oswald font-bold text-gray-200">SUBHUB</h2>
                <p className="text-xs text-gray-500 leading-tight">Subcontractor List</p>
            </Link>

         </div>
      </main>

      {/* FOOTER */}
      <div className="fixed bottom-0 w-full bg-[#1a1a1a] border-t border-[#333] p-3 z-40">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">
            FIELD DESK OPS &copy; 2026 • BETA RELEASE
          </p>
      </div>

      {/* SPEED DIAL (Create New Bid) */}
      <div className="fixed bottom-16 right-6 z-50">
        <Link href="/apps/profitlock">
            <button className="bg-[#FF6700] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-110 active:scale-95 transition-all duration-300">
            <Plus className="text-black" size={32} strokeWidth={3} />
            </button>
        </Link>
      </div>

    </div>
  );
}
