"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Users, Phone, Mail, FileCheck, ShieldAlert, ShieldCheck, 
  Plus, Search, Star, Trash2, ArrowLeft, Briefcase 
} from "lucide-react";
import Link from "next/link";

export default function SubHub() {
  const supabase = createClient();
  
  // STATE
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTrade, setFilterTrade] = useState("ALL");
  
  // FORM
  const [form, setForm] = useState({
    company_name: "", contact_name: "", trade: "General", 
    phone: "", email: "", w9_on_file: false, 
    insurance_expiry: "", rating: 3, notes: ""
  });

  const TRADES = ["General", "Electrical", "Plumbing", "HVAC", "Framing", "Drywall", "Painting", "Roofing", "Masonry"];

  useEffect(() => {
    loadSubs();
  }, []);

  const loadSubs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("subcontractors")
      .select("*")
      .order("company_name", { ascending: true });
      
    if (data) setSubs(data);
    setLoading(false);
  };

  const saveSub = async () => {
    if (!form.company_name) return alert("Company Name Required");
    const { data: { user } } = await supabase.auth.getUser();

    const payload = { ...form, user_id: user.id };
    
    // Convert empty date string to null for DB
    if (payload.insurance_expiry === "") payload.insurance_expiry = null;

    const { data, error } = await supabase.from("subcontractors").insert(payload).select().single();

    if (data) {
        setSubs([...subs, data]);
        setShowAdd(false);
        setForm({ company_name: "", contact_name: "", trade: "General", phone: "", email: "", w9_on_file: false, insurance_expiry: "", rating: 3, notes: "" });
    } else {
        alert("Error saving: " + error.message);
    }
  };

  const deleteSub = async (id) => {
    if(!confirm("Remove this subcontractor?")) return;
    await supabase.from("subcontractors").delete().eq("id", id);
    setSubs(subs.filter(s => s.id !== id));
  };

  // Helper: Check if insurance is expired
  const isExpired = (dateString) => {
    if (!dateString) return false; // Treat missing as "Unknown" (handled visually)
    return new Date(dateString) < new Date();
  };

  const filteredSubs = subs.filter(s => filterTrade === "ALL" || s.trade === filterTrade);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter pb-24">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
        .font-oswald { font-family: "Oswald", sans-serif; }
      `}</style>

      {/* HEADER */}
      <header className="max-w-xl mx-auto px-6 pt-8 pb-6 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-white"><ArrowLeft /></Link>
        <div>
            <h1 className="text-3xl font-oswald font-bold tracking-wide flex items-center gap-2">
                SUB<span className="text-[#FF6700]">HUB</span> <Users size={24} className="text-[#FF6700]"/>
            </h1>
            <p className="text-xs text-gray-500">Subcontractor & Compliance Database</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 space-y-6">
        
        {/* TRADE FILTER */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setFilterTrade("ALL")} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${filterTrade === "ALL" ? "bg-[#FF6700] text-black border-[#FF6700]" : "border-[#404040] text-gray-400"}`}>ALL</button>
            {TRADES.filter(t => t !== "General").map(t => (
                <button key={t} onClick={() => setFilterTrade(t)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${filterTrade === t ? "bg-[#FF6700] text-black border-[#FF6700]" : "border-[#404040] text-gray-400"}`}>{t.toUpperCase()}</button>
            ))}
        </div>

        {/* ADD NEW SUB FORM */}
        {showAdd ? (
            <div className="bg-[#262626] border border-[#FF6700] rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold mb-3 text-sm font-oswald">NEW SUBCONTRACTOR</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input placeholder="Company Name" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="col-span-2 bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]"/>
                    <input placeholder="Contact Person" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]"/>
                    <select value={form.trade} onChange={e => setForm({...form, trade: e.target.value})} className="bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]">
                        {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]"/>
                    <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]"/>
                </div>

                <div className="border-t border-[#404040] pt-3 mb-3">
                    <p className="text-xs text-gray-500 font-bold mb-2 uppercase">Compliance</p>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm flex items-center gap-2"><FileCheck size={16} className={form.w9_on_file ? "text-green-500" : "text-gray-500"}/> W-9 On File?</label>
                        <input type="checkbox" checked={form.w9_on_file} onChange={e => setForm({...form, w9_on_file: e.target.checked})} className="w-5 h-5 accent-[#FF6700]"/>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm flex items-center gap-2"><ShieldCheck size={16} className="text-gray-500"/> Insurance Exp.</label>
                        <input type="date" value={form.insurance_expiry} onChange={e => setForm({...form, insurance_expiry: e.target.value})} className="bg-[#1a1a1a] border border-[#404040] rounded p-1 text-xs text-white"/>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={saveSub} className="flex-1 bg-[#FF6700] text-black font-bold py-3 rounded hover:bg-[#e55c00]">SAVE SUB</button>
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white">CANCEL</button>
                </div>
            </div>
        ) : (
            <button onClick={() => setShowAdd(true)} className="w-full border-2 border-dashed border-[#404040] text-gray-500 font-bold py-3 rounded-xl hover:border-[#FF6700] hover:text-[#FF6700] transition flex items-center justify-center gap-2">
                <Plus size={20}/> ADD SUBCONTRACTOR
            </button>
        )}

        {/* SUB LIST */}
        <div className="space-y-4">
            {filteredSubs.map(sub => (
                <div key={sub.id} className="bg-[#262626] border border-[#404040] p-4 rounded-xl relative group hover:border-[#FF6700] transition-colors">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-lg text-white leading-none">{sub.company_name}</h3>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Briefcase size={12}/> {sub.trade} • {sub.contact_name}</p>
                        </div>
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={12} className={i < sub.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-600"} />
                            ))}
                        </div>
                    </div>

                    {/* Compliance Badges */}
                    <div className="flex gap-2 mb-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 ${sub.w9_on_file ? "bg-green-900/20 text-green-500 border-green-900" : "bg-red-900/20 text-red-500 border-red-900"}`}>
                            <FileCheck size={10}/> {sub.w9_on_file ? "W-9 OK" : "NO W-9"}
                        </span>
                        
                        {sub.insurance_expiry ? (
                            isExpired(sub.insurance_expiry) ? (
                                <span className="text-[10px] font-bold bg-red-900/20 text-red-500 border border-red-900 px-2 py-1 rounded flex items-center gap-1">
                                    <ShieldAlert size={10}/> INS EXPIRED
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold bg-green-900/20 text-green-500 border border-green-900 px-2 py-1 rounded flex items-center gap-1">
                                    <ShieldCheck size={10}/> INSURED
                                </span>
                            )
                        ) : (
                            <span className="text-[10px] font-bold bg-gray-700 text-gray-300 border border-gray-600 px-2 py-1 rounded flex items-center gap-1">
                                <ShieldAlert size={10}/> NO INS DATE
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2">
                        <a href={`tel:${sub.phone}`} className="bg-[#333] hover:bg-[#FF6700] hover:text-black text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition">
                            <Phone size={14}/> CALL
                        </a>
                        <a href={`mailto:${sub.email}`} className="bg-[#333] hover:bg-[#FF6700] hover:text-black text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition">
                            <Mail size={14}/> EMAIL
                        </a>
                        <button onClick={() => deleteSub(sub.id)} className="bg-[#333] hover:bg-red-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition">
                            <Trash2 size={14}/>
                        </button>
                    </div>

                </div>
            ))}
        </div>

      </main>
    </div>
  );
}
