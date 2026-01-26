"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { 
  Calculator, Package, Camera, PenTool, 
  LogOut, Sun, Moon, Loader2, AlertTriangle, CheckCircle2,
  X, ChevronRight, Users, Menu, Clock, Wallet, Briefcase, Activity, Plus, Truck, Trash2, User as UserIcon
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
  const [crewList, setCrewList] = useState([]);
  const [vanList, setVanList] = useState([]);
  const [alertList, setAlertList] = useState([]);
  const [financials, setFinancials] = useState({ income: 0, expense: 0 });

  // UI State
  const [activeDrawer, setActiveDrawer] = useState(null); 
  const [adminTab, setAdminTab] = useState("JOB"); 
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Forms
  const [newJobData, setNewJobData] = useState({ name: "", client: "" });
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

    // 1. FETCH ALL RESOURCES
    const { data: jobs } = await supabase.from("jobs").select("*").order("updated_at", { ascending: false });
    const { data: crew } = await supabase.from("crew").select("*").order("created_at", { ascending: false });
    const { data: vans } = await supabase.from("vans").select("*").order("created_at", { ascending: false });
    const { data: bids } = await supabase.from("bids").select("sale_price, material_cost, status");
    const { data: inventory } = await supabase.from("inventory").select("name, quantity, min_quantity");
    const { data: drafts } = await supabase.from("contracts").select("project_name, created_at").eq("status", "DRAFT");

    // 2. PROCESS FINANCIALS
    let income = 0, expense = 0, badBids = 0;
    if (bids) {
        bids.forEach(b => {
            if (b.status !== "REJECTED") {
                income += (Number(b.sale_price) || 0);
                expense += (Number(b.material_cost) || 0);
            } else badBids++;
        });
    }

    // 3. PROCESS ALERTS
    let alerts = [];
    if (inventory) inventory.forEach(i => { if (i.quantity <= (i.min_quantity || 3)) alerts.push({ type: "STOCK", msg: `Low: ${i.name}`, link: "/apps/loadout", severity: "high" }); });
    if (drafts) {
        const yesterday = new Date(Date.now() - 86400000);
        drafts.forEach(d => { if (new Date(d.created_at) < yesterday) alerts.push({ type: "DRAFT", msg: `Stale: ${d.project_name}`, link: "/apps/signoff", severity: "med" }); });
    }
    if (badBids > 0) alerts.push({ type: "BID", msg: `${badBids} Rejected Bids`, link: "/apps/profitlock", severity: "high" });

    // 4. SET STATE
    setActiveJobs(jobs || []);
    setCrewList(crew || []);
    setVanList(vans || []);
    setAlertList(alerts);
    setFinancials({ income, expense });
    setMetrics({ 
        revenue: income, 
        profit: income - expense, 
        jobs: jobs?.filter(j => j.status === 'ACTIVE').length || 0, 
        alerts: alerts.length 
    });
    setLoading(false);
  };

  // --- ACTIONS ---

  const handleCreateJob = async () => {
      if (!newJobData.name) return;
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("jobs").insert({
          user_id: user.id,
          job_name: newJobData.name.toUpperCase(),
          customer_name: newJobData.client,
          status: "ACTIVE"
      }).select().single();

      setCreating(false);
      if (!error && data) {
          setActiveJobs([data, ...activeJobs]);
          setMetrics({...metrics, jobs: metrics.jobs + 1});
          setShowNewJobModal(false);
          setNewJobData({ name: "", client: "" });
      } else {
          alert("Error creating job. Check DB policies.");
      }
  };

  const handleCreateWorker = async () => {
      if (!newWorker.name) return;
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("crew").insert({ 
          user_id: user.id, name: newWorker.name, role: newWorker.role 
      }).select().single();
      
      setCreating(false);
      if (!error && data) {
          setCrewList([data, ...crewList]);
          setNewWorker({ name: "", role: "Tech" });
      } else {
          alert("Error adding worker.");
      }
  };

  const handleCreateVan = async () => {
      if (!newVan.name) return;
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("vans").insert({ 
          user_id: user.id, name: newVan.name, plate_number: newVan.plate 
      }).select().single();

      setCreating(false);
      if (!error && data) {
          setVanList([data, ...vanList]);
          setNewVan({ name: "", plate: "" });
      } else {
          alert("Error adding van.");
      }
  };

  const deleteResource = async (table, id) => {
      if(!confirm("Delete this item?")) return;
      await supabase.from(table).delete().eq("id", id);
      if (table === 'crew') setCrewList(crewList.filter(c => c.id !== id));
      if (table === 'vans') setVanList(vanList.filter(v => v.id !== id));
      if (table === 'jobs') setActiveJobs(activeJobs.filter(j => j.id !== id));
  };

  const completeJob = async (jobId) => {
      await supabase.from("jobs").update({ status: "COMPLETED" }).eq("id", jobId);
      // We update local state to reflect completion without removing it from history view entirely if we want
      setActiveJobs(activeJobs.map(j => j.id === jobId ? {...j, status: 'COMPLETED'} : j));
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
                <div className="flex items-baseline gap-2">
                    <h1 className="text-3xl font-oswald font-bold tracking-tighter uppercase text-[var(--text-main)]">
                        <span className="text-[#FF6700]">COMMAND</span>CENTER
                    </h1>
                    <span className="text-xl font-mono text-zinc-500 font-bold tracking-widest">{time}</span>
                </div>
                <p className="text-lg text-zinc-400 font-bold uppercase tracking-wide mt-1">{greeting}, {user?.email?.split("@")[0]}</p>
            </div>
            
            <button onClick={() => setActiveDrawer("SETTINGS")} className="industrial-card p-3 rounded-xl bg-[#FF6700] text-black shadow-[0_0_15px_rgba(255,103,0,0.4)] hover:scale-105 transition-transform active:scale-95">
                <Menu size={24} strokeWidth={3} />
            </button>
        </div>

        {/* --- METRIC TILES --- */}
        <div className="grid grid-cols-3 gap-3 mt-6">
            <button onClick={() => setActiveDrawer("FINANCE")} className={`industrial-card rounded-xl p-3 text-center border-2 transition-all relative overflow-hidden group ${metrics.profit < 0 ? "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse" : "border-transparent hover:border-green-500/50"}`}>
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1">NET REVENUE</p>
                <p className={`text-lg font-black tracking-tighter ${metrics.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                    ${metrics.profit.toLocaleString()}
                </p>
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
      
      {/* 1. JOB MANAGER + CREATE MODAL */}
      {activeDrawer === "JOBS" && (
        <Drawer title="MISSION CONTROL" close={() => setActiveDrawer(null)}>
            {showNewJobModal ? (
                <div className="animate-in slide-in-from-right space-y-4 p-1">
                    <div className="flex items-center gap-2 mb-4 text-[#FF6700] cursor-pointer" onClick={() => setShowNewJobModal(false)}><ChevronRight className="rotate-180" size={16}/><span className="text-xs font-black uppercase">Back to List</span></div>
                    <h3 className="text-sm font-black uppercase">New Job Dispatch</h3>
                    <input autoFocus placeholder="PROJECT NAME (E.G. 123 MAIN ST)" value={newJobData.name} onChange={e => setNewJobData({...newJobData, name: e.target.value.toUpperCase()})} className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-lg text-xs font-bold outline-none uppercase text-[var(--text-main)]" />
                    <input placeholder="CLIENT NAME (OPTIONAL)" value={newJobData.client} onChange={e => setNewJobData({...newJobData, client: e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-lg text-xs font-bold outline-none uppercase text-[var(--text-main)]" />
                    <button onClick={handleCreateJob} disabled={creating} className="w-full bg-[#FF6700] text-black font-black py-4 rounded-xl uppercase shadow-lg flex items-center justify-center gap-2">
                        {creating ? <Loader2 className="animate-spin" size={18}/> : "CREATE JOB"}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <button onClick={() => { setNewJobData({name: "", client: ""}); setShowNewJobModal(true); }} className="w-full py-4 border-2 border-dashed border-[#FF6700] text-[#FF6700] font-black rounded-xl text-xs hover:bg-[#FF6700]/10 uppercase transition-colors">+ DISPATCH NEW JOB</button>
                    {activeJobs.map(job => (
                        <div key={job.id} className="industrial-card p-4 rounded-xl border border-[var(--border-color)] flex justify-between items-center group">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-black text-[#FF6700] uppercase text-sm">{job.job_name}</h3>
                                    {job.status === 'COMPLETED' && <span className="text-[8px] bg-green-500/20 text-green-500 px-1 rounded font-bold">DONE</span>}
                                </div>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase">{job.customer_name || "NO CLIENT ASSIGNED"}</p>
                            </div>
                            {job.status === 'ACTIVE' && <button onClick={() => completeJob(job.id)} className="px-3 py-2 bg-zinc-800 text-zinc-400 text-[9px] font-black rounded hover:bg-green-600 hover:text-white transition uppercase">Complete</button>}
                        </div>
                    ))}
                </div>
            )}
        </Drawer>
      )}

      {/* 2. ADMIN DRAWER (Resource Management) */}
      {activeDrawer === "SETTINGS" && (
        <Drawer title="ADMIN CONSOLE" close={() => setActiveDrawer(null)}>
            <div className="flex border-b border-[var(--border-color)] mb-6">
                {["JOB", "CREW", "VAN"].map(tab => (
                    <button key={tab} onClick={() => setAdminTab(tab)} className={`flex-1 pb-3 font-black text-[10px] tracking-widest ${adminTab === tab ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-500"}`}>{tab}</button>
                ))}
            </div>

            <div className="space-y-6">
                {/* --- JOB TAB --- */}
                {adminTab === "JOB" && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-xl bg-[#FF6700]/5 border border-[#FF6700]/30 space-y-3">
                            <h3 className="text-[#FF6700] font-black text-xs uppercase">Dispatch New Job</h3>
                            <input placeholder="JOB NAME" value={newJobData.name} onChange={e => setNewJobData({...newJobData, name: e.target.value.toUpperCase()})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <input placeholder="CLIENT NAME" value={newJobData.client} onChange={e => setNewJobData({...newJobData, client: e.target.value})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <button onClick={handleCreateJob} disabled={creating} className="w-full bg-[#FF6700] text-black font-black py-3 rounded-lg text-xs uppercase flex justify-center">{creating ? <Loader2 className="animate-spin"/> : "CREATE JOB"}</button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-zinc-500 uppercase ml-1">Recent Jobs</p>
                            {activeJobs.slice(0,5).map(j => (
                                <div key={j.id} className="flex justify-between p-3 industrial-card rounded-lg border border-[var(--border-color)]">
                                    <span className="text-xs font-bold">{j.job_name}</span>
                                    <button onClick={() => deleteResource('jobs', j.id)} className="text-zinc-500 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- CREW TAB --- */}
                {adminTab === "CREW" && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/30 space-y-3">
                            <h3 className="text-blue-500 font-black text-xs uppercase">Add Personnel</h3>
                            <input placeholder="WORKER NAME" value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <button onClick={handleCreateWorker} disabled={creating} className="w-full bg-blue-600 text-white font-black py-3 rounded-lg text-xs uppercase flex justify-center">{creating ? <Loader2 className="animate-spin"/> : "ADD WORKER"}</button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-zinc-500 uppercase ml-1">Active Crew</p>
                            {crewList.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-3 industrial-card rounded-lg border border-[var(--border-color)]">
                                    <div className="flex items-center gap-3"><div className="w-6 h-6 rounded-full bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-400">{c.name[0]}</div><span className="text-xs font-bold">{c.name}</span></div>
                                    <button onClick={() => deleteResource('crew', c.id)} className="text-zinc-500 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- VAN TAB --- */}
                {adminTab === "VAN" && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/30 space-y-3">
                            <h3 className="text-purple-500 font-black text-xs uppercase">Register Vehicle</h3>
                            <input placeholder="VAN ID (E.G. VAN-04)" value={newVan.name} onChange={e => setNewVan({...newVan, name: e.target.value.toUpperCase()})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <input placeholder="LICENSE PLATE" value={newVan.plate} onChange={e => setNewVan({...newVan, plate: e.target.value.toUpperCase()})} className="w-full bg-[var(--bg-main)] p-3 rounded-lg text-xs font-bold outline-none uppercase border border-[var(--border-color)]" />
                            <button onClick={handleCreateVan} disabled={creating} className="w-full bg-purple-600 text-white font-black py-3 rounded-lg text-xs uppercase flex justify-center">{creating ? <Loader2 className="animate-spin"/> : "ADD VAN"}</button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-zinc-500 uppercase ml-1">Fleet</p>
                            {vanList.map(v => (
                                <div key={v.id} className="flex justify-between items-center p-3 industrial-card rounded-lg border border-[var(--border-color)]">
                                    <div className="flex items-center gap-3"><Truck size={14} className="text-purple-500"/><span className="text-xs font-bold">{v.name}</span><span className="text-[10px] text-zinc-500 font-mono">{v.plate_number}</span></div>
                                    <button onClick={() => deleteResource('vans', v.id)} className="text-zinc-500 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            ))}
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

      {/* 3. ALERTS & FINANCE (Unchanged Drawers) */}
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
