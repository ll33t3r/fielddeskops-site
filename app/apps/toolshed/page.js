"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { Wrench, Plus, User, Trash2, AlertTriangle } from "lucide-react";
import Header from "../../components/Header"; // <--- IMPORT THE NEW HEADER

export default function ToolShed() {
  const supabase = createClient();
  
  // STATE
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("ALL");
  
  // FORM
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assignee, setAssignee] = useState("");

  useEffect(() => { loadAssets(); }, []);

  const loadAssets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("assets").select("*").order("name");
    if (data) setAssets(data);
    setLoading(false);
  };

  const addAsset = async () => {
    if (!newName) return alert("Tool Name Required");
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("assets").insert({
        user_id: user.id, name: newName, brand: newBrand, serial_number: newSerial, status: "AVAILABLE"
    }).select().single();
    if (data) {
        setAssets([...assets, data]); setShowAdd(false);
        setNewName(""); setNewBrand(""); setNewSerial("");
    }
  };

  const updateStatus = async (id, status, assigneeName = null) => {
    const updates = { status, checked_out_by: assigneeName, checked_out_at: status === "CHECKED_OUT" ? new Date().toISOString() : null };
    await supabase.from("assets").update(updates).eq("id", id);
    setAssets(assets.map(a => a.id === id ? { ...a, ...updates } : a));
    setSelectedAsset(null); setAssignee("");
  };

  const deleteAsset = async (id) => {
    if(!confirm("Delete this tool?")) return;
    await supabase.from("assets").delete().eq("id", id);
    setAssets(assets.filter(a => a.id !== id));
  };

  const filteredAssets = assets.filter(a => filter === "ALL" || a.status === filter);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter pb-24">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap");
        .font-oswald { font-family: "Oswald", sans-serif; }
        .glass-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(5px); }
      `}</style>

      {/* UNIVERSAL HEADER IMPLEMENTATION */}
      <Header 
        title="TOOLSHED" 
        backLink="/" 
      />

      <main className="max-w-xl mx-auto px-6 space-y-6 pt-4">
        
        {/* STATS */}
        <div className="grid grid-cols-3 gap-2">
            {["ALL", "CHECKED_OUT", "BROKEN"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`p-3 rounded-lg border text-center transition ${filter === f ? "bg-[#333] border-[#FF6700]" : "bg-[#262626] border-[#404040]"}`}>
                    <p className={`text-2xl font-oswald font-bold ${f==="BROKEN"?"text-red-500":f==="CHECKED_OUT"?"text-blue-400":"text-white"}`}>
                        {assets.filter(a => f === "ALL" ? true : a.status === f).length}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase">{f.replace("_"," ")}</p>
                </button>
            ))}
        </div>

        {/* ADD TOOL */}
        {showAdd ? (
            <div className="bg-[#262626] border border-[#FF6700] rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold mb-3 text-sm">REGISTER ASSET</h3>
                <input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] rounded p-2 mb-2 text-white outline-none focus:border-[#FF6700]"/>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <input placeholder="Brand" value={newBrand} onChange={e => setNewBrand(e.target.value)} className="bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]"/>
                    <input placeholder="Serial" value={newSerial} onChange={e => setNewSerial(e.target.value)} className="bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]"/>
                </div>
                <div className="flex gap-2">
                    <button onClick={addAsset} className="flex-1 bg-[#FF6700] text-black font-bold py-2 rounded hover:bg-[#e55c00]">SAVE</button>
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white">CANCEL</button>
                </div>
            </div>
        ) : (
            <button onClick={() => setShowAdd(true)} className="w-full border-2 border-dashed border-[#404040] text-gray-500 font-bold py-3 rounded-xl hover:border-[#FF6700] hover:text-[#FF6700] transition flex items-center justify-center gap-2">
                <Plus size={20}/> REGISTER TOOL
            </button>
        )}

        {/* LIST */}
        <div className="space-y-3">
            {filteredAssets.map(asset => (
                <div key={asset.id} className="bg-[#262626] border border-[#404040] p-4 rounded-xl relative">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-lg leading-none">{asset.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{asset.brand}</p>
                        </div>
                        <div className="text-right">
                            {asset.status === "AVAILABLE" && <span className="text-[10px] font-bold text-green-500 border border-green-900 px-2 py-1 rounded bg-green-900/20">IN SHOP</span>}
                            {asset.status === "CHECKED_OUT" && <span className="text-[10px] font-bold text-blue-400 border border-blue-900 px-2 py-1 rounded bg-blue-900/20">OUT</span>}
                            {asset.status === "BROKEN" && <span className="text-[10px] font-bold text-red-500 border border-red-900 px-2 py-1 rounded bg-red-900/20">REPAIR</span>}
                        </div>
                    </div>
                    {/* ACTIONS */}
                    <div className="pt-3 mt-3 border-t border-[#333] flex items-center justify-between">
                        {asset.status === "AVAILABLE" ? (
                            selectedAsset === asset.id ? (
                                <div className="flex items-center gap-2 w-full animate-in fade-in">
                                    <input autoFocus placeholder="Who?" value={assignee} onChange={e => setAssignee(e.target.value)} className="bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm text-white flex-1 outline-none focus:border-[#FF6700]"/>
                                    <button onClick={() => updateStatus(asset.id, "CHECKED_OUT", assignee)} className="bg-[#FF6700] text-black text-xs font-bold px-3 py-1.5 rounded">GO</button>
                                </div>
                            ) : <button onClick={() => setSelectedAsset(asset.id)} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1"><User size={14}/> CHECK OUT</button>
                        ) : asset.status === "CHECKED_OUT" ? (
                            <div className="flex items-center gap-3">
                                <p className="text-xs text-blue-400">{asset.checked_out_by}</p>
                                <button onClick={() => updateStatus(asset.id, "AVAILABLE")} className="text-xs font-bold bg-[#333] px-2 py-1 rounded hover:bg-white hover:text-black">RETURN</button>
                            </div>
                        ) : <button onClick={() => updateStatus(asset.id, "AVAILABLE")} className="text-xs font-bold text-green-500 hover:underline">MARK FIXED</button>}
                        <div className="flex gap-3">
                            <button onClick={() => updateStatus(asset.id, "BROKEN")} className="text-gray-600 hover:text-red-500"><AlertTriangle size={16}/></button>
                            <button onClick={() => deleteAsset(asset.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
