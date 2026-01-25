"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Plus, Minus, Search, Trash2, X, Loader2, Truck, 
  ClipboardList, ChevronDown, AlertTriangle, Settings, 
  RefreshCw, Edit3, CheckCircle2, Eye, EyeOff, Wrench, 
  Camera, User, LayoutGrid, Users, ListPlus, Save, Box, GripVertical, ArrowLeft, ArrowRightLeft
} from "lucide-react";
import Link from "next/link";

const THEME_ORANGE = "#FF6700";

export default function LoadOut() {
  const supabase = createClient();
  
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState("STOCK");
  const [vans, setVans] = useState([]);
  const [currentVan, setCurrentVan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [renameVanName, setRenameVanName] = useState("");

  // --- STOCK STATE ---
  const [items, setItems] = useState([]);
  const [stockSearch, setStockSearch] = useState(""); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [targetQtyInput, setTargetQtyInput] = useState("");
  
  // --- SWAP STATE (Replaces Drag & Drop) ---
  const [swapSourceIndex, setSwapSourceIndex] = useState(null);
  
  // --- ADD MODAL STATE ---
  const [showAddModal, setShowAddModal] = useState(false);
  // Unified logic - batchRows handles single and bulk
  const [batchRows, setBatchRows] = useState([{ name: "", qty: 3 }]); 

  // --- TOOLS STATE ---
  const [tools, setTools] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [toolSearch, setToolSearch] = useState("");
  const [showAddTool, setShowAddTool] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTool, setNewTool] = useState({ name: "", brand: "", serial: "" });
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [toolFilter, setToolFilter] = useState("ALL");
  const [newMemberName, setNewMemberName] = useState("");

  const colors = [
    { hex: "#262626", name: "Charcoal" },
    { hex: THEME_ORANGE, name: "Brand Orange" }, 
    { hex: "#7f1d1d", name: "Red" },
    { hex: "#14532d", name: "Green" },
    { hex: "#1e3a8a", name: "Blue" },
    { hex: "#581c87", name: "Purple" },
  ];

  // HAPTIC ENGINE
  const vibrate = (pattern = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
  };

  useEffect(() => { initFleet(); }, []);

  // 1. INIT
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

    const { data: team } = await supabase.from("team_members").select("*").order("name");
    if (team) setTeamMembers(team);

    fetchVanData(userVans[0].id);
  };

  const fetchVanData = async (vanId) => {
    setLoading(true);
    const { data: stock } = await supabase.from("inventory").select("*").eq("van_id", vanId).order("created_at", { ascending: false });
    if (stock) setItems(stock);
    
    const { data: assets } = await supabase.from("assets").select("*").eq("van_id", vanId).order("created_at", { ascending: false });
    if (assets) setTools(assets);
    
    setLoading(false);
  };

  const switchVan = (vanId) => {
    vibrate();
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

  // --- SWAP LOGIC (Replaces Drag & Drop) ---
  const handleSwapClick = (index) => {
      vibrate(20);
      
      // If nothing selected, select this one
      if (swapSourceIndex === null) {
          setSwapSourceIndex(index);
          return;
      }

      // If clicking self, deselect
      if (swapSourceIndex === index) {
          setSwapSourceIndex(null);
          return;
      }

      // Perform Swap
      const newItems = [...items];
      const itemA = newItems[swapSourceIndex];
      const itemB = newItems[index];

      newItems[swapSourceIndex] = itemB;
      newItems[index] = itemA;

      setItems(newItems);
      setSwapSourceIndex(null);
      showToast("Items Swapped", "success");
      
      // Optional: Here you would save the new order to DB if you had a sort_order column
  };

  // 2. STOCK ACTIONS
  const addSingleStockItem = async () => {
    if (!newItemName.trim()) return;
    vibrate(20);
    const { data: { user } } = await supabase.auth.getUser();
    const tempId = Math.random();
    const tempItem = { id: tempId, name: newItemName, quantity: 1, min_quantity: 3, color: THEME_ORANGE };
    setItems([tempItem, ...items]);
    setNewItemName("");
    setShowAddModal(false);

    const { data } = await supabase.from("inventory").insert({
        user_id: user.id, van_id: currentVan.id, name: tempItem.name, quantity: 1, min_quantity: 3, color: THEME_ORANGE 
    }).select().single();
    if (data) setItems(prev => prev.map(i => i.id === tempId ? data : i));
  };

  // BATCH ACTIONS
  const handleBatchRowChange = (index, field, value) => {
      const newRows = [...batchRows];
      newRows[index][field] = value;
      setBatchRows(newRows);
  };

  const addBatchRow = () => {
      vibrate();
      setBatchRows([...batchRows, { name: "", qty: 3 }]);
  };

  const removeBatchRow = (index) => {
      if(batchRows.length === 1) return;
      const newRows = [...batchRows];
      newRows.splice(index, 1);
      setBatchRows(newRows);
  };

  const saveBatch = async () => {
      vibrate(20);
      const validRows = batchRows.filter(r => r.name.trim() !== "");
      if(validRows.length === 0) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Optimistic
      const newItems = validRows.map(r => ({
          id: Math.random(), name: r.name, quantity: 1, min_quantity: parseInt(r.qty) || 3, color: THEME_ORANGE
      }));
      setItems([...newItems, ...items]);
      
      setBatchRows([{ name: "", qty: 3 }]);
      setShowAddModal(false);

      // DB Loop
      for (const row of validRows) {
          await supabase.from("inventory").insert({
            user_id: user.id, van_id: currentVan.id, name: row.name, 
            quantity: 1, min_quantity: parseInt(row.qty) || 3, color: THEME_ORANGE 
          });
      }
      fetchVanData(currentVan.id); 
      showToast(`${validRows.length} Items Added`, "success");
  };

  const updateStockQty = async (id, currentQty, change) => {
    vibrate(5); 
    const newQty = Math.max(0, Number(currentQty) + change);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
  };

  const openStockEdit = (e, item) => {
      e.stopPropagation(); // Prevent swap click
      vibrate();
      setEditingItem(item);
      setTargetQtyInput(item.min_quantity.toString());
  };

  const saveStockEdit = async () => {
    if (!editingItem) return;
    vibrate();
    const newMin = parseInt(targetQtyInput) || 0;
    const updatedItem = { ...editingItem, min_quantity: newMin };
    setItems(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i));
    await supabase.from("inventory").update({ name: updatedItem.name, color: updatedItem.color, min_quantity: updatedItem.min_quantity, quantity: updatedItem.quantity }).eq("id", updatedItem.id);
    setEditingItem(null);
  };

  const deleteStockItem = async (id) => {
    if(!confirm("Delete this item?")) return;
    vibrate();
    setItems(prev => prev.filter(i => i.id !== id));
    await supabase.from("inventory").delete().eq("id", id);
    setEditingItem(null);
  };

  // 3. TOOL ACTIONS
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
    vibrate();
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let finalPhotoUrl = null;
    if (newPhoto) {
        const fileName = `${user.id}/${Date.now()}-${newPhoto.name}`;
        const { error: uploadError } = await supabase.storage.from("tool-photos").upload(fileName, newPhoto);
        if (uploadError) {
            showToast("Photo failed, saving tool anyway...", "error");
        } else {
            const { data } = supabase.storage.from("tool-photos").getPublicUrl(fileName);
            finalPhotoUrl = data.publicUrl;
        }
    }

    const { data, error } = await supabase.from("assets").insert({
        user_id: user.id, van_id: currentVan.id, name: newTool.name, 
        brand: newTool.brand, serial_number: newTool.serial, 
        photo_url: finalPhotoUrl, status: "IN_VAN"
    }).select().single();

    if (error) {
        showToast("Error saving: " + error.message, "error");
    } else if (data) {
        setTools([data, ...tools]);
        setShowAddTool(false);
        setNewTool({ name: "", brand: "", serial: "" });
        setNewPhoto(null); setPhotoPreview(null);
        showToast("Tool Added", "success");
    }
    setUploading(false);
  };

  const updateToolStatus = async (id, status, memberId = null) => {
    vibrate();
    setTools(tools.map(t => t.id === id ? { ...t, status, assigned_to: memberId } : t));
    setSelectedAsset(null);
    await supabase.from("assets").update({ status, assigned_to: memberId }).eq("id", id);
  };

  const deleteTool = async (id) => {
    if(!confirm("Delete tool?")) return;
    vibrate();
    setTools(tools.filter(t => t.id !== id));
    await supabase.from("assets").delete().eq("id", id);
  };

  // 4. TEAM ACTIONS
  const addTeamMember = async () => {
    if (!newMemberName.trim()) return;
    vibrate();
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("team_members").insert({ user_id: user.id, name: newMemberName }).select().single();
    if (data) {
        setTeamMembers([...teamMembers, data]);
        setNewMemberName("");
    }
  };

  const deleteTeamMember = async (id) => {
    if(!confirm("Remove user?")) return;
    vibrate();
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    await supabase.from("team_members").delete().eq("id", id);
  };

  // 5. GLOBAL MENU
  const handleRenameVan = async () => {
    if(!renameVanName.trim()) return;
    vibrate();
    const updatedVans = vans.map(v => v.id === currentVan.id ? {...v, name: renameVanName} : v);
    setVans(updatedVans);
    setCurrentVan({...currentVan, name: renameVanName});
    await supabase.from("vans").update({ name: renameVanName }).eq("id", currentVan.id);
    showToast("Van Renamed", "success");
  };

  const handleDeleteVan = async () => {
    if (vans.length <= 1) return showToast("Cannot delete only van", "error");
    if (!confirm("Delete this van and ALL contents?")) return;
    vibrate();
    setLoading(true);
    await supabase.from("inventory").delete().eq("van_id", currentVan.id);
    await supabase.from("assets").delete().eq("van_id", currentVan.id);
    await supabase.from("vans").delete().eq("id", currentVan.id);
    window.location.reload(); 
  };

  const copyShoppingList = () => {
    vibrate();
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
    vibrate();
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

  // FILTERS
  const filteredTools = tools.filter(t => {
      const matchSearch = !toolSearch || t.name.toLowerCase().includes(toolSearch.toLowerCase()) || t.serial_number?.toLowerCase().includes(toolSearch.toLowerCase());
      const matchFilter = toolFilter === "ALL" || 
                          (toolFilter === "OUT" && t.status === "CHECKED_OUT") ||
                          (toolFilter === "BROKEN" && t.status === "BROKEN");
      return matchSearch && matchFilter;
  });

  const filteredItems = items.filter(i => {
      return !stockSearch || i.name.toLowerCase().includes(stockSearch.toLowerCase());
  });

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6700]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-inter pb-32">
      
      {/* CUSTOM HEADER: Inline to ensure correct color in Light Mode */}
      <div className="flex items-center gap-4 px-6 pt-4 mb-4">
        <Link href="/" className="p-2 rounded-lg hover:text-[#FF6700] transition-colors text-foreground border border-transparent hover:border-[#FF6700]/30">
          <ArrowLeft size={28} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] font-oswald">LOADOUT</h1>
          <p className="text-xs text-foreground font-bold tracking-widest opacity-60">INVENTORY TRACKER</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-2">
        
        {/* TOP BAR - VAN SELECTOR */}
        <div className="flex items-center justify-between mb-4 bg-industrial-card border border-industrial-border p-3 rounded-xl relative z-20">
            <div className="relative w-full">
                <button onClick={() => { vibrate(); setShowSettings(!showSettings); }} className="w-full flex items-center justify-between font-bold text-lg uppercase tracking-wide">
                    <div className="flex items-center gap-3">
                        <Truck className="text-[#FF6700]" size={20} />
                        <span className="text-foreground">{currentVan ? currentVan.name : "Loading..."}</span>
                    </div>
                    <Settings size={20} className={`text-industrial-muted transition-transform ${showSettings ? "rotate-90 text-foreground" : ""}`}/>
                </button>

                {/* SETTINGS MENU */}
                {showSettings && (
                    <div className="absolute top-full left-0 mt-4 w-full md:w-80 bg-[#1a1a1a] rounded-xl shadow-2xl z-50 p-4 animate-in fade-in border border-gray-700">
                        {activeTab === "STOCK" && (
                            <div className="mb-4 pb-4 border-b border-gray-700">
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Interface</label>
                                <button onClick={() => { vibrate(); setIsEditMode(!isEditMode); setShowSettings(false); }} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isEditMode ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-white/5 border-gray-600 text-white"}`}>
                                    <span className="font-bold text-sm flex items-center gap-2">{isEditMode ? <Eye/> : <EyeOff/>} {isEditMode ? "EDITING ON" : "STANDARD"}</span>
                                </button>
                            </div>
                        )}
                        <div className="mb-4 pb-4 border-b border-gray-700">
                            <label className="text-xs text-gray-500 font-bold uppercase mb-1">Vehicle Name</label>
                            <div className="flex gap-2">
                                <input value={renameVanName} onChange={e => setRenameVanName(e.target.value)} className="bg-black/40 border border-gray-700 rounded p-2 text-sm flex-1 text-white outline-none focus:border-[#FF6700]" />
                                <button onClick={handleRenameVan} className="bg-[#FF6700] text-black rounded p-2"><CheckCircle2/></button>
                            </div>
                        </div>
                        <div className="mb-4 pb-4 border-b border-gray-700 space-y-2">
                            <label className="text-xs text-gray-500 font-bold uppercase">Switch Vehicle</label>
                            {vans.map(v => (
                                <button key={v.id} onClick={() => switchVan(v.id)} className={`w-full text-left text-sm p-2 rounded hover:bg-white/5 ${v.id === currentVan.id ? "text-[#FF6700] bg-[#FF6700]/10" : "text-gray-400"}`}>{v.name}</button>
                            ))}
                            <button onClick={createVan} className="w-full text-left text-xs font-bold text-[#FF6700] p-2 hover:underline flex items-center gap-1"><Plus size={12}/> New Van</button>
                        </div>
                        
                        <div className="mb-4 pb-4 border-b border-gray-700">
                             <button onClick={() => { vibrate(); setShowTeamModal(true); setShowSettings(false); }} className="w-full flex items-center gap-2 text-sm text-white p-2 rounded hover:bg-white/5 border border-gray-700 justify-center font-bold">
                                <Users size={16}/> MANAGE TEAM
                             </button>
                        </div>

                        <div className="space-y-2 pb-4 border-b border-gray-700">
                            <button onClick={copyShoppingList} className="w-full flex items-center gap-2 text-sm text-gray-400 p-2 rounded hover:bg-white/5"><ClipboardList size={16}/> Copy Shopping List</button>
                            <button onClick={restockAll} className="w-full flex items-center gap-2 text-sm text-green-500 p-2 rounded hover:bg-green-900/20"><RefreshCw size={16}/> Restock All</button>
                        </div>
                        <div className="pt-2"><button onClick={handleDeleteVan} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:text-red-500 p-2"><Trash2 size={14}/> Delete Vehicle</button></div>
                    </div>
                )}
            </div>
        </div>

        {/* TABS - CONSISTENT COLORS */}
        <div className="flex bg-industrial-bg p-1 rounded-xl mb-6 border border-industrial-border">
            <button onClick={() => { vibrate(); setActiveTab("STOCK"); }} className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide flex items-center justify-center gap-2 transition-all ${activeTab === "STOCK" ? "bg-[#FF6700] text-black shadow-lg" : "text-industrial-muted hover:text-foreground"}`}>
                <LayoutGrid size={18}/> STOCK
            </button>
            <button onClick={() => { vibrate(); setActiveTab("TOOLS"); }} className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide flex items-center justify-center gap-2 transition-all ${activeTab === "TOOLS" ? "bg-[#FF6700] text-black shadow-lg" : "text-industrial-muted hover:text-foreground"}`}>
                <Wrench size={18}/> TOOLS
            </button>
        </div>

        {/* TAB 1: STOCK */}
        {activeTab === "STOCK" && (
            <div className="animate-in fade-in slide-in-from-left-4">
                
                {/* ACTION BAR (STICKY) */}
                <div className="sticky top-0 z-30 bg-background pt-2 pb-4 flex gap-2 h-16">
                    <div className="relative flex-1 h-full">
                        <Search className="absolute left-3 top-4 text-industrial-muted" size={20} />
                        <input 
                            type="text" 
                            placeholder="Filter stock..." 
                            value={stockSearch} 
                            onChange={(e) => setStockSearch(e.target.value)} 
                            className="input-field rounded-xl pl-12 pr-4 w-full h-full bg-industrial-card border-none text-lg shadow-sm" 
                        />
                    </div>
                    {/* ADD BUTTON OPENS UNIFIED MODAL */}
                    <button onClick={() => { vibrate(); setShowAddModal(true); }} className="bg-[#FF6700] text-black h-full px-6 rounded-xl font-bold flex items-center justify-center hover:scale-105 transition shadow-lg shrink-0">
                        <Plus size={32} />
                    </button>
                </div>

                {/* THE CONTROL DECK GRID */}
                <div className="grid grid-cols-3 gap-3 pb-20 select-none">
                    {filteredItems.map((item, index) => (
                        <div 
                            key={item.id} 
                            onClick={() => { if(isEditMode) handleSwapClick(index); }} 
                            style={{ backgroundColor: item.color || "#262626" }} 
                            className={`relative h-44 rounded-xl overflow-hidden flex flex-col justify-between shadow-lg border border-white/5 
                                ${isEditMode ? "cursor-pointer active:scale-95 transition-transform" : ""}
                                ${swapSourceIndex === index ? "ring-4 ring-[#FF6700] scale-95" : (isEditMode ? "ring-2 ring-white" : "")} 
                                ${item.quantity < (item.min_quantity || 3) ? "ring-2 ring-red-500" : ""}`}
                        >
                            {/* TOP */}
                            <div className="p-3 flex justify-between items-start h-[30%]">
                                <h3 className="font-oswald font-bold text-sm leading-tight truncate text-white w-full opacity-90">{item.name}</h3>
                                {isEditMode ? (
                                    <button onClick={(e) => openStockEdit(e, item)} className="p-1 bg-black/50 rounded hover:bg-[#FF6700] hover:text-black text-white transition"><Edit3 size={14}/></button>
                                ) : (item.quantity < (item.min_quantity || 3) && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 ml-1"></div>)}
                            </div>
                            {/* MIDDLE */}
                            <div className="flex-1 flex items-center justify-center h-[35%] bg-black/10">
                                <span className="text-5xl font-oswald font-bold text-white tracking-tighter drop-shadow-md">{item.quantity}</span>
                            </div>
                            {/* BOTTOM */}
                            {!isEditMode && (
                                <div className="flex h-[35%] border-t border-white/10">
                                    <button onClick={(e) => { e.stopPropagation(); updateStockQty(item.id, item.quantity, -1); }} className="flex-1 bg-black/20 hover:bg-red-500/20 active:bg-red-500 text-white flex items-center justify-center transition-colors border-r border-white/10"><Minus size={24} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); updateStockQty(item.id, item.quantity, 1); }} className="flex-1 bg-black/20 hover:bg-green-500/20 active:bg-green-500 text-white flex items-center justify-center transition-colors"><Plus size={24} /></button>
                                </div>
                            )}
                            {isEditMode && <div className="absolute inset-x-0 bottom-0 h-[35%] bg-black/50 flex items-center justify-center text-[10px] font-bold uppercase text-white">{swapSourceIndex === index ? "SELECTED" : "TAP TO SWAP"}</div>}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* TAB 2: TOOLS */}
        {activeTab === "TOOLS" && (
            <div className="animate-in fade-in slide-in-from-right-4">
                
                {/* ACTION BAR (STICKY) - Identical to Stock */}
                <div className="sticky top-0 z-30 bg-background pt-2 pb-4 flex gap-2 h-16">
                    <div className="relative flex-1 h-full">
                        <Search className="absolute left-3 top-4 text-industrial-muted" size={20} />
                        <input type="text" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)} placeholder="Search tools..." className="input-field rounded-xl pl-12 pr-4 w-full h-full bg-industrial-card border-none text-lg shadow-sm" />
                    </div>
                    {/* Add Tool Button (Identical Orange) */}
                    <button onClick={() => { vibrate(); setShowAddTool(true); }} className="bg-[#FF6700] text-black h-full px-6 rounded-xl font-bold flex items-center justify-center hover:scale-105 transition shadow-lg shrink-0">
                        <Plus size={32} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                    {[{k:"ALL", l:"All Tools"}, {k:"OUT", l:"Checked Out"}, {k:"BROKEN", l:"Broken"}].map(f => (
                        <button key={f.k} onClick={() => { vibrate(); setToolFilter(f.k); }} className={`p-2 rounded text-xs font-bold border transition ${toolFilter === f.k ? "bg-[#FF6700] text-black border-[#FF6700]" : "border-industrial-border text-industrial-muted"}`}>{f.l}</button>
                    ))}
                </div>

                <div className="space-y-3 pb-20">
                    {filteredTools.length === 0 ? <div className="text-center py-10 text-industrial-muted">No tools found.</div> : filteredTools.map(tool => (
                        <div key={tool.id} className={`glass-panel p-4 rounded-xl relative transition-all duration-300 ${tool.status === "BROKEN" ? "border-red-900/50 bg-red-900/5" : ""} ${selectedAsset === tool.id ? "ring-1 ring-[#FF6700]" : ""}`}>
                            <div className="flex gap-4 cursor-pointer" onClick={() => { vibrate(); setSelectedAsset(selectedAsset === tool.id ? null : tool.id); }}>
                                <div className="w-16 h-16 rounded-lg bg-black/40 flex-shrink-0 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {tool.photo_url ? <img src={tool.photo_url} alt={tool.name} className="w-full h-full object-cover"/> : <Wrench size={20} className="text-gray-600"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg leading-tight truncate pr-2 text-foreground">{tool.name}</h3>
                                        {tool.status === "IN_VAN" && <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded">IN VAN</span>}
                                        {tool.status === "CHECKED_OUT" && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded">OUT</span>}
                                        {tool.status === "BROKEN" && <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-1 rounded">BROKEN</span>}
                                    </div>
                                    <p className="text-xs text-industrial-muted mt-1">{tool.brand} {tool.serial_number && `• S/N: ${tool.serial_number}`}</p>
                                    {tool.status === "CHECKED_OUT" && tool.assigned_to && (
                                        <p className="text-xs text-blue-400 mt-1 flex items-center gap-1"><User size={12}/> {teamMembers.find(m => m.id === tool.assigned_to)?.name || "Unknown"}</p>
                                    )}
                                </div>
                            </div>
                            {selectedAsset === tool.id && (
                                <div className="mt-4 pt-4 border-t border-industrial-border animate-in slide-in-from-top-2">
                                    {tool.status === "IN_VAN" ? (
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <select onChange={(e) => { if(e.target.value) updateToolStatus(tool.id, "CHECKED_OUT", e.target.value); }} className="w-full bg-industrial-card border border-industrial-border rounded-lg px-3 py-2 text-sm text-foreground outline-none appearance-none focus:border-[#FF6700]">
                                                    <option value="">Select Technician...</option>
                                                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-3 text-industrial-muted pointer-events-none"/>
                                            </div>
                                            <button onClick={() => updateToolStatus(tool.id, "BROKEN")} className="px-3 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 hover:bg-red-900/40"><AlertTriangle size={18}/></button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateToolStatus(tool.id, "IN_VAN")} className="flex-1 bg-industrial-card hover:bg-white hover:text-black py-2 rounded-lg font-bold text-sm transition text-foreground">RETURN TO VAN</button>
                                            <button onClick={() => deleteTool(tool.id)} className="px-3 py-2 text-industrial-muted hover:text-foreground transition"><Trash2 size={18}/></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="mt-12 text-center opacity-40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-muted">
                POWERED BY <span className="text-[#FF6700]">FIELDDESKOPS</span>
            </p>
        </div>

      </main>

      {/* --- ADD ITEMS MODAL (SINGLE & BATCH CONSOLIDATED) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-[100] sm:p-4 backdrop-blur-sm animate-in slide-in-from-bottom-10">
             <div className="bg-[#121212] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl border-t sm:border border-gray-700 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="font-oswald font-bold text-2xl text-[#FF6700] flex items-center gap-2"><ListPlus size={24}/> ADD ITEMS</h2>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
                </div>
                {/* CONSOLIDATED LIST VIEW */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4">
                        {batchRows.map((row, idx) => (
                            <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                                <span className="text-gray-600 font-mono text-xs w-4">{idx + 1}</span>
                                <input placeholder="Item Name (e.g. Wire Nuts)" value={row.name} onChange={(e) => handleBatchRowChange(idx, "name", e.target.value)} className="flex-1 bg-black/40 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#FF6700]" />
                                <input type="number" placeholder="Qty" value={row.qty} onChange={(e) => handleBatchRowChange(idx, "qty", e.target.value)} className="w-16 bg-black/40 border border-gray-700 rounded-lg p-3 text-center text-[#FF6700] outline-none focus:border-[#FF6700]" />
                                {batchRows.length > 1 && <button onClick={() => removeBatchRow(idx)} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={16}/></button>}
                            </div>
                        ))}
                        <button onClick={addBatchRow} className="w-full py-3 border border-dashed border-gray-800 rounded-lg text-gray-500 flex justify-center items-center gap-2 hover:border-gray-500 hover:text-white"><Plus size={16}/> Add Row</button>
                    </div>
                    <button onClick={saveBatch} className="bg-[#FF6700] text-black font-bold py-4 rounded-xl text-xl shrink-0 hover:scale-[1.02] transition">SAVE ITEMS</button>
                </div>
             </div>
        </div>
      )}

      {/* TOOL MODAL - FIXED DARK INPUTS */}
      {showAddTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-industrial-border bg-industrial-bg">
                <button onClick={() => setShowAddTool(false)} className="absolute top-4 right-4 text-industrial-muted hover:text-foreground"><X size={20}/></button>
                <h2 className="font-oswald font-bold text-xl mb-6 text-[#FF6700]">REGISTER TOOL</h2>
                <div className="mb-4">
                    {photoPreview ? (
                        <div className="relative w-full h-40 bg-black/40 rounded-xl overflow-hidden border border-white/10">
                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover"/>
                            <button onClick={() => { setPhotoPreview(null); setNewPhoto(null); }} className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full text-white shadow-lg"><X size={14}/></button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-industrial-border rounded-xl cursor-pointer hover:border-[#FF6700] hover:bg-white/5 transition">
                            <Camera size={24} className="text-industrial-muted mb-2"/>
                            <span className="text-xs text-industrial-muted font-bold uppercase">Tap to Take Photo</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect}/>
                        </label>
                    )}
                </div>
                <div className="space-y-3">
                    <input placeholder="Tool Name (e.g. Hilti Drill)" value={newTool.name} onChange={e => setNewTool({...newTool, name: e.target.value})} className="bg-black/40 border border-gray-700 rounded-lg p-3 w-full text-white outline-none focus:border-[#FF6700]"/>
                    <div className="flex gap-2">
                        <input placeholder="Brand" value={newTool.brand} onChange={e => setNewTool({...newTool, brand: e.target.value})} className="bg-black/40 border border-gray-700 rounded-lg p-3 w-full text-white outline-none focus:border-[#FF6700]"/>
                        <input placeholder="Serial #" value={newTool.serial} onChange={e => setNewTool({...newTool, serial: e.target.value})} className="bg-black/40 border border-gray-700 rounded-lg p-3 w-full text-white outline-none focus:border-[#FF6700]"/>
                    </div>
                </div>
                <button onClick={addTool} disabled={uploading} className="w-full mt-6 bg-[#FF6700] text-black font-bold py-3 rounded-xl hover:scale-105 transition shadow-[0_0_20px_rgba(255,103,0,0.4)] flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>} SAVE TO VAN
                </button>
            </div>
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
             <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-industrial-border bg-industrial-bg">
                <button onClick={() => setShowTeamModal(false)} className="absolute top-4 right-4 text-industrial-muted hover:text-foreground"><X size={20}/></button>
                <h2 className="font-oswald font-bold text-xl mb-6 text-foreground flex items-center gap-2"><Users size={20}/> MANAGE TEAM</h2>
                <div className="flex gap-2 mb-6">
                    <input placeholder="Enter Name (e.g. Mike)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} className="input-field rounded-lg p-2 flex-1"/>
                    <button onClick={addTeamMember} className="bg-[#FF6700] text-black font-bold px-4 rounded-lg"><Plus/></button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {teamMembers.length === 0 ? <p className="text-industrial-muted text-xs text-center py-4">No team members added yet.</p> : teamMembers.map(m => (
                        <div key={m.id} className="bg-white/5 border border-white/5 p-3 rounded-lg flex justify-between items-center">
                            <span className="font-bold text-sm text-foreground">{m.name}</span>
                            <button onClick={() => deleteTeamMember(m.id)} className="text-industrial-muted hover:text-red-500"><Trash2 size={14}/></button>
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
