"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { 
  Calculator, Package, Camera, PenTool, 
  LogOut, Sun, Moon, Loader2, AlertTriangle, CheckCircle2,
  X, ChevronRight, Users, Menu, Clock, Wallet, Briefcase, Activity, Plus, Truck, UserPlus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [time, setTime] = useState("");
  const [greeting, setGreeting] = useState("WELCOME");
  
  // Data State
  const [metrics, setMetrics] = useState({ revenue: 0, profit: 0, jobs: 0, alerts: 0 });
  const [activeJobs, setActiveJobs] = useState([]);
  const [alertList, setAlertList] = useState([]);
  const [financials, setFinancials] = useState({ income: 0, expense: 0 });

  // UI State
  const [activeDrawer, setActiveDrawer] = useState(null); 
  const [adminTab, setAdminTab] = useState("JOB"); // JOB, CREW, VAN, CUSTOMER
  
  // Forms
  const [creating, setCreating] = useState(false);
  const [newJob, setNewJob] = useState({ name: "", client: "" });
  const [newWorker, setNewWorker] = useState({ name: "", role: "Tech" });
  const [newVan, setNewVan] = useState({ name: "", plate: "" });

  // --- INIT ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      const h = now.getHours();
      setGreeting(h < 12 ? "GOOD MORNING" : h < 18 ? "GOOD AFTERNOON" : "GOOD EVENING");
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    loadCommandData();
    return () => clearInterval(interval);
  }, []);

  const loadCommandData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/auth/login"); return; }
    setUser(user);

    const { data: jobs } = await supabase.from("jobs").select("*").eq("status", "ACTIVE").order("updated_at", { ascending: false });
    const { data: bids } = await supabase.from("bids").select("sale_price, material_cost, status");
    
    let income = 0, expense = 0, badBids = 0;
    if (bids) {
        bids.forEach(b => {
            if (b.status !== "REJECTED") {
                income += (Number(b.sale_price) || 0);
                expense += (Number(b.material_cost) || 0);
            } else badBids++;
        });
    }

    const { data: inventory } = await supabase.from("inventory").select("name, quantity, min_quantity");
    const { data: drafts } = await supabase.from("contracts").select("project_name, created_at").eq("status", "DRAFT");
    
    let alerts = [];
    if (inventory) inventory.forEach(i => { if (i.quantity <= (i.min_quantity || 3)) alerts.push({ type: "STOCK", msg: `Low: ${i.name}`, link: "/apps/loadout", severity: "high" }); });
    if (drafts) {
        const yesterday = new Date(Date.now() - 86400000);
        drafts.forEach(d => { if (new Date(d.created_at) < yesterday) alerts.push({ type: "DRAFT", msg: `Stale: ${d.project_name}`, link: "/apps/signoff", severity: "med" }); });
    }
    if (badBids > 0) alerts.push({ type: "BID", msg: `${badBids} Rejected Bids`, link: "/apps/profitlock", severity: "high" });

    setActiveJobs(jobs || []);
    setAlertList(alerts);
    setFinancials({ income, expense });
    setMetrics({ revenue: income, profit: income - expense, jobs: jobs?.length || 0, alerts: alerts.length });
    setLoading(false);
  };

  // --- CREATION HANDLERS ---
  const handleCreateJob = async () => {
      if (!newJob.name) return;
      setCreating(true);
      const { error } = await supabase.from("jobs").insert({ user_id: user.id, job_name: newJob.name.toUpperCase(), customer_name: newJob.client, status: "ACTIVE" });
      if (!error) { 
          loadCommandData(); 
          setNewJob({ name: "", client: "" }); 
          alert("Job Dispatched"); 
      } else alert("Error creating job.");
      setCreating(false);
  };

  const handleCreateWorker = async () => {
      if (!newWorker.name) return;
      setCreating(true);
      const { error } = await supabase.from("crew").insert({ user_id: user.id, name: newWorker.name, role: newWorker.role });
      if (!error) { setNewWorker({ name: "", role: "Tech" }); alert("Worker Added"); }
      setCreating(false);
  };

  const handleCreateVan = async () => {
      if (!newVan.name) return;
      setCreating(true);
      const { error } = await supabase.from("vans").insert({ user_id: user.id, name: newVan.name, plate_number: newVan.plate });
      if (!error) { setNewVan({ name: "", plate: "" }); alert("Van Added"); }
      setCreating(false);
  };

  const completeJob = async (jobId) => {
      await supabase.from("jobs").update({ status: "COMPLETED" }).eq("id", jobId);
      setActiveJobs(activeJobs.filter(j => j.id !== jobId));
      setMetrics({...metrics, jobs: metrics.jobs - 1});
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace("/auth/login"); };
  
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  if (loading) return <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="h-screen flex flex-col relative selection:bg-[#FF6700] selection:text-black bg-[var(--bg-main)] overflow-hidden font-inter text-[var(--text-main)]">
      
      {/* --- HUD HEADER --- */}
      <header className="px-6 pt-6 pb-2 shrink-0 z-10 relative">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[#FF6700] font-black text-[10px] tracking-[0.3em] uppercase mb-1 animate-pulse">FIELDDESKOPS</p>
                <div className="flex items-end gap-3">
                    <h1 className="text-3xl font-oswald font-bold tracking-tighter uppercase text-[var(--text-main)] leading-none">
                        <span className="text-[#FF6700]">COMMAND</span>CENTER
                    </h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-lg text-zinc-400 font-bold uppercase tracking-wide">{greeting}, {user?.email?.split("@")[0]}</p>
                    <span className="text-[10px] font-mono text-zinc-600 font-bold tracking-widest pt-1">{time}</span>
                </div>
            </div>
            
            <button onClick={() => setActiveDrawer("SETTINGS")} className="industrial-card p-3 rounded-xl bg-[#FF6700] text-black shadow-[0_0_15px_rgba(255,103,0,0.4)] hover:scale-105 transition-transform active:scale-95">
                <Menu size={24} strokeWidth={3} />
            </button>
        </div>

        {/* --- METRIC TILES --- */}
        <div className="grid grid-cols-3 gap-3 mt-6">
            <button onClick={() => setActiveDrawer("FINANCE")} className={`industrial-card rounded-xl p-3 text-center border-2 transition-all relative overflow-hidden group ${metrics.profit < 0 ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse" : "border-transparent hover:border-green-500/50"}`}>
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">NET REVENUE</p>
                <p className={`text-lg font-black tracking-tighter ${metrics.profit >= 0 ? "text-green-500" : "text-red-500"}`}>${metrics.profit.toLocaleString()}</p>
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"/>
            </button>

            <button onClick={() => setActiveDrawer("JOBS")} className="industrial-card rounded-xl p-3 text-center border-2 border-transparent hover:border-[#FF6700]/50 transition-all relative overflow-hidden group">
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">ACTIVE OPS</p>
                <p className="text-lg font-black tracking-tighter text-[var(--text-main)]">{metrics.jobs}</p>
                <div className="absolute inset-0 bg-[#FF6700]/5 opacity-0 group-hover:opacity-100 transition-opacity"/>
            </button>

            <button onClick={() => setActiveDrawer("ALERTS")} className={`industrial-card rounded-xl p-3 text-center border-2 transition-all relative overflow-hidden ${metrics.alerts > 0 ? "border-red-500/50 bg-red-900/10" : "border-transparent opacity-60"}`}>
                <p className={`text-[9px] uppercase font-black tracking-widest mb-1 ${metrics.alerts > 0 ? "text-red-500" : "text-zinc-500"}`}>SYSTEM</p>
                <div className="flex items-center justify-center gap-2">
                    {metrics.alerts > 0 ? <AlertTriangle size={18} className="text-red-500 animate-pulse"/> : <CheckCircle2 size={18} className="text-zinc-600"/>}
                    <span className={`text-lg font-black ${metrics.alerts > 0 ? "text-red-500" : "text-zinc-600"}`}>{metrics.alerts > 0 ? metrics.alerts : "OK"}</span>
                </div>
            </button>
        </div>
      </header>

      {/* --- APP GRID --- */}
      <main className="flex-1 p-6 min-h-0 pt-2">
         <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full w-full max-w-2xl mx-auto">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Estimates" icon={<Calculator size={32}/>} color="text-green-500" status={metrics.profit < 0 ? "red" : "green"} />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={32}/>} color="text-blue-500" status={alertList.find(a => a.type === "STOCK") ? "red" : "green"} />
            <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Evidence" icon={<Camera size={32}/>} color="text-purple-500" status="green" />
            <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={32}/>} color="text-[#FF6700]" status={alertList.find(a => a.type === "DRAFT") ? "yellow" : "green"} />
         </div>
      </main>

      {/* --- DRAWERS --- */}
      
      {/* 1. JOB LIST DRAWER (View Only) */}
      {activeDrawer === "JOBS" && (
        <Drawer title="MISSION CONTROL" close={() => setActiveDrawer(null)}>
            <div className="space-y-4">
                {activeJobs.length === 0 ? <p className="text-center text-zinc-500 text-xs font-bold py-10">NO ACTIVE OPS</p> : activeJobs.map(job => (
                    <div key={job.id} className="industrial-card p-4 rounded-xl border border-[var(--border-color)] flex justify-between items-center group">
                        <div>
                            <h3 className="font-black text-[#FF6700] uppercase text-sm">{job.job_name}</h3>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">{job.customer_name || "NO CLIENT ASSIGNED"}</p>
                        </div>
                        <button onClick={() => completeJob(job.id)} className="px-3 py-2 bg-zinc-800 text-zinc-400 text-[9px] font-black rounded hover:bg-green-600 hover:text-white transition uppercase">Complete</button>
                    </div>
                ))}
            </div>
        </Drawer>
      )}

      {/* 2. SETTINGS / ADMIN DRAWER (Create Resources) */}
      {activeDrawer === "SETTINGS" && (
        <Drawer title="ADMIN CONSOLE" close={() => setActiveDrawer(null)}>
            <div className="flex border-b border-[var(--border-color)] mb-6">
                {["JOB", "CREW", "VAN"].map(tab => (
                    <button key={tab} onClick={() => setAdminTab(tab)} className={`flex-1 pb-3 font-black text-[10px] tracking-widest ${adminTab === tab ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-500"}`}>{tab}</button>
                ))}
            </div>

            <div className="space-y-6">
                {adminTab === "JOB" && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-xl bg-[#FF6700]/5 border border-[#FF6700]/30 space-y-3">
                            <h3 className="text-[#FF6700] font-black text-xs uppercase">Dispatch New Job</h3>
                            <input placeholder="JOB NAME (E.G. 101 MAPLE)" value={newJob.name} onChange={e => setNewJob({...newJob, name: e.target.value.toUpperCase()})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <input placeholder="CLIENT NAME" value={newJob.client} onChange={e => setNewJob({...newJob, client: e.target.value})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <button onClick={handleCreateJob} disabled={creating} className="w-full bg-[#FF6700] text-black font-black py-3 rounded-lg text-xs uppercase flex justify-center">{creating ? <Loader2 className="animate-spin"/> : "CREATE JOB"}</button>
                        </div>
                    </div>
                )}

                {adminTab === "CREW" && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/30 space-y-3">
                            <h3 className="text-blue-500 font-black text-xs uppercase">Add Personnel</h3>
                            <input placeholder="WORKER NAME" value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <button onClick={handleCreateWorker} disabled={creating} className="w-full bg-blue-600 text-white font-black py-3 rounded-lg text-xs uppercase flex justify-center">{creating ? <Loader2 className="animate-spin"/> : "ADD WORKER"}</button>
                        </div>
                    </div>
                )}

                {adminTab === "VAN" && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/30 space-y-3">
                            <h3 className="text-purple-500 font-black text-xs uppercase">Register Vehicle</h3>
                            <input placeholder="VAN ID (E.G. VAN-04)" value={newVan.name} onChange={e => setNewVan({...newVan, name: e.target.value.toUpperCase()})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <input placeholder="LICENSE PLATE" value={newVan.plate} onChange={e => setNewVan({...newVan, plate: e.target.value.toUpperCase()})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <button onClick={handleCreateVan} disabled={creating} className="w-full bg-purple-600 text-white font-black py-3 rounded-lg text-xs uppercase flex justify-center">{creating ? <Loader2 className="animate-spin"/> : "ADD VAN"}</button>
                        </div>
                    </div>
                )}

                <div className="pt-8 border-t border-[var(--border-color)]">
                    <button onClick={toggleTheme} className="w-full flex justify-between items-center p-4 industrial-card rounded-xl border border-[var(--border-color)] hover:border-[#FF6700] transition mb-4">
                        <div className="flex items-center gap-3"><Sun size={18}/><span className="text-xs font-bold">Theme Mode</span></div>
                        <span className="text-[9px] font-black uppercase bg-zinc-800 text-white px-2 py-1 rounded">TOGGLE</span>
                    </button>
                    <button onClick={handleLogout} className="w-full py-4 bg-red-600/10 text-red-500 font-black text-xs rounded-xl border border-red-900/30 hover:bg-red-600 hover:text-white transition uppercase">Log Out</button>
                </div>
            </div>
        </Drawer>
      )}

      {/* 3. ALERTS & FINANCE DRAWERS (UNCHANGED) */}
      {activeDrawer === "ALERTS" && (
        <Drawer title="SYSTEM ALERTS" close={() => setActiveDrawer(null)}>
            <div className="space-y-3">
                {alertList.length === 0 ? <div className="text-center py-10"><CheckCircle2 className="mx-auto mb-2 text-green-600" size={40}/><p className="text-xs font-black text-zinc-500">ALL SYSTEMS NOMINAL</p></div> : alertList.map((alert, i) => (
                    <Link href={alert.link} key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${alert.severity === "high" ? "bg-red-900/10 border-red-900/50" : "bg-yellow-900/10 border-yellow-900/30"}`}>
                        <AlertTriangle className={alert.severity === "high" ? "text-red-500" : "text-yellow-500"} size={20} />
                        <div><p className="text-[10px] font-black uppercase opacity-60">{alert.type}</p><p className="text-xs font-bold">{alert.msg}</p></div>
                        <ChevronRight className="ml-auto opacity-50" size={16}/>
                    </Link>
                ))}
            </div>
        </Drawer>
      )}
      
      {activeDrawer === "FINANCE" && (
        <Drawer title="FINANCIAL INTEL" close={() => setActiveDrawer(null)}>
            <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <p className="text-xs font-black text-zinc-500 uppercase mb-2">Net Profit Margin</p>
                <p className={`text-4xl font-oswald font-bold ${metrics.profit >= 0 ? "text-[#FF6700]" : "text-red-500"}`}>${metrics.profit.toLocaleString()}</p>
            </div>
        </Drawer>
      )}

    </div>
  );
}

// --- SUBCOMPONENTS ---

function AppCard({ href, label, sub, icon, color, status }) {
    return (
        <Link href={href} className="industrial-card flex flex-col items-center justify-center text-center rounded-2xl transition-all duration-300 group relative overflow-hidden hover:bg-[var(--bg-card)]/80 active:scale-95 border-2 border-transparent hover:border-zinc-700">
            <div className="absolute top-3 right-3"><div className={`w-2 h-2 rounded-full ${status === "red" ? "bg-red-500 animate-pulse" : status === "yellow" ? "bg-yellow-500" : "bg-green-500/30"}`}></div></div>
            <div className={`mb-3 p-4 rounded-full bg-black/5 dark:bg-white/5 ${color} group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
            <h2 className="text-lg md:text-2xl font-black tracking-wider mb-1 group-hover:text-[var(--text-main)] transition-colors">{label}</h2>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{sub}</p>
        </Link>
    );
}

function Drawer({ title, close, children }) {
    return (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />
            <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-[var(--bg-main)] border-l border-[var(--border-color)] p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-[var(--text-main)]">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--border-color)]">
                    <h2 className="text-2xl font-oswald font-bold text-[#FF6700] tracking-wide uppercase">{title}</h2>
                    <button onClick={close} className="p-2 hover:bg-zinc-800 rounded-full transition"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
}
