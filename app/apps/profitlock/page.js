'use client';

import { useState, useEffect } from 'react';
// Navigate up from app/apps/profitlock/ -> app/ -> utils/
import { createClient } from '../../../utils/supabase/client';
import { 
  Trash2, Save, FileText, Share, Settings, Menu, X, ArrowLeft, Plus, Loader2, 
  Briefcase, DollarSign, Lock, Unlock, ChevronDown, CheckCircle2, Box, Clock, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfitLock() {
  const supabase = createClient();
  const router = useRouter();
  
  // --- CORE DATA ---
  const [activeJobs, setActiveJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null); // The Job Object
  const [estimateHistory, setEstimateHistory] = useState([]); 

  // --- CALCULATOR STATE ---
  const [mode, setMode] = useState('SIMPLE'); // 'SIMPLE' or 'ADVANCED'
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  
  // Simple Inputs
  const [simpleMaterials, setSimpleMaterials] = useState(''); 
  const [simpleHours, setSimpleHours] = useState('');
  
  // Advanced Inputs (Line Items)
  const [lineItems, setLineItems] = useState([
      { id: 1, description: 'Materials', quantity: 1, unit_cost: 0, markup: 20 },
      { id: 2, description: 'Labor', quantity: 1, unit_cost: 0, markup: 20 }
  ]); 

  // --- CONFIG (Lives in Menu) ---
  const [hourlyRate, setHourlyRate] = useState(75);
  const [defaultMarkup, setDefaultMarkup] = useState(20);
  
  // UI State
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // --- INIT ---
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Get Active Jobs for the Dropdown
    const { data: jobs } = await supabase.from('jobs').select('*').eq('status', 'ACTIVE').order('updated_at', { ascending: false });
    setActiveJobs(jobs || []);

    // 2. Get Recent Estimates
    const { data: est } = await supabase.from('estimates').select('*, jobs(job_name)').order('created_at', { ascending: false });
    setEstimateHistory(est || []);
  };

  // --- LOGIC ENGINE ---
  const calculateTotals = () => {
    let cost = 0;
    let price = 0;

    if (mode === 'SIMPLE') {
        const mat = parseFloat(simpleMaterials) || 0;
        const labor = (parseFloat(simpleHours) || 0) * hourlyRate;
        cost = mat + labor;
        // Simple Logic: Cost + Markup %
        price = cost * (1 + (defaultMarkup / 100));
    } else {
        // Advanced Logic
        lineItems.forEach(item => {
            const itemCost = (parseFloat(item.unit_cost) || 0) * (parseFloat(item.quantity) || 1);
            const itemPrice = itemCost * (1 + ((parseFloat(item.markup) || defaultMarkup) / 100));
            cost += itemCost;
            price += itemPrice;
        });
    }

    const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
    return { cost, price, margin };
  };

  const { cost, price, margin } = calculateTotals();

  // --- ACTIONS ---

  const addLineItem = () => {
      setLineItems([...lineItems, { id: Date.now(), description: '', quantity: 1, unit_cost: 0, markup: defaultMarkup }]);
  };

  const updateLineItem = (id, field, value) => {
      setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeLineItem = (id) => {
      setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!selectedJob) { showToast("Select a Job first!", "error"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Create Estimate Header
    const { data: est, error } = await supabase.from('estimates').insert({
        user_id: user.id,
        job_id: selectedJob.id,
        name: mode === 'SIMPLE' ? 'Quick Estimate' : 'Detailed Quote',
        total_cost: cost,
        total_price: price,
        margin_percent: margin,
        status: 'DRAFT'
    }).select().single();

    if (error) { 
        console.error(error);
        showToast("Error saving estimate", "error"); 
        setLoading(false); 
        return; 
    }

    // 2. Save Line Items (If Advanced)
    if (mode === 'ADVANCED' && lineItems.length > 0) {
        const itemsToSave = lineItems.map(i => ({
            estimate_id: est.id,
            user_id: user.id,
            description: i.description,
            quantity: i.quantity,
            unit_cost: i.unit_cost,
            markup_percent: i.markup,
            total_price: (i.unit_cost * i.quantity) * (1 + (i.markup/100))
        }));
        await supabase.from('estimate_items').insert(itemsToSave);
    }

    showToast("Estimate Saved!", "success");
    loadData(); // Refresh history
    setLoading(false);
  };

  const showToast = (msg, type) => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-inter flex flex-col relative overflow-hidden">
      
      {/* HEADER */}
      <header className="p-6 flex justify-between items-start z-10">
        <div className="flex items-center gap-4">
            <Link href="/" className="industrial-card p-3 rounded-xl hover:bg-[#FF6700]/10 transition hover:text-[#FF6700] border border-transparent hover:border-[#FF6700]/30">
                <ArrowLeft size={24} />
            </Link>
            <div>
                <h1 className="text-3xl font-oswald font-bold text-[#FF6700] tracking-wide uppercase">PROFITLOCK</h1>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ESTIMATING SUITE</p>
            </div>
        </div>
        <button onClick={() => setShowMenu(true)} className="industrial-card p-3 rounded-xl hover:text-[#FF6700] transition shadow-[0_0_15px_rgba(255,103,0,0.2)] hover:shadow-[0_0_20px_rgba(255,103,0,0.5)] border border-transparent hover:border-[#FF6700]">
            <Menu size={24} />
        </button>
      </header>

      {/* INVOICE MODE OVERLAY */}
      {isInvoiceMode ? (
          <div className="flex-1 p-6 animate-in slide-in-from-bottom-10 bg-white text-black m-4 rounded-xl shadow-2xl relative flex flex-col">
              <div className="border-b border-gray-200 pb-6 mb-6 flex justify-between items-start">
                  <div>
                      <h2 className="text-4xl font-oswald font-bold uppercase tracking-tighter">INVOICE</h2>
                      <p className="text-sm font-bold text-gray-500 uppercase">{selectedJob?.job_name || "DRAFT"}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-sm font-bold text-gray-400">Date Issued</p>
                      <p className="font-mono font-bold">{new Date().toLocaleDateString()}</p>
                  </div>
              </div>
              
              <div className="flex-1">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="border-b-2 border-black">
                              <th className="py-2 text-xs font-black uppercase tracking-wider text-gray-500">Description</th>
                              <th className="py-2 text-xs font-black uppercase tracking-wider text-gray-500 text-right">Total</th>
                          </tr>
                      </thead>
                      <tbody className="font-mono text-sm">
                          {mode === 'SIMPLE' ? (
                              <>
                                <tr className="border-b border-gray-100"><td className="py-4 font-bold">Materials & Hardware</td><td className="py-4 text-right">${(parseFloat(simpleMaterials)||0).toFixed(2)}</td></tr>
                                <tr className="border-b border-gray-100"><td className="py-4 font-bold">Labor Services</td><td className="py-4 text-right">${((parseFloat(simpleHours)||0)*hourlyRate).toFixed(2)}</td></tr>
                              </>
                          ) : (
                              lineItems.map((item, i) => (
                                  <tr key={i} className="border-b border-gray-100">
                                      <td className="py-4 font-bold">{item.description || "Item"}</td>
                                      <td className="py-4 text-right">${((item.unit_cost * item.quantity) * (1 + (item.markup/100))).toFixed(2)}</td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>

              <div className="bg-gray-100 p-6 rounded-xl flex justify-between items-end mt-6">
                  <div>
                      <p className="text-xs font-black text-gray-400 uppercase">Total Amount Due</p>
                      <p className="text-xs text-gray-400">Payment due upon receipt</p>
                  </div>
                  <p className="text-5xl font-oswald font-bold">${price.toFixed(2)}</p>
              </div>

              <button onClick={() => setIsInvoiceMode(false)} className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition">
                  <X size={20} />
              </button>
          </div>
      ) : (
      /* CALCULATOR MODE */
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6 pb-24">
        
        {/* JOB SELECTOR */}
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Connect to Job</label>
                {!selectedJob && <span className="text-[10px] text-red-500 font-bold animate-pulse">REQUIRED</span>}
            </div>
            <div className="relative">
                <select 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm font-bold uppercase outline-none focus:border-[#FF6700] focus:shadow-[0_0_15px_rgba(255,103,0,0.1)] transition appearance-none text-white"
                    onChange={(e) => setSelectedJob(activeJobs.find(j => j.id === e.target.value))}
                    value={selectedJob?.id || ""}
                >
                    <option value="" disabled>-- Select Active Job --</option>
                    {activeJobs.map(job => (
                        <option key={job.id} value={job.id}>{job.job_name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16}/>
            </div>
        </div>

        {/* MODE TOGGLE */}
        <div className="p-1 bg-zinc-900 rounded-xl flex border border-zinc-800">
            <button onClick={() => setMode('SIMPLE')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${mode === 'SIMPLE' ? 'bg-[#FF6700] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Simple</button>
            <button onClick={() => setMode('ADVANCED')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${mode === 'ADVANCED' ? 'bg-[#FF6700] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Advanced</button>
        </div>

        {/* INPUT AREA */}
        <div className="industrial-card rounded-2xl p-6 border border-zinc-800 space-y-6">
            
            {mode === 'SIMPLE' ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2"><Box size={12}/> Materials Cost</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                            <input type="number" value={simpleMaterials} onChange={e => setSimpleMaterials(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-xl p-4 pl-8 font-mono font-bold outline-none focus:border-[#FF6700] transition text-white" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2"><Clock size={12}/> Labor Hours</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">H</span>
                            <input type="number" value={simpleHours} onChange={e => setSimpleHours(e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-xl p-4 pl-8 font-mono font-bold outline-none focus:border-[#FF6700] transition text-white" placeholder="0" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 animate-in fade-in">
                    {lineItems.map((item, idx) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-6">
                                <input placeholder="Description" value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-lg p-3 text-xs font-bold outline-none focus:border-[#FF6700] text-white" />
                            </div>
                            <div className="col-span-2">
                                <input placeholder="Qty" type="number" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-center outline-none focus:border-[#FF6700] text-white" />
                            </div>
                            <div className="col-span-3">
                                <input placeholder="Cost" type="number" value={item.unit_cost} onChange={(e) => updateLineItem(item.id, 'unit_cost', e.target.value)} className="w-full bg-black/20 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-center outline-none focus:border-[#FF6700] text-white" />
                            </div>
                            <div className="col-span-1 text-center">
                                <button onClick={() => removeLineItem(item.id)} className="text-zinc-600 hover:text-red-500 transition"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addLineItem} className="w-full py-3 border border-dashed border-zinc-700 text-zinc-500 rounded-lg text-xs font-bold hover:text-[#FF6700] hover:border-[#FF6700] transition uppercase">+ Add Line Item</button>
                </div>
            )}

            {/* RESULTS METER */}
            <div className="bg-black/40 rounded-xl p-6 border border-zinc-800/50">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Estimated Profit</p>
                        <p className={`text-2xl font-oswald font-bold ${margin < 20 ? 'text-red-500' : 'text-green-500'}`}>${(price - cost).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Client Quote</p>
                        <p className="text-4xl font-oswald font-bold text-white">${price.toFixed(2)}</p>
                    </div>
                </div>
                
                {/* Visual Meter */}
                <div className="h-3 bg-zinc-900 rounded-full overflow-hidden relative">
                    <div className={`h-full transition-all duration-500 ${margin < 15 ? 'bg-red-600' : margin < 30 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(margin * 2, 100)}%` }}></div>
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-black text-zinc-600 uppercase">
                    <span>Breakeven</span>
                    <span>{margin.toFixed(1)}% Margin</span>
                    <span>50% Target</span>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3">
                <button onClick={() => setIsInvoiceMode(true)} className="flex-1 py-4 bg-zinc-800 text-white font-black text-sm uppercase rounded-xl hover:bg-zinc-700 transition flex items-center justify-center gap-2">
                    <FileText size={18}/> Preview
                </button>
                <button onClick={handleSave} disabled={loading || !selectedJob} className="flex-[2] py-4 bg-[#FF6700] text-black font-black text-sm uppercase rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin"/> : <Save size={18} />} Save Estimate
                </button>
            </div>

        </div>
      </main>
      )}

      {/* SIDEBAR MENU */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowMenu(false)} />
            <div className="w-80 bg-[var(--bg-main)] border-l border-zinc-800 h-full shadow-2xl relative animate-in slide-in-from-right p-6 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-oswald font-bold text-[#FF6700] uppercase">Settings & History</h2>
                    <button onClick={() => setShowMenu(false)}><X className="text-zinc-500 hover:text-white" /></button>
                </div>

                {/* GLOBAL CONFIG */}
                <div className="space-y-4 mb-8">
                    <p className="text-[10px] font-black text-zinc-600 uppercase">Global Defaults</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-bold text-zinc-500 block mb-1">Hourly Rate</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">$</span>
                                <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 pl-6 text-xs font-bold outline-none focus:border-[#FF6700] text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-zinc-500 block mb-1">Markup %</label>
                            <div className="relative">
                                <input type="number" value={defaultMarkup} onChange={e => setDefaultMarkup(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-bold outline-none focus:border-[#FF6700] text-white" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAVED ESTIMATES */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <p className="text-[10px] font-black text-zinc-600 uppercase mb-3">Saved Estimates</p>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        {estimateHistory.map(est => (
                            <div key={est.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-[#FF6700] transition group cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-white">{est.jobs?.job_name || "Unknown Job"}</p>
                                        <p className="text-[10px] text-zinc-500">{new Date(est.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs font-oswald font-bold text-[#FF6700]">${est.total_price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl text-white font-bold animate-in slide-in-from-bottom-10 z-[60] flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
              {toast.type === 'error' ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}
              {toast.msg}
          </div>
      )}

    </div>
  );
}