"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Wrench, Plus, Search, User, Clock, 
  CheckCircle, AlertTriangle, ArrowLeft, Trash2, Power
} from "lucide-react";
import Link from "next/link";

export default function ToolShed() {
  const supabase = createClient();
  
  // STATE
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL, AVAILABLE, OUT, BROKEN
  
  // FORM
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newSerial, setNewSerial] = useState("");

  // CHECK OUT FORM
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assignee, setAssignee] = useState("");

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("assets")
      .select("*")
      .order("name", { ascending: true });
      
    if (data) setAssets(data);
    setLoading(false);
  };

  const addAsset = async () => {
    if (!newName) return alert("Tool Name Required");
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from("assets").insert({
        user_id: user.id,
        name: newName,
        brand: newBrand,
        serial_number: newSerial,
        status: "AVAILABLE"
    }).select().single();

    if (data) {
        setAssets([...assets, data]);
        setShowAdd(false);
        setNewName(""); setNewBrand(""); setNewSerial("");
    }
  };

  const updateStatus = async (id, status, assigneeName = null) => {
    const updates = { 
        status: status,
        checked_out_by: assigneeName,
        checked_out_at: status === "CHECKED_OUT" ? new Date().toISOString() : null
    };

    const { error } = await supabase.from("assets").update(updates).eq("id", id);
    
    if (!error) {
        setAssets(assets.map(a => a.id === id ? { ...a, ...updates } : a));
        setSelectedAsset(null);
        setAssignee("");
    }
  };

  const deleteAsset = async (id) => {
    if(!confirm("Delete this tool permanently?")) return;
    await supabase.from("assets").delete().eq("id", id);
    setAssets(assets.filter(a => a.id !== id));
  };

  // Filter Logic
  const filteredAssets = assets.filter(a => {
    if (filter === "ALL") return true;
    return a.status === filter;
  });

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
                TOOL<span className="text-[#FF6700]">SHED</span> <Wrench size={24} className="text-[#FF6700]"/>
            </h1>
            <p className="text-xs text-gray-500">Asset & Equipment Tracker</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 space-y-6">
        
        {/* STATS */}
        <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setFilter("ALL")} className={`p-3 rounded-lg border text-center ${filter === "ALL" ? "bg-[#333] border-[#FF6700]" : "bg-[#262626] border-[#404040]"}`}>
                <p className="text-2xl font-oswald font-bold">{assets.length}</p>
                <p className="text-[10px] text-gray-500 uppercase">Total</p>
            </button>
            <button onClick={() => setFilter("CHECKED_OUT")} className={`p-3 rounded-lg border text-center ${filter === "CHECKED_OUT" ? "bg-[#333] border-[#FF6700]" : "bg-[#262626] border-[#404040]"}`}>
                <p className="text-2xl font-oswald font-bold text-blue-400">{assets.filter(a => a.status === "CHECKED_OUT").length}</p>
                <p className="text-[10px] text-gray-500 uppercase">In Use</p>
            </button>
            <button onClick={() => setFilter("BROKEN")} className={`p-3 rounded-lg border text-center ${filter === "BROKEN" ? "bg-[#333] border-[#FF6700]" : "bg-[#262626] border-[#404040]"}`}>
                <p className="text-2xl font-oswald font-bold text-red-500">{assets.filter(a => a.status === "BROKEN").length}</p>
                <p className="text-[10px] text-gray-500 uppercase">Broken</p>
            </button>
        </div>

        {/* ADD NEW TOOL */}
        {showAdd ? (
            <div className="bg-[#262626] border border-[#FF6700] rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold mb-3 text-sm">REGISTER NEW ASSET</h3>
                <input placeholder="Tool Name (e.g. Hammer Drill)" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#404040] rounded p-2 mb-2 text-white outline-none focus:border-[#FF6700]"/>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <input placeholder="Brand (e.g. Milwaukee)" value={newBrand} onChange={e => setNewBrand(e.target.value)} className="bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]"/>
                    <input placeholder="Serial #" value={newSerial} onChange={e => setNewSerial(e.target.value)} className="bg-[#1a1a1a] border border-[#404040] rounded p-2 text-white outline-none focus:border-[#FF6700]"/>
                </div>
                <div className="flex gap-2">
                    <button onClick={addAsset} className="flex-1 bg-[#FF6700] text-black font-bold py-2 rounded hover:bg-[#e55c00]">SAVE TOOL</button>
                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white">CANCEL</button>
                </div>
            </div>
        ) : (
            <button onClick={() => setShowAdd(true)} className="w-full border-2 border-dashed border-[#404040] text-gray-500 font-bold py-3 rounded-xl hover:border-[#FF6700] hover:text-[#FF6700] transition flex items-center justify-center gap-2">
                <Plus size={20}/> REGISTER NEW TOOL
            </button>
        )}

        {/* ASSET LIST */}
        <div className="space-y-3">
            {filteredAssets.map(asset => (
                <div key={asset.id} className="bg-[#262626] border border-[#404040] p-4 rounded-xl relative group">
                    
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-lg leading-none">{asset.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{asset.brand} • <span className="font-mono">{asset.serial_number || "No Serial"}</span></p>
                        </div>
                        <div className="text-right">
                            {asset.status === "AVAILABLE" && <span className="text-[10px] font-bold bg-green-900/30 text-green-500 px-2 py-1 rounded border border-green-900">IN SHOP</span>}
                            {asset.status === "CHECKED_OUT" && <span className="text-[10px] font-bold bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-900">CHECKED OUT</span>}
                            {asset.status === "BROKEN" && <span className="text-[10px] font-bold bg-red-900/30 text-red-500 px-2 py-1 rounded border border-red-900">NEEDS REPAIR</span>}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="pt-3 mt-3 border-t border-[#333] flex items-center justify-between">
                        
                        {/* Logic: If Available -> Check Out. If Out -> Check In. */}
                        {asset.status === "AVAILABLE" ? (
                            selectedAsset === asset.id ? (
                                <div className="flex items-center gap-2 w-full animate-in fade-in">
                                    <input 
                                        autoFocus
                                        placeholder="Assign to who?" 
                                        value={assignee} 
                                        onChange={e => setAssignee(e.target.value)} 
                                        className="bg-[#1a1a1a] border border-[#404040] rounded px-2 py-1 text-sm text-white flex-1 outline-none focus:border-[#FF6700]"
                                    />
                                    <button onClick={() => updateStatus(asset.id, "CHECKED_OUT", assignee)} className="bg-[#FF6700] text-black text-xs font-bold px-3 py-1.5 rounded">CONFIRM</button>
                                    <button onClick={() => setSelectedAsset(null)} className="text-gray-500"><Plus size={18} className="rotate-45"/></button>
                                </div>
                            ) : (
                                <button onClick={() => setSelectedAsset(asset.id)} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1">
                                    <User size={14}/> CHECK OUT
                                </button>
                            )
                        ) : asset.status === "CHECKED_OUT" ? (
                            <div className="flex items-center gap-3">
                                <p className="text-xs text-blue-400 flex items-center gap-1"><User size={12}/> {asset.checked_out_by}</p>
                                <button onClick={() => updateStatus(asset.id, "AVAILABLE")} className="text-xs font-bold bg-[#333] px-2 py-1 rounded hover:bg-white hover:text-black transition">RETURN</button>
                            </div>
                        ) : (
                            <button onClick={() => updateStatus(asset.id, "AVAILABLE")} className="text-xs font-bold text-green-500 hover:underline">MARK FIXED</button>
                        )}

                        {/* Report Broken / Delete */}
                        <div className="flex gap-3">
                            {asset.status !== "BROKEN" && (
                                <button onClick={() => updateStatus(asset.id, "BROKEN")} className="text-gray-600 hover:text-red-500" title="Report Broken"><AlertTriangle size={16}/></button>
                            )}
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
