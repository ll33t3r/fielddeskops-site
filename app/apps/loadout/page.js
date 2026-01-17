"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Package, Plus, Minus, Trash2, Download, AlertTriangle, 
  Search, X, Loader2 
} from "lucide-react";
import Link from "next/link";

export default function LoadOut() {
  const supabase = createClient();
  
  // STATE
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newCategory, setNewCategory] = useState("tools");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // EDITING STATE (Modal)
  const [editingItem, setEditingItem] = useState(null);
  
  // LONG PRESS LOGIC
  const timerRef = useRef(null);

  // 1. LOAD FROM CLOUD
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setItems(data);
    setLoading(false);
  };

  // 2. ADD ITEM
  const addItem = async () => {
    if (!newItem.trim()) { showToast("Enter item name", "error"); return; }
    const qty = parseInt(newQuantity) || 1;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic Update
    const tempItem = { 
        id: Math.random(), 
        name: newItem, 
        quantity: qty, 
        category: newCategory, 
        color: "#262626",
        created_at: new Date().toISOString() 
    };
    setItems([tempItem, ...items]);
    setNewItem(""); 
    setNewQuantity("1");

    // Save to Cloud
    const { data, error } = await supabase.from("inventory").insert({
      user_id: user.id,
      name: tempItem.name,
      quantity: tempItem.quantity,
      category: tempItem.category,
      color: tempItem.color
    }).select();

    if (data) {
        // Swap temp ID with real ID
        setItems(prev => prev.map(i => i.id === tempItem.id ? data[0] : i));
        showToast("✅ Added to Cloud", "success");
    }
  };

  // 3. UPDATE QUANTITY (+/-)
  const updateQuantity = async (id, currentQty, change) => {
    const newQty = Math.max(0, Number(currentQty) + change);
    
    // Optimistic UI
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    
    // Cloud Update
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
  };

  // 4. SAVE EDIT (Name/Color)
  const saveEdit = async () => {
    if (!editingItem) return;
    
    setItems(prev => prev.map(i => i.id === editingItem.id ? editingItem : i));
    
    await supabase.from("inventory").update({ 
        name: editingItem.name, 
        color: editingItem.color,
        category: editingItem.category
    }).eq("id", editingItem.id);
    
    setEditingItem(null);
    showToast("Item Updated", "success");
  };

  // 5. DELETE
  const deleteItem = async (id) => {
    if(!confirm("Delete this item?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("inventory").delete().eq("id", id);
    setEditingItem(null);
    showToast("Item Deleted", "info");
  };

  // LONG PRESS HANDLERS
  const startPress = (item) => {
    timerRef.current = setTimeout(() => {
      setEditingItem(item); // Open Modal
    }, 600); // 600ms hold time
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // UTILS
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const exportCSV = () => {
    const csv = [
      ["Item", "Quantity", "Category", "Date Added"],
      ...items.map(item => [item.name, item.quantity, item.category, new Date(item.created_at).toLocaleDateString()])
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loadout-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // FILTERS
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const lowStockItems = items.filter(item => item.quantity < 3);

  // COLORS
  const colors = [
    { hex: "#262626", name: "Default" },
    { hex: "#7f1d1d", name: "Red" },
    { hex: "#c2410c", name: "Orange" },
    { hex: "#a16207", name: "Yellow" },
    { hex: "#14532d", name: "Green" },
    { hex: "#1e3a8a", name: "Blue" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter pb-20">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap');
        .font-oswald { font-family: 'Oswald', sans-serif; }
        .no-select { user-select: none; -webkit-user-select: none; }
      `}</style>

      {/* HEADER */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
            <Package size={32} className="text-[#FF6700]" />
            <h1 className="text-3xl md:text-4xl font-bold font-oswald text-[#f5f5f5] tracking-wide">LOADOUT</h1>
        </div>
        <p className="text-gray-500 text-sm">Cloud Inventory • Hold Card to Edit</p>
      </div>

      <main className="max-w-5xl mx-auto px-6">
        
        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#262626] border border-[#404040] rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-[#FF6700]">{items.reduce((a,b) => a + Number(b.quantity), 0)}</div>
                <div className="text-xs text-gray-500 uppercase">Total Count</div>
            </div>
            <div className="bg-[#262626] border border-[#404040] rounded-lg p-4 text-center">
                <div className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {items.length}
                </div>
                <div className="text-xs text-gray-500 uppercase">Unique Items</div>
            </div>
        </div>

        {/* ADD NEW BAR */}
        <div className="bg-[#262626] border border-[#404040] rounded-xl p-4 mb-6">
            <h2 className="text-[#FF6700] font-oswald font-bold mb-3">ADD NEW ITEM</h2>
            <div className="flex flex-col md:flex-row gap-3">
                <input 
                    type="text" 
                    value={newItem} 
                    onChange={(e)=>setNewItem(e.target.value)} 
                    placeholder="Item Name..." 
                    className="flex-[2] bg-[#1a1a1a] border border-[#404040] rounded px-4 py-3 focus:border-[#FF6700] outline-none" 
                />
                <input 
                    type="number" 
                    value={newQuantity} 
                    onChange={(e)=>setNewQuantity(e.target.value)} 
                    className="flex-1 bg-[#1a1a1a] border border-[#404040] rounded px-4 py-3 focus:border-[#FF6700] outline-none text-center" 
                />
                <select 
                    value={newCategory} 
                    onChange={(e)=>setNewCategory(e.target.value)} 
                    className="flex-1 bg-[#1a1a1a] border border-[#404040] rounded px-4 py-3 focus:border-[#FF6700] outline-none"
                >
                    {['tools', 'supplies', 'safety', 'equipment', 'parts'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
                <button onClick={addItem} className="bg-[#FF6700] text-black font-bold px-6 rounded hover:bg-[#cc5200] transition">
                    <Plus />
                </button>
            </div>
        </div>

        {/* SEARCH & EXPORT */}
        <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e)=>setSearchTerm(e.target.value)} 
                    placeholder="Search..." 
                    className="w-full bg-[#262626] border border-[#404040] rounded-lg pl-10 pr-4 py-3 focus:border-[#FF6700] outline-none"
                />
            </div>
            <button onClick={exportCSV} className="bg-[#262626] border border-[#404040] text-gray-400 px-4 rounded-lg hover:text-white hover:border-white transition">
                <Download />
            </button>
        </div>

        {/* THE PEGBOARD (GRID) */}
        {loading ? <div className="text-center py-10"><Loader2 className="animate-spin inline text-[#FF6700]" /></div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 no-select">
                {filteredItems.map(item => (
                    <div 
                        key={item.id}
                        onMouseDown={() => startPress(item)}
                        onMouseUp={endPress}
                        onTouchStart={() => startPress(item)}
                        onTouchEnd={endPress}
                        style={{ backgroundColor: item.color || '#262626' }}
                        className="relative h-40 rounded-xl p-4 flex flex-col justify-between shadow-lg active:scale-95 transition-transform border border-white/5"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-oswald font-bold text-lg leading-tight shadow-black drop-shadow-md">{item.name}</h3>
                                <span className="text-xs opacity-70 uppercase tracking-wider">{item.category}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 bg-black/20 rounded-full p-1 backdrop-blur-sm">
                            <button 
                                onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity, -1); }}
                                className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 active:bg-red-500 transition"
                            >
                                <Minus size={16} />
                            </button>
                            
                            <span className="text-2xl font-oswald font-bold mx-2">
                                {item.quantity}
                            </span>

                            <button 
                                onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity, 1); }}
                                className="w-8 h-8 bg-black/40 rounded-full flex items-center justify-center hover:bg-black/60 active:bg-green-500 transition"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
            <div className="bg-[#262626] border border-[#404040] w-full max-w-sm rounded-xl p-6 shadow-2xl relative">
                <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
                <h2 className="text-[#FF6700] font-oswald font-bold text-xl mb-6">EDIT ITEM</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 font-bold">NAME</label>
                        <input type="text" value={editingItem.name} onChange={(e)=>setEditingItem({...editingItem, name: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#404040] rounded p-3 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold">CATEGORY</label>
                        <select value={editingItem.category} onChange={(e)=>setEditingItem({...editingItem, category: e.target.value})} className="w-full bg-[#1a1a1a] border border-[#404040] rounded p-3 text-white">
                             {['tools', 'supplies', 'safety', 'equipment', 'parts'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold">COLOR CODE</label>
                        <div className="grid grid-cols-6 gap-2 mt-2">
                            {colors.map(c => (
                                <button 
                                    key={c.hex} 
                                    onClick={()=>setEditingItem({...editingItem, color: c.hex})}
                                    style={{ backgroundColor: c.hex }}
                                    className={`h-8 rounded ${editingItem.color === c.hex ? 'ring-2 ring-white' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button onClick={()=>deleteItem(editingItem.id)} className="flex-1 bg-red-900/30 text-red-500 border border-red-900 py-3 rounded font-bold flex items-center justify-center gap-2"><Trash2 size={16}/> Delete</button>
                        <button onClick={saveEdit} className="flex-[2] bg-[#FF6700] text-black py-3 rounded font-bold">SAVE CHANGES</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={`fixed bottom-6 right-6 px-6 py-3 rounded shadow-xl font-bold text-white ${toast.type==='error'?'bg-red-500':'bg-green-500'}`}>{toast.message}</div>}
    </div>
  );
}
