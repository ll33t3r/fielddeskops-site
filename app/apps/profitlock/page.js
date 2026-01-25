'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { Trash2, Save, FileText, Share, Settings, ChevronDown, Loader2, Menu, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfitLock() {
  const supabase = createClient();
  
  // STATE
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  const [jobName, setJobName] = useState('');
  const [materialsCost, setMaterialsCost] = useState(0);
  const [laborHours, setLaborHours] = useState(0);
  
  // UI STATE
  const [showMenu, setShowMenu] = useState(false); 

  // HIDDEN VARIABLES (Defaults)
  const [hourlyRate, setHourlyRate] = useState(75);
  const [markupPercent, setMarkupPercent] = useState(20);
  
  const [bidHistory, setBidHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // LOAD BIDS
  useEffect(() => { fetchBids(); }, []);

  const fetchBids = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('bids').select('*').order('created_at', { ascending: false });
    if (data) {
        const mapped = data.map(bid => {
            const cost = Number(bid.materials) + (Number(bid.hours) * Number(bid.rate));
            const finalBid = Number(bid.sale_price);
            const grossMargin = finalBid > 0 ? ((finalBid - cost) / finalBid) * 100 : 0;
            return {
                id: bid.id,
                jobName: bid.project_name,
                materials: Number(bid.materials),
                hours: Number(bid.hours),
                rate: Number(bid.rate),
                markup: Number(bid.margin),
                cost: cost,
                finalPrice: `$${finalBid.toFixed(2)}`,
                grossMargin: Math.round(grossMargin),
                date: new Date(bid.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            };
        });
        setBidHistory(mapped);
    }
  };

  // MATH ENGINE
  const materials = parseFloat(materialsCost) || 0;
  const hours = parseFloat(laborHours) || 0;
  const rate = parseFloat(hourlyRate) || 75;
  const markup = parseFloat(markupPercent) || 20;
  
  const laborCost = hours * rate; // Internal Cost
  const totalInternalCost = materials + laborCost;
  const markupAmount = totalInternalCost * (markup / 100);
  const finalBid = totalInternalCost + markupAmount;
  const netProfit = finalBid - totalInternalCost;
  const grossMargin = finalBid > 0 ? (netProfit / finalBid) * 100 : 0;

  // METER LOGIC
  const getProfitMeterInfo = (margin) => {
    const visualWidth = Math.min(margin * 1.6, 100);
    if (margin < 20) return { color: '#ef4444', label: 'RISKY', width: visualWidth };
    else if (margin < 40) return { color: '#eab308', label: 'OK', width: visualWidth };
    else return { color: '#22c55e', label: 'HEALTHY', width: visualWidth };
  };
  const meterInfo = getProfitMeterInfo(grossMargin);

  // SAVE TO DB
  const saveBid = async () => {
    if (!jobName.trim()) { showToast('Enter job name', 'error'); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    
    const { error } = await supabase.from('bids').insert({
      user_id: user.id,
      project_name: jobName,
      materials, hours, rate, margin: markup,
      sale_price: finalBid, profit: netProfit
    });
    
    if (!error) { fetchBids(); showToast('✅ Saved', 'success'); }
    else { showToast(error.message, 'error'); }
    setLoading(false);
  };

  const loadBid = (bid) => {
    setJobName(bid.jobName);
    setMaterialsCost(bid.materials);
    setLaborHours(bid.hours);
    setHourlyRate(bid.rate);
    setMarkupPercent(bid.markup);
    setIsInvoiceMode(false);
    setShowSettings(false);
    setShowMenu(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBid = async (id, index) => {
    if(!confirm('Delete?')) return;
    const newHist = [...bidHistory];
    newHist.splice(index, 1);
    setBidHistory(newHist);
    await supabase.from('bids').delete().eq('id', id);
  };

  const showToast = (msg, type) => { setToast({message: msg, type}); setTimeout(()=>setToast(null), 3000); };
  
  // SHARE / PRINT HANDLER
  const handleShare = async () => { 
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Invoice: ${jobName}`,
                text: `Invoice for ${jobName} - Total: $${finalBid.toFixed(2)}`,
                url: window.location.href 
            });
        } catch (err) {
            window.print(); 
        }
    } else {
        window.print(); 
    }
  };

  return (
    <div className="flex flex-col p-4 max-w-xl mx-auto space-y-6 relative">
      <style jsx global>{`
        @media print {
            body * { visibility: hidden; }
            #invoice-area, #invoice-area * { visibility: visible; }
            #invoice-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; color: black; box-shadow: none; }
            .no-print { display: none !important; }
        }
      `}</style>

      {/* 1. FLUSH HEADER (With Hardcoded Orange Title) */}
      <div className="flex items-center gap-4 no-print">
        <Link href="/" className="industrial-card p-2 rounded-lg hover:text-[#FF6700] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700]">ProfitLock</h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest opacity-60">BIDS & INVOICES</p>
        </div>
      </div>

      {/* === PRIVACY MENU BUTTON === */}
      <button 
        onClick={() => setShowMenu(true)} 
        className="absolute top-4 right-4 z-40 p-2 bg-white/10 rounded-full hover:bg-white/20 transition no-print text-[var(--text-main)]"
      >
        <Menu size={24} />
      </button>

      {/* === SIDEBAR DRAWER (HISTORY) === */}
      <div className={`fixed inset-y-0 right-0 w-80 industrial-card shadow-2xl transform transition-transform duration-300 z-50 ${showMenu ? 'translate-x-0' : 'translate-x-full'} no-print border-l-2`}>
        <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-oswald font-bold text-xl text-[#FF6700] uppercase flex items-center gap-2"><Save size={18}/> Saved Bids</h2>
                <button onClick={() => setShowMenu(false)} className="text-[var(--text-sub)] hover:text-[var(--text-main)]"><X/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {bidHistory.length === 0 ? (
                  <p className="text-[var(--text-sub)] text-xs italic text-center py-10">No saved history.</p>
                ) : (
                  bidHistory.map((bid, idx) => (
                    <div key={bid.id} onClick={() => loadBid(bid)} className="bg-white/5 border border-[var(--border-color)] rounded-lg p-3 cursor-pointer hover:bg-white/10 hover:border-[#FF6700]/50 transition group relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-[var(--text-main)] text-sm truncate w-40">{bid.jobName || 'No Name'}</p>
                            <p className="text-[10px] text-[var(--text-sub)]">{bid.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-oswald font-bold">{bid.finalPrice}</p>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteBid(bid.id, idx); }} className="absolute -top-2 -right-2 bg-red-900/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg">
                          <Trash2 size={12} />
                        </button>
                    </div>
                  ))
                )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-center opacity-30 text-[10px] uppercase font-bold tracking-widest text-[var(--text-sub)]">
                FieldDeskOps Protected
            </div>
        </div>
      </div>

        {/* TABS */}
        <div className="flex gap-2 no-print mb-6">
            <button 
                onClick={() => setIsInvoiceMode(false)}
                className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide transition-all ${!isInvoiceMode ? 'bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.4)]' : 'industrial-card text-[var(--text-sub)]'}`}
            >
                CALCULATOR
            </button>
            <button 
                onClick={() => setIsInvoiceMode(true)}
                className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide flex items-center justify-center gap-2 transition-all ${isInvoiceMode ? 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-lg' : 'industrial-card text-[var(--text-sub)]'}`}
            >
                <FileText size={16} /> INVOICE
            </button>
        </div>

        {/* VIEW 1: CALCULATOR (STEALTH MODE) */}
        {!isInvoiceMode && (
            <div className="industrial-card rounded-xl p-6 space-y-6 animate-in fade-in">
                
                {/* Job Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--text-sub)] mb-1">Job Name</label>
                  <input type="text" value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="e.g. Smith - Water Heater" className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full font-bold outline-none" />
                </div>

                {/* Materials & Labor Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--text-sub)] mb-1">Materials ($)</label>
                      <input type="number" value={materialsCost} onChange={(e) => setMaterialsCost(e.target.value)} min="0" step="0.01" className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--text-sub)] mb-1">Labor Hours</label>
                      <input type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} min="0" step="0.5" className="bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-3 w-full outline-none" />
                    </div>
                </div>

                {/* FINAL PRICE */}
                <div className="bg-black/20 border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-xs text-[var(--text-sub)] uppercase tracking-widest mb-1 font-bold">ESTIMATED TOTAL</p>
                    <p className="text-5xl font-oswald font-bold text-[var(--text-main)] tracking-wide">${finalBid.toFixed(2)}</p>
                </div>

                {/* --- THE SECRET SETTINGS MENU --- */}
                <div className="bg-black/20 rounded-lg overflow-hidden border border-white/5">
                    <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition text-[var(--text-sub)]">
                      <span className="font-bold text-xs uppercase flex items-center gap-2"><Settings size={14} /> Settings</span>
                      <ChevronDown size={16} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Hidden Area: Rates & Profits */}
                    {showSettings && (
                      <div className="p-4 space-y-4 border-t border-white/5 animate-in slide-in-from-top-2 bg-[#050505]">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Hourly Rate ($)</label>
                                <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="bg-[#1a1a1a] text-white border border-gray-800 rounded p-2 w-full text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Markup %</label>
                                <input type="number" value={markupPercent} onChange={(e) => setMarkupPercent(e.target.value)} className="bg-[#1a1a1a] text-white border border-gray-800 rounded p-2 w-full text-sm outline-none" />
                            </div>
                        </div>

                        {/* Internal Data */}
                        <div className="pt-2 border-t border-white/10 mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Internal Cost:</span>
                                <span>${totalInternalCost.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-green-500">
                                <span>Net Profit:</span>
                                <span>${netProfit.toFixed(2)} ({grossMargin.toFixed(0)}%)</span>
                            </div>
                            {/* Meter */}
                            <div className="h-1 bg-[#333] rounded-full overflow-hidden mt-2">
                                <div className="h-full transition-all duration-500" style={{ width: `${Math.min(meterInfo.width, 100)}%`, backgroundColor: meterInfo.color }}></div>
                            </div>
                        </div>
                      </div>
                    )}
                </div>

                <button onClick={saveBid} disabled={loading} className="w-full h-14 bg-[#FF6700] text-black font-bold text-lg uppercase rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-[1.02] transition flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} SAVE TO CLOUD
                </button>
            </div>
        )}

        {/* VIEW 2: CLIENT INVOICE (Paper is always white) */}
        {isInvoiceMode && (
            <div className="animate-in fade-in">
                {/* The Paper */}
                <div id="invoice-area" className="bg-white text-black rounded-xl p-8 shadow-2xl min-h-[600px] flex flex-col relative mb-24 border-2 border-black">
                    
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">INVOICE</p>
                        <h1 className="text-3xl font-oswald font-bold text-gray-900">{jobName || 'Draft Project'}</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Date Issued</p>
                        <p className="font-bold">{new Date().toLocaleDateString()}</p>
                    </div>
                    </div>

                    {/* Line Items */}
                    <table className="w-full mb-8 flex-1">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="py-2 text-left text-xs uppercase font-bold text-gray-600">Description</th>
                                <th className="py-2 text-right text-xs uppercase font-bold text-gray-600">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-gray-100">
                                <td className="py-4 font-medium">Materials & Supplies</td>
                                <td className="py-4 text-right">${materials.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-4 font-medium">Labor & Services</td>
                                <td className="py-4 text-right">${(finalBid - materials).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Total */}
                    <div className="bg-gray-100 rounded-lg p-4 flex justify-between items-end">
                    <span className="text-sm font-bold text-gray-600 uppercase">Total Due</span>
                    <span className="text-4xl font-oswald font-bold">${finalBid.toFixed(2)}</span>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-400">
                        <p>Thank you for your business.</p>
                    </div>
                </div>

                {/* Floating Action Bar */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-black/90 border-t border-white/10 no-print z-50 flex gap-3 justify-center shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
                    <button onClick={() => setIsInvoiceMode(false)} className="bg-white/10 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white/20">
                        <ArrowLeft size={18} /> EDIT
                    </button>
                    <button onClick={handleShare} className="bg-[#FF6700] text-black px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition flex items-center gap-2">
                        <Share size={18} /> SHARE / PRINT
                    </button>
                </div>
            </div>
        )}

        {/* BRANDING FOOTER (MAIN APP) */}
        {!isInvoiceMode && (
             <div className="mt-12 text-center opacity-40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-sub)]">
                    POWERED BY FIELDDESKOPS
                </p>
            </div>
        )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-xl text-white font-bold animate-in slide-in-from-bottom-5 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
