"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { 
  Calculator, Package, Camera, PenTool, 
  LogOut, Sun, Moon, Loader2, AlertTriangle, CheckCircle2,
  X, ChevronRight, ShoppingCart
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // STATE
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("HELLO");
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, lowStockCount: 0 });
  const [alertItems, setAlertItems] = useState([]); // Stores the actual items
  const [showAlerts, setShowAlerts] = useState(false); // Controls modal
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

    // FETCH ALERTS (LoadOut)
    const { data: inventory } = await supabase.from("inventory").select("name, quantity, min_quantity");
    let lowItems = [];
    if (inventory) {
        // Filter items where Quantity < Target (default 3)
        lowItems = inventory.filter(i => i.quantity < (i.min_quantity || 3));
    }

    setAlertItems(lowItems);
    setMetrics({ revenue, jobs, lowStockCount: lowItems.length });
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace("/auth/login"); };

  if (loading) return <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="h-screen flex flex-col relative selection:bg-[#FF6700] selection:text-black bg-[var(--bg-main)] overflow-hidden font-inter">
      
      {/* HEADER */}
      <header className="px-6 pt-6 pb-2 shrink-0">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[#FF6700] font-bold text-[10px] tracking-[0.2em] uppercase mb-1">FIELDDESKOPS</p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-foreground">{greeting}.</h1>
            </div>
            <div className="flex gap-3">
                <button onClick={toggleTheme} className="p-3 rounded-full industrial-card hover:text-[#FF6700] transition text-foreground">
                    {theme === "dark" ? <Sun size={20}/> : <Moon size={20}/>}
                </button>
                <button onClick={handleLogout} className="p-3 rounded-full industrial-card hover:bg-red-500/20 hover:text-red-500 transition text-foreground">
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
                <p className="font-bold text-lg tracking-tight text-foreground">{metrics.jobs}</p>
            </div>

            {/* 3. SYSTEM ALERTS (Clickable) */}
            <button 
                onClick={() => metrics.lowStockCount > 0 && setShowAlerts(true)}
                disabled={metrics.lowStockCount === 0}
                className={`industrial-card rounded-xl p-3 text-center transition-all duration-300 relative overflow-hidden ${metrics.lowStockCount > 0 ? "bg-red-900/10 border-red-500 cursor-pointer hover:bg-red-900/20 active:scale-95" : "cursor-default opacity-80"}`}
            >
                <p className={`text-[10px] uppercase font-bold tracking-wider ${metrics.lowStockCount > 0 ? "text-red-500" : "text-gray-400"}`}>
                    {metrics.lowStockCount > 0 ? "ATTENTION" : "SYSTEM"}
                </p>
                <div className="flex items-center justify-center gap-2">
                    {metrics.lowStockCount > 0 ? (
                        <>
                            <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                            <p className="font-bold text-lg tracking-tight text-red-500">{metrics.lowStockCount} LOW</p>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={16} className="text-gray-600" />
                            <p className="font-bold text-lg tracking-tight text-gray-500">OK</p>
                        </>
                    )}
                </div>
                {/* Visual Hint to click if active */}
                {metrics.lowStockCount > 0 && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500/50"><ChevronRight size={14}/></div>}
            </button>
        </div>
      </header>

      {/* APPS GRID */}
      <main className="flex-1 p-6 min-h-0">
         <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full w-full max-w-2xl mx-auto">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Bids & Invoices" icon={<Calculator size={32}/>} color="group-hover:text-green-500" />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={32}/>} color="group-hover:text-blue-500" alert={metrics.lowStockCount > 0} />
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

      {/* --- ALERT MODAL --- */}
      {showAlerts && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-red-900/50 bg-[#0a0a0a]">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-red-900/30 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-full">
                            <AlertTriangle size={24} className="text-red-500" />
                        </div>
                        <div>
                            <h2 className="font-oswald font-bold text-xl text-red-500 tracking-wide">SYSTEM ALERTS</h2>
                            <p className="text-xs text-red-400/60 uppercase font-bold tracking-widest">Action Required</p>
                        </div>
                    </div>
                    <button onClick={() => setShowAlerts(false)} className="text-gray-500 hover:text-white transition"><X size={24}/></button>
                </div>

                {/* List */}
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar mb-6">
                    {alertItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-red-900/5 border border-red-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="font-bold text-gray-200">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-red-500 font-mono font-bold text-lg">{item.quantity}</span>
                                <span className="text-gray-600 text-[10px] uppercase font-bold ml-1">/ {item.min_quantity || 3}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action */}
                <Link href="/apps/loadout" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                    <ShoppingCart size={18}/> GO TO LOADOUT
                </Link>
            </div>
        </div>
      )}

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
            
            <h2 className="text-lg md:text-2xl font-bold tracking-widest mb-1 group-hover:text-white transition-colors text-foreground">{label}</h2>
            <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-bold">{sub}</p>
        </Link>
    );
}
