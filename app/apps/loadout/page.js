"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Package, Plus, Minus, Search, Trash2, X, Loader2, 
  Truck, ClipboardList, ChevronDown 
} from "lucide-react";
import Link from "next/link";

// RESTORED ORIGINAL BRAND ORANGE
const THEME_ORANGE = "#FF6700"; 

export default function LoadOut() {
  const supabase = createClient();
  
  // STATE
  const [vans, setVans] = useState([]);
  const [currentVan, setCurrentVan] = useState(null);
  const [items, setItems] = useState([]);
  
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // EDITING
  const [editingItem, setEditingItem] = useState(null);
  const timerRef = useRef(null);

  // ESSENTIALS LIST (Now matches Brand Orange)
  const defaultLoadout = [
    { name: "Wax Ring", category: "parts", color: THEME_ORANGE },
    { name: "Angle Stop", category: "parts", color: THEME_ORANGE },
    { name: "Teflon Tape", category: "supplies", color: THEME_ORANGE },
    { name: "PVC Glue", category: "supplies", color: THEME_ORANGE },
    { name: "P-Trap", category: "parts", color: THEME_ORANGE },
    { name: "Coupling", category: "parts", color: THEME_ORANGE },
    { name: "Supply Line", category: "parts", color: THEME_ORANGE },
    { name: "Flapper", category: "parts", color: THEME_ORANGE },
    { name: "Ball Valve", category: "parts", color: THEME_ORANGE },
    { name: "Drain Snake", category: "tools", color: "#262626" }
  ];

  // 1. INIT
  useEffect(() => { initFleet(); }, []);

  const initFleet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let { data: userVans } = await supabase.from("vans").select("*").order("created_at");

    if (!userVans || userVans.length === 0) {
        const { data: newVan } = await supabase.from("vans").insert({
            user_id: user.id,
            name: "Van #1"
        }).select().single();
        userVans = [newVan];
    }

    setVans(userVans);
    setCurrentVan(userVans[0]);
    fetchInventory(userVans[0].id);
  };

  // 2. FETCH
  const fetchInventory = async (vanId) => {
    setLoading(true);
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("van_id", vanId)
      .order("created_at", { ascending: false });
    
    if (!data || data.length === 0) {
        await seedEssentials(vanId);
    } else {
        setItems(data);
        setLoading(false);
    }
  };

  const seedEssentials = async (vanId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const rows = defaultLoadout.map(item => ({
        user_id: user.id,
        van_id: vanId,
        name: item.name,
        category: item.category,
        quantity: 1,
        color: item.color
    }));

    const { data } = await supabase.from("inventory").insert(rows).select();
    if (data) setItems(data);
    setLoading(false);
  };

  // 3. ACTIONS
  const createVan = async () => {
    const name = prompt("Enter Name for new Vehicle/Location:");
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data: newVan } = await supabase.from("vans").insert({ user_id: user.id, name: name }).select().single();
    if (newVan) {
        setVans([...vans, newVan]);
        setCurrentVan(newVan);
        fetchInventory(newVan.id);
        showToast(`Created ${name}`, "success");
    }
  };

  const switchVan = (vanId) => {
    const selected = vans.find(v => v.id === vanId);
    setCurrentVan(selected);
    fetchInventory(vanId);
  };

  const copyShoppingList = () => {
    const toBuy = items.filter(i => i.quantity < 2);
    if (toBuy.length === 0) { showToast("Stock good! No items needed.", "info"); return; }
    const text = `SHOPPING LIST (${currentVan.name}):\n\n` + toBuy.map(i => `- ${i.name}`).join("\n");
    navigator.clipboard.writeText(text);
    showToast("📋 Shopping List Copied!", "success");
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    // Default new items to THEME_ORANGE instead of dark gray for visibility
    const temp = { id: Math.random(), name: newItem, quantity: 1, color: THEME_ORANGE, category: "tools" };
    setItems([temp, ...items]);
    setNewItem("");

    const { data } = await supabase.from("inventory").insert({
        user_id: user.id,
        van_id: currentVan.id,
        name: temp.name,
        quantity: 1,
        color: THEME_ORANGE 
    }).select();

    if (data) setItems(prev => prev.map(i => i.id === temp.id ? data[0] : i));
  };

  const updateQuantity = async (id, currentQty, change) => {
    const newQty = Math.max(0, Number(currentQty) + change);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
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

  // UX FIX: 900ms Hold + Scroll Cancel
  const startPress = (item) => { 
    timerRef.current = setTimeout(() => {
        setEditingItem(item);
        if (navigator.vibrate) navigator.vibrate(50);
    }, 900); 
  };
  
  const endPress = () => { 
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } 
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };
  
  // Colors for Picker
  const colors = [
    { hex: "#262626", name: "Charcoal" },
    { hex: THEME_ORANGE, name: "Brand Orange" }, 
    { hex: "#7f1d1d", name: "Red" },
    { hex: "#14532d", name: "Green" },
    { hex: "#1e3a8a", name: "Blue" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter pb-32">
       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap');
        .font-oswald { font-family: 'Oswald', sans-serif; }
        .no-select { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
      `}</style>

      {/* HEADER */}
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-6 flex justify-between items-start">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
            <Package className="w-8 h-8" style={{color: THEME_ORANGE}} />
            <h1 className="text-3xl font-oswald font-bold tracking-wide">LOAD<span style={{color: THEME_ORANGE}}>OUT</span></h1>
        </Link>
        <div className="relative group z-20">
            <button className="flex items-center gap-2 bg-[#262626] border border-[#404040] px-4 py-2 rounded-lg font-bold text-sm uppercase transition" style={{borderColor: '#404040'}}>
                <Truck size={16} style={{color: THEME_ORANGE}} />
                {currentVan ? currentVan.name : "Loading..."}
                <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#262626] border border-[#404040] rounded-xl shadow-xl overflow-hidden hidden group-hover:block">
                {vans.map(v => (
                    <button key={v.id} onClick={() => switchVan(v.id)} className="w-full text-left px-4 py-3 hover:bg-[#333] border-b border-[#333] last:border-0 text-sm font-bold">
                        {v.name}
                    </button>
                ))}
                <button onClick={createVan} className="w-full text-left px-4 py-3 text-black font-bold text-sm hover:opacity-90 flex items-center gap-2" style={{backgroundColor: THEME_ORANGE}}>
                    <Plus size={14} /> ADD NEW VAN
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        
        {/* ADD & SEARCH */}
        <form onSubmit={addItem} className="flex gap-2 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input 
                    type="text" 
                    value={newItem}
                    onChange={(e)=>setNewItem(e.target.value)}
                    placeholder="Add item..."
                    className="w-full bg-[#262626] border border-[#404040] rounded-xl pl-10 pr-4 py-3 outline-none transition"
                    style={{borderColor: '#404040'}}
                />
            </div>
            <button type="submit" className="text-black rounded-xl w-12 flex items-center justify-center font-bold hover:opacity-90" style={{backgroundColor: THEME_ORANGE}}>
                <Plus />
            </button>
        </form>

        {/* GRID */}
        {loading ? <div className="text-center py-10"><Loader2 className="animate-spin inline" style={{color: THEME_ORANGE}}/></div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 no-select">
                {items.map(item => (
                    <div 
                        key={item.id}
                        onMouseDown={() => startPress(item)}
                        onMouseUp={endPress}
                        onMouseLeave={endPress}
                        onTouchStart={() => startPress(item)}
                        onTouchEnd={endPress}
                        onTouchMove={endPress} // Scroll cancels Edit
                        style={{ backgroundColor: item.color }}
                        className="relative h-32 rounded-xl p-4 flex flex-col justify-between shadow-lg active:scale-95 transition-transform"
                    >
                        <h3 className="font-oswald font-bold text-lg leading-tight drop-shadow-md truncate">{item.name}</h3>
                        
                        <div className="flex items-center justify-between mt-2">
                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity, -1); }} className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/40 active:bg-red-500 transition"><Minus size={16} /></button>
                            <span className="text-2xl font-oswald font-bold drop-shadow-md">{item.quantity}</span>
                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity, 1); }} className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/40 active:bg-green-500 transition"><Plus size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-[#1a1a1a]/90 backdrop-blur border-t border-[#333] p-4 z-10">
        <div className="max-w-5xl mx-auto flex justify-center">
             <button onClick={copyShoppingList} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-sm uppercase tracking-wide transition">
                <ClipboardList size={18} /> Copy Shopping List
             </button>
        </div>
      </div>

      {/* MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
            <div className="bg-[#262626] border border-[#404040] w-full max-w-sm rounded-xl p-6 shadow-2xl relative">
                <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
                <h2 className="font-oswald font-bold text-xl mb-6" style={{color: THEME_ORANGE}}>EDIT ITEM</h2>
                <input type="text" value={editingItem.name} onChange={(e)=>setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#404040] rounded p-3 text-white mb-4" />
                <div className="grid grid-cols-5 gap-2 mb-6">
                    {colors.map(c => (
                        <button key={c.hex} onClick={()=>setEditingItem({...editingItem, color: c.hex})} style={{ backgroundColor: c.hex }} className={`h-8 rounded ${editingItem.color === c.hex ? 'ring-2 ring-white' : ''}`} />
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={()=>deleteItem(editingItem.id)} className="flex-1 bg-red-900/30 text-red-500 border border-red-900 py-3 rounded font-bold flex items-center justify-center gap-2"><Trash2 size={16}/> Delete</button>
                    <button onClick={saveEdit} className="flex-[2] text-black py-3 rounded font-bold" style={{backgroundColor: THEME_ORANGE}}>SAVE</button>
                </div>
            </div>
        </div>
      )}
      {toast && <div className={`fixed bottom-20 right-6 px-6 py-3 rounded shadow-xl font-bold text-white ${toast.type==='success'?'bg-green-600':'bg-blue-600'}`}>{toast.msg}</div>}
    </div>
  );
}
