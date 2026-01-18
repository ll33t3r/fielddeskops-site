"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { Users, Phone, Mail, FileCheck, ShieldAlert, ShieldCheck, Plus, Trash2 } from "lucide-react";
import Header from "../../components/Header";

export default function SubHub() {
  const supabase = createClient();
  const [subs, setSubs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTrade, setFilterTrade] = useState("ALL");
  const [form, setForm] = useState({ company_name: "", contact_name: "", trade: "General", phone: "", email: "", w9_on_file: false, insurance_expiry: "", rating: 3 });
  
  const TRADES = ["General", "Electrical", "Plumbing", "HVAC", "Framing", "Drywall", "Painting"];

  useEffect(() => { loadSubs(); }, []);

  const loadSubs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("subcontractors").select("*").order("company_name");
    if (data) setSubs(data);
  };

  const saveSub = async () => {
    if (!form.company_name) return alert("Name Required");
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...form, user_id: user.id, insurance_expiry: form.insurance_expiry || null };
    const { data } = await supabase.from("subcontractors").insert(payload).select().single();
    if (data) { setSubs([...subs, data]); setShowAdd(false); setForm({ company_name: "", contact_name: "", trade: "General", phone: "", email: "", w9_on_file: false, insurance_expiry: "", rating: 3 }); }
  };

  const deleteSub = async (id) => {
    if(!confirm("Remove sub?")) return;
    await supabase.from("subcontractors").delete().eq("id", id);
    setSubs(subs.filter(s => s.id !== id));
  };

  const filteredSubs = subs.filter(s => filterTrade === "ALL" || s.trade === filterTrade);

  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter pb-24">
      <Header title="SUBHUB" backLink="/" />
      <main className="max-w-xl mx-auto px-6 space-y-6 pt-4">
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setFilterTrade("ALL")} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${filterTrade === "ALL" ? "bg-[#FF6700] text-black border-[#FF6700]" : "glass-btn text-gray-400"}`}>ALL</button>
            {TRADES.map(t => (
                <button key={t} onClick={() => setFilterTrade(t)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border ${filterTrade === t ? "bg-[#FF6700] text-black border-[#FF6700]" : "glass-btn text-gray-400"}`}>{t.toUpperCase()}</button>
            ))}
        </div>

        {showAdd ? (
            <div className="glass-panel border border-[#FF6700] rounded-xl p-4 animate-in fade-in">
                <h3 className="font-bold mb-3 text-sm">NEW SUBCONTRACTOR</h3>
                <input placeholder="Company Name" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="input-field w-full rounded p-2 mb-2"/>
                <div className="flex gap-2 mb-2">
                    <input placeholder="Contact" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="input-field flex-1 rounded p-2"/>
                    <select value={form.trade} onChange={e => setForm({...form, trade: e.target.value})} className="input-field rounded p-2 text-sm text-black">
                        {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 mb-2">
                    <input type="date" value={form.insurance_expiry} onChange={e => setForm({...form, insurance_expiry: e.target.value})} className="input-field flex-1 rounded p-2 text-sm"/>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.w9_on_file} onChange={e => setForm({...form, w9_on_file: e.target.checked})} /> W-9?</label>
                </div>
                <button onClick={saveSub} className="w-full bg-[#FF6700] text-black font-bold py-3 rounded hover:scale-105 transition">SAVE SUB</button>
            </div>
        ) : (
            <button onClick={() => setShowAdd(true)} className="w-full border-2 border-dashed border-[#404040] text-gray-500 font-bold py-3 rounded-xl hover:border-[#FF6700] hover:text-[#FF6700] transition flex items-center justify-center gap-2"><Plus size={20}/> ADD SUB</button>
        )}

        <div className="space-y-4">
            {filteredSubs.map(sub => (
                <div key={sub.id} className="glass-panel p-4 rounded-xl relative group">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-lg">{sub.company_name}</h3>
                            <p className="text-xs text-gray-400 mt-1">{sub.trade} • {sub.contact_name}</p>
                        </div>
                        <div className="flex gap-1">
                            {sub.w9_on_file && <span className="text-[10px] bg-green-900/30 text-green-500 px-2 py-1 rounded border border-green-900">W-9 OK</span>}
                            {sub.insurance_expiry && new Date(sub.insurance_expiry) < new Date() && <span className="text-[10px] bg-red-900/30 text-red-500 px-2 py-1 rounded border border-red-900">INS EXPIRED</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <a href={`tel:${sub.phone}`} className="glass-btn hover:bg-[#FF6700] hover:text-black text-xs font-bold py-2 rounded flex justify-center gap-2"><Phone size={14}/> CALL</a>
                        <a href={`mailto:${sub.email}`} className="glass-btn hover:bg-[#FF6700] hover:text-black text-xs font-bold py-2 rounded flex justify-center gap-2"><Mail size={14}/> EMAIL</a>
                        <button onClick={() => deleteSub(sub.id)} className="glass-btn hover:bg-red-600 text-xs font-bold py-2 rounded flex justify-center gap-2"><Trash2 size={14}/></button>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
