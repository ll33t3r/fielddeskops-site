"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Package, Plus, Minus, Search, Trash2, X, Loader2, 
  Truck, ClipboardList, ChevronDown, AlertTriangle 
} from "lucide-react";
import Header from "../../components/Header";

const THEME_ORANGE = "#FF6700";

export default function LoadOut() {
  const supabase = createClient();
  
  // STATE
  const [vans, setVans] = useState([]);
  const [currentVan, setCurrentVan] = useState(null);
  const [items, setItems] = useState([]);
  
  // FORM STATE
  const [newItem, setNewItem] = useState("");
  const [minQty, setMinQty] = useState(3); // Preserved Smart Feature
  
  // UX STATE
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const timerRef = useRef(null);

  // COLORS
  const colors = [
    { hex: "#262626", name: "Charcoal" },
    { hex: THEME_ORANGE, name: "Brand Orange" }, 
    { hex: "#7f1d1d", name: "Red" },
    { hex: "#14532d", name: "Green" },
    { hex: "#1e3a8a", name: "Blue" },
  ];

  useEffect(() => { initFleet(); }, []);

  // --- LOGIC ---

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

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    // Optimistic UI Update
    const tempId = Math.random();
    const tempItem = { id: tempId, name: newItem, quantity: 1, min_quantity: minQty, color: THEME_ORANGE, category: "tools" };
    setItems([tempItem, ...items]);
    setNewItem("");

    const { data } = await supabase.from("inventory").insert({
        user_id: user.id,
        van_id: currentVan.id,
        name: tempItem.name,
        quantity: 1,
        min_quantity: minQty,
        color: THEME_ORANGE 
    }).select().single();

    if (data) setItems(prev => prev.map(i => i.id === tempId ? data : i));
  };

  const updateQuantity = async (id, currentQty, change) => {
    const newQty = Math.max(0, Number(currentQty) + change);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i)); // Instant UI
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setItems(prev => prev.map(i => i.id === editingItem.id ? editingItem : i));
    await supabase.from("inventory").update({ name: editingItem.name, color: editingItem.color }).eq("id", editingItem.id);
    setEditingItem(null);
  };

  const deleteItem = async (id) => {
    if(!confirm("Remove item?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("inventory").delete().eq("id", id);
    setEditingItem(null);
  };

  // --- UX HELPERS ---

  const switchVan = (vanId) => {
    const selected = vans.find(v => v.id === vanId);
    setCurrentVan(selected);
    fetchInventory(vanId);
  };

  const startPress = (item) => { 
    timerRef.current = setTimeout(() => {
        setEditingItem(item);
        if (navigator.vibrate) navigator.vibrate(50);
    }, 800); 
  };
  
  const endPress = () => { 
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } 
  };

  const createVan = async () => {
    const name = prompt("Enter Name for new Vehicle/Location:");
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: newVan } = await supabase.from("vans").insert({ user_id: user.id, name: name }).select().single();
    if (newVan) {
        setVans([...vans, newVan]);
        setCurrentVan(newVan);
        fetchInventory(newVan.id);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter pb-32">
      <Header title="LOADOUT" backLink="/" />

      <main className="max-w-5xl mx-auto px-6 pt-4">
        
        {/* VAN SELECTOR */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative group z-20">
            <button className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-white/5 transition">
              <Truck size={16} className="text-[#FF6700]" />
              {currentVan ? currentVan.name : "Loading..."}
              <ChevronDown size={14} />
            </button>
            
            {/* Dropdown */}
            <div className="absolute left-0 top-full mt-2 w-48 glass-panel rounded-xl shadow-xl overflow-hidden hidden group-hover:block border border-[#333]">
              {vans.map((v) => (
                <button key={v.id} onClick={() => switchVan(v.id)} className="w-full text-left px-4 py-3 hover:bg-[#333] border-b border-[#333] last:border-0 text-xs font-bold uppercase tracking-wide">
                  {v.name}
                </button>
              ))}
              <button onClick={createVan} className="w-full text-left px-4 py-3 text-black font-bold text-xs hover:bg-[#e55c00] flex items-center gap-2 bg-[#FF6700]">
                <Plus size={14} /> ADD NEW VAN
              </button>
            </div>
          </div>
        </div>

        {/* ADD ITEM FORM */}
        <form onSubmit={addItem} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add item..." className="input-field rounded-lg pl-10 pr-4 py-3 w-full" />
          </div>
          {/* Min Qty Box */}
          <input 
            type="number" 
            value={minQty} 
            onChange={(e) => setMinQty(Number(e.target.value))} 
            className="input-field w-14 rounded-lg text-center font-bold text-[#FF6700]" 
            title="Alert if below this amount"
          />
          <button type="submit" className="bg-[#FF6700] text-black font-bold rounded-lg w-12 flex items-center justify-center shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition">
            <Plus />
          </button>
        </form>

        {/* THE GRID (Big Buttons Restored) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 select-none">
          {items.map((item) => (
            <div
              key={item.id}
              onMouseDown={() => startPress(item)}
              onMouseUp={endPress}
              onMouseLeave={endPress}
              onTouchStart={() => startPress(item)}
              onTouchEnd={endPress}
              style={{ backgroundColor: item.color || "#262626" }} // Restore dynamic color
              className={`relative h-32 rounded-xl p-4 flex flex-col justify-between shadow-lg active:scale-95 transition-transform border border-white/5 ${item.quantity < (item.min_quantity || 3) ? "ring-2 ring-red-500" : ""}`}
            >
              <h3 className="font-oswald font-bold text-lg leading-tight drop-shadow-md truncate text-white">
                {item.name}
              </h3>

              {/* Low Stock Indicator */}
              {item.quantity < (item.min_quantity || 3) && (
                <div className="absolute top-2 right-2 text-red-500 animate-pulse bg-black/40 rounded-full p-1">
                    <AlertTriangle size={14} />
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity, -1); }}
                  className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 active:bg-red-500 transition text-white backdrop-blur-sm"
                >
                  <Minus size={16} />
                </button>
                
                <span className="text-2xl font-oswald font-bold drop-shadow-md text-white">
                  {item.quantity}
                </span>
                
                <button
                  onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity, 1); }}
                  className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 active:bg-green-500 transition text-white backdrop-blur-sm"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* EDIT MODAL (Restored) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-xl p-6 shadow-2xl relative border border-white/10">
            <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <h2 className="font-oswald font-bold text-xl mb-6 text-[#FF6700]">EDIT ITEM</h2>
            
            <input 
                type="text" 
                value={editingItem.name} 
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} 
                className="input-field rounded-lg mb-4 w-full p-3" 
            />
            
            <div className="grid grid-cols-5 gap-2 mb-6">
              {colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setEditingItem({ ...editingItem, color: c.hex })}
                  style={{ backgroundColor: c.hex }}
                  className={`h-10 rounded-lg transition-transform hover:scale-110 ${editingItem.color === c.hex ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"}`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => deleteItem(editingItem.id)} className="flex-1 bg-red-900/30 text-red-500 border border-red-900 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-900/50">
                <Trash2 size={16} /> Delete
              </button>
              <button onClick={saveEdit} className="flex-[2] bg-[#FF6700] text-black py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition">
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
