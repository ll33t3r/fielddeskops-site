"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { Trash2, Save, Calculator, Loader2 } from "lucide-react";
import Link from "next/link"; // Added for navigation

export default function ProfitLock() {
  const supabase = createClient();
  
  // =====================
  // 1. THE ENGINE (Logic)
  // =====================
  
  // STATE
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

    const { data, error } = await supabase
      .from("bids")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
      return;
    }

    const mappedBids = data.map(bid => {
      const cost = Number(bid.materials) + (Number(bid.hours) * Number(bid.rate));
      const finalBid = Number(bid.sale_price);
      const grossMargin = finalBid > 0 ? ((finalBid - cost) / finalBid) * 100 : 0;
      
      const dateObj = new Date(bid.created_at);
      const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        id: bid.id,
        jobName: bid.project_name,
        materials: Number(bid.materials),
        hours: Number(bid.hours),
        hourlyRate: Number(bid.rate),
        markup: Number(bid.margin),
        cost: cost,
        finalPrice: `$${finalBid.toFixed(2)}`,
        grossMargin: Math.round(grossMargin),
        date: dateStr
      };
    });

    setBidHistory(mappedBids);
  };

  // MATH CALCULATIONS
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

  // SAVE LOGIC
  const saveBid = async () => {
    if (!jobName.trim()) { setToast({message: "Enter job name", type: "error"}); setTimeout(()=>setToast(null), 2000); return; }
    
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("bids").insert({
      user_id: user.id,
      project_name: jobName,
      materials: materials,
      hours: hours,
      rate: rate,
      margin: markup,
      sale_price: finalBid,
      profit: finalBid - cost
    });

    if (error) {
       setToast({message: "Error saving", type: "error"});
    } else {
      fetchBids();
      setJobName("");
      setToast({message: "✅ Bid Saved to Cloud", type: "success"});
    }
    setLoading(false);
    setTimeout(()=>setToast(null), 2000);
  };

  const loadBidIntoCalculator = (bid) => {
    setJobName(bid.jobName);
    setMaterialsCost(bid.materials);
    setLaborHours(bid.hours);
    setHourlyRate(bid.hourlyRate);
    setMarkupPercent(bid.markup);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteBid = async (id, index) => {
    if(!confirm("Delete this bid?")) return;
    
    // Optimistic UI update
    const newHistory = [...bidHistory];
    newHistory.splice(index, 1);
    setBidHistory(newHistory);

    await supabase.from("bids").delete().eq("id", id);
  };


  // =====================
  // 2. THE SKIN (UI)
  // =====================
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap');
        .font-oswald { font-family: 'Oswald', sans-serif; }
      `}</style>

      {/* ===== HEADER ===== */}
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Calculator className="w-8 h-8 text-[#FF6700]" />
            <h1 className="text-3xl md:text-4xl font-oswald font-bold tracking-wide">
            PROFIT<span className="text-[#FF6700]">LOCK</span>
            </h1>
        </Link>
        <span className="self-end text-xs text-gray-400 ml-2">V6 PRO</span>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-12 grid gap-6 md:grid-cols-3">
        {/* ===== LEFT COLUMN : CALCULATOR ===== */}
        <section className="md:col-span-2 bg-[#262626] border border-[#404040] rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-oswald font-bold text-[#FF6700] mb-4">WORK ORDER</h2>

          {/* Job Name */}
          <label className="block text-sm font-semibold mb-1">Job Name</label>
          <input
            type="text"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            placeholder="e.g. Kitchen Sink Repair"
            maxLength={50}
            className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition"
          />

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Materials Cost</label>
              <input
                type="number"
                value={materialsCost}
                onChange={(e) => setMaterialsCost(e.target.value)}
                min="0"
                step="0.01"
                className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Labor Hours</label>
              <input
                type="number"
                value={laborHours}
                onChange={(e) => setLaborHours(e.target.value)}
                min="0"
                step="0.5"
                className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Hourly Rate</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                min="0"
                step="5"
                className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Markup %</label>
              <input
                type="number"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                min="0"
                step="5"
                className="w-full h-12 px-4 bg-[#1a1a1a] border-2 border-[#404040] rounded-lg focus:border-[#FF6700] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Cost Breakdown Panel */}
          <div className="mt-6 bg-[#1a1a1a] border border-[#404040] rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-400">Materials</span>
            <span className="text-right">${materials.toFixed(2)}</span>
            <span className="text-gray-400">Labor</span>
            <span className="text-right">${labor.toFixed(2)}</span>
            <span className="text-gray-400">Subtotal</span>
            <span className="text-right">${cost.toFixed(2)}</span>
            <span className="text-[#FF6700] font-semibold">Markup</span>
            <span className="text-right text-[#FF6700] font-semibold">${markupAmount.toFixed(2)}</span>
          </div>

          {/* Final Price Spotlight */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">FINAL BID PRICE</p>
            <p className="text-5xl font-oswald font-bold text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]">
              ${finalBid.toFixed(2)}
            </p>
          </div>

          {/* Profit Meter */}
          <div className="mt-6">
            <div className="h-10 bg-[#1a1a1a] border-2 border-[#404040] rounded-full overflow-hidden">
              <div
                className="h-full flex items-center px-4 text-sm font-oswald tracking-wide transition-all duration-500"
                style={{ width: `${Math.min(meterInfo.visualWidth, 100)}%`, backgroundColor: meterInfo.color }}
              >
                {meterInfo.visualWidth > 15 && `${grossMargin.toFixed(0)}%`}
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-lg font-oswald" style={{ color: meterInfo.color }}>{meterInfo.label}</p>
              <p className="text-sm text-gray-400">{meterInfo.sublabel}</p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveBid}
            disabled={loading}
            className="mt-6 w-full h-12 bg-[#FF6700] text-[#1a1a1a] font-oswald font-bold uppercase rounded-lg hover:bg-[#e65c00] transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
            Save Bid to Cloud
          </button>
        </section>

        {/* ===== RIGHT COLUMN : HISTORY ===== */}
        <aside className="bg-[#262626] border border-[#404040] rounded-xl p-6 shadow-lg max-h-[75vh] overflow-y-auto">
          <h3 className="text-xl font-oswald font-bold text-[#FF6700] mb-4">Recent Bids</h3>
          {bidHistory.length === 0 ? (
            <p className="text-gray-400 text-sm">No bids saved yet.</p>
          ) : (
            <ul className="space-y-3">
              {bidHistory.map((bid, idx) => (
                <li
                  key={bid.id}
                  onClick={() => loadBidIntoCalculator(bid)}
                  className="bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 cursor-pointer hover:border-[#FF6700] hover:scale-[1.02] transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{bid.jobName || "Unnamed Job"}</p>
                      <p className="text-xs text-gray-400">{bid.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{bid.finalPrice}</p>
                      <p className="text-xs text-blue-400">{bid.grossMargin}% margin</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBid(bid.id, idx);
                      }}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
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
        <div
          className="fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-xl text-white font-semibold animate-slide-in"
          style={{ backgroundColor: toast.type === "success" ? "#22c55e" : "#ef4444" }}
        >
          {toast.message}
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
