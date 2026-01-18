"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { Trash2, Save, Calculator, Loader2, FileText, Printer, Settings, ChevronDown } from "lucide-react";
import Header from "../../components/Header";

export default function ProfitLock() {
  const supabase = createClient();
  
  // STATE
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  const [jobName, setJobName] = useState("");
  const [materialsCost, setMaterialsCost] = useState(0);
  const [laborHours, setLaborHours] = useState(0);
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
    const { data } = await supabase.from("bids").select("*").order("created_at", { ascending: false });
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
                date: new Date(bid.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            };
        });
        setBidHistory(mapped);
    }
  };

  // MATH
  const materials = parseFloat(materialsCost) || 0;
  const hours = parseFloat(laborHours) || 0;
  const rate = parseFloat(hourlyRate) || 75;
  const markup = parseFloat(markupPercent) || 20;
  const labor = hours * rate;
  const cost = materials + labor;
  const markupAmount = cost * (markup / 100);
  const finalBid = cost + markupAmount;
  const grossMargin = finalBid > 0 ? ((finalBid - cost) / finalBid) * 100 : 0;

  // METER LOGIC
  const getProfitMeterInfo = (margin) => {
    const visualWidth = Math.min(margin * 1.6, 100);
    if (margin < 20) return { color: "#ef4444", label: "⚠️ CRITICAL RISK", sublabel: "You are barely breaking even", visualWidth };
    else if (margin < 40) return { color: "#eab308", label: "⚠️ THIN MARGINS", sublabel: "You are surviving, but not growing", visualWidth };
    else if (margin < 60) return { color: "#22c55e", label: "✅ HEALTHY", sublabel: "This is where a real business lives", visualWidth };
    else return { color: "#f97316", label: "🚀 AGGRESSIVE", sublabel: "High profit - watch for rejection risk", visualWidth };
  };
  const meterInfo = getProfitMeterInfo(grossMargin);

  // SAVE
  const saveBid = async () => {
    if (!jobName.trim()) { showToast("Enter job name", "error"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    
    const { error } = await supabase.from("bids").insert({
      user_id: user.id,
      project_name: jobName,
      materials, hours, rate, margin: markup,
      sale_price: finalBid, profit: finalBid - cost
    });
    
    if (!error) { fetchBids(); showToast("✅ Saved to Cloud", "success"); }
    else { showToast(error.message, "error"); }
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBid = async (id, index) => {
    if(!confirm("Delete?")) return;
    const newHist = [...bidHistory];
    newHist.splice(index, 1);
    setBidHistory(newHist);
    await supabase.from("bids").delete().eq("id", id);
  };

  const showToast = (msg, type) => { setToast({message: msg, type}); setTimeout(()=>setToast(null), 3000); };
  const handlePrint = () => { window.print(); };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter pb-20">
      <style jsx global>{`
        @media print {
            body * { visibility: hidden; }
            #invoice-area, #invoice-area * { visibility: visible; }
            #invoice-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; color: black; }
            .no-print { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <Header title="PROFITLOCK" backLink="/" />

      <main className="max-w-6xl mx-auto px-6 grid gap-6 md:grid-cols-3 pt-4">
        
        {/* ===== LEFT COLUMN: THE TOOL ===== */}
        <section className="md:col-span-2 space-y-4">
            
            {/* TABS */}
            <div className="flex gap-2 no-print">
                <button 
                    onClick={() => setIsInvoiceMode(false)}
                    className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide transition-all ${!isInvoiceMode ? 'bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.4)]' : 'glass-btn text-gray-500'}`}
                >
                    CALCULATOR
                </button>
                <button 
                    onClick={() => setIsInvoiceMode(true)}
                    className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide flex items-center justify-center gap-2 transition-all ${isInvoiceMode ? 'bg-white text-black' : 'glass-btn text-gray-500'}`}
                >
                    <FileText size={16} /> INVOICE VIEW
                </button>
            </div>

            {/* VIEW 1: CALCULATOR */}
            {!isInvoiceMode && (
                <div className="glass-panel rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-left-4">
                    <h2 className="text-xl font-oswald font-bold text-[#FF6700]">WORK ESTIMATE</h2>

                    {/* Job Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Project Name</label>
                      <input type="text" value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="e.g. Smith Residence - Kitchen" className="input-field rounded-lg p-3 w-full font-bold" />
                    </div>

                    {/* Materials & Labor Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Materials ($)</label>
                          <input type="number" value={materialsCost} onChange={(e) => setMaterialsCost(e.target.value)} min="0" step="0.01" className="input-field rounded-lg p-3 w-full" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Labor Hours</label>
                          <input type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} min="0" step="0.5" className="input-field rounded-lg p-3 w-full" />
                        </div>
                    </div>

                    {/* Settings / Sensitive Data (HIDDEN BY DEFAULT) */}
                    <div className="bg-black/20 rounded-lg overflow-hidden border border-white/5">
                        <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition text-gray-400">
                          <span className="font-bold text-xs uppercase flex items-center gap-2"><Settings size={14} /> Profit Settings</span>
                          <ChevronDown size={16} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                        </button>

                        {showSettings && (
                          <div className="p-4 space-y-4 border-t border-white/5 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Hourly Rate</label>
                                    <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="input-field rounded p-2 w-full text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Markup %</label>
                                    <input type="number" value={markupPercent} onChange={(e) => setMarkupPercent(e.target.value)} className="input-field rounded p-2 w-full text-sm" />
                                </div>
                            </div>

                            {/* Profit Meter */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Margin Analysis</p>
                              <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-500" style={{ width: `${Math.min(meterInfo.visualWidth, 100)}%`, backgroundColor: meterInfo.color }}></div>
                              </div>
                              <p className="text-xs mt-1 font-bold" style={{ color: meterInfo.color }}>{meterInfo.label} ({grossMargin.toFixed(0)}%)</p>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Final Price Spotlight */}
                    <div className="bg-gradient-to-r from-green-900/30 to-green-900/10 border border-green-500/30 rounded-xl p-6 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 bg-green-500/10 rounded-full translate-x-4 -translate-y-4 blur-xl"></div>
                        <p className="text-xs text-green-400 uppercase tracking-widest mb-1 font-bold">Recommended Bid Price</p>
                        <p className="text-5xl font-oswald font-bold text-white drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] relative z-10">${finalBid.toFixed(2)}</p>
                        <p className="text-xs text-gray-400 mt-2 relative z-10">Total Cost: ${cost.toFixed(2)} • Profit: ${(finalBid - cost).toFixed(2)}</p>
                    </div>

                    <button onClick={saveBid} disabled={loading} className="w-full h-14 bg-[#FF6700] text-black font-bold text-lg uppercase rounded-xl shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-[1.02] transition flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} SAVE TO CLOUD
                    </button>
                </div>
            )}

            {/* VIEW 2: CLIENT INVOICE */}
            {isInvoiceMode && (
                <div id="invoice-area" className="bg-white text-black rounded-xl p-8 shadow-2xl min-h-[600px] flex flex-col relative animate-in fade-in">
                    
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">INVOICE</p>
                        <h1 className="text-3xl font-oswald font-bold text-gray-900">{jobName || "Draft Project"}</h1>
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

                    {/* Print Button */}
                    <button onClick={handlePrint} className="absolute top-8 right-8 no-print bg-black text-white px-4 py-2 rounded shadow font-bold flex items-center gap-2 hover:bg-gray-800 transition">
                        <Printer size={16} /> Print PDF
                    </button>
                </div>
            )}
        </section>

        {/* ===== RIGHT COLUMN: HISTORY ===== */}
        <aside className="no-print">
          <div className="glass-panel rounded-xl p-5 sticky top-24 border border-white/10">
            <h3 className="text-sm font-bold text-[#FF6700] uppercase tracking-wider mb-4 flex items-center gap-2"><Save size={14}/> Saved Bids</h3>
            
            {bidHistory.length === 0 ? (
              <p className="text-gray-500 text-xs italic">No saved history found.</p>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                {bidHistory.map((bid, idx) => (
                  <div key={bid.id} onClick={() => loadBid(bid)} className="bg-white/5 border border-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 hover:border-[#FF6700]/50 transition group relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white text-sm truncate w-32">{bid.jobName || "No Name"}</p>
                        <p className="text-[10px] text-gray-500">{bid.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-oswald font-bold">{bid.finalPrice}</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteBid(bid.id, idx); }} className="absolute -top-2 -right-2 bg-red-900/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

      </main>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-xl text-white font-bold animate-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
