"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { 
  Calculator, Package, Camera, PenTool, Clock, ShieldAlert, 
  AlertTriangle, Wrench, Users, LogOut, Plus, Loader2, X, 
  FilePlus, UserPlus, Play, RefreshCw, Trash2, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // STATE
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("HELLO");
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, alerts: 0 });
  
  // POPUPS
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertList, setAlertList] = useState([]); 
  const [refreshing, setRefreshing] = useState(false); // For the manual scan button

  useEffect(() => {
    // 1. Greeting Logic
    const h = new Date().getHours();
    setGreeting(h < 12 ? "GOOD MORNING" : h < 18 ? "GOOD AFTERNOON" : "GOOD EVENING");
    
    // 2. Initial Data Load
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth/login"); return; }

    // A. Revenue & Jobs
    const { data: bids } = await supabase.from("bids").select("sale_price");
    const revenue = bids ? bids.reduce((acc, b) => acc + (Number(b.sale_price) || 0), 0) : 0;
    const jobs = bids ? bids.length : 0;

    // B. Alerts (The Ghost Buster)
    const { data: inventory } = await supabase.from("inventory").select("name, quantity, min_quantity");
    const { data: subs } = await supabase.from("subcontractors").select("company_name, insurance_expiry");

    // Recalculate Stock Alerts (Live Data)
    const stockAlerts = inventory?.filter(i => i.quantity < i.min_quantity).map(i => ({ 
        id: "stock-" + Math.random(), 
        type: "STOCK", 
        title: "LOW STOCK",
        msg: `${i.name}: ${i.quantity} / ${i.min_quantity}`,
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500"
    })) || [];
    
    // Recalculate Sub Alerts (Live Data)
    const subAlerts = subs?.filter(s => s.insurance_expiry && new Date(s.insurance_expiry) < new Date()).map(s => ({ 
        id: "sub-" + Math.random(), 
        type: "INSURANCE", 
        title: "EXPIRED",
        msg: `${s.company_name} Ins. Expired`,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500"
    })) || [];

    const allAlerts = [...stockAlerts, ...subAlerts];
    setAlertList(allAlerts);
    setMetrics({ revenue, jobs, alerts: allAlerts.length });
    setLoading(false);
  };

  const manualRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 800); // Visual feedback delay
  };

  const dismissAlert = (index) => {
    const newAlerts = [...alertList];
    newAlerts.splice(index, 1);
    setAlertList(newAlerts);
    setMetrics(prev => ({ ...prev, alerts: newAlerts.length }));
  };

  const clearAllAlerts = () => {
    if(!confirm("Clear all alerts from the dashboard? (They will reappear if issues persist on next scan)")) return;
    setAlertList([]);
    setMetrics(prev => ({ ...prev, alerts: 0 }));
    setShowAlerts(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace("/auth/login"); };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter overflow-hidden flex flex-col relative selection:bg-[#FF6700] selection:text-black">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
        .font-oswald { font-family: "Oswald", sans-serif; }
        .glass-panel { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .glass-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(5px); }
      `}</style>

      {/* HEADER */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[#FF6700] font-bold text-[10px] tracking-[0.2em] uppercase mb-1">FIELDDESKOPS</p>
                <h1 className="text-3xl font-oswald font-bold text-white tracking-wide">{greeting}.</h1>
            </div>
            <button onClick={handleLogout} className="glass-btn p-2 rounded-full hover:bg-red-500/20 hover:text-red-500 transition"><LogOut size={18}/></button>
        </div>

        {/* METRICS BAR */}
        <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="glass-panel rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Revenue</p>
                <p className="text-[#22c55e] font-oswald text-lg tracking-tight">${metrics.revenue.toLocaleString()}</p>
            </div>
            <div className="glass-panel rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Jobs</p>
                <p className="text-white font-oswald text-lg tracking-tight">{metrics.jobs}</p>
            </div>
            <button onClick={() => setShowAlerts(true)} className={`glass-panel rounded-xl p-3 text-center transition active:scale-95 relative ${metrics.alerts > 0 ? "border-red-500/50 bg-red-500/10" : ""}`}>
                {metrics.alerts > 0 && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">System</p>
                <div className="flex items-center justify-center gap-1">
                    {metrics.alerts > 0 && <AlertTriangle size={14} className="text-red-500"/>}
                    <p className={`font-oswald text-lg tracking-tight ${metrics.alerts > 0 ? "text-red-500" : "text-gray-400"}`}>{metrics.alerts > 0 ? metrics.alerts + " ALERTS" : "OK"}</p>
                </div>
            </button>
        </div>
      </header>

      {/* APPS GRID */}
      <main className="flex-1 overflow-y-auto px-5 pb-32 custom-scrollbar">
         <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Bids & Invoices" icon={<Calculator size={20}/>} />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={20}/>} />
            <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Photos" icon={<Camera size={20}/>} />
            <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={20}/>} />
            <AppCard href="/apps/crewclock" label="CREWCLOCK" sub="Timesheets" icon={<Clock size={20}/>} color="orange"/>
            <AppCard href="/apps/safetybrief" label="SAFETYBRIEF" sub="Compliance" icon={<ShieldAlert size={20}/>} />
            <AppCard href="/apps/toolshed" label="TOOLSHED" sub="Asset Tracker" icon={<Wrench size={20}/>} />
            <AppCard href="/apps/subhub" label="SUBHUB" sub="Subcontractors" icon={<Users size={20}/>} />
         </div>
      </main>

      {/* SPEED DIAL (FAB) */}
      <div className="fixed bottom-8 right-6 z-50 flex flex-col items-end gap-3">
        {showSpeedDial && (
            <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-10 fade-in duration-200">
                <Link href="/apps/profitlock" className="flex items-center gap-3">
                    <span className="bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur">New Bid</span>
                    <div className="w-10 h-10 rounded-full bg-[#262626] border border-[#404040] text-green-500 flex items-center justify-center shadow-lg"><FilePlus size={18}/></div>
                </Link>
                <Link href="/apps/loadout" className="flex items-center gap-3">
                    <span className="bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur">Add Item</span>
                    <div className="w-10 h-10 rounded-full bg-[#262626] border border-[#404040] text-blue-400 flex items-center justify-center shadow-lg"><Package size={18}/></div>
                </Link>
                <Link href="/apps/crewclock" className="flex items-center gap-3">
                    <span className="bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur">Clock In</span>
                    <div className="w-10 h-10 rounded-full bg-[#262626] border border-[#404040] text-orange-500 flex items-center justify-center shadow-lg"><Play size={18}/></div>
                </Link>
            </div>
        )}
        <button 
            onClick={() => setShowSpeedDial(!showSpeedDial)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,103,0,0.3)] transition-all duration-300 ${showSpeedDial ? "bg-white text-black rotate-45" : "bg-[#FF6700] text-black hover:scale-110"}`}
        >
            <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>

      {/* ALERTS MODAL */}
      {showAlerts && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-oswald text-xl flex items-center gap-2"><AlertTriangle className="text-[#FF6700]"/> SYSTEM ALERTS</h2>
                    <div className="flex gap-2">
                        <button onClick={manualRefresh} className="glass-btn p-2 rounded-lg hover:bg-white/10" disabled={refreshing}>
                            <RefreshCw size={18} className={refreshing ? "animate-spin text-[#FF6700]" : "text-gray-400"}/>
                        </button>
                        <button onClick={() => setShowAlerts(false)} className="glass-btn p-2 rounded-lg hover:bg-white/10 text-gray-400">
                            <X size={18}/>
                        </button>
                    </div>
                </div>
                
                {/* Alert List */}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {alertList.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2 opacity-50"/>
                            <p className="text-gray-500 text-sm">All systems operational.</p>
                        </div>
                    ) : (
                        alertList.map((alert, i) => (
                            <div key={alert.id} className={`border-l-4 ${alert.border} ${alert.bg} p-3 rounded flex justify-between items-start group`}>
                                <div>
                                    <p className={`text-xs font-bold ${alert.color}`}>{alert.title}</p>
                                    <p className="text-sm text-gray-200">{alert.msg}</p>
                                </div>
                                <button onClick={() => dismissAlert(i)} className="text-gray-500 hover:text-white p-1">
                                    <X size={14}/>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Actions */}
                {alertList.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                         <button onClick={clearAllAlerts} className="flex-1 bg-red-900/20 text-red-500 py-3 rounded-xl font-bold transition hover:bg-red-900/40 text-xs flex items-center justify-center gap-2">
                            <Trash2 size={14}/> CLEAR ALL
                        </button>
                         <button onClick={() => setShowAlerts(false)} className="flex-1 bg-[#333] hover:bg-white hover:text-black py-3 rounded-xl font-bold transition text-xs">
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

// Reusable Card Component
function AppCard({ href, label, sub, icon, color }) {
    return (
        <Link href={href} className="glass-panel p-4 rounded-xl hover:bg-white/5 active:scale-95 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 bg-gradient-to-br from-white/5 to-transparent rounded-full translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500 pointer-events-none"></div>
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2.5 rounded-lg transition-colors ${color === "orange" ? "bg-[#FF6700] text-black" : "glass-btn text-gray-300 group-hover:text-white group-hover:border-[#FF6700]/50"}`}>
                    {icon}
                </div>
            </div>
            <h2 className="text-sm font-oswald font-bold text-gray-200 group-hover:text-[#FF6700] transition-colors">{label}</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{sub}</p>
        </Link>
    );
}
