"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { 
  Calculator, Package, Camera, PenTool, 
  LogOut, Sun, Moon, Loader2, AlertTriangle, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // STATE
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("HELLO");
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, lowStock: 0 });
  const [theme, setTheme] = useState("dark");
  
  useEffect(() => {
    // 1. Theme Logic
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // 2. Greeting
    const h = new Date().getHours();
    setGreeting(h < 12 ? "GOOD MORNING" : h < 18 ? "GOOD AFTERNOON" : "GOOD EVENING");
    
    // 3. Load Data
    loadDashboardData();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth/login"); return; }

    // FETCH REVENUE (ProfitLock)
    const { data: bids } = await supabase.from("bids").select("sale_price");
    const revenue = bids ? bids.reduce((acc, b) => acc + (Number(b.sale_price) || 0), 0) : 0;
    const jobs = bids ? bids.length : 0;

    // FETCH ALERTS (LoadOut) -> Low Stock Logic
    // Matches logic in LoadOut app: item.quantity < (item.min_quantity || 3)
    const { data: inventory } = await supabase.from("inventory").select("quantity, min_quantity");
    let lowStockCount = 0;
    if (inventory) {
        lowStockCount = inventory.filter(i => i.quantity < (i.min_quantity || 3)).length;
    }

    setMetrics({ revenue, jobs, lowStock: lowStockCount });
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace("/auth/login"); };

  if (loading) return <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="h-screen flex flex-col relative selection:bg-[#FF6700] selection:text-black bg-[var(--bg-main)] overflow-hidden">
      
      {/* HEADER */}
      <header className="px-6 pt-6 pb-2 shrink-0">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[#FF6700] font-bold text-[10px] tracking-[0.2em] uppercase mb-1">FIELDDESKOPS</p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-wide">{greeting}.</h1>
            </div>
            <div className="flex gap-3">
                <button onClick={toggleTheme} className="p-3 rounded-full industrial-card hover:text-[#FF6700] transition">
                    {theme === "dark" ? <Sun size={20}/> : <Moon size={20}/>}
                </button>
                <button onClick={handleLogout} className="p-3 rounded-full industrial-card hover:bg-red-500/20 hover:text-red-500 transition">
                    <LogOut size={20}/>
                </button>
            </div>
        </div>

        {/* METRICS BAR */}
        <div className="grid grid-cols-3 gap-4 mt-6">
            {/* 1. Revenue */}
            <div className="industrial-card rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Revenue</p>
                <p className="text-[#22c55e] font-bold text-lg tracking-tight">${metrics.revenue.toLocaleString()}</p>
            </div>
            
            {/* 2. Jobs */}
            <div className="industrial-card rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Jobs</p>
                <p className="font-bold text-lg tracking-tight">{metrics.jobs}</p>
            </div>

            {/* 3. SYSTEM ALERTS (The Logic) */}
            <div className={`industrial-card rounded-xl p-3 text-center transition-all duration-300 ${metrics.lowStock > 0 ? "bg-red-500/10 border-red-500" : ""}`}>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${metrics.lowStock > 0 ? "text-red-500" : "text-gray-400"}`}>
                    {metrics.lowStock > 0 ? "ATTENTION" : "SYSTEM"}
                </p>
                <div className="flex items-center justify-center gap-2">
                    {metrics.lowStock > 0 ? (
                        <>
                            <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                            <p className="font-bold text-lg tracking-tight text-red-500">{metrics.lowStock} LOW</p>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={16} className="text-gray-600" />
                            <p className="font-bold text-lg tracking-tight text-gray-500">OK</p>
                        </>
                    )}
                </div>
            </div>
        </div>
      </header>

      {/* APPS GRID */}
      <main className="flex-1 p-6 min-h-0">
         <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full w-full max-w-2xl mx-auto">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Bids & Invoices" icon={<Calculator size={32}/>} color="group-hover:text-green-500" />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={32}/>} color="group-hover:text-blue-500" alert={metrics.lowStock > 0} />
            <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Photos" icon={<Camera size={32}/>} color="group-hover:text-purple-500" />
            <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={32}/>} color="group-hover:text-[#FF6700]" />
         </div>
      </main>

      {/* FOOTER */}
      <div className="pb-4 text-center shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 opacity-40">
                POWERED BY FIELDDESKOPS
            </p>
      </div>
    </div>
  );
}

// Reusable Card Component
function AppCard({ href, label, sub, icon, color, alert }) {
    return (
        <Link href={href} className={`
            industrial-card flex flex-col items-center justify-center text-center
            rounded-2xl transition-all duration-300 group relative overflow-hidden
            hover:bg-gray-800/80 active:scale-95 border-2 
            ${alert ? "border-red-500/50 bg-red-900/10" : "border-transparent hover:border-gray-700"}
        `}>
            {/* Background Glow */}
            <div className="absolute top-0 right-0 p-20 bg-gradient-to-br from-white/5 to-transparent rounded-full translate-x-10 -translate-y-10 pointer-events-none"></div>
            
            <div className={`mb-3 p-4 rounded-full bg-black/20 ${color} transition-colors duration-300 relative`}>
                {icon}
                {/* Notification Dot on App Icon */}
                {alert && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>}
            </div>
            
            <h2 className="text-lg md:text-2xl font-bold tracking-widest mb-1 group-hover:text-white transition-colors">{label}</h2>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-bold">{sub}</p>
        </Link>
    );
}
