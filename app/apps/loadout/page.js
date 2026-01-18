"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { Package, Plus, Minus, Search, Trash2, X, Loader2, Truck, ClipboardList, ChevronDown } from "lucide-react";
import Header from "../../components/Header";

const THEME_ORANGE = "#FF6700";

export default function LoadOut() {
  const supabase = createClient();
  const [vans, setVans] = useState([]);
  const [currentVan, setCurrentVan] = useState(null);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [minQty, setMinQty] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => { initFleet(); }, []);

  const initFleet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let { data: userVans } = await supabase.from("vans").select("*").order("created_at");
    if (!userVans || userVans.length === 0) {
       const { data: newVan } = await supabase.from("vans").insert({ user_id: user.id, name: "Van #1" }).select().single();
       userVans = [newVan];
    }
    setVans(userVans);
    setCurrentVan(userVans[0]);
    fetchInventory(userVans[0].id);
  };

  const fetchInventory = async (vanId) => {
    setLoading(true);
    const { data } = await supabase.from("inventory").select("*").eq("van_id", vanId).order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("inventory").insert({
        user_id: user.id, van_id: currentVan.id, name: newItem, category: "general", quantity: 1, min_quantity: minQty
    }).select().single();
    if (data) { setItems([data, ...items]); setNewItem(""); }
  };

  const updateQty = async (id, current, change) => {
    const newQty = Math.max(0, current + change);
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
    setItems(items.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  };

  const deleteItem = async (id) => {
    if(!confirm("Remove item?")) return;
    await supabase.from("inventory").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
  };

  if(loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter pb-24">
      <Header title="LOADOUT" backLink="/" />
      <main className="max-w-xl mx-auto px-6 space-y-6 pt-4">
        
        {/* VAN SELECTOR */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Truck className="text-[#FF6700]"/>
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">CURRENT VEHICLE</p>
                    <h2 className="text-xl font-oswald font-bold">{currentVan?.name}</h2>
                </div>
            </div>
            <button className="glass-btn p-2 rounded-lg text-gray-400"><ChevronDown size={20}/></button>
        </div>

        {/* ADD ITEM */}
        <div className="flex gap-2">
            <input placeholder="Add Item..." value={newItem} onChange={e => setNewItem(e.target.value)} className="input-field flex-1 rounded-lg p-3"/>
            <input type="number" value={minQty} onChange={e => setMinQty(Number(e.target.value))} className="input-field w-16 rounded-lg p-3 text-center" title="Min Qty"/>
            <button onClick={addItem} className="bg-[#FF6700] text-black font-bold px-4 rounded-lg hover:scale-105 transition"><Plus/></button>
        </div>

        {/* INVENTORY LIST */}
        <div className="space-y-3">
            {items.map(item => (
                <div key={item.id} className={`glass-panel p-4 rounded-xl flex justify-between items-center ${item.quantity < item.min_quantity ? "border-l-4 border-l-red-500" : ""}`}>
                    <div>
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        {item.quantity < item.min_quantity && <span className="text-[10px] text-red-500 font-bold uppercase bg-red-900/20 px-2 py-0.5 rounded">Low Stock</span>}
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => updateQty(item.id, item.quantity, -1)} className="glass-btn p-2 rounded-full"><Minus size={16}/></button>
                        <span className={`font-oswald text-xl w-8 text-center ${item.quantity < item.min_quantity ? "text-red-500" : "text-white"}`}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity, 1)} className="glass-btn p-2 rounded-full"><Plus size={16}/></button>
                        <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-500 ml-2"><Trash2 size={18}/></button>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
