"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Plus, Minus, Search, Trash2, X, Loader2, Truck, 
  ClipboardList, ChevronDown, AlertTriangle, Settings, 
  RefreshCw, Edit3, CheckCircle2, Eye, EyeOff, Wrench, 
  Camera, User, LayoutGrid, Users, Filter
} from "lucide-react";
import Header from "../../components/Header";

const THEME_ORANGE = "#FF6700";

export default function LoadOut() {
  const supabase = createClient();
  
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState("STOCK"); // "STOCK" or "TOOLS"
  const [vans, setVans] = useState([]);
  const [currentVan, setCurrentVan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false); // Global Menu
  const [renameVanName, setRenameVanName] = useState("");

  // --- STOCK STATE (Inventory) ---
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [targetQtyInput, setTargetQtyInput] = useState("");

  // --- TOOLS STATE (Assets) ---
  const [tools, setTools] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [toolSearch, setToolSearch] = useState("");
  const [showAddTool, setShowAddTool] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTool, setNewTool] = useState({ name: "", brand: "", serial: "" });
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null); // Expanded card ID
  const [toolFilter, setToolFilter] = useState("ALL");
  const [newMemberName, setNewMemberName] = useState(""); // For adding users

  // Colors for Stock Cards
  const colors = [
    { hex: "#262626", name: "Charcoal" },
    { hex: THEME_ORANGE, name: "Brand Orange" }, 
    { hex: "#7f1d1d", name: "Red" },
    { hex: "#14532d", name: "Green" },
    { hex: "#1e3a8a", name: "Blue" },
    { hex: "#581c87", name: "Purple" },
  ];

  useEffect(() => { initFleet(); }, []);

  // ==========================
  // 1. INITIALIZATION & LOADING
  // ==========================
  const initFleet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load Vans
    let { data: userVans } = await supabase.from("vans").select("*").order("created_at");
    if (!userVans || userVans.length === 0) {
        const { data: newVan } = await supabase.from("vans").insert({ user_id: user.id, name: "Van #1" }).select().single();
        userVans = [newVan];
    }
    setVans(userVans);
    setCurrentVan(userVans[0]);
    setRenameVanName(userVans[0].name);

    // Load Team
    const { data: team } = await supabase.from("team_members").select("*").order("name");
    if (team) setTeamMembers(team);

    // Load Data for first van
    fetchVanData(userVans[0].id);
  };

  const fetchVanData = async (vanId) => {
    setLoading(true);
    // Fetch Stock (Consumables)
    const { data: stock } = await supabase.from("inventory").select("*").eq("van_id", vanId).order("created_at", { ascending: false });
    if (stock) setItems(stock);
    
    // Fetch Tools (Assets)
    const { data: assets } = await supabase.from("assets").select("*").eq("van_id", vanId).order("created_at", { ascending: false });
    if (assets) setTools(assets);
    
    setLoading(false);
  };

  const switchVan = (vanId) => {
    const selected = vans.find(v => v.id === vanId);
    setCurrentVan(selected);
    setRenameVanName(selected.name);
    fetchVanData(vanId);
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
        fetchVanData(newVan.id);
        setShowSettings(false);
    }
  };

  // ==========================
  // 2. STOCK LOGIC (From LoadOut)
  // ==========================
  const addStockItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    const tempId = Math.random();
    const tempItem = { id: tempId, name: newItem, quantity: 1, min_quantity: 3, color: THEME_ORANGE };
    setItems([tempItem, ...items]);
    setNewItem("");

    const { data } = await supabase.from("inventory").insert({
        user_id: user.id, van_id: currentVan.id, name: tempItem.name, quantity: 1, min_quantity: 3, color: THEME_ORANGE 
    }).select().single();
    if (data) setItems(prev => prev.map(i => i.id === tempId ? data : i));
  };

  const updateStockQty = async (id, currentQty, change) => {
    const newQty = Math.max(0, Number(currentQty) + change);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
  };

  const openStockEdit = (item) => {
      setEditingItem(item);
      setTargetQtyInput(item.min_quantity.toString());
  };

  const saveStockEdit = async () => {
    if (!editingItem) return;
    const newMin = parseInt(targetQtyInput) || 0;
    const updatedItem = { ...editingItem, min_quantity: newMin };
    setItems(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i));
    await supabase.from("inventory").update({ 
        name: updatedItem.name, color: updatedItem.color, 
        min_quantity: updatedItem.min_quantity, quantity: updatedItem.quantity 
    }).eq("id", updatedItem.id);
    setEditingItem(null);
  };

  const deleteStockItem = async (id) => {
    if(!confirm("Delete this item?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("inventory").delete().eq("id", id);
    setEditingItem(null);
  };

  // ==========================
  // 3. TOOLS LOGIC (From ToolShed)
  // ==========================
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result);
    reader.readAsDataURL(file);
    setNewPhoto(file);
  };

  const addTool = async () => {
    if (!newTool.name) return showToast("Name required", "error");
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let finalPhotoUrl = null;
    if (newPhoto) {
        const fileName = `${user.id}/${Date.now()}-${newPhoto.name}`;
        const { error } = await supabase.storage.from("tool-photos").upload(fileName, newPhoto);
        if (!error) {
            const { data } = supabase.storage.from("tool-photos").getPublicUrl(fileName);
            finalPhotoUrl = data.publicUrl;
        }
    }

    const { data } = await supabase.from("assets").insert({
        user_id: user.id, van_id: currentVan.id, name: newTool.name, 
        brand: newTool.brand, serial_number: newTool.serial, 
        photo_url: finalPhotoUrl, status: "IN_VAN"
    }).select().single();

    if (data) {
        setTools([data, ...tools]);
        setShowAddTool(false);
        setNewTool({ name: "", brand: "", serial: "" });
        setNewPhoto(null); setPhotoPreview(null);
        showToast("Tool Added", "success");
    }
    setUploading(false);
  };

  const updateToolStatus = async (id, status, memberId = null) => {
    // Optimistic Update
    setTools(tools.map(t => t.id === id ? { ...t, status, assigned_to: memberId } : t));
    setSelectedAsset(null);
    await supabase.from("assets").update({ status, assigned_to: memberId }).eq("id", id);
  };

  const deleteTool = async (id) => {
    if(!confirm("Delete tool?")) return;
    setTools(tools.filter(t => t.id !== id));
    await supabase.from("assets").delete().eq("id", id);
  };

  // ==========================
  // 4. TEAM LOGIC
  // ==========================
  const addTeamMember = async () => {
    if (!newMemberName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("team_members").insert({ user_id: user.id, name: newMemberName }).select().single();
    if (data) {
        setTeamMembers([...teamMembers, data]);
        setNewMemberName("");
    }
  };

  const deleteTeamMember = async (id) => {
    if(!confirm("Remove user?")) return;
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    await supabase.from("team_members").delete().eq("id", id);
  };

  // ==========================
  // 5. GLOBAL ACTIONS
  // ==========================
  const handleRenameVan = async () => {
    if(!renameVanName.trim()) return;
    const updatedVans = vans.map(v => v.id === currentVan.id ? {...v, name: renameVanName} : v);
    setVans(updatedVans);
    setCurrentVan({...currentVan, name: renameVanName});
    await supabase.from("vans").update({ name: renameVanName }).eq("id", currentVan.id);
    showToast("Van Renamed", "success");
  };

  const handleDeleteVan = async () => {
    if (vans.length <= 1) return showToast("Cannot delete only van", "error");
    if (!confirm("Delete this van and ALL contents (Stock + Tools)?")) return;
    setLoading(true);
    await supabase.from("inventory").delete().eq("van_id", currentVan.id);
    await supabase.from("assets").delete().eq("van_id", currentVan.id);
    await supabase.from("vans").delete().eq("id", currentVan.id);
    window.location.reload(); 
  };

  const copyShoppingList = () => {
    const toBuy = items.filter(i => i.quantity < i.min_quantity);
    if (toBuy.length === 0) { showToast("Nothing to buy!", "success"); return; }
    let text = `🛒 ${currentVan.name.toUpperCase()} SHOPPING LIST:\n`;
    toBuy.forEach(i => text += `- ${i.name} (${i.quantity}/${i.min_quantity})\n`);
    navigator.clipboard.writeText(text);
    showToast("Copied!", "success");
    setShowSettings(false);
  };

  const restockAll = async () => {
    if(!confirm("Auto-Refill low items?")) return;
    const updates = items.map(i => i.quantity < i.min_quantity ? { ...i, quantity: i.min_quantity } : i);
    setItems(updates);
    updates.forEach(async (item) => {
         if (item.quantity !== items.find(o => o.id === item.id).quantity) {
             await supabase.from("inventory").update({ quantity: item.quantity }).eq("id", item.id);
         }
    });
    setShowSettings(false);
    showToast("Restocked", "success");
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  // --- FILTERS ---
  const filteredTools = tools.filter(t => {
      const matchSearch = !toolSearch || t.name.toLowerCase().includes(toolSearch.toLowerCase()) || t.serial_number?.toLowerCase().includes(toolSearch.toLowerCase());
      const matchFilter = toolFilter === "ALL" || 
                          (toolFilter === "OUT" && t.status === "CHECKED_OUT") ||
                          (toolFilter === "BROKEN" && t.status === "BROKEN");
      return matchSearch && matchFilter;
  });

  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter pb-32">
      <Header title="LOADOUT" backLink="/" />

      <main className="max-w-6xl mx-auto px-6 pt-4">
        
        {/* === TOP BAR === */}
        <div className="flex items-center justify-between mb-4 bg-[#1a1a1a] border border-white/10 p-3 rounded-xl relative z-20">
            <div className="relative w-full">
                <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center justify-between font-bold text-lg uppercase tracking-wide">
                    <div className="flex items-center gap-3">
                        <Truck className="text-[#FF6700]" size={20} />
                        {currentVan ? currentVan.name : "Loading..."}
                    </div>
                    <Settings size={20} className={`text-gray-400 transition-transform ${showSettings ? "rotate-90 text-white" : ""}`}/>
                </button>

                {/* === GLOBAL MENU === */}
                {showSettings && (
                    <div className="absolute top-full left-0 mt-4 w-full md:w-80 glass-panel rounded-xl shadow-2xl z-50 p-4 animate-in fade-in bg-[#0a0a0a] border border-white/10">
                        {/* 1. Edit Mode (Stock Only) */}
                        {activeTab === "STOCK" && (
                            <div className="mb-4 pb-4 border-b border-white/10">
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Interface</label>
                                <button onClick={() => { setIsEditMode(!isEditMode); setShowSettings(false); }} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isEditMode ? "bg-[#FF6700] text-black" : "bg-white/5"}`}>
                                    <span className="font-bold text-sm flex items-center gap-2">{isEditMode ? <Eye/> : <EyeOff/>} {isEditMode ? "EDITING ON" : "STANDARD"}</span>
                                </button>
                            </div>
                        )}
                        {/* 2. Rename */}
                        <div className="mb-4 pb-4 border-b border-white/10">
                            <label className="text-xs text-gray-500 font-bold uppercase mb-1">Vehicle Name</label>
                            <div className="flex gap-2">
                                <input value={renameVanName} onChange={e => setRenameVanName(e.target.value)} className="input-field rounded p-2 text-sm flex-1" />
                                <button onClick={handleRenameVan} className="bg-[#FF6700] text-black rounded p-2"><CheckCircle2/></button>
                            </div>
                        </div>
                        {/* 3. Switch Van */}
                        <div className="mb-4 pb-4 border-b border-white/10 space-y-2">
                            <label className="text-xs text-gray-500 font-bold uppercase">Switch Vehicle</label>
                            {vans.map(v => (
                                <button key={v.id} onClick={() => switchVan(v.id)} className={`w-full text-left text-sm p-2 rounded hover:bg-white/5 ${v.id === currentVan.id ? "text-[#FF6700] bg-[#FF6700]/10" : "text-gray-400"}`}>{v.name}</button>
                            ))}
                            <button onClick={createVan} className="w-full text-left text-xs font-bold text-[#FF6700] p-2 hover:underline flex items-center gap-1"><Plus size={12}/> New Van</button>
                        </div>
                        {/* 4. Actions */}
                        <div className="space-y-2 pb-4 border-b border-white/10">
                            <button onClick={copyShoppingList} className="w-full flex items-center gap-2 text-sm text-gray-300 p-2 rounded hover:bg-white/5"><ClipboardList size={16}/> Copy Shopping List</button>
                            <button onClick={restockAll} className="w-full flex items-center gap-2 text-sm text-green-500 p-2 rounded hover:bg-green-900/20"><RefreshCw size={16}/> Restock All</button>
                        </div>
                        {/* 5. Delete */}
                        <div className="pt-2"><button onClick={handleDeleteVan} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:text-red-500 p-2"><Trash2 size={14}/> Delete Vehicle</button></div>
                    </div>
                )}
            </div>
        </div>

        {/* === TAB SWITCHER === */}
        <div className="flex bg-[#1a1a1a] p-1 rounded-xl mb-6 border border-white/10">
            <button onClick={() => setActiveTab("STOCK")} className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide flex items-center justify-center gap-2 transition-all ${activeTab === "STOCK" ? "bg-[#FF6700] text-black shadow-lg" : "text-gray-500 hover:text-white"}`}>
                <LayoutGrid size={18}/> STOCK
            </button>
            <button onClick={() => setActiveTab("TOOLS")} className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide flex items-center justify-center gap-2 transition-all ${activeTab === "TOOLS" ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"}`}>
                <Wrench size={18}/> TOOLS
            </button>
        </div>

        {/* ======================= TAB 1: STOCK ======================= */}
        {activeTab === "STOCK" && (
            <div className="animate-in fade-in slide-in-from-left-4">
                <form onSubmit={addStockItem} className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add stock item..." className="input-field rounded-lg pl-10 pr-4 py-3 w-full" />
                    </div>
                    <button type="submit" className="bg-[#FF6700] text-black font-bold rounded-lg w-14 flex items-center justify-center hover:scale-105 transition"><Plus /></button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 select-none">
                    {items.map((item) => (
                        <div key={item.id} onClick={() => { if(isEditMode) openStockEdit(item); }} style={{ backgroundColor: item.color || "#262626" }} className={`relative h-36 rounded-xl p-4 flex flex-col justify-between shadow-lg transition-transform border border-white/5 ${isEditMode ? "cursor-pointer hover:scale-105 ring-2 ring-white" : ""} ${item.quantity < (item.min_quantity || 3) ? "ring-2 ring-red-500" : ""}`}>
                            <div className="flex justify-between items-start">
                                <h3 className="font-oswald font-bold text-lg leading-tight truncate text-white w-24">{item.name}</h3>
                                {isEditMode ? <Edit3 size={16} className="text-white/80"/> : item.quantity < (item.min_quantity || 3) && <AlertTriangle size={16} className="text-red-500 animate-pulse" />}
                            </div>
                            {!isEditMode && (
                                <div className="flex items-center justify-between mt-2">
                                    <button onClick={(e) => { e.stopPropagation(); updateStockQty(item.id, item.quantity, -1); }} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/40 active:bg-red-500 transition text-white backdrop-blur-sm"><Minus size={20} /></button>
                                    <div className="text-center">
                                        <span className="text-3xl font-oswald font-bold drop-shadow-md text-white block leading-none">{item.quantity}</span>
                                        <span className="text-[10px] text-white/60 font-bold uppercase">Target: {item.min_quantity || 3}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); updateStockQty(item.id, item.quantity, 1); }} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/40 active:bg-green-500 transition text-white backdrop-blur-sm"><Plus size={20} /></button>
                                </div>
                            )}
                            {isEditMode && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl"><p className="text-xs font-bold uppercase tracking-widest text-white border border-white px-2 py-1 rounded">Tap to Edit</p></div>}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ======================= TAB 2: TOOLS ======================= */}
        {activeTab === "TOOLS" && (
            <div className="animate-in fade-in slide-in-from-right-4">
                
                {/* TOOLBAR */}
                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3.5 text-gray-500" size={18} />
                        <input type="text" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)} placeholder="Search tools..." className="input-field rounded-lg pl-10 pr-4 py-3 w-full" />
                    </div>
                    <button onClick={() => setShowTeamModal(true)} className="bg-[#333] hover:bg-white hover:text-black text-white font-bold px-4 rounded-lg flex items-center justify-center border border-white/10"><Users size={20}/></button>
                    <button onClick={() => setShowAddTool(true)} className="bg-white text-black font-bold px-4 rounded-lg flex items-center justify-center hover:scale-105 transition"><Plus size={24}/></button>
                </div>

                {/* FILTERS */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {[{k:"ALL", l:"All Tools"}, {k:"OUT", l:"Checked Out"}, {k:"BROKEN", l:"Broken"}].map(f => (
                        <button key={f.k} onClick={() => setToolFilter(f.k)} className={`p-2 rounded text-xs font-bold border transition ${toolFilter === f.k ? "bg-[#FF6700] text-black border-[#FF6700]" : "border-white/10 text-gray-400"}`}>{f.l}</button>
                    ))}
                </div>

                {/* TOOL LIST */}
                <div className="space-y-3 pb-20">
                    {filteredTools.length === 0 ? <div className="text-center py-10 text-gray-500">No tools found.</div> : filteredTools.map(tool => (
                        <div key={tool.id} className={`glass-panel p-4 rounded-xl relative transition-all duration-300 ${tool.status === "BROKEN" ? "border-red-900/50 bg-red-900/5" : ""} ${selectedAsset === tool.id ? "ring-1 ring-[#FF6700]" : ""}`}>
                            <div className="flex gap-4 cursor-pointer" onClick={() => setSelectedAsset(selectedAsset === tool.id ? null : tool.id)}>
                                <div className="w-16 h-16 rounded-lg bg-black/40 flex-shrink-0 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {tool.photo_url ? <img src={tool.photo_url} alt={tool.name} className="w-full h-full object-cover"/> : <Wrench size={20} className="text-gray-600"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg leading-tight truncate pr-2 text-white">{tool.name}</h3>
                                        {tool.status === "IN_VAN" && <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded">IN VAN</span>}
                                        {tool.status === "CHECKED_OUT" && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded">OUT</span>}
                                        {tool.status === "BROKEN" && <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-1 rounded">BROKEN</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{tool.brand} {tool.serial_number && `• S/N: ${tool.serial_number}`}</p>
                                    {tool.status === "CHECKED_OUT" && tool.assigned_to && (
                                        <p className="text-xs text-blue-400 mt-1 flex items-center gap-1"><User size={12}/> {teamMembers.find(m => m.id === tool.assigned_to)?.name || "Unknown"}</p>
                                    )}
                                </div>
                            </div>
                            {selectedAsset === tool.id && (
                                <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2">
                                    {tool.status === "IN_VAN" ? (
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <select onChange={(e) => { if(e.target.value) updateToolStatus(tool.id, "CHECKED_OUT", e.target.value); }} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none appearance-none focus:border-[#FF6700]">
                                                    <option value="">Select Technician...</option>
                                                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none"/>
                                            </div>
                                            <button onClick={() => updateToolStatus(tool.id, "BROKEN")} className="px-3 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 hover:bg-red-900/40"><AlertTriangle size={18}/></button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateToolStatus(tool.id, "IN_VAN")} className="flex-1 bg-[#333] hover:bg-white hover:text-black py-2 rounded-lg font-bold text-sm transition">RETURN TO VAN</button>
                                            <button onClick={() => deleteTool(tool.id)} className="px-3 py-2 text-gray-500 hover:text-white transition"><Trash2 size={18}/></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

      </main>

      {/* --- MODALS --- */}
      
      {/* 1. STOCK EDIT */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-xl p-6 shadow-2xl relative border border-white/10 bg-[#121212]">
            <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <h2 className="font-oswald font-bold text-xl mb-6 text-[#FF6700] flex items-center gap-2"><Edit3 size={20}/> EDIT STOCK</h2>
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
              <button onClick={() => deleteStockItem(editingItem.id)} className="flex-1 bg-red-900/20 text-red-500 border border-red-900/50 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-900/40"><Trash2 size={16} /> Delete</button>
              <button onClick={saveStockEdit} className="flex-[2] bg-[#FF6700] text-black py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition">SAVE CHANGES</button>
            </div>
            <button onClick={() => { const refillVal = parseInt(targetQtyInput) || 3; setEditingItem({...editingItem, quantity: refillVal}); }} className="w-full mt-3 text-xs text-green-500 font-bold uppercase tracking-wider hover:text-green-400 py-2 border border-green-900/30 rounded bg-green-900/10">Quick Action: Refill to Target</button>
          </div>
        </div>
      )}

      {/* 2. ADD TOOL */}
      {showAddTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-white/10 bg-[#121212]">
                <button onClick={() => setShowAddTool(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                <h2 className="font-oswald font-bold text-xl mb-6 text-[#FF6700]">REGISTER TOOL</h2>
                <div className="mb-4">
                    {photoPreview ? (
                        <div className="relative w-full h-40 bg-black/40 rounded-xl overflow-hidden border border-white/10">
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover"/>
                            <button onClick={() => { setPhotoPreview(null); setNewPhoto(null); }} className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full text-white shadow-lg"><X size={14}/></button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#FF6700] hover:bg-white/5 transition">
                            <Camera size={24} className="text-gray-400 mb-2"/>
                            <span className="text-xs text-gray-500 font-bold uppercase">Tap to Take Photo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect}/>
                        </label>
                    )}
                </div>
                <div className="space-y-3">
                    <input placeholder="Tool Name (e.g. Hilti Drill)" value={newTool.name} onChange={e => setNewTool({...newTool, name: e.target.value})} className="input-field rounded-lg p-3 w-full"/>
                    <div className="flex gap-2">
                        <input placeholder="Brand" value={newTool.brand} onChange={e => setNewTool({...newTool, brand: e.target.value})} className="input-field rounded-lg p-3 w-full"/>
                        <input placeholder="Serial #" value={newTool.serial} onChange={e => setNewTool({...newTool, serial: e.target.value})} className="input-field rounded-lg p-3 w-full"/>
                    </div>
                </div>
                <button onClick={addTool} disabled={uploading} className="w-full mt-6 bg-[#FF6700] text-black font-bold py-3 rounded-xl hover:scale-105 transition shadow-[0_0_20px_rgba(255,103,0,0.4)] flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>} SAVE TO VAN
                </button>
            </div>
        </div>
      )}

      {/* 3. MANAGE TEAM */}
      {showTeamModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
             <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-white/10 bg-[#121212]">
                <button onClick={() => setShowTeamModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                <h2 className="font-oswald font-bold text-xl mb-6 text-white flex items-center gap-2"><Users size={20}/> MANAGE TEAM</h2>
                <div className="flex gap-2 mb-6">
                    <input placeholder="Enter Name (e.g. Mike)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="input-field rounded-lg p-2 flex-1"/>
                    <button onClick={addTeamMember} className="bg-[#FF6700] text-black font-bold px-4 rounded-lg"><Plus/></button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {teamMembers.length === 0 ? <p className="text-gray-500 text-xs text-center py-4">No team members added yet.</p> : teamMembers.map(m => (
                        <div key={m.id} className="bg-white/5 border border-white/5 p-3 rounded-lg flex justify-between items-center">
                            <span className="font-bold text-sm text-gray-200">{m.name}</span>
                            <button onClick={() => deleteTeamMember(m.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      )}

      {toast && <div className={`fixed bottom-24 right-6 px-6 py-3 rounded shadow-xl font-bold text-white z-[60] animate-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-green-600" : "bg-blue-600"}`}>{toast.msg}</div>}
    </div>
  );
}
