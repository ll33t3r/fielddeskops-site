"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { useLiveBrain } from "../hooks/useLiveBrain";
import { useActiveJob } from "../hooks/useActiveJob";
import { 
  Calculator, Package, Camera, PenTool, 
  AlertTriangle, LogOut, Plus, Loader2, X, 
  FilePlus, Play, RefreshCw, Trash2, CheckCircle2,
  Sun, Moon, Eye, EyeOff, Menu, Briefcase, Truck, Users, Settings
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // --- THE BRAIN ---
  const { jobs, loading: brainLoading } = useLiveBrain();
  const { activeJob, setActiveJob } = useActiveJob();
  const [quickJobName, setQuickJobName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("HELLO");
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, alerts: 0 });
  const [theme, setTheme] = useState("dark");
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Hamburger State
  
  // POPUPS
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertList, setAlertList] = useState([]); 
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const h = new Date().getHours();
    setGreeting(h < 12 ? "GOOD MORNING" : h < 18 ? "GOOD AFTERNOON" : "GOOD EVENING");
    
    loadDashboardData();
  }, []);

  // --- ACTIONS ---
  
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!quickJobName.trim()) return;
    setIsCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase.from("jobs").insert({
      user_id: user.id,
      title: quickJobName,
      status: "ACTIVE"
    }).select().single();

    if (data) {
      setActiveJob(data);
      setQuickJobName("");
    }
    setIsCreating(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth/login"); return; }

    const { data: bids } = await supabase.from("estimates").select("total_price");
    const revenue = bids ? bids.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0) : 0;
    
    const { data: inventory } = await supabase.from("inventory").select("name, quantity, min_quantity");
    const stockAlerts = inventory?.filter(i => i.quantity < i.min_quantity).map(i => ({ 
        id: "stock-" + Math.random(), 
        type: "STOCK", 
        title: "LOW STOCK",
        msg: `${i.name}: ${i.quantity} / ${i.min_quantity}`,
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500"
    })) || [];
    
    setAlertList(stockAlerts);
    setMetrics({ revenue, jobs: bids ? bids.length : 0, alerts: stockAlerts.length });
    setLoading(false);
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const dismissAlert = (index) => {
    const newAlerts = [...alertList];
    newAlerts.splice(index, 1);
    setAlertList(newAlerts);
    setMetrics(prev => ({ ...prev, alerts: newAlerts.length }));
  };

  const clearAllAlerts = () => {
    if(!confirm("Clear all alerts?")) return;
    setAlertList([]);
    setMetrics(prev => ({ ...prev, alerts: 0 }));
    setShowAlerts(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace("/auth/login"); };

  const formatCurrency = (val) => {
    if (privacyMode) return "****";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="h-screen w-full bg-[#121212] text-white font-inter overflow-hidden flex flex-col relative selection:bg-[#FF6700] selection:text-black transition-colors duration-300">
      
      {/* HEADER */}
      <header className="px-5 pt-8 pb-4 bg-[#121212] z-10">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-[#FF6700] font-bold text-[10px] tracking-[0.2em] uppercase mb-1">FIELDDESKOPS</p>
                <h1 className="text-2xl font-oswald font-bold tracking-wide text-white">{greeting}.</h1>
            </div>
            <div className="flex gap-2">
                 {/* HAMBURGER MENU BUTTON */}
                <button onClick={() => setIsMenuOpen(true)} className="glass-btn p-2 rounded-full hover:bg-[#FF6700]/20 hover:text-[#FF6700] transition text-zinc-500">
                    <Menu size={20}/>
                </button>
            </div>
        </div>

        {/* ONE-TAP DISPATCH BAR */}
        <form onSubmit={handleCreateJob} className="relative mb-4 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6700]">
                {isCreating ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
            </div>
            <input 
                type="text" 
                placeholder="Start New Job..." 
                value={quickJobName}
                onChange={(e) => setQuickJobName(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-base text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FF6700] focus:shadow-[0_0_20px_rgba(255,103,0,0.2)] transition-all"
            />
        </form>

        {/* ACTIVE JOB INDICATOR */}
        {activeJob ? (
           <div className="flex items-center justify-between bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-lg p-3 mb-2 animate-in fade-in">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF6700] shadow-[0_0_10px_#FF6700] animate-pulse"></div>
                  <div>
                      <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider">ACTIVE MISSION</p>
                      <p className="font-oswald text-sm text-white tracking-wide">{activeJob.title}</p>
                  </div>
              </div>
              <button onClick={() => setActiveJob(null)} className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]"><X size={14}/></button>
           </div>
        ) : (
           <div className="text-center py-2 mb-2 opacity-30 text-[10px] uppercase tracking-widest text-zinc-500">NO ACTIVE MISSION</div>
        )}

        {/* METRICS BAR */}
        <div className="grid grid-cols-3 gap-3">
            <div className="glass-panel rounded-xl p-3 text-center border border-white/5 bg-[#1a1a1a]">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Revenue</p>
                <p className="text-[#22c55e] font-oswald text-lg tracking-tight">{formatCurrency(metrics.revenue)}</p>
            </div>
            <div className="glass-panel rounded-xl p-3 text-center border border-white/5 bg-[#1a1a1a]">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Jobs</p>
                <p className="font-oswald text-lg tracking-tight text-white">{metrics.jobs}</p>
            </div>
            <button onClick={() => setShowAlerts(true)} className={`glass-panel rounded-xl p-3 text-center transition active:scale-95 relative border border-white/5 bg-[#1a1a1a] ${metrics.alerts > 0 ? "border-red-500/50 bg-red-500/10" : ""}`}>
                {metrics.alerts > 0 && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">System</p>
                <div className="flex items-center justify-center gap-1">
                    {metrics.alerts > 0 && <AlertTriangle size={14} className="text-red-500"/>}
                    <p className={`font-oswald text-lg tracking-tight ${metrics.alerts > 0 ? "text-red-500" : "text-zinc-500"}`}>{metrics.alerts > 0 ? metrics.alerts : "OK"}</p>
                </div>
            </button>
        </div>
      </header>

      {/* APPS GRID - THE BIG 4 ONLY - ALWAYS GLOWING */}
      <main className="flex-1 overflow-y-auto px-5 pb-32 custom-scrollbar">
         <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Estimates" icon={<Calculator size={20}/>} glow={true} />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={20}/>} glow={true} />
            <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Photos" icon={<Camera size={20}/>} glow={true} />
            <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={20}/>} glow={true} />
         </div>

         {/* RECENT JOBS LIST */}
         <div className="mt-8">
            <h2 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3 pl-1">RECENT MISSIONS</h2>
            <div className="space-y-2">
                {jobs.slice(0, 5).map(job => (
                    <button 
                        key={job.id} 
                        onClick={() => setActiveJob(job)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700] shadow-[0_0_15px_rgba(255,103,0,0.1)]" : "bg-[#1a1a1a] border-white/5 hover:bg-[#252525]"}`}
                    >
                        <div className="text-left">
                            <p className={`font-oswald text-sm ${activeJob?.id === job.id ? "text-[#FF6700]" : "text-white"}`}>{job.title}</p>
                            <p className="text-[10px] text-zinc-500">{new Date(job.created_at).toLocaleDateString()}</p>
                        </div>
                        {activeJob?.id === job.id && <Play size={14} className="text-[#FF6700] fill-[#FF6700]" />}
                    </button>
                ))}
            </div>
         </div>
      </main>

      {/* HAMBURGER MENU (SLIDE-OUT DRAWER) */}
      {isMenuOpen && (
        <>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 animate-in fade-in" onClick={() => setIsMenuOpen(false)}/>
            <div className="absolute inset-y-0 right-0 w-3/4 max-w-xs bg-[#121212] border-l border-[#FF6700]/30 z-50 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="font-oswald text-xl text-white tracking-wide">COMMAND MENU</h2>
                    <button onClick={() => setIsMenuOpen(false)}><X size={24} className="text-zinc-500 hover:text-[#FF6700]"/></button>
                </div>
                
                {/* MENU OPTIONS */}
                <div className="space-y-6 flex-1">
                    <div>
                        <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-widest mb-2">OPERATIONS</p>
                        <div className="space-y-2">
                             <MenuOption icon={<Briefcase size={18}/>} label="Manage Jobs" onClick={() => {}} />
                             <MenuOption icon={<Truck size={18}/>} label="Manage Fleet" onClick={() => {}} />
                             <MenuOption icon={<Users size={18}/>} label="Manage Workers" onClick={() => {}} />
                             <MenuOption icon={<Settings size={18}/>} label="Customer Database" onClick={() => {}} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-widest mb-2">SYSTEM</p>
                        <div className="space-y-2">
                            <button onClick={() => setPrivacyMode(!privacyMode)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] text-zinc-400 hover:bg-[#252525] hover:text-white transition">
                                {privacyMode ? <EyeOff size={18}/> : <Eye size={18}/>}
                                <span className="font-oswald text-sm">Privacy Mode</span>
                            </button>
                            <button onClick={toggleTheme} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] text-zinc-400 hover:bg-[#252525] hover:text-white transition">
                                {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
                                <span className="font-oswald text-sm">Toggle Theme</span>
                            </button>
                        </div>
                    </div>
                </div>

                <button onClick={handleLogout} className="mt-auto w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-900/10 text-red-500 hover:bg-red-900/20 transition font-bold text-sm">
                    <LogOut size={18}/> LOGOUT
                </button>
            </div>
        </>
      )}

      {/* SPEED DIAL (EXISTING) */}
      <div className="fixed bottom-8 right-6 z-30 flex flex-col items-end gap-3">
        {showSpeedDial && (
            <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-10 fade-in duration-200">
                <Link href="/apps/profitlock" className="flex items-center gap-3">
                    <span className="bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded border border-white/10 shadow-md">New Bid</span>
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 text-green-500 flex items-center justify-center shadow-lg"><FilePlus size={18}/></div>
                </Link>
                <Link href="/apps/loadout" className="flex items-center gap-3">
                    <span className="bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded border border-white/10 shadow-md">Add Item</span>
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-white/10 text-blue-400 flex items-center justify-center shadow-lg"><Package size={18}/></div>
                </Link>
            </div>
        )}
        <button 
            onClick={() => setShowSpeedDial(!showSpeedDial)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,103,0,0.3)] transition-all duration-300 ${showSpeedDial ? "bg-black text-white rotate-45 border border-white/20" : "bg-[#FF6700] text-black hover:scale-110"}`}
        >
            <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>

      {/* ALERTS MODAL */}
      {showAlerts && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="glass-panel bg-[#121212] border border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-oswald text-xl flex items-center gap-2 text-white"><AlertTriangle className="text-[#FF6700]"/> SYSTEM ALERTS</h2>
                    <div className="flex gap-2">
                        <button onClick={manualRefresh} className="p-2 rounded-lg hover:bg-white/10" disabled={refreshing}>
                            <RefreshCw size={18} className={refreshing ? "animate-spin text-[#FF6700]" : "text-zinc-500"}/>
                        </button>
                        <button onClick={() => setShowAlerts(false)} className="p-2 rounded-lg hover:bg-white/10 text-zinc-500">
                            <X size={18}/>
                        </button>
                    </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {alertList.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2 opacity-50"/>
                            <p className="text-zinc-500 text-sm">All systems operational.</p>
                        </div>
                    ) : (
                        alertList.map((alert, i) => (
                            <div key={alert.id} className={`border-l-4 ${alert.border} ${alert.bg} p-3 rounded flex justify-between items-start group`}>
                                <div>
                                    <p className={`text-xs font-bold ${alert.color}`}>{alert.title}</p>
                                    <p className="text-sm text-white">{alert.msg}</p>
                                </div>
                                <button onClick={() => dismissAlert(i)} className="text-zinc-500 hover:text-white p-1"><X size={14}/></button>
                            </div>
                        ))
                    )}
                </div>
                {alertList.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/10 flex gap-2">
                         <button onClick={clearAllAlerts} className="flex-1 bg-red-900/20 text-red-500 py-3 rounded-xl font-bold transition hover:bg-red-900/40 text-xs flex items-center justify-center gap-2">
                            <Trash2 size={14}/> CLEAR ALL
                        </button>
                         <button onClick={() => setShowAlerts(false)} className="flex-1 bg-[#1a1a1a] hover:bg-[#252525] text-white py-3 rounded-xl font-bold transition text-xs border border-white/10">
                            CLOSE
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}

// Reusable App Card (ALWAYS GLOWING)
function AppCard({ href, label, sub, icon, glow }) {
    return (
        <Link href={href} className={`glass-panel p-4 rounded-xl border border-white/5 bg-[#1a1a1a] hover:bg-[#252525] active:scale-95 transition-all group relative overflow-hidden ${glow ? "border-[#FF6700]/50 shadow-[0_0_15px_rgba(255,103,0,0.15)]" : ""}`}>
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2.5 rounded-lg transition-colors ${glow ? "bg-[#121212] text-[#FF6700] shadow-[0_0_10px_rgba(255,103,0,0.4)]" : "glass-btn text-zinc-400"}`}>
                    {icon}
                </div>
            </div>
            <h2 className={`text-sm font-oswald font-bold transition-colors ${glow ? "text-[#FF6700] drop-shadow-[0_0_5px_rgba(255,103,0,0.4)]" : "text-white"}`}>{label}</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{sub}</p>
        </Link>
    );
}

// Reusable Menu Option
function MenuOption({ icon, label, onClick }) {
    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] text-zinc-400 hover:bg-[#252525] hover:text-white transition group">
            <div className="group-hover:text-[#FF6700] transition">{icon}</div>
            <span className="font-oswald text-sm">{label}</span>
        </button>
    )
}
