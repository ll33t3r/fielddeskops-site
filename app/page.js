"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { 
  Calculator, Package, Camera, Plus, PenTool,
  AlertTriangle, TrendingUp, DollarSign, Loader2, LogOut
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

  // 1. THE ENGINE
  useEffect(() => {
    const init = async () => {
      // A. Check Auth
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.replace("/auth/login");
        return;
      }

      // B. Set Time-Aware Greeting
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("GOOD MORNING.");
      else if (hour < 18) setGreeting("GOOD AFTERNOON.");
      else setGreeting("GOOD EVENING.");

      // C. Ask ProfitLock (Revenue)
      const { data: bids } = await supabase.from("bids").select("sale_price");
      const activeJobs = bids ? bids.length : 0;
      const revenue = bids ? bids.reduce((sum, bid) => sum + Number(bid.sale_price), 0) : 0;

      // D. Ask LoadOut (Inventory)
      const { data: inventory } = await supabase.from("inventory").select("quantity");
      const totalItems = inventory ? inventory.length : 0;
      const lowStock = inventory ? inventory.filter(i => i.quantity < 2).length : 0;

      setMetrics({
        activeJobs,
        pipelineRevenue: revenue,
        lowStockCount: lowStock,
        totalItems
      });
      setLoading(false);
    };

    init();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#FF6700]" size={48} />
        <p className="text-gray-500 font-oswald tracking-widest text-sm animate-pulse">LOADING COMMAND CENTER...</p>
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
          .font-oswald { font-family: "Oswald", sans-serif; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter pb-24 relative overflow-hidden">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
        .font-oswald { font-family: "Oswald", sans-serif; }
      `}</style>

      {/* SECTION 1: MORNING BRIEFING */}
      <header className="px-6 pt-12 pb-8 bg-gradient-to-b from-black/40 to-transparent relative">
        <button 
            onClick={handleLogout}
            className="absolute top-6 right-6 text-gray-500 hover:text-red-500 transition-colors"
            title="Sign Out"
        >
            <LogOut size={20} />
        </button>

        <h1 className="text-4xl md:text-5xl font-oswald font-bold mb-2 tracking-wide">
          {greeting}
        </h1>
        <p className="text-gray-400 text-sm mb-8 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${metrics.activeJobs > 0 ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></span>
          System Status: {metrics.activeJobs > 0 ? "ACTIVE" : "STANDBY"}
        </p>

        {/* THE TICKER */}
        <div className="grid grid-cols-2 gap-4">
           {/* REVENUE */}
           <div className="bg-[#262626] border border-[#404040] p-4 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition">
                  <DollarSign size={40} />
              </div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pipeline Revenue</p>
              <p className="text-2xl md:text-3xl font-oswald text-[#22c55e] mt-1">
                ${metrics.pipelineRevenue.toLocaleString()}
              </p>
           </div>

           {/* INVENTORY */}
           <div className={`bg-[#262626] border p-4 rounded-xl shadow-lg relative overflow-hidden transition-colors ${metrics.lowStockCount > 0 ? "border-red-900/50" : "border-[#404040]"}`}>
              <div className="absolute top-0 right-0 p-2 opacity-10">
                  <AlertTriangle size={40} />
              </div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Inventory Alert</p>
              <div className="flex items-baseline gap-2 mt-1">
                 <p className={`text-2xl md:text-3xl font-oswald ${metrics.lowStockCount > 0 ? "text-red-500" : "text-gray-300"}`}>
                    {metrics.lowStockCount}
                 </p>
                 <span className="text-xs text-gray-500">Items Low</span>
              </div>
           </div>
        </div>
      </header>

      {/* SECTION 2: LIVE CARDS (The Tools) */}
      <main className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
         
         {/* PROFITLOCK */}
         <Link href="/apps/profitlock" className="group bg-[#262626] p-6 rounded-xl border border-[#404040] hover:border-[#FF6700] relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,103,0,0.1)]">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-2xl font-oswald font-bold text-white group-hover:text-[#FF6700] transition-colors">PROFIT<span className="text-[#FF6700]">LOCK</span></h2>
                    <p className="text-sm text-gray-400 mt-1">Bid Calculator & Invoicing</p>
                </div>
                <div className="bg-[#333] p-3 rounded-full group-hover:bg-[#FF6700] group-hover:text-black transition-colors">
                    <Calculator size={24} />
                </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#22c55e] bg-[#22c55e]/10 py-1 px-3 rounded w-fit">
                <TrendingUp size={12} /> {metrics.activeJobs} ACTIVE BIDS
            </div>
         </Link>

         {/* LOADOUT */}
         <Link href="/apps/loadout" className="group bg-[#262626] p-6 rounded-xl border border-[#404040] hover:border-[#FF6700] relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,103,0,0.1)]">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-2xl font-oswald font-bold text-white group-hover:text-[#FF6700] transition-colors">LOAD<span className="text-[#FF6700]">OUT</span></h2>
                    <p className="text-sm text-gray-400 mt-1">Fleet Inventory Manager</p>
                </div>
                <div className="bg-[#333] p-3 rounded-full group-hover:bg-[#FF6700] group-hover:text-black transition-colors">
                    <Package size={24} />
                </div>
            </div>
             <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-400 bg-[#333] py-1 px-3 rounded w-fit">
                <Package size={12} /> {metrics.totalItems} ITEMS TRACKED
            </div>
         </Link>
         
         {/* SITESNAP */}
         <Link href="/apps/sitesnap" className="group bg-[#262626] p-6 rounded-xl border border-[#404040] hover:border-[#FF6700] relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,103,0,0.1)]">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-2xl font-oswald font-bold text-white group-hover:text-[#FF6700] transition-colors">SITE<span className="text-[#FF6700]">SNAP</span></h2>
                    <p className="text-sm text-gray-400 mt-1">Photo Documentation</p>
                </div>
                <div className="bg-[#333] p-3 rounded-full group-hover:bg-[#FF6700] group-hover:text-black transition-colors">
                    <Camera size={24} />
                </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-900/20 py-1 px-3 rounded w-fit">
                <Camera size={12} /> READY FOR UPLOAD
            </div>
         </Link>

         {/* SIGNOFF (RESTORED) */}
         <Link href="/apps/signoff" className="group bg-[#262626] p-6 rounded-xl border border-[#404040] hover:border-[#FF6700] relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,103,0,0.1)]">
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h2 className="text-2xl font-oswald font-bold text-white group-hover:text-[#FF6700] transition-colors">SIGN<span className="text-[#FF6700]">OFF</span></h2>
                    <p className="text-sm text-gray-400 mt-1">Digital Contracts</p>
                </div>
                <div className="bg-[#333] p-3 rounded-full group-hover:bg-[#FF6700] group-hover:text-black transition-colors">
                    <PenTool size={24} />
                </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-900/20 py-1 px-3 rounded w-fit">
                <PenTool size={12} /> CONTRACTS READY
            </div>
         </Link>

      </main>

      {/* WARNING BANNER */}
      <div className="fixed bottom-0 w-full bg-red-900/90 backdrop-blur border-t border-red-700 p-2 text-center z-40">
          <p className="text-xs font-bold text-red-100 uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertTriangle size={12} /> Demo Mode: Data Wipes in 14 Days
          </p>
      </div>

      {/* SPEED DIAL */}
      <div className="fixed bottom-12 right-6 z-50">
        <Link href="/apps/profitlock">
            <button className="bg-[#FF6700] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-110 active:scale-95 transition-all duration-300">
            <Plus className="text-black" size={32} strokeWidth={3} />
            </button>
        </Link>
      </div>

    </div>
  );
}
