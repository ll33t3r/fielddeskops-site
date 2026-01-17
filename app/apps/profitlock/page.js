"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { Trash2, Save, Calculator, Loader2, FileText, Printer } from "lucide-react";
import Link from "next/link";

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

  // LOAD BIDS
  useEffect(() => {
    fetchBids();
  }, []);

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
    if (margin < 20) return { color: "#ef4444", label: "🚨 CRITICAL RISK", sublabel: "You are barely breaking even", visualWidth };
    else if (margin < 40) return { color: "#eab308", label: "⚠️ THIN MARGINS", sublabel: "You are surviving, but not growing", visualWidth };
    else if (margin < 60) return { color: "#22c55e", label: "✅ HEALTHY", sublabel: "This is where a real business lives", visualWidth };
    else return { color: "#f97316", label: "💰 AGGRESSIVE", sublabel: "High profit - watch for rejection risk", visualWidth };
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBid = async (id, index) => {
    if(!confirm("Delete?")) return;
    const newHist = [...bidHistory];
    newHist.splice(index, 1);
    setBidHistory(newHist);
    await supabase.from("bids").delete().eq("id", id);
  };

  const showToast = (msg, type) => {
      setToast({message: msg, type});
      setTimeout(()=>setToast(null), 3000);
  };

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap');
        .font-oswald { font-family: 'Oswald', sans-serif; }
        @media print {
            body * { visibility: hidden; }
            #invoice-area, #invoice-area * { visibility: visible; }
            #invoice-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; color: black; }
            .no-print { display: none !important; }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>

      {/* HEADER */}
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center gap-3 no-print">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Calculator className="w-8 h-8 text-[#FF6700]" />
            <h1 className="text-3xl md:text-4xl font-oswald font-bold tracking-wide">
            PROFIT<span className="text-[#FF6700]">LOCK</span>
            </h1>
        </Link>
        <span className="self-end text-xs text-gray-400 ml-2">V7.2 INVOICE</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-12 grid gap-6 md:grid-cols-3">
        
        {/* ===== LEFT COLUMN: THE TOOL ===== */}
        <section className="md:col-span-2">
            
            {/* TABS */}
            <div className="flex gap-2 mb-4 no-print">
                <button 
                    onClick={() => setIsInvoiceMode(false)}
                    className={`px-6 py-2 rounded-t-lg font-bold font-oswald tracking-wide transition-colors ${!isInvoiceMode ? 'bg-[#FF6700] text-[#1a1a1a]' : 'bg-[#262626] text-gray-500 border border-b-0 border-[#404040]'}`}
                >
                    CALCULATOR
                </button>
                <button 
                    onClick={() => setIsInvoiceMode(true)}
                    className={`px-6 py-2 rounded-t-lg font-bold font-oswald tracking-wide flex items-center gap-2 transition-colors ${isInvoiceMode ? 'bg-white text-black' : 'bg-[#262626] text-gray-500 border border-b-0 border-[#404040]'}`}
                >
                    <FileText size={16} /> CLIENT INVOICE
                </button>
            </div>

            {/* VIEW 1: CALCULATOR */}
            {!isInvoiceMode && (
                <div className="bg-[#262626] border border-[#404040] rounded-b-xl rounded-tr-xl p-6 shadow-lg">
                    <h2 className="text-xl font-oswald font-bold text-[#FF6700] mb-4">WORK ORDER</h2>

                    {/* Job Name */}
                    <label className="block text-sm font-semibold mb-1">Job Name (Client & Description)</label>
                    <input type="text" value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="e.g. Smith Residence - Kitchen Repair" maxLength={50} className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition" />

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div><label className="block text-sm font-semibold mb-1">Materials Cost</label><input type="number" value={materialsCost} onChange={(e) => setMaterialsCost(e.target.value)} min="0" step="0.01" className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition" /></div>
                        <div><label className="block text-sm font-semibold mb-1">Labor Hours</label><input type="number" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} min="0" step="0.5" className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition" /></div>
                        <div><label className="block text-sm font-semibold mb-1">Hourly Rate</label><input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} min="0" step="5" className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition" /></div>
                        <div><label className="block text-sm font-semibold mb-1">Markup %</label><input type="number" value={markupPercent} onChange={(e) => setMarkupPercent(e.target.value)} min="0" step="5" className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition" /></div>
                    </div>

                    {/* Cost Breakdown Panel */}
                    <div className="mt-6 bg-[#1a1a1a] border border-[#404040] rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-400">Materials</span><span className="text-right">${materials.toFixed(2)}</span>
                        <span className="text-gray-400">Labor</span><span className="text-right">${labor.toFixed(2)}</span>
                        <span className="text-gray-400">Subtotal</span><span className="text-right">${cost.toFixed(2)}</span>
                        <span className="text-[#FF6700] font-semibold">Markup</span><span className="text-right text-[#FF6700] font-semibold">${markupAmount.toFixed(2)}</span>
                    </div>

                    {/* Final Price Spotlight */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400">FINAL BID PRICE</p>
                        <p className="text-5xl font-oswald font-bold text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]">${finalBid.toFixed(2)}</p>
                    </div>

                    {/* Profit Meter */}
                    <div className="mt-6">
                        <div className="h-10 bg-[#1a1a1a] border-2 border-[#404040] rounded-full overflow-hidden">
                        <div className="h-full flex items-center px-4 text-sm font-oswald tracking-wide transition-all duration-500" style={{ width: `${Math.min(meterInfo.visualWidth, 100)}%`, backgroundColor: meterInfo.color }}>
                            {meterInfo.visualWidth > 15 && `${grossMargin.toFixed(0)}%`}
                        </div>
                        </div>
                        <div className="mt-2 text-center">
                        <p className="text-lg font-oswald" style={{ color: meterInfo.color }}>{meterInfo.label}</p>
                        <p className="text-sm text-gray-400">{meterInfo.sublabel}</p>
                        </div>
                    </div>

                    <button onClick={saveBid} disabled={loading} className="mt-6 w-full h-12 bg-[#FF6700] text-[#1a1a1a] font-oswald font-bold uppercase rounded-lg hover:bg-[#e65c00] transition flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />} Save Bid to Cloud
                    </button>
                </div>
            )}

            {/* VIEW 2: CLIENT INVOICE (With Fixed Labels) */}
            {isInvoiceMode && (
                <div id="invoice-area" className="bg-white text-black rounded-b-xl rounded-tr-xl p-8 shadow-2xl relative min-h-[600px]">
                    <div className="absolute top-8 right-8 text-right">
                        <h2 className="text-2xl font-bold font-oswald tracking-widest text-gray-900">INVOICE</h2>
                        <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="mb-12">
                        {/* THE FIX: Changed Label to "RE: PROJECT / JOB" */}
                        <p className="text-xs font-bold text-gray-400 uppercase">RE: PROJECT / JOB</p>
                        <h1 className="text-3xl font-bold border-b-2 border-black pb-2 inline-block min-w-[300px]">
                            {jobName || "Unnamed Project"}
                        </h1>
                    </div>

                    <table className="w-full mb-8 text-left">
                        <thead>
                            <tr className="border-b border-gray-300">
                                <th className="py-2 font-bold uppercase text-xs text-gray-500">Description</th>
                                <th className="py-2 font-bold uppercase text-xs text-gray-500 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-sm">
                            <tr className="border-b border-gray-100">
                                <td className="py-4">Materials & Supplies</td>
                                <td className="py-4 text-right">${materials.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-4">Labor & Services</td>
                                <td className="py-4 text-right">${(finalBid - materials).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-end">
                        <div className="text-right">
                            <p className="text-sm font-bold uppercase text-gray-500">Total Due</p>
                            <p className="text-4xl font-oswald font-bold text-black">${finalBid.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
                        <p>Thank you for your business.</p>
                    </div>

                    <div className="absolute top-[-50px] right-0 no-print">
                        <button onClick={handlePrint} className="bg-white text-black px-4 py-2 rounded shadow font-bold flex items-center gap-2 hover:bg-gray-200 transition">
                            <Printer size={18} /> PRINT / PDF
                        </button>
                    </div>
                </div>
            )}

        </section>

        {/* ===== RIGHT COLUMN: HISTORY ===== */}
        <aside className="no-print bg-[#262626] border border-[#404040] rounded-xl p-6 shadow-lg max-h-[75vh] overflow-y-auto">
          <h3 className="text-xl font-oswald font-bold text-[#FF6700] mb-4">Saved Bids</h3>
          {bidHistory.length === 0 ? (
            <p className="text-gray-400 text-sm">No bids saved yet.</p>
          ) : (
            <ul className="space-y-3">
              {bidHistory.map((bid, idx) => (
                <li key={bid.id} onClick={() => loadBid(bid)} className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 cursor-pointer hover:border-[#FF6700] hover:scale-[1.02] transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{bid.jobName || "Unnamed Job"}</p>
                      <p className="text-xs text-gray-400">{bid.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{bid.finalPrice}</p>
                      <p className="text-xs text-blue-400">{bid.grossMargin}% margin</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteBid(bid.id, idx); }} className="ml-2 text-red-400 hover:text-red-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-xl text-white font-semibold animate-slide-in" style={{ backgroundColor: toast.type === "success" ? "#22c55e" : "#ef4444" }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
