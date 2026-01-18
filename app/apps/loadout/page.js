"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Plus, Minus, Search, Trash2, X, Loader2, Truck, 
  ClipboardList, ChevronDown, AlertTriangle, Settings, 
  RefreshCw, Edit3, CheckCircle2, Eye, EyeOff
} from "lucide-react";
import Header from "../../components/Header";

const THEME_ORANGE = "#FF6700";

export default function LoadOut() {
  const supabase = createClient();
  
  // STATE
  const [vans, setVans] = useState([]);
  const [currentVan, setCurrentVan] = useState(null);
  const [items, setItems] = useState([]);
  
  // FORM & MODES
  const [newItem, setNewItem] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [renameVanName, setRenameVanName] = useState("");
  const [targetQtyInput, setTargetQtyInput] = useState(""); 
  
  // UX STATE
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // COLORS
  const colors = [
    { hex: "#262626", name: "Charcoal" },
    { hex: THEME_ORANGE, name: "Brand Orange" }, 
    { hex: "#7f1d1d", name: "Red" },
    { hex: "#14532d", name: "Green" },
    { hex: "#1e3a8a", name: "Blue" },
    { hex: "#581c87", name: "Purple" },
  ];

  useEffect(() => { initFleet(); }, []);

  // --- 1. INITIALIZATION ---

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
    setRenameVanName(userVans[0].name);
    fetchInventory(userVans[0].id);
  };

  const fetchInventory = async (vanId) => {
    setLoading(true);
    const { data } = await supabase.from("inventory").select("*").eq("van_id", vanId).order("created_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  };

  const switchVan = (vanId) => {
    const selected = vans.find(v => v.id === vanId);
    setCurrentVan(selected);
    setRenameVanName(selected.name);
    fetchInventory(vanId);
    setShowSettings(false);
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
        setShowSettings(false);
    }
  };

  // --- 2. INVENTORY ACTIONS ---

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    const tempId = Math.random();
    const tempItem = { id: tempId, name: newItem, quantity: 1, min_quantity: 3, color: THEME_ORANGE };
    setItems([tempItem, ...items]);
    setNewItem("");

    const { data } = await supabase.from("inventory").insert({
        user_id: user.id,
        van_id: currentVan.id,
        name: tempItem.name,
        quantity: 1,
        min_quantity: 3,
        color: THEME_ORANGE 
    }).select().single();

    if (data) setItems(prev => prev.map(i => i.id === tempId ? data : i));
  };

  const updateQuantity = async (id, currentQty, change) => {
    const newQty = Math.max(0, Number(currentQty) + change);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
  };

  // --- 3. EDIT & SETTINGS LOGIC ---

  const openEditModal = (item) => {
      setEditingItem(item);
      setTargetQtyInput(item.min_quantity.toString()); 
  };

  const saveItemEdit = async () => {
    if (!editingItem) return;
    const newMin = parseInt(targetQtyInput) || 0;
    const updatedItem = { ...editingItem, min_quantity: newMin };
    
    setItems(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i));
    await supabase.from("inventory").update({ 
        name: updatedItem.name, 
        color: updatedItem.color, 
        min_quantity: updatedItem.min_quantity,
        quantity: updatedItem.quantity 
    }).eq("id", updatedItem.id);
    
    setEditingItem(null);
  };

  const deleteItem = async (id) => {
    if(!confirm("Permanently delete this item?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("inventory").delete().eq("id", id);
    setEditingItem(null);
  };

  // --- 4. GLOBAL ACTIONS ---

  const handleRenameVan = async () => {
    if(!renameVanName.trim()) return;
    const updatedVans = vans.map(v => v.id === currentVan.id ? {...v, name: renameVanName} : v);
    setVans(updatedVans);
    setCurrentVan({...currentVan, name: renameVanName});
    await supabase.from("vans").update({ name: renameVanName }).eq("id", currentVan.id);
    showToast("Van Renamed", "success");
  };

  const handleDeleteVan = async () => {
    if (vans.length <= 1) {
        showToast("Cannot delete the only van.", "error");
        return;
    }
    if (!confirm(`DELETE ${currentVan.name.toUpperCase()}?\n\nThis will permanently delete the van and ALL items inside it.`)) return;
    
    setLoading(true);
    await supabase.from("inventory").delete().eq("van_id", currentVan.id); // Clear items
    await supabase.from("vans").delete().eq("id", currentVan.id); // Delete van
    
    const remaining = vans.filter(v => v.id !== currentVan.id);
    setVans(remaining);
    setCurrentVan(remaining[0]);
    setRenameVanName(remaining[0].name);
    fetchInventory(remaining[0].id);
    setShowSettings(false);
    setLoading(false);
    showToast("Vehicle Deleted", "success");
  };

  const copyShoppingList = () => {
    const toBuy = items.filter(i => i.quantity < i.min_quantity);
    if (toBuy.length === 0) { showToast("Inventory Full! Nothing to buy.", "success"); return; }
    
    let text = `🛒 SHOPPING LIST - ${currentVan.name.toUpperCase()}\n\n`;
    toBuy.forEach(i => {
        const needed = i.min_quantity - i.quantity;
        text += `- ${i.name}: Need ${needed} (Have ${i.quantity}/${i.min_quantity})\n`;
    });
    
    navigator.clipboard.writeText(text);
    showToast("📋 Copied!", "success");
    setShowSettings(false);
  };

  const restockAll = async () => {
    if(!confirm("Auto-Refill all low items?")) return;
    const updates = items.map(i => {
        if (i.quantity < i.min_quantity) { return { ...i, quantity: i.min_quantity }; }
        return i;
    });
    setItems(updates);
    setShowSettings(false);
    showToast("✅ Items Restocked", "success");
    for (const item of updates) {
        if (item.quantity !== items.find(old => old.id === item.id).quantity) {
            await supabase.from("inventory").update({ quantity: item.quantity }).eq("id", item.id);
        }
    }
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter pb-32">
      <Header title="LOADOUT" backLink="/" />

      <main className="max-w-6xl mx-auto px-6 pt-4">
        
        {/* --- TOP BAR --- */}
        <div className="flex items-center justify-between mb-6 bg-[#1a1a1a] border border-white/10 p-3 rounded-xl">
            <div className="relative w-full">
                <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center justify-between font-bold text-lg uppercase tracking-wide">
                    <div className="flex items-center gap-3">
                        <Truck className="text-[#FF6700]" size={20} />
                        {currentVan ? currentVan.name : "Loading..."}
                    </div>
                    <Settings size={20} className={`text-gray-400 transition-transform ${showSettings ? "rotate-90 text-white" : ""}`}/>
                </button>

                {/* --- MENU --- */}
                {showSettings && (
                    <div className="absolute top-full left-0 mt-4 w-full md:w-80 glass-panel rounded-xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 border border-white/10 bg-[#0a0a0a]">
                        
                        {/* 1. EDIT TOGGLE */}
                        <div className="mb-4 pb-4 border-b border-white/10">
                            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Interface Mode</label>
                            <button 
                                onClick={() => { setIsEditMode(!isEditMode); setShowSettings(false); }} 
                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isEditMode ? "bg-[#FF6700] border-[#FF6700] text-black" : "bg-white/5 border-white/10 text-gray-300"}`}
                            >
                                <span className="font-bold text-sm flex items-center gap-2">
                                    {isEditMode ? <Eye size={16}/> : <EyeOff size={16}/>}
                                    {isEditMode ? "EDITING ON" : "STANDARD VIEW"}
                                </span>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isEditMode ? "bg-black/30" : "bg-white/20"}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isEditMode ? "left-4" : "left-1"}`}></div>
                                </div>
                            </button>
                        </div>

                        {/* 2. RENAME VAN */}
                        <div className="mb-4 pb-4 border-b border-white/10">
                            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Vehicle Name</label>
                            <div className="flex gap-2">
                                <input value={renameVanName} onChange={e => setRenameVanName(e.target.value)} className="input-field rounded p-2 text-sm flex-1" />
                                <button onClick={handleRenameVan} className="bg-[#FF6700] text-black rounded p-2"><CheckCircle2 size={16}/></button>
                            </div>
                        </div>

                        {/* 3. SWITCH VAN */}
                        <div className="mb-4 pb-4 border-b border-white/10 space-y-2">
                            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Switch Vehicle</label>
                            {vans.map(v => (
                                <button key={v.id} onClick={() => switchVan(v.id)} className={`w-full text-left text-sm p-2 rounded hover:bg-white/5 ${v.id === currentVan.id ? "text-[#FF6700] font-bold bg-[#FF6700]/10" : "text-gray-400"}`}>
                                    {v.name}
                                </button>
                            ))}
                            <button onClick={createVan} className="w-full text-left text-xs font-bold text-[#FF6700] p-2 hover:underline flex items-center gap-1">
                                <Plus size={12}/> Create New Van
                            </button>
                        </div>

                        {/* 4. ACTIONS */}
                        <div className="space-y-2 pb-4 border-b border-white/10">
                            <button onClick={copyShoppingList} className="w-full flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white p-2 rounded hover:bg-white/5">
                                <ClipboardList size={16}/> Copy Shopping List
                            </button>
                            <button onClick={restockAll} className="w-full flex items-center gap-2 text-sm font-bold text-green-500 hover:text-green-400 p-2 rounded hover:bg-green-900/20">
                                <RefreshCw size={16}/> Restock All Items
                            </button>
                        </div>

                        {/* 5. DELETE VAN */}
                        <div className="pt-2">
                             <button onClick={handleDeleteVan} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:text-red-500 p-2 rounded hover:bg-red-900/20">
                                <Trash2 size={14}/> Delete This Vehicle
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* ADD FORM */}
        <form onSubmit={addItem} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
            <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add new item..." className="input-field rounded-lg pl-10 pr-4 py-3 w-full" />
          </div>
          <button type="submit" className="bg-[#FF6700] text-black font-bold rounded-lg w-14 flex items-center justify-center shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition">
            <Plus />
          </button>
        </form>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 select-none">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => { if(isEditMode) openEditModal(item); }}
              style={{ backgroundColor: item.color || "#262626" }} 
              className={`relative h-36 rounded-xl p-4 flex flex-col justify-between shadow-lg transition-transform border border-white/5 ${isEditMode ? "cursor-pointer hover:scale-105 hover:ring-2 ring-white" : ""} ${item.quantity < (item.min_quantity || 3) ? "ring-2 ring-red-500" : ""}`}
            >
              <div className="flex justify-between items-start">
                  <h3 className="font-oswald font-bold text-lg leading-tight drop-shadow-md truncate text-white w-24">{item.name}</h3>
                  {isEditMode ? <Edit3 size={16} className="text-white/80"/> : item.quantity < (item.min_quantity || 3) && <AlertTriangle size={16} className="text-red-500 animate-pulse drop-shadow-md" />}
              </div>

              {!isEditMode && (
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity, -1); }} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/40 active:bg-red-500 transition text-white backdrop-blur-sm"><Minus size={20} /></button>
                    <div className="text-center">
                        <span className="text-3xl font-oswald font-bold drop-shadow-md text-white block leading-none">{item.quantity}</span>
                        <span className="text-[10px] text-white/60 font-bold uppercase">Target: {item.min_quantity || 3}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity, 1); }} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/40 active:bg-green-500 transition text-white backdrop-blur-sm"><Plus size={20} /></button>
                  </div>
              )}
              
              {isEditMode && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl"><p className="text-xs font-bold uppercase tracking-widest text-white border border-white px-2 py-1 rounded">Tap to Edit</p></div>}
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-xl p-6 shadow-2xl relative border border-white/10 bg-[#121212]">
            <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <h2 className="font-oswald font-bold text-xl mb-6 text-[#FF6700] flex items-center gap-2"><Edit3 size={20}/> EDIT ITEM</h2>
            
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Item Name</label>
            <input type="text" value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="input-field rounded-lg mb-4 w-full p-3 font-bold text-lg" />
            
            <div className="mb-6 bg-white/5 p-4 rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Target / Low Stock Level</label>
                    <span className="text-xs text-[#FF6700]">Alerts under {targetQtyInput || 0}</span>
                </div>
                <div className="flex gap-4 items-center">
                    <input type="number" value={targetQtyInput} onChange={(e) => setTargetQtyInput(e.target.value)} className="input-field rounded-lg w-20 text-center font-oswald text-xl p-2" placeholder="0"/>
                    <div className="flex-1 text-xs text-gray-500 leading-tight">Enter a number. The alert triggers if quantity drops below this.</div>
                </div>
            </div>

            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Card Color</label>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {colors.map((c) => (
                <button key={c.hex} onClick={() => setEditingItem({ ...editingItem, color: c.hex })} style={{ backgroundColor: c.hex }} className={`h-10 rounded-lg transition-transform hover:scale-110 ${editingItem.color === c.hex ? "ring-2 ring-white scale-110" : "opacity-40 hover:opacity-100"}`} />
              ))}
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => deleteItem(editingItem.id)} className="flex-1 bg-red-900/20 text-red-500 border border-red-900/50 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-900/40"><Trash2 size={16} /> Delete</button>
              <button onClick={saveItemEdit} className="flex-[2] bg-[#FF6700] text-black py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition">SAVE CHANGES</button>
            </div>
            <button onClick={() => { const refillVal = parseInt(targetQtyInput) || 3; setEditingItem({...editingItem, quantity: refillVal}); }} className="w-full mt-3 text-xs text-green-500 font-bold uppercase tracking-wider hover:text-green-400 py-2 border border-green-900/30 rounded bg-green-900/10">Quick Action: Refill to Target</button>
          </div>
        </div>
      )}
      {toast && <div className={`fixed bottom-24 right-6 px-6 py-3 rounded shadow-xl font-bold text-white z-[60] animate-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-green-600" : "bg-blue-600"}`}>{toast.msg}</div>}
    </div>
  );
}
