"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../utils/supabase/client";
import { useLiveBrain } from "../hooks/useLiveBrain";
import { useActiveJob } from "../hooks/useActiveJob";
import { 
  Calculator, Package, Camera, PenTool, Plus, Loader2, X, 
  FilePlus, Play, RefreshCw, Trash2, CheckCircle2,
  Sun, Moon, Eye, EyeOff, Menu, LogOut, AlertTriangle,
  Users, Truck, UserCircle, Phone, Mail, MapPin, FileText,
  Edit2, Check, Search, ChevronDown, Briefcase
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  // --- THE BRAIN ---
  const { jobs: liveJobs, loading: brainLoading, refresh: refreshBrain } = useLiveBrain();
  const { activeJob, setActiveJob } = useActiveJob();
  const [quickJobName, setQuickJobName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const inputRef = useRef(null);

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

  // RESOURCE STATE
  const [activeTab, setActiveTab] = useState("JOBS");
  const [workers, setWorkers] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");

  // FORM STATE
  const [newJobTitle, setNewJobTitle] = useState("");
  const [editingJob, setEditingJob] = useState(null);
  const [newWorker, setNewWorker] = useState({ name: "", role: "" });
  const [newRig, setNewRig] = useState({ name: "", plate: "" });
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedPrivacy = localStorage.getItem("privacyMode");
    if (savedPrivacy !== null) {
      setPrivacyMode(savedPrivacy === "true");
    }

    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening");
    
    loadDashboardData();
  }, []);

  // Sync liveJobs from brain hook to local state
  useEffect(() => {
    if (liveJobs) {
      setJobs(liveJobs);
      setMetrics(prev => ({ ...prev, jobs: liveJobs.filter(j => j.status === 'ACTIVE').length }));
    }
  }, [liveJobs]);

  // --- ACTIONS ---
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!quickJobName.trim()) return;
    setIsCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("jobs").insert({
      user_id: user.id,
      title: quickJobName,
      status: "ACTIVE"
    }).select().single();

    if (data && !error) {
      setActiveJob(data);
      setQuickJobName("");
      setShowJobDropdown(false);
      // Refresh jobs list immediately
      await refreshBrain();
      await loadJobs();
    }
    setIsCreating(false);
  };

  const selectExistingJob = (job) => {
    setActiveJob(job);
    setQuickJobName("");
    setShowJobDropdown(false);
  };

  const addJobFromMenu = async () => {
    if (!newJobTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("jobs").insert({
      user_id: user.id,
      title: newJobTitle,
      status: "ACTIVE"
    }).select().single();
    
    if (data && !error) {
      setNewJobTitle("");
      await refreshBrain();
      await loadJobs();
    }
  };

  const updateJob = async (id, updates) => {
    const { error } = await supabase.from("jobs").update(updates).eq("id", id);
    if (!error) {
      setEditingJob(null);
      await refreshBrain();
      await loadJobs();
    }
  };

  const deleteJob = async (id) => {
    if (!confirm("Delete this job?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (!error) {
      if (activeJob?.id === id) setActiveJob(null);
      await refreshBrain();
      await loadJobs();
    }
  };

  const addWorker = async () => {
    if (!newWorker.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("crew").insert({
      user_id: user.id,
      name: newWorker.name,
      role: newWorker.role || "Tech"
    }).select().single();
    
    if (data && !error) {
      setNewWorker({ name: "", role: "" });
      await loadResources();
    } else {
      console.error("Worker insert error:", error);
      alert("Failed to add worker: " + (error?.message || "Unknown error"));
    }
  };

  const addRig = async () => {
    if (!newRig.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("fleet").insert({
      user_id: user.id,
      name: newRig.name,
      plate_number: newRig.plate || ""
    });
    if (!error) {
      setNewRig({ name: "", plate: "" });
      await loadResources();
    }
  };

  const addCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("customers").insert({
      user_id: user.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      address: newCustomer.address,
      notes: newCustomer.notes
    });
    if (!error) {
      setNewCustomer({ name: "", phone: "", email: "", address: "", notes: "" });
      await loadResources();
    }
  };

  const deleteWorker = async (id) => {
    if (!confirm("Remove worker?")) return;
    await supabase.from("crew").delete().eq("id", id);
    await loadResources();
  };

  const deleteRig = async (id) => {
    if (!confirm("Remove rig?")) return;
    await supabase.from("fleet").delete().eq("id", id);
    await loadResources();
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Remove customer?")) return;
    await supabase.from("customers").delete().eq("id", id);
    await loadResources();
  };

  const formatCurrency = (val) => {
    if (privacyMode) return "****";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  const togglePrivacyMode = () => {
    const newMode = !privacyMode;
    setPrivacyMode(newMode);
    localStorage.setItem("privacyMode", newMode.toString());
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const loadJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (data) {
      setJobs(data);
      setMetrics(prev => ({ ...prev, jobs: data.filter(j => j.status === 'ACTIVE').length }));
    }
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
    setMetrics(prev => ({ ...prev, revenue, alerts: stockAlerts.length }));
    
    await loadJobs();
    await loadResources();
    setLoading(false);
  };

  const loadResources = async () => {
    const { data: crewData } = await supabase.from("crew").select("*").order("name");
    const { data: fleetData } = await supabase.from("fleet").select("*").order("name");
    const { data: customerData } = await supabase.from("customers").select("*").order("name");
    
    if (crewData) setWorkers(crewData);
    if (fleetData) setFleet(fleetData);
    if (customerData) setCustomers(customerData);
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

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.address?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const recentJobs = jobs ? jobs.slice(0, 5) : [];

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] font-inter overflow-hidden flex flex-col relative selection:bg-[#FF6700] selection:text-black transition-colors">
      
      {/* HEADER */}
      <header className="px-6 pt-4 pb-3 shrink-0">
        <div className="flex justify-between items-start mb-3">
            <div>
                <p className="text-[#FF6700] font-bold text-[9px] tracking-[0.25em] uppercase mb-2">FIELDDESKOPS</p>
                <h1 className="text-4xl font-oswald font-bold tracking-tight leading-none mb-0.5">
                  <span className="text-[#FF6700] drop-shadow-[0_0_12px_rgba(255,103,0,0.5)]">COMMAND</span>
                  <span className="text-[var(--text-main)]">CENTER</span>
                </h1>
                <p className="text-[9px] text-[var(--text-sub)] font-medium tracking-wider uppercase opacity-60">{greeting}</p>
            </div>
            
            <button 
              onClick={() => setShowHamburger(true)} 
              className="p-3 rounded-xl bg-[#FF6700] text-black shadow-[0_0_15px_rgba(255,103,0,0.4)] hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] active:scale-95 transition-all"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
        </div>

        {/* QUICK JOB INPUT */}
        <div className="relative mb-3">
          <form onSubmit={handleCreateJob} className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6700]">
                  {isCreating ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
              </div>
              <input 
                  ref={inputRef}
                  type="text" 
                  placeholder="Start or Select Job..." 
                  value={quickJobName}
                  onChange={(e) => setQuickJobName(e.target.value)}
                  onFocus={() => setShowJobDropdown(true)}
                  className="w-full bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl py-3 pl-12 pr-12 text-base text-[var(--text-main)] placeholder:text-[var(--text-sub)] focus:outline-none focus:border-[#FF6700] focus:shadow-[0_0_15px_rgba(255,103,0,0.2)] transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowJobDropdown(!showJobDropdown)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[#FF6700]"
              >
                <ChevronDown size={18} />
              </button>
          </form>

          {showJobDropdown && recentJobs.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-2 border-b border-[var(--border-color)] text-xs text-[var(--text-sub)] uppercase tracking-wider px-3">Recent Jobs</div>
              {recentJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => selectExistingJob(job)}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--bg-surface)] transition flex justify-between items-center group"
                >
                  <span className="text-sm text-[var(--text-main)] group-hover:text-[#FF6700]">{job.title}</span>
                  <span className="text-xs text-[var(--text-sub)]">{new Date(job.created_at).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE JOB INDICATOR */}
        {activeJob && (
           <div className="flex items-center justify-between bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-lg p-3 mb-3 shadow-[0_0_10px_rgba(255,103,0,0.15)]">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF6700] shadow-[0_0_8px_#FF6700] animate-pulse"></div>
                  <div>
                      <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider">ACTIVE MISSION</p>
                      <p className="font-oswald text-sm text-[var(--text-main)] tracking-wide">{activeJob.title}</p>
                  </div>
              </div>
              <button onClick={() => setActiveJob(null)} className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]"><X size={14}/></button>
           </div>
        )}

        {/* METRICS BAR */}
        <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 text-center relative group">
                <p className="text-[10px] text-[var(--text-sub)] uppercase font-bold tracking-wider mb-1">Revenue</p>
                <p className="text-[#22c55e] font-oswald text-lg tracking-tight">{formatCurrency(metrics.revenue)}</p>
                <button 
                  onClick={togglePrivacyMode}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                  title={privacyMode ? "Show" : "Hide"}
                >
                  {privacyMode ? <EyeOff size={12} className="text-[#FF6700]"/> : <Eye size={12} className="text-[var(--text-sub)]"/>}
                </button>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 text-center">
                <p className="text-[10px] text-[var(--text-sub)] uppercase font-bold tracking-wider mb-1">Active Jobs</p>
                <p className="font-oswald text-lg tracking-tight text-[var(--text-main)]">{metrics.jobs}</p>
            </div>
            <button 
              onClick={() => setShowHamburger(true)} 
              className={`bg-[var(--bg-card)] border rounded-lg p-3 text-center transition active:scale-95 relative ${metrics.alerts > 0 ? "border-red-500/50 bg-red-500/10" : "border-[var(--border-color)]"}`}
            >
                {metrics.alerts > 0 && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                <p className="text-[10px] text-[var(--text-sub)] uppercase font-bold tracking-wider mb-1">System</p>
                <div className="flex items-center justify-center gap-1">
                    {metrics.alerts > 0 && <AlertTriangle size={14} className="text-red-500"/>}
                    <p className={`font-oswald text-lg tracking-tight ${metrics.alerts > 0 ? "text-red-500" : "text-[var(--text-main)]"}`}>{metrics.alerts > 0 ? metrics.alerts : "OK"}</p>
                </div>
            </button>
        </div>
      </header>

      {/* MAIN CONTENT - APPS GRID */}
      <main className="flex-1 flex items-center justify-center px-6 pb-16">
         <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Bids & Invoices" icon={<Calculator size={28}/>} active={activeJob} />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={28}/>} active={activeJob} />
            <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Photos" icon={<Camera size={28}/>} active={activeJob} />
            <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={28}/>} active={activeJob} />
         </div>
      </main>

      {/* FOOTER BRANDING */}
      <div className="pb-4 text-center shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest">
          <span className="text-[var(--text-sub)] opacity-40">POWERED BY </span>
          <span className="text-[#FF6700]">FIELDDESKOPS</span>
        </p>
      </div>

      {/* SPEED DIAL */}
      <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-3">
        {showSpeedDial && (
            <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-10 fade-in duration-200">
                <Link href="/apps/profitlock" className="flex items-center gap-3" onClick={() => setShowSpeedDial(false)}>
                    <span className="bg-[var(--bg-card)] backdrop-blur-xl text-[var(--text-main)] text-xs px-3 py-1.5 rounded-lg shadow-lg border border-[var(--border-color)]">New Bid</span>
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] text-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.25)]"><FilePlus size={20}/></div>
                </Link>
                <Link href="/apps/loadout" className="flex items-center gap-3" onClick={() => setShowSpeedDial(false)}>
                    <span className="bg-[var(--bg-card)] backdrop-blur-xl text-[var(--text-main)] text-xs px-3 py-1.5 rounded-lg shadow-lg border border-[var(--border-color)]">Add Item</span>
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] text-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.25)]"><Package size={20}/></div>
                </Link>
            </div>
        )}
        <button 
            onClick={() => setShowSpeedDial(!showSpeedDial)}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(255,103,0,0.4)] transition-all duration-300 ${showSpeedDial ? "bg-[var(--bg-card)] backdrop-blur-xl text-[var(--text-main)] rotate-45 border border-[var(--border-color)]" : "bg-[#FF6700] text-black hover:scale-110"}`}
        >
            <Plus size={36} strokeWidth={2.5} />
        </button>
      </div>

      {/* HAMBURGER MENU */}
      {showHamburger && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => setShowHamburger(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-96 max-w-[90vw] z-50 bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            
            <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] p-5 flex justify-between items-center backdrop-blur-xl z-10">
              <h2 className="font-oswald text-xl text-[#FF6700] drop-shadow-[0_0_8px_rgba(255,103,0,0.4)]">COMMAND MENU</h2>
              <button onClick={() => setShowHamburger(false)} className="p-2 hover:bg-white/10 rounded-lg text-[var(--text-sub)] transition">
                <X size={20}/>
              </button>
            </div>

            <div className="p-5 space-y-6">
              
              <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-lg">
                {["JOBS", "WORKERS", "FLEET", "CUSTOMERS"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 rounded text-[10px] font-bold transition ${activeTab === tab ? "bg-[#FF6700] text-black shadow-[0_0_12px_rgba(255,103,0,0.3)]" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "JOBS" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-2 block">Create Job</label>
                    <div className="flex gap-2">
                      <input 
                        placeholder="Job Title..." 
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <button onClick={addJobFromMenu} className="bg-[#FF6700] text-black px-4 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
                        <Plus size={18}/>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">All Jobs ({jobs.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {jobs && jobs.map(job => (
                        <div 
                          key={job.id} 
                          className={`p-3 rounded-lg border transition-all ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700] shadow-[0_0_10px_rgba(255,103,0,0.15)]" : "bg-[var(--bg-surface)] border-[var(--border-color)]"}`}
                        >
                          {editingJob?.id === job.id ? (
                            <div className="space-y-2">
                              <input 
                                value={editingJob.title}
                                onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-base text-[var(--input-text)]"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => updateJob(job.id, { title: editingJob.title })} className="flex-1 bg-green-600 text-white py-1 rounded text-xs font-bold">
                                  <Check size={14} className="inline"/>
                                </button>
                                <button onClick={() => setEditingJob(null)} className="flex-1 bg-gray-700 text-white py-1 rounded text-xs font-bold">
                                  <X size={14} className="inline"/>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div className="flex-1 cursor-pointer" onClick={() => { setActiveJob(job); setShowHamburger(false); }}>
                                <p className={`font-oswald text-sm ${activeJob?.id === job.id ? "text-[#FF6700]" : "text-[var(--text-main)]"}`}>{job.title}</p>
                                <p className="text-[10px] text-[var(--text-sub)]">{job.status} • {new Date(job.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => setEditingJob(job)} className="p-1.5 hover:bg-white/10 rounded text-[var(--text-sub)] hover:text-[var(--text-main)]">
                                  <Edit2 size={14}/>
                                </button>
                                <button 
                                  onClick={() => updateJob(job.id, { status: job.status === "ACTIVE" ? "COMPLETED" : "ACTIVE" })} 
                                  className={`p-1.5 hover:bg-white/10 rounded ${job.status === "COMPLETED" ? "text-green-500" : "text-[var(--text-sub)]"} hover:text-green-500`}
                                  title={job.status === "ACTIVE" ? "Mark Complete" : "Reopen"}
                                >
                                  <CheckCircle2 size={14}/>
                                </button>
                                <button onClick={() => deleteJob(job.id)} className="p-1.5 hover:bg-white/10 rounded text-[var(--text-sub)] hover:text-red-500">
                                  <Trash2 size={14}/>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "WORKERS" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-2 block">Add Worker</label>
                    <div className="space-y-2">
                      <input 
                        placeholder="Name..." 
                        value={newWorker.name}
                        onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        placeholder="Role (Optional)..." 
                        value={newWorker.role}
                        onChange={(e) => setNewWorker({...newWorker, role: e.target.value})}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <button onClick={addWorker} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
                        Add Worker
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">Team ({workers.length})</h3>
                    <div className="space-y-2">
                      {workers.map(worker => (
                        <div key={worker.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Users size={16} className="text-[#FF6700]"/>
                            <div>
                              <p className="font-bold text-sm text-[var(--text-main)]">{worker.name}</p>
                              <p className="text-xs text-[var(--text-sub)]">{worker.role || "Tech"}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteWorker(worker.id)} className="text-[var(--text-sub)] hover:text-red-500">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "FLEET" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-2 block">Add Rig</label>
                    <div className="space-y-2">
                      <input 
                        placeholder="Rig Name..." 
                        value={newRig.name}
                        onChange={(e) => setNewRig({...newRig, name: e.target.value})}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        placeholder="Plate # (Optional)..." 
                        value={newRig.plate}
                        onChange={(e) => setNewRig({...newRig, plate: e.target.value})}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <button onClick={addRig} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
                        Add Rig
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">Fleet ({fleet.length})</h3>
                    <div className="space-y-2">
                      {fleet.map(rig => (
                        <div key={rig.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Truck size={16} className="text-[#FF6700]"/>
                            <div>
                              <p className="font-bold text-sm text-[var(--text-main)]">{rig.name}</p>
                              <p className="text-xs text-[var(--text-sub)]">{rig.plate_number || "No Plate"}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteRig(rig.id)} className="text-[var(--text-sub)] hover:text-red-500">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "CUSTOMERS" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-2 block">Add Customer</label>
                    <div className="space-y-2">
                      <input 
                        placeholder="Name..." 
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        type="tel"
                        inputMode="numeric"
                        placeholder="Phone..." 
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value.replace(/[^0-9]/g, '')})}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        type="email"
                        placeholder="Email..." 
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        placeholder="Address..." 
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                      <textarea 
                        placeholder="Notes..." 
                        value={newCustomer.notes}
                        onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                        rows={3}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none resize-none"
                      />
                      <button onClick={addCustomer} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
                        Add Customer
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">Customers ({customers.length})</h3>
                    
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={16}/>
                      <input 
                        placeholder="Search by name, phone, address..." 
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-10 pr-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      />
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredCustomers.map(customer => (
                        <div key={customer.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg overflow-hidden">
                          <button 
                            onClick={() => setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)}
                            className="w-full p-3 flex justify-between items-center hover:bg-[var(--bg-surface)] transition"
                          >
                            <div className="flex items-center gap-3 text-left">
                              <UserCircle size={16} className="text-[#FF6700] shrink-0"/>
                              <div>
                                <p className="font-bold text-sm text-[var(--text-main)]">{customer.name}</p>
                                <p className="text-xs text-[var(--text-sub)]">{customer.phone || "No Phone"}</p>
                              </div>
                            </div>
                            <ChevronDown size={16} className={`text-[var(--text-sub)] transition-transform ${expandedCustomer === customer.id ? "rotate-180" : ""}`}/>
                          </button>

                          {expandedCustomer === customer.id && (
                            <div className="px-3 pb-3 space-y-2 border-t border-[var(--border-color)] pt-3">
                              {customer.email && <p className="text-xs text-[var(--text-sub)] flex items-center gap-2"><Mail size={12}/>{customer.email}</p>}
                              {customer.address && <p className="text-xs text-[var(--text-sub)] flex items-center gap-2"><MapPin size={12}/>{customer.address}</p>}
                              {customer.notes && <p className="text-xs text-[var(--text-sub)] flex items-start gap-2 bg-black/40 p-2 rounded"><FileText size={12} className="mt-0.5 shrink-0"/>{customer.notes}</p>}
                              <button onClick={() => deleteCustomer(customer.id)} className="w-full bg-red-900/20 border border-red-500/30 text-red-500 py-2 rounded text-xs font-bold hover:bg-red-900/40 transition flex items-center justify-center gap-2">
                                <Trash2 size={12}/> Delete Customer
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-[var(--border-color)] pt-6 space-y-3">
                <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">SYSTEM</h3>
                
                <button 
                  onClick={toggleTheme} 
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex items-center justify-between hover:bg-[var(--bg-card)] transition"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon size={18} className="text-[#FF6700]"/> : <Sun size={18} className="text-[var(--text-sub)]"/>}
                    <span className="text-sm font-bold text-[var(--text-main)]">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${theme === 'dark' ? "bg-[#FF6700]" : "bg-gray-700"}`}>
                    <div className={`w-4 h-4 rounded-full bg-black m-0.5 transition-transform ${theme === 'dark' ? "translate-x-5" : ""}`}></div>
                  </div>
                </button>

                <button 
                  onClick={manualRefresh} 
                  disabled={refreshing}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex items-center gap-3 hover:bg-[var(--bg-card)] transition"
                >
                  <RefreshCw size={18} className={refreshing ? "animate-spin text-[#FF6700]" : "text-[var(--text-sub)]"}/>
                  <span className="text-sm font-bold text-[var(--text-main)]">Refresh Data</span>
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

function AppCard({ href, label, sub, icon, active }) {
    return (
        <Link href={href} className={`bg-[var(--bg-card)] backdrop-blur-xl border p-6 rounded-2xl hover:bg-[var(--bg-surface)] active:scale-95 transition-all group relative overflow-hidden ${active ? "border-[#FF6700] shadow-[0_0_15px_rgba(255,103,0,0.2)]" : "border-[var(--border-color)]"}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="mb-4 text-[#FF6700] group-hover:drop-shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-all">
                  {icon}
              </div>
              <h2 className="text-base font-oswald font-bold text-[var(--text-main)] group-hover:text-[#FF6700] transition-colors mb-1">{label}</h2>
              <p className="text-[10px] text-[var(--text-sub)] uppercase tracking-wide">{sub}</p>
            </div>
        </Link>
    );
}
