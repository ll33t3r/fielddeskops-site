"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { useLiveBrain } from "../hooks/useLiveBrain";
import { useActiveJob } from "../hooks/useActiveJob";
import { 
  Calculator, Package, Camera, PenTool, Clock, ShieldAlert, 
  AlertTriangle, Wrench, Users, LogOut, Plus, Loader2, X, 
  FilePlus, Play, RefreshCw, Trash2, CheckCircle2,
  Sun, Moon, Eye, EyeOff, Menu
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

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("HELLO");
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, alerts: 0 });
  const [theme, setTheme] = useState("dark");
  
  // MODALS
  const [showHamburger, setShowHamburger] = useState(false);
  const [showSpeedDial, setShowSpeedDial] = useState(false);
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

  const formatCurrency = (val) => {
    if (privacyMode) return "****";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
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
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace("/auth/login"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="h-screen w-full bg-background text-foreground font-inter overflow-hidden flex flex-col relative selection:bg-[#FF6700] selection:text-black transition-colors duration-300">
      
      {/* MINIMAL HEADER */}
      <header className="px-5 pt-8 pb-4 shrink-0">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-[#FF6700] font-bold text-[10px] tracking-[0.2em] uppercase mb-1">FIELDDESKOPS</p>
                <h1 className="text-3xl font-oswald font-bold tracking-wide text-foreground">{greeting}.</h1>
            </div>
            
            {/* HAMBURGER BUTTON (Orange Glow) */}
            <button 
              onClick={() => setShowHamburger(true)} 
              className="p-3 rounded-xl bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.6)] active:scale-95 transition-all"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
        </div>

        {/* QUICK JOB INPUT */}
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

        {/* ACTIVE JOB INDICATOR */}
        {activeJob && (
           <div className="flex items-center justify-between bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-lg p-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF6700] shadow-[0_0_10px_#FF6700] animate-pulse"></div>
                  <div>
                      <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider">ACTIVE MISSION</p>
                      <p className="font-oswald text-sm text-foreground tracking-wide">{activeJob.title}</p>
                  </div>
              </div>
              <button onClick={() => setActiveJob(null)} className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]"><X size={14}/></button>
           </div>
        )}
      </header>

      {/* MAIN CONTENT - APPS GRID ONLY */}
      <main className="flex-1 overflow-y-auto px-5 pb-32 custom-scrollbar">
         <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Bids & Invoices" icon={<Calculator size={20}/>} active={activeJob} />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={20}/>} active={activeJob} />
            <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Photos" icon={<Camera size={20}/>} active={activeJob} />
            <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={20}/>} active={activeJob} />
         </div>
      </main>

      {/* SPEED DIAL (Bottom Right) */}
      <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-3">
        {showSpeedDial && (
            <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-10 fade-in duration-200">
                <Link href="/apps/profitlock" className="flex items-center gap-3" onClick={() => setShowSpeedDial(false)}>
                    <span className="glass-panel bg-industrial-card text-foreground text-xs px-2 py-1 rounded backdrop-blur shadow-md">New Bid</span>
                    <div className="w-10 h-10 rounded-full bg-industrial-card border border-industrial-border text-green-500 flex items-center justify-center shadow-lg"><FilePlus size={18}/></div>
                </Link>
                <Link href="/apps/loadout" className="flex items-center gap-3" onClick={() => setShowSpeedDial(false)}>
                    <span className="glass-panel bg-industrial-card text-foreground text-xs px-2 py-1 rounded backdrop-blur shadow-md">Add Item</span>
                    <div className="w-10 h-10 rounded-full bg-industrial-card border border-industrial-border text-blue-400 flex items-center justify-center shadow-lg"><Package size={18}/></div>
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

      {/* HAMBURGER MENU (Slide-in from Right) */}
      {showHamburger && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowHamburger(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] z-50 glass-panel bg-industrial-bg border-l border-industrial-border shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            
            {/* Header */}
            <div className="sticky top-0 bg-industrial-bg border-b border-industrial-border p-5 flex justify-between items-center">
              <h2 className="font-oswald text-xl text-[#FF6700]">COMMAND MENU</h2>
              <button onClick={() => setShowHamburger(false)} className="p-2 hover:bg-white/10 rounded-lg text-industrial-muted transition">
                <X size={20}/>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6">
              
              {/* METRICS */}
              <div>
                <h3 className="text-xs font-bold text-industrial-muted uppercase tracking-widest mb-3">METRICS</h3>
                <div className="space-y-2">
                  <div className="glass-panel rounded-lg p-3 flex justify-between items-center">
                    <span className="text-xs text-industrial-muted uppercase">Revenue</span>
                    <span className="text-[#22c55e] font-oswald text-lg">{formatCurrency(metrics.revenue)}</span>
                  </div>
                  <div className="glass-panel rounded-lg p-3 flex justify-between items-center">
                    <span className="text-xs text-industrial-muted uppercase">Jobs</span>
                    <span className="font-oswald text-lg text-foreground">{metrics.jobs}</span>
                  </div>
                  <div className={`glass-panel rounded-lg p-3 flex justify-between items-center ${metrics.alerts > 0 ? "border-red-500/50 bg-red-500/10" : ""}`}>
                    <span className="text-xs text-industrial-muted uppercase">System</span>
                    <div className="flex items-center gap-2">
                      {metrics.alerts > 0 && <AlertTriangle size={14} className="text-red-500"/>}
                      <span className={`font-oswald text-lg ${metrics.alerts > 0 ? "text-red-500" : "text-foreground"}`}>{metrics.alerts > 0 ? metrics.alerts : "OK"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ALERTS */}
              {alertList.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-industrial-muted uppercase tracking-widest">ALERTS</h3>
                    <button onClick={clearAllAlerts} className="text-[10px] text-red-500 hover:underline">Clear All</button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alertList.map((alert, i) => (
                      <div key={alert.id} className={`border-l-4 ${alert.border} ${alert.bg} p-2 rounded flex justify-between items-start text-sm`}>
                        <div>
                          <p className={`text-[10px] font-bold ${alert.color}`}>{alert.title}</p>
                          <p className="text-xs text-foreground">{alert.msg}</p>
                        </div>
                        <button onClick={() => dismissAlert(i)} className="text-industrial-muted hover:text-foreground p-1"><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT MISSIONS */}
              {jobs && jobs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-industrial-muted uppercase tracking-widest mb-3">RECENT MISSIONS</h3>
                  <div className="space-y-2">
                    {jobs.slice(0, 5).map(job => (
                      <button 
                        key={job.id} 
                        onClick={() => { setActiveJob(job); setShowHamburger(false); }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700]" : "glass-panel border-industrial-border hover:bg-industrial-card"}`}
                      >
                        <p className={`font-oswald text-sm ${activeJob?.id === job.id ? "text-[#FF6700]" : "text-foreground"}`}>{job.title}</p>
                        <p className="text-[10px] text-industrial-muted">{new Date(job.created_at).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CONTROLS */}
              <div className="border-t border-industrial-border pt-6 space-y-3">
                <h3 className="text-xs font-bold text-industrial-muted uppercase tracking-widest mb-3">SETTINGS</h3>
                
                <button 
                  onClick={() => setPrivacyMode(!privacyMode)} 
                  className="w-full glass-panel p-3 rounded-lg flex items-center justify-between hover:bg-industrial-card transition"
                >
                  <div className="flex items-center gap-3">
                    {privacyMode ? <EyeOff size={18} className="text-[#FF6700]"/> : <Eye size={18} className="text-industrial-muted"/>}
                    <span className="text-sm font-bold text-foreground">Privacy Mode</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${privacyMode ? "bg-[#FF6700]" : "bg-industrial-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-black m-0.5 transition-transform ${privacyMode ? "translate-x-5" : ""}`}></div>
                  </div>
                </button>

                <button 
                  onClick={toggleTheme} 
                  className="w-full glass-panel p-3 rounded-lg flex items-center justify-between hover:bg-industrial-card transition"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon size={18} className="text-[#FF6700]"/> : <Sun size={18} className="text-industrial-muted"/>}
                    <span className="text-sm font-bold text-foreground">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${theme === 'dark' ? "bg-[#FF6700]" : "bg-industrial-muted"}`}>
                    <div className={`w-4 h-4 rounded-full bg-black m-0.5 transition-transform ${theme === 'dark' ? "translate-x-5" : ""}`}></div>
                  </div>
                </button>

                <button 
                  onClick={manualRefresh} 
                  disabled={refreshing}
                  className="w-full glass-panel p-3 rounded-lg flex items-center gap-3 hover:bg-industrial-card transition"
                >
                  <RefreshCw size={18} className={refreshing ? "animate-spin text-[#FF6700]" : "text-industrial-muted"}/>
                  <span className="text-sm font-bold text-foreground">Refresh Data</span>
                </button>

                <button 
                  onClick={handleLogout} 
                  className="w-full bg-red-900/20 border border-red-500/30 text-red-500 p-3 rounded-lg flex items-center gap-3 hover:bg-red-900/40 transition font-bold"
                >
                  <LogOut size={18}/>
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// Reusable App Card
function AppCard({ href, label, sub, icon, active }) {
    return (
        <Link href={href} className={`glass-panel p-4 rounded-xl hover:bg-industrial-card active:scale-95 transition-all group relative overflow-hidden ${active ? "border-[#FF6700] shadow-[0_0_15px_rgba(255,103,0,0.15)]" : ""}`}>
            <div className="absolute top-0 right-0 p-12 bg-gradient-to-br from-white/5 to-transparent rounded-full translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="p-2.5 rounded-lg glass-btn text-industrial-muted group-hover:text-foreground group-hover:border-[#FF6700]/50 transition-colors">
                    {icon}
                </div>
            </div>
            <h2 className="text-sm font-oswald font-bold text-foreground group-hover:text-[#FF6700] transition-colors">{label}</h2>
            <p className="text-[10px] text-industrial-muted uppercase tracking-wide">{sub}</p>
        </Link>
    );
}
