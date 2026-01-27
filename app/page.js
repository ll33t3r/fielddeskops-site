"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { useLiveBrain } from "../hooks/useLiveBrain";
import { useActiveJob } from "../hooks/useActiveJob";
import { 
  Calculator, Package, Camera, PenTool, Clock, ShieldAlert, 
  AlertTriangle, Wrench, Users, LogOut, Plus, Loader2, X, 
  FilePlus, Play, RefreshCw, Trash2, CheckCircle2,
  Sun, Moon, Eye, EyeOff, Search
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // --- THE BRAIN (NEW LOGIC) ---
  const { jobs, loading: brainLoading } = useLiveBrain();
  const { activeJob, setActiveJob } = useActiveJob();
  const [quickJobName, setQuickJobName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  // --- EXISTING STATE ---
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("HELLO");
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, alerts: 0 });
  const [theme, setTheme] = useState("dark");
  
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

  // --- NEW ACTIONS (BRAIN) ---
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

  const formatCurrency = (val) => {
    if (privacyMode) return "****";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  // --- EXISTING ACTIONS ---
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
    
    // Alert logic remains same
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

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="h-screen w-full bg-background text-foreground font-inter overflow-hidden flex flex-col relative selection:bg-[#FF6700] selection:text-black transition-colors duration-300">
      
      {/* HEADER */}
      <header className="px-5 pt-8 pb-4 shrink-0">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-[#FF6700] font-bold text-[10px] tracking-[0.2em] uppercase mb-1">FIELDDESKOPS</p>
                <h1 className="text-3xl font-oswald font-bold tracking-wide text-foreground">{greeting}.</h1>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setPrivacyMode(!privacyMode)} className="glass-btn p-2 rounded-full hover:text-[#FF6700] transition text-industrial-muted">
                    {privacyMode ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
                <button onClick={toggleTheme} className="glass-btn p-2 rounded-full hover:text-[#FF6700] transition text-industrial-muted">
                    {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
                </button>
                <button onClick={handleLogout} className="glass-btn p-2 rounded-full hover:bg-red-500/20 hover:text-red-500 transition text-industrial-muted">
                    <LogOut size={18}/>
                </button>
            </div>
        </div>

        {/* 1. ONE-TAP DISPATCH (NEW) */}
        <form onSubmit={handleCreateJob} className="relative mb-2 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6700]">
                {isCreating ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
            </div>
            <input 
                type="text" 
                placeholder="Start New Job..." 
                value={quickJobName}
                onChange={(e) => setQuickJobName(e.target.value)}
                className="w-full glass-panel bg-industrial-card border border-industrial-border rounded-xl py-3 pl-12 pr-4 text-base text-foreground placeholder:text-industrial-muted focus:outline-none focus:border-[#FF6700] focus:shadow-[0_0_20px_rgba(255,103,0,0.2)] transition-all"
            />
        </form>

        {/* 2. ACTIVE JOB INDICATOR (NEW) */}
        {activeJob ? (
           <div className="flex items-center justify-between bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-lg p-3 mb-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF6700] shadow-[0_0_10px_#FF6700] animate-pulse"></div>
                  <div>
                      <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider">ACTIVE MISSION</p>
                      <p className="font-oswald text-sm text-foreground tracking-wide">{activeJob.title}</p>
                  </div>
              </div>
              <button onClick={() => setActiveJob(null)} className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]"><X size={14}/></button>
           </div>
        ) : null}

        {/* METRICS BAR (EXISTING) */}
        <div className="grid grid-cols-3 gap-3">
            <div className="glass-panel rounded-xl p-3 text-center">
                <p className="text-[10px] text-industrial-muted uppercase font-bold tracking-wider">Revenue</p>
                <p className="text-[#22c55e] font-oswald text-lg tracking-tight">{formatCurrency(metrics.revenue)}</p>
            </div>
            <div className="glass-panel rounded-xl p-3 text-center">
                <p className="text-[10px] text-industrial-muted uppercase font-bold tracking-wider">Jobs</p>
                <p className="font-oswald text-lg tracking-tight text-foreground">{metrics.jobs}</p>
            </div>
            <button onClick={() => setShowAlerts(true)} className={`glass-panel rounded-xl p-3 text-center transition active:scale-95 relative ${metrics.alerts > 0 ? "border-red-500/50 bg-red-500/10" : ""}`}>
                {metrics.alerts > 0 && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                <p className="text-[10px] text-industrial-muted uppercase font-bold tracking-wider">System</p>
                <div className="flex items-center justify-center gap-1">
                    {metrics.alerts > 0 && <AlertTriangle size={14} className="text-red-500"/>}
                    <p className={`font-oswald text-lg tracking-tight ${metrics.alerts > 0 ? "text-red-500" : "text-industrial-muted"}`}>{metrics.alerts > 0 ? metrics.alerts : "OK"}</p>
                </div>
            </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto px-5 pb-32 custom-scrollbar">
         
         {/* 3. APPS GRID (EXISTING) */}
         <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-8">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Bids & Invoices" icon={<Calculator size={20}/>} active={activeJob} />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={20}/>} active={activeJob} />
            <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Photos" icon={<Camera size={20}/>} active={activeJob} />
            <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={20}/>} active={activeJob} />
            <AppCard href="/apps/crewclock" label="CREWCLOCK" sub="Timesheets" icon={<Clock size={20}/>} color="orange"/>
            <AppCard href="/apps/safetybrief" label="SAFETYBRIEF" sub="Compliance" icon={<ShieldAlert size={20}/>} />
            <AppCard href="/apps/toolshed" label="TOOLSHED" sub="Asset Tracker" icon={<Wrench size={20}/>} />
            <AppCard href="/apps/subhub" label="SUBHUB" sub="Subcontractors" icon={<Users size={20}/>} />
         </div>

         {/* 4. RECENT MISSIONS (NEW - FROM BRAIN) */}
         {jobs && jobs.length > 0 && (
             <div className="mb-8">
                <h2 className="text-xs font-bold text-industrial-muted uppercase tracking-widest mb-3 pl-1">RECENT MISSIONS</h2>
                <div className="space-y-2">
                    {jobs.slice(0, 5).map(job => (
                        <button 
                            key={job.id} 
                            onClick={() => setActiveJob(job)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700] shadow-[0_0_15px_rgba(255,103,0,0.1)]" : "glass-panel border-industrial-border hover:bg-industrial-card"}`}
                        >
                            <div className="text-left">
                                <p className={`font-oswald text-sm ${activeJob?.id === job.id ? "text-[#FF6700]" : "text-foreground"}`}>{job.title}</p>
                                <p className="text-[10px] text-industrial-muted">{new Date(job.created_at).toLocaleDateString()}</p>
                            </div>
                            {activeJob?.id === job.id && <Play size={14} className="text-[#FF6700] fill-[#FF6700]" />}
                        </button>
                    ))}
                </div>
             </div>
         )}
      </main>

      {/* SPEED DIAL (EXISTING) */}
      <div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-3">
        {showSpeedDial && (
            <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-10 fade-in duration-200">
                <Link href="/apps/profitlock" className="flex items-center gap-3">
                    <span className="glass-panel bg-industrial-card text-foreground text-xs px-2 py-1 rounded backdrop-blur shadow-md">New Bid</span>
                    <div className="w-10 h-10 rounded-full bg-industrial-card border border-industrial-border text-green-500 flex items-center justify-center shadow-lg"><FilePlus size={18}/></div>
                </Link>
                <Link href="/apps/loadout" className="flex items-center gap-3">
                    <span className="glass-panel bg-industrial-card text-foreground text-xs px-2 py-1 rounded backdrop-blur shadow-md">Add Item</span>
                    <div className="w-10 h-10 rounded-full bg-industrial-card border border-industrial-border text-blue-400 flex items-center justify-center shadow-lg"><Package size={18}/></div>
                </Link>
                <Link href="/apps/crewclock" className="flex items-center gap-3">
                    <span className="glass-panel bg-industrial-card text-foreground text-xs px-2 py-1 rounded backdrop-blur shadow-md">Clock In</span>
                    <div className="w-10 h-10 rounded-full bg-industrial-card border border-industrial-border text-orange-500 flex items-center justify-center shadow-lg"><Play size={18}/></div>
                </Link>
            </div>
        )}
        <button 
            onClick={() => setShowSpeedDial(!showSpeedDial)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,103,0,0.3)] transition-all duration-300 ${showSpeedDial ? "bg-background text-foreground rotate-45 border border-industrial-border" : "bg-[#FF6700] text-black hover:scale-110"}`}
        >
            <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>

      {/* ALERTS MODAL (EXISTING) */}
      {showAlerts && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="glass-panel bg-industrial-bg border-industrial-border w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-oswald text-xl flex items-center gap-2 text-foreground"><AlertTriangle className="text-[#FF6700]"/> SYSTEM ALERTS</h2>
                    <div className="flex gap-2">
                        <button onClick={manualRefresh} className="glass-btn p-2 rounded-lg hover:bg-white/10" disabled={refreshing}>
                            <RefreshCw size={18} className={refreshing ? "animate-spin text-[#FF6700]" : "text-industrial-muted"}/>
                        </button>
                        <button onClick={() => setShowAlerts(false)} className="glass-btn p-2 rounded-lg hover:bg-white/10 text-industrial-muted">
                            <X size={18}/>
                        </button>
                    </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {alertList.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2 opacity-50"/>
                            <p className="text-industrial-muted text-sm">All systems operational.</p>
                        </div>
                    ) : (
                        alertList.map((alert, i) => (
                            <div key={alert.id} className={`border-l-4 ${alert.border} ${alert.bg} p-3 rounded flex justify-between items-start group`}>
                                <div>
                                    <p className={`text-xs font-bold ${alert.color}`}>{alert.title}</p>
                                    <p className="text-sm text-foreground">{alert.msg}</p>
                                </div>
                                <button onClick={() => dismissAlert(i)} className="text-industrial-muted hover:text-foreground p-1"><X size={14}/></button>
                            </div>
                        ))
                    )}
                </div>
                {alertList.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-industrial-border flex gap-2">
                         <button onClick={clearAllAlerts} className="flex-1 bg-red-900/20 text-red-500 py-3 rounded-xl font-bold transition hover:bg-red-900/40 text-xs flex items-center justify-center gap-2">
                            <Trash2 size={14}/> CLEAR ALL
                        </button>
                         <button onClick={() => setShowAlerts(false)} className="flex-1 bg-industrial-card hover:bg-industrial-bg text-foreground py-3 rounded-xl font-bold transition text-xs border border-industrial-border">
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

// Reusable App Card (EXISTING)
function AppCard({ href, label, sub, icon, color, active }) {
    return (
        <Link href={href} className={`glass-panel p-4 rounded-xl hover:bg-industrial-card active:scale-95 transition-all group relative overflow-hidden ${active ? "border-[#FF6700] shadow-[0_0_15px_rgba(255,103,0,0.15)]" : ""}`}>
            <div className="absolute top-0 right-0 p-12 bg-gradient-to-br from-white/5 to-transparent rounded-full translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2.5 rounded-lg transition-colors ${color === "orange" ? "bg-[#FF6700] text-black" : "glass-btn text-industrial-muted group-hover:text-foreground group-hover:border-[#FF6700]/50"}`}>
                    {icon}
                </div>
            </div>
            <h2 className="text-sm font-oswald font-bold text-foreground group-hover:text-[#FF6700] transition-colors">{label}</h2>
            <p className="text-[10px] text-industrial-muted uppercase tracking-wide">{sub}</p>
        </Link>
    );
}
