"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { useLiveBrain } from "../hooks/useLiveBrain";
import { useActiveJob } from "../hooks/useActiveJob";
import { 
  Calculator, Package, Camera, PenTool, Plus, Loader2, X, 
  FilePlus, Play, RefreshCw, Trash2, CheckCircle2,
  Sun, Moon, Eye, EyeOff, Menu, LogOut, AlertTriangle,
  Users, Truck, UserCircle, Phone, Mail, MapPin, FileText
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

  // RESOURCE STATE
  const [activeTab, setActiveTab] = useState("JOBS"); // JOBS, WORKERS, FLEET, CUSTOMERS
  const [workers, setWorkers] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [customers, setCustomers] = useState([]);

  // FORM STATE
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newWorker, setNewWorker] = useState({ name: "", role: "" });
  const [newRig, setNewRig] = useState({ name: "", plate: "" });
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening");
    
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

  const addJobFromMenu = async () => {
    if (!newJobTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("jobs").insert({
      user_id: user.id,
      title: newJobTitle,
      status: "ACTIVE"
    }).select().single();
    
    if (data) {
      setNewJobTitle("");
      await loadDashboardData();
    }
  };

  const addWorker = async () => {
    if (!newWorker.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("crew").insert({
      user_id: user.id,
      name: newWorker.name,
      role: newWorker.role || "Tech"
    });
    setNewWorker({ name: "", role: "" });
    loadResources();
  };

  const addRig = async () => {
    if (!newRig.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("fleet").insert({
      user_id: user.id,
      name: newRig.name,
      plate_number: newRig.plate || ""
    });
    setNewRig({ name: "", plate: "" });
    loadResources();
  };

  const addCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("customers").insert({
      user_id: user.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      address: newCustomer.address,
      notes: newCustomer.notes
    });
    setNewCustomer({ name: "", phone: "", email: "", address: "", notes: "" });
    loadResources();
  };

  const deleteWorker = async (id) => {
    if (!confirm("Remove worker?")) return;
    await supabase.from("crew").delete().eq("id", id);
    loadResources();
  };

  const deleteRig = async (id) => {
    if (!confirm("Remove rig?")) return;
    await supabase.from("fleet").delete().eq("id", id);
    loadResources();
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Remove customer?")) return;
    await supabase.from("customers").delete().eq("id", id);
    loadResources();
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

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="h-screen w-full bg-[#121212] text-foreground font-inter overflow-hidden flex flex-col relative selection:bg-[#FF6700] selection:text-black">
      
      {/* HEADER */}
      <header className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex justify-between items-start mb-3">
            <div>
                <h1 className="text-4xl font-oswald font-bold tracking-tight leading-none">
                  <span className="text-[#FF6700] drop-shadow-[0_0_20px_#FF6700]">COMMAND</span>
                  <span className="text-white">CENTER</span>
                </h1>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">{greeting}</p>
            </div>
            
            {/* HAMBURGER BUTTON (Orange Glow) */}
            <button 
              onClick={() => setShowHamburger(true)} 
              className="p-3 rounded-xl bg-[#FF6700] text-black shadow-[0_0_20px_#FF6700] hover:shadow-[0_0_30px_#FF6700] active:scale-95 transition-all"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
        </div>

        {/* QUICK JOB INPUT */}
        <form onSubmit={handleCreateJob} className="relative mb-3 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6700]">
                {isCreating ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
            </div>
            <input 
                type="text" 
                placeholder="Start New Job..." 
                value={quickJobName}
                onChange={(e) => setQuickJobName(e.target.value)}
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl py-3 pl-12 pr-4 text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF6700] focus:shadow-[0_0_20px_rgba(255,103,0,0.3)] transition-all"
            />
        </form>

        {/* ACTIVE JOB INDICATOR */}
        {activeJob && (
           <div className="flex items-center justify-between bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-lg p-3 mb-3 shadow-[0_0_15px_rgba(255,103,0,0.2)]">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF6700] shadow-[0_0_10px_#FF6700] animate-pulse"></div>
                  <div>
                      <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider">ACTIVE MISSION</p>
                      <p className="font-oswald text-sm text-white tracking-wide">{activeJob.title}</p>
                  </div>
              </div>
              <button onClick={() => setActiveJob(null)} className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]"><X size={14}/></button>
           </div>
        )}
      </header>

      {/* MAIN CONTENT - APPS GRID (LARGER) */}
      <main className="flex-1 flex items-center justify-center px-6 pb-24">
         <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
            <AppCard href="/apps/profitlock" label="PROFITLOCK" sub="Bids & Invoices" icon={<Calculator size={28}/>} active={activeJob} />
            <AppCard href="/apps/loadout" label="LOADOUT" sub="Inventory" icon={<Package size={28}/>} active={activeJob} />
            <AppCard href="/apps/sitesnap" label="SITESNAP" sub="Photos" icon={<Camera size={28}/>} active={activeJob} />
            <AppCard href="/apps/signoff" label="SIGNOFF" sub="Contracts" icon={<PenTool size={28}/>} active={activeJob} />
         </div>
      </main>

      {/* SPEED DIAL (Bottom Right) */}
      <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-3">
        {showSpeedDial && (
            <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-10 fade-in duration-200">
                <Link href="/apps/profitlock" className="flex items-center gap-3" onClick={() => setShowSpeedDial(false)}>
                    <span className="bg-white/10 backdrop-blur-xl text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-white/20">New Bid</span>
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]"><FilePlus size={20}/></div>
                </Link>
                <Link href="/apps/loadout" className="flex items-center gap-3" onClick={() => setShowSpeedDial(false)}>
                    <span className="bg-white/10 backdrop-blur-xl text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-white/20">Add Item</span>
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]"><Package size={20}/></div>
                </Link>
            </div>
        )}
        <button 
            onClick={() => setShowSpeedDial(!showSpeedDial)}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,103,0,0.5)] transition-all duration-300 ${showSpeedDial ? "bg-white/10 backdrop-blur-xl text-white rotate-45 border border-white/20" : "bg-[#FF6700] text-black hover:scale-110"}`}
        >
            <Plus size={36} strokeWidth={2.5} />
        </button>
      </div>

      {/* HAMBURGER MENU */}
      {showHamburger && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => setShowHamburger(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-96 max-w-[90vw] z-50 bg-[#1a1a1a] border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            
            {/* Header */}
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-white/10 p-5 flex justify-between items-center backdrop-blur-xl z-10">
              <h2 className="font-oswald text-xl text-[#FF6700] drop-shadow-[0_0_10px_#FF6700]">COMMAND MENU</h2>
              <button onClick={() => setShowHamburger(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition">
                <X size={20}/>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6">
              
              {/* TABS */}
              <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-lg">
                {["JOBS", "WORKERS", "FLEET", "CUSTOMERS"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 rounded text-[10px] font-bold transition ${activeTab === tab ? "bg-[#FF6700] text-black shadow-[0_0_15px_rgba(255,103,0,0.4)]" : "text-gray-400 hover:text-white"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* JOBS TAB */}
              {activeTab === "JOBS" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Create Job</label>
                    <div className="flex gap-2">
                      <input 
                        placeholder="Job Title..." 
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <button onClick={addJobFromMenu} className="bg-[#FF6700] text-black px-4 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] transition">
                        <Plus size={18}/>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Jobs</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {jobs && jobs.slice(0, 10).map(job => (
                        <button 
                          key={job.id} 
                          onClick={() => { setActiveJob(job); setShowHamburger(false); }}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700] shadow-[0_0_15px_rgba(255,103,0,0.2)]" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                        >
                          <p className={`font-oswald text-sm ${activeJob?.id === job.id ? "text-[#FF6700]" : "text-white"}`}>{job.title}</p>
                          <p className="text-[10px] text-gray-500">{new Date(job.created_at).toLocaleDateString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* WORKERS TAB */}
              {activeTab === "WORKERS" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Add Worker</label>
                    <div className="space-y-2">
                      <input 
                        placeholder="Name..." 
                        value={newWorker.name}
                        onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        placeholder="Role (Optional)..." 
                        value={newWorker.role}
                        onChange={(e) => setNewWorker({...newWorker, role: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <button onClick={addWorker} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] transition">
                        Add Worker
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Team ({workers.length})</h3>
                    <div className="space-y-2">
                      {workers.map(worker => (
                        <div key={worker.id} className="bg-white/5 border border-white/10 p-3 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Users size={16} className="text-[#FF6700]"/>
                            <div>
                              <p className="font-bold text-sm text-white">{worker.name}</p>
                              <p className="text-xs text-gray-500">{worker.role || "Tech"}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteWorker(worker.id)} className="text-gray-500 hover:text-red-500">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FLEET TAB */}
              {activeTab === "FLEET" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Add Rig</label>
                    <div className="space-y-2">
                      <input 
                        placeholder="Rig Name..." 
                        value={newRig.name}
                        onChange={(e) => setNewRig({...newRig, name: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        placeholder="Plate # (Optional)..." 
                        value={newRig.plate}
                        onChange={(e) => setNewRig({...newRig, plate: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <button onClick={addRig} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] transition">
                        Add Rig
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Fleet ({fleet.length})</h3>
                    <div className="space-y-2">
                      {fleet.map(rig => (
                        <div key={rig.id} className="bg-white/5 border border-white/10 p-3 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Truck size={16} className="text-[#FF6700]"/>
                            <div>
                              <p className="font-bold text-sm text-white">{rig.name}</p>
                              <p className="text-xs text-gray-500">{rig.plate_number || "No Plate"}</p>
                            </div>
                          </div>
                          <button onClick={() => deleteRig(rig.id)} className="text-gray-500 hover:text-red-500">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOMERS TAB */}
              {activeTab === "CUSTOMERS" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Add Customer</label>
                    <div className="space-y-2">
                      <input 
                        placeholder="Name..." 
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        placeholder="Phone..." 
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        placeholder="Email..." 
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <input 
                        placeholder="Address..." 
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none"
                      />
                      <textarea 
                        placeholder="Notes..." 
                        value={newCustomer.notes}
                        onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#FF6700] outline-none resize-none"
                      />
                      <button onClick={addCustomer} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] transition">
                        Add Customer
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customers ({customers.length})</h3>
                    <div className="space-y-2">
                      {customers.map(customer => (
                        <div key={customer.id} className="bg-white/5 border border-white/10 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <UserCircle size={16} className="text-[#FF6700]"/>
                              <p className="font-bold text-sm text-white">{customer.name}</p>
                            </div>
                            <button onClick={() => deleteCustomer(customer.id)} className="text-gray-500 hover:text-red-500">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                          {customer.phone && <p className="text-xs text-gray-400 flex items-center gap-2"><Phone size={12}/>{customer.phone}</p>}
                          {customer.email && <p className="text-xs text-gray-400 flex items-center gap-2"><Mail size={12}/>{customer.email}</p>}
                          {customer.address && <p className="text-xs text-gray-400 flex items-center gap-2"><MapPin size={12}/>{customer.address}</p>}
                          {customer.notes && <p className="text-xs text-gray-500 mt-2 flex items-start gap-2"><FileText size={12} className="mt-0.5"/>{customer.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SYSTEM CONTROLS */}
              <div className="border-t border-white/10 pt-6 space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">SYSTEM</h3>
                
                {/* Metrics */}
                <div className="space-y-2">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase">Revenue</span>
                    <span className="text-[#22c55e] font-oswald text-lg">{formatCurrency(metrics.revenue)}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase">Jobs</span>
                    <span className="font-oswald text-lg text-white">{metrics.jobs}</span>
                  </div>
                  <div className={`bg-white/5 border rounded-lg p-3 flex justify-between items-center ${metrics.alerts > 0 ? "border-red-500/50 bg-red-500/10" : "border-white/10"}`}>
                    <span className="text-xs text-gray-400 uppercase">Alerts</span>
                    <div className="flex items-center gap-2">
                      {metrics.alerts > 0 && <AlertTriangle size={14} className="text-red-500"/>}
                      <span className={`font-oswald text-lg ${metrics.alerts > 0 ? "text-red-500" : "text-white"}`}>{metrics.alerts > 0 ? metrics.alerts : "OK"}</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <button 
                  onClick={() => setPrivacyMode(!privacyMode)} 
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg flex items-center justify-between hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    {privacyMode ? <EyeOff size={18} className="text-[#FF6700]"/> : <Eye size={18} className="text-gray-400"/>}
                    <span className="text-sm font-bold text-white">Privacy Mode</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${privacyMode ? "bg-[#FF6700]" : "bg-gray-700"}`}>
                    <div className={`w-4 h-4 rounded-full bg-black m-0.5 transition-transform ${privacyMode ? "translate-x-5" : ""}`}></div>
                  </div>
                </button>

                <button 
                  onClick={toggleTheme} 
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg flex items-center justify-between hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon size={18} className="text-[#FF6700]"/> : <Sun size={18} className="text-gray-400"/>}
                    <span className="text-sm font-bold text-white">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${theme === 'dark' ? "bg-[#FF6700]" : "bg-gray-700"}`}>
                    <div className={`w-4 h-4 rounded-full bg-black m-0.5 transition-transform ${theme === 'dark' ? "translate-x-5" : ""}`}></div>
                  </div>
                </button>

                <button 
                  onClick={manualRefresh} 
                  disabled={refreshing}
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-3 hover:bg-white/10 transition"
                >
                  <RefreshCw size={18} className={refreshing ? "animate-spin text-[#FF6700]" : "text-gray-400"}/>
                  <span className="text-sm font-bold text-white">Refresh Data</span>
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

// Reusable App Card (LARGER)
function AppCard({ href, label, sub, icon, active }) {
    return (
        <Link href={href} className={`bg-white/5 backdrop-blur-xl border p-6 rounded-2xl hover:bg-white/10 active:scale-95 transition-all group relative overflow-hidden ${active ? "border-[#FF6700] shadow-[0_0_25px_rgba(255,103,0,0.3)]" : "border-white/10"}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="mb-4 text-[#FF6700] group-hover:drop-shadow-[0_0_15px_#FF6700] transition-all">
                  {icon}
              </div>
              <h2 className="text-base font-oswald font-bold text-white group-hover:text-[#FF6700] transition-colors mb-1">{label}</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{sub}</p>
            </div>
        </Link>
    );
}
