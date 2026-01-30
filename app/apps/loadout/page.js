"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Plus, Minus, Search, Trash2, X, Loader2, Truck, 
  ClipboardList, ChevronDown, AlertTriangle, Settings, 
  RefreshCw, Edit3, CheckCircle2, Eye, EyeOff, Wrench, 
  Camera, User, LayoutGrid, Users, ListPlus, Save, Box, GripVertical, ArrowLeft, ArrowRightLeft, Pencil, List
} from "lucide-react";
import Link from "next/link";

const THEME_ORANGE = "#FF6700";

export default function LoadOut() {
  const supabase = createClient();
  
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState("STOCK");
  const [rigs, setRigs] = useState([]);
  const [currentRig, setCurrentRig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [renameRigName, setRenameRigName] = useState("");

  // --- STOCK STATE ---
  const [items, setItems] = useState([]);
  const [stockSearch, setStockSearch] = useState(""); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [targetQtyInput, setTargetQtyInput] = useState("");
  const [viewMode, setViewMode] = useState("buttons");
  
  // --- SMART SELECTION STATE ---
  const [selectedIndices, setSelectedIndices] = useState([]); // Stores indexes of selected cards
  
  // --- ADD MODAL STATE ---
  const [showAddModal, setShowAddModal] = useState(false);
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

  // HAPTIC ENGINE
  const vibrate = (pattern = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
  };

  useEffect(() => { initFleet(); }, []);
  useEffect(() => {
    const saved = localStorage.getItem("loadout-view-mode");
    if (saved) setViewMode(saved);
  }, []);

  // 1. INIT
  const initFleet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Not authenticated", "error");
      setLoading(false);
      return;
    }
    if (!user) return;

    let { data: userRigs } = await supabase
      .from("rigs")
      .select("*")
      .order("created_at");

    if (!userRigs || userRigs.length === 0) {
      const { data: newRig } = await supabase
        .from("rigs")
        .insert({
          user_id: user.id,
          name: "Rig 1",
        })
        .select()
        .single();
      userRigs = [newRig];
    }

    setRigs(userRigs);
    setCurrentRig(userRigs[0]);
    setRenameRigName(userRigs[0].name);

    const { data: team } = await supabase
      .from("team_members")
      .select("*")
      .order("name");
    if (team) setTeamMembers(team);

    fetchRigData(userRigs[0].id);
  };

  const fetchRigData = async (rigId) => {
    console.log("Fetching data for rig:", rigId);
    setLoading(true);

    const { data: stock, error: stockError } = await supabase
      .from("inventory")
      .select("*")
      .eq("rig_id", rigId)
      .order("created_at", { ascending: false });

    console.log("Stock data:", stock, "Error:", stockError);
    if (stock) setItems(stock);

    const { data: tools, error: toolsError } = await supabase
      .from("tools")
      .select("*")
      .eq("rig_id", rigId)
      .order("created_at", { ascending: false });

    console.log("Tools data:", tools, "Error:", toolsError);
    if (tools) setTools(tools);

    setLoading(false);
  };

  const switchRig = (rigId) => {
    vibrate();
    const selected = rigs.find((v) => v.id === rigId);
    setCurrentRig(selected);
    setRenameRigName(selected.name);
    fetchRigData(rigId);
    setShowSettings(false);
  };

  const createRig = async () => {
    const name = prompt("Enter Name for new Rig");
    if (!name) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { data: newRig } = await supabase
      .from("rigs")
      .insert({
        user_id: user.id,
        name: name,
      })
      .select()
      .single();

    if (newRig) {
      setRigs([...rigs, newRig]);
      setCurrentRig(newRig);
      fetchRigData(newRig.id);
      setShowSettings(false);
    }
  };

  // --- SMART SELECTION LOGIC ---
  const toggleSelection = (index) => {
      vibrate(15);
      if (selectedIndices.includes(index)) {
          setSelectedIndices(prev => prev.filter(i => i !== index));
      } else {
          setSelectedIndices(prev => [...prev, index]);
      }
  };

  const handleSwapSelected = () => {
      if (selectedIndices.length !== 2) return;
      vibrate(30);
      const newItems = [...items];
      const indexA = selectedIndices[0];
      const indexB = selectedIndices[1];
      
      const temp = newItems[indexA];
      newItems[indexA] = newItems[indexB];
      newItems[indexB] = temp;
      
      setItems(newItems);
      setSelectedIndices([]);
      showToast("Items Swapped", "success");
      // Add DB persistence here in future
  };

  const handleDeleteSelected = async () => {
      if (!confirm(`Delete ${selectedIndices.length} items?`)) return;
      vibrate(50);
      
      // Get IDs to delete from DB
      const idsToDelete = selectedIndices.map(idx => items[idx].id);
      
      // Update UI
      const newItems = items.filter((_, idx) => !selectedIndices.includes(idx));
      setItems(newItems);
      setSelectedIndices([]);
      
      // DB Delete
      await supabase.from("inventory").delete().in("id", idsToDelete);
      showToast("Deleted", "success");
  };

  const handleEditSelected = () => {
      if (selectedIndices.length !== 1) return;
      openStockEdit(null, items[selectedIndices[0]]);
      setSelectedIndices([]);
  };

  // --- UNIFIED BATCH ADD LOGIC ---
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
    const validRows = batchRows.filter((r) => r.name.trim() !== "");
    if (validRows.length === 0) return;

    // Get user correctly
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log("Auth result:", { user, authError });

    if (!user || !user.id) {
      alert("Not authenticated. Please log in again.");
      return;
    }

    if (!currentRig || !currentRig.id) {
      alert("No rig selected");
      return;
    }

    for (const row of validRows) {
      const payload = {
        user_id: user.id,
        rig_id: currentRig.id,
        name: row.name,
        quantity: 1,
        min_quantity: parseInt(row.qty) || 3,
        color: THEME_ORANGE,
      };

      console.log("Inserting payload:", payload);

      const { data, error } = await supabase
        .from("inventory")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        alert(`Error: ${error.message}`);
        return;
      }

      console.log("Success:", data);
    }

    await fetchRigData(currentRig.id);
    showToast(`${validRows.length} Items Added`, "success");
    setBatchRows([{ name: "", qty: "3" }]);
    setShowAddModal(false);
  };

  const updateStockQty = async (id, currentQty, change) => {
    vibrate(5); 
    const newQty = Math.max(0, Number(currentQty) + change);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
  };

  const openStockEdit = (e, item) => {
      if(e) e.stopPropagation();
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
    if (!newTool.name) {
      showToast("Name required", "error");
      return;
    }

    vibrate();
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Not authenticated", "error");
      setUploading(false);
      return;
    }
    if (!currentRig?.id) {
      showToast("Select a rig first", "error");
      setUploading(false);
      return;
    }

    let finalPhotoUrl = null;

    if (newPhoto) {
      const fileName = `${user.id}/${Date.now()}-${newPhoto.name}`;
      const { error: uploadError } = await supabase.storage
        .from("tool-photos")
        .upload(fileName, newPhoto);

      if (!uploadError) {
        const { data } = supabase.storage
          .from("tool-photos")
          .getPublicUrl(fileName);
        finalPhotoUrl = data.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("tools")
      .insert({
        user_id: user.id,
        rig_id: currentRig.id,
        name: newTool.name,
        brand: newTool.brand || null,
        serial_number: newTool.serial || null,
        photo_url: finalPhotoUrl,
        status: "IN_RIG",
      })
      .select()
      .single();

    if (error) {
      console.error("Tool save error:", error);
      showToast(`Error: ${error.message}`, "error");
    } else if (data) {
      console.log("Tool saved successfully:", data);

      // Don't manually update state - fetch fresh from database
      await fetchRigData(currentRig.id);

      setShowAddTool(false);
      setNewTool({ name: "", brand: "", serial: "" });
      setNewPhoto(null);
      setPhotoPreview(null);
      showToast("Tool Added", "success");
    }

    setUploading(false);
  };

  const updateToolStatus = async (id, status, memberId = null) => {
    vibrate();
    setTools(tools.map((t) => (t.id === id ? { ...t, status, assigned_to: memberId } : t)));
    setSelectedAsset(null);
    await supabase
      .from("tools")
      .update({ status, assigned_to: memberId })
      .eq("id", id);
  };

  const deleteTool = async (id) => {
    if (!confirm("Delete tool?")) return;
    vibrate();
    setTools(tools.filter((t) => t.id !== id));
    await supabase.from("tools").delete().eq("id", id);
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
  const handleRenameRig = async () => {
    if(!renameRigName.trim()) return;
    vibrate();
    const updatedRigs = rigs.map(v => v.id === currentRig.id ? {...v, name: renameRigName} : v);
    setRigs(updatedRigs);
    setCurrentRig({...currentRig, name: renameRigName});
    await supabase.from("rigs").update({ name: renameRigName }).eq("id", currentRig.id);
    showToast("Rig Renamed", "success");
  };

  const handleDeleteRig = async () => {
    if (rigs.length === 1) {
      showToast("Cannot delete only rig", "error");
      return;
    }
    if (!confirm("Delete this rig and ALL contents?")) return;

    vibrate();
    setLoading(true);

    await supabase.from("inventory").delete().eq("rig_id", currentRig.id);
    await supabase.from("tools").delete().eq("rig_id", currentRig.id);
    await supabase.from("rigs").delete().eq("id", currentRig.id);

    window.location.reload();
  };

  const copyShoppingList = () => {
    vibrate();
    const toBuy = items.filter(i => i.quantity < i.min_quantity);
    if (toBuy.length === 0) { showToast("Nothing to buy!", "success"); return; }
    let text = `🛒 ${currentRig.name.toUpperCase()} SHOPPING LIST:\n`;
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
      
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-var(--bg-main) border-b border-var(--border-color) px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors">
              <ArrowLeft size={28} />
            </Link>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#FF6700]">FIELDDESKOPS</p>
              <h1 
                className="text-2xl font-bold uppercase tracking-wider"
                style={{
                  color: "#FF6700",
                  textShadow: "0 0 10px rgba(255,103,0,0.5), 0 0 20px rgba(255,103,0,0.3), 0 0 30px rgba(255,103,0,0.2)"
                }}
              >
                LOADOUT
              </h1>
              <p 
                className="text-[8px] font-bold uppercase tracking-widest"
                style={{
                  color: "#FF6700",
                  textShadow: "0 0 8px rgba(255,103,0,0.3)"
                }}
              >
                INVENTORY TRACKER
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-2">
        
        {/* TOP BAR - RIG SELECTOR (Z-40 to fix stacking) */}
        <div className="flex items-center justify-between mb-4 bg-industrial-card border border-industrial-border p-3 rounded-xl relative z-40">
            <div className="relative w-full">
                <button onClick={() => { vibrate(); setShowSettings(!showSettings); }} className="w-full flex items-center justify-between font-bold text-lg uppercase tracking-wide">
                    <div className="flex items-center gap-3">
                        <Truck className="text-[#FF6700]" size={20} />
                        <span className="text-foreground">{currentRig ? currentRig.name : "Loading..."}</span>
                    </div>
                    <Settings size={20} className={`text-industrial-muted transition-transform ${showSettings ? "rotate-90 text-foreground" : ""}`}/>
                </button>

                {/* SETTINGS MENU (Z-50) */}
                {showSettings && (
                    <div className="absolute top-full left-0 mt-4 w-full md:w-80 bg-[#1a1a1a] rounded-xl shadow-2xl z-50 p-4 animate-in fade-in border border-gray-700">
                        {activeTab === "STOCK" && (
                            <div className="mb-4 pb-4 border-b border-gray-700">
                                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Interface</label>
                                <button onClick={() => { vibrate(); setIsEditMode(!isEditMode); setShowSettings(false); setSelectedIndices([]); }} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isEditMode ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-white/5 border-gray-600 text-white"}`}>
                                    <span className="font-bold text-sm flex items-center gap-2">{isEditMode ? <Eye/> : <EyeOff/>} {isEditMode ? "EDITING ON" : "STANDARD"}</span>
                                </button>
                            </div>
                        )}
                        <div className="mb-4 pb-4 border-b border-gray-700">
                                <label className="text-xs text-gray-500 font-bold uppercase mb-1">Rig Name</label>
                            <div className="flex gap-2">
                                <input value={renameRigName} onChange={e => setRenameRigName(e.target.value)} className="bg-black/40 border border-gray-700 rounded p-2 text-sm flex-1 text-white outline-none focus:border-[#FF6700]" />
                                <button onClick={handleRenameRig} className="bg-[#FF6700] text-black rounded p-2"><CheckCircle2/></button>
                            </div>
                        </div>
                        <div className="mb-4 pb-4 border-b border-gray-700 space-y-2">
                            <label className="text-xs text-gray-500 font-bold uppercase">Switch Rig</label>
                            {rigs.map(v => (
                                <button key={v.id} onClick={() => switchRig(v.id)} className={`w-full text-left text-sm p-2 rounded hover:bg-white/5 ${v.id === currentRig.id ? "text-[#FF6700] bg-[#FF6700]/10" : "text-gray-400"}`}>{v.name}</button>
                            ))}
                            <button onClick={createRig} className="w-full text-left text-xs font-bold text-[#FF6700] p-2 hover:underline flex items-center gap-1"><Plus size={12}/> New Rig</button>
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
                        <div className="pt-2"><button onClick={handleDeleteRig} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-600 hover:text-red-500 p-2"><Trash2 size={14}/> Delete Rig</button></div>
                    </div>
                )}
            </div>
        </div>

        {/* TABS */}
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
                
                {/* ACTION BAR (STICKY Z-30 - Lower than Menu) */}
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
                    <button
                      onClick={() => {
                        vibrate();
                        const newMode = viewMode === "buttons" ? "list" : "buttons";
                        setViewMode(newMode);
                        localStorage.setItem("loadout-view-mode", newMode);
                      }}
                      className="bg-industrial-card text-foreground h-full px-4 rounded-xl font-bold flex items-center justify-center hover:bg-white/5 transition border border-industrial-border shrink-0"
                      title={viewMode === "buttons" ? "Switch to List View" : "Switch to Button View"}
                    >
                      {viewMode === "buttons" ? <List size={24} /> : <LayoutGrid size={24} />}
                    </button>
                    <button onClick={() => { vibrate(); setShowAddModal(true); }} className="bg-[#FF6700] text-black h-full px-6 rounded-xl font-bold flex items-center justify-center hover:scale-105 transition shadow-lg shrink-0">
                        <Plus size={32} />
                    </button>
                </div>

                {/* THE CONTROL DECK GRID */}
                {viewMode === "buttons" ? (
                  // EXISTING BUTTON GRID - Keep as is
                  <div className="grid grid-cols-3 gap-3 pb-24 select-none">
                    {filteredItems.map((item, index) => {
                      const isSelected = selectedIndices.includes(index);
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isEditMode) toggleSelection(index);
                          }}
                          style={{ backgroundColor: item.color || "#262626" }}
                          className={`relative h-44 rounded-xl overflow-hidden flex flex-col justify-between shadow-lg border border-white/5 ${
                            isEditMode ? "cursor-pointer active:scale-95 transition-transform" : ""
                          } ${isSelected ? "ring-4 ring-[#FF6700] scale-95" : isEditMode ? "ring-2 ring-white/20" : ""} ${
                            item.quantity < (item.min_quantity || 3) ? "ring-2 ring-red-500" : ""
                          }`}
                        >
                          {/* TOP */}
                          <div className="p-3 flex justify-between items-start h-[30%]">
                            <h3 className="font-oswald font-bold text-sm leading-tight truncate text-white w-full opacity-90">
                              {item.name}
                            </h3>
                            {isEditMode && isSelected && (
                              <div className="w-3 h-3 bg-[#FF6700] rounded-full shadow-[0_0_10px_#FF6700]" />
                            )}
                            {!isEditMode && item.quantity < (item.min_quantity || 3) && (
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 ml-1" />
                            )}
                          </div>

                          {/* MIDDLE */}
                          <div className="flex-1 flex items-center justify-center h-[35%] bg-black/10">
                            <span className="text-5xl font-oswald font-bold text-white tracking-tighter drop-shadow-md">
                              {item.quantity}
                            </span>
                          </div>

                          {/* BOTTOM */}
                          {!isEditMode ? (
                            <div className="flex h-[35%] border-t border-white/10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStockQty(item.id, item.quantity, -1);
                                }}
                                className="flex-1 bg-black/20 hover:bg-red-500/20 active:bg-red-500 text-white flex items-center justify-center transition-colors border-r border-white/10"
                              >
                                <Minus size={24} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStockQty(item.id, item.quantity, 1);
                                }}
                                className="flex-1 bg-black/20 hover:bg-green-500/20 active:bg-green-500 text-white flex items-center justify-center transition-colors"
                              >
                                <Plus size={24} />
                              </button>
                            </div>
                          ) : (
                            <div className="absolute inset-x-0 bottom-0 h-[35%] flex items-center justify-center text-[10px] font-bold uppercase bg-black/50 text-white">
                              {isSelected ? "SELECTED" : "TAP TO SELECT"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // NEW LIST VIEW
                  <div className="space-y-2 pb-24">
                    {filteredItems.map((item, index) => {
                      const isSelected = selectedIndices.includes(index);
                      const minQuantity = item.min_quantity ?? 3;
                      const isLowStock = item.quantity <= minQuantity - 3;
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isEditMode) toggleSelection(index);
                          }}
                          className={`bg-industrial-card border rounded-xl p-4 flex items-center justify-between transition-all ${
                            isEditMode ? "cursor-pointer hover:bg-white/5" : ""
                          } ${isSelected ? "ring-2 ring-[#FF6700] bg-[#FF6700]/10" : "border-white/5"} ${
                            isLowStock ? "ring-2 ring-red-500 bg-red-500/5" : ""
                          }`}
                        >
                          {/* Left: Name + Stock Status */}
                          <div className="flex-1 flex items-center gap-4">
                            <div 
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: item.color || "#FF6700" }}
                            />
                            <div>
                              <h3 className="font-bold text-lg text-white">{item.name}</h3>
                              <p className="text-xs text-industrial-muted">
                                Target: {minQuantity} | 
                                {isLowStock ? (
                                  <span className="text-red-500 font-bold"> LOW STOCK</span>
                                ) : (
                                  <span className="text-green-500"> In Stock</span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Center: Quantity Display */}
                          <div className="text-4xl font-bold text-white font-oswald mx-8">
                            {item.quantity}
                          </div>

                          {/* Right: Controls or Edit Indicator */}
                          {!isEditMode ? (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStockQty(item.id, item.quantity, -1);
                                }}
                                className="bg-black/20 hover:bg-red-500/20 active:bg-red-500 text-white w-12 h-12 rounded-lg flex items-center justify-center transition-colors border border-white/10"
                              >
                                <Minus size={20} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStockQty(item.id, item.quantity, 1);
                                }}
                                className="bg-black/20 hover:bg-green-500/20 active:bg-green-500 text-white w-12 h-12 rounded-lg flex items-center justify-center transition-colors border border-white/10"
                              >
                                <Plus size={20} />
                              </button>
                              <button
                                onClick={(e) => openStockEdit(e, item)}
                                className="bg-black/20 hover:bg-white/10 text-white w-12 h-12 rounded-lg flex items-center justify-center transition-colors border border-white/10"
                              >
                                <Pencil size={18} />
                              </button>
                            </div>
                          ) : (
                            isSelected && (
                              <div className="w-6 h-6 bg-[#FF6700] rounded-full flex items-center justify-center">
                                <CheckCircle2 size={16} className="text-black" />
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
        )}

        {/* TAB 2: TOOLS */}
        {activeTab === "TOOLS" && (
            <div className="animate-in fade-in slide-in-from-right-4">
                <div className="sticky top-0 z-30 bg-background pt-2 pb-4 flex gap-2 h-16">
                    <div className="relative flex-1 h-full">
                        <Search className="absolute left-3 top-4 text-industrial-muted" size={20} />
                        <input type="text" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)} placeholder="Search tools..." className="input-field rounded-xl pl-12 pr-4 w-full h-full bg-industrial-card border-none text-lg shadow-sm" />
                    </div>
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
                                        {tool.status === "IN_RIG" && <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded">IN RIG</span>}
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
                                    {tool.status === "IN_RIG" ? (
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
                                            <button onClick={() => updateToolStatus(tool.id, "IN_RIG")} className="flex-1 bg-industrial-card hover:bg-white hover:text-black py-2 rounded-lg font-bold text-sm transition text-foreground">RETURN TO RIG</button>
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

      {/* --- SMART ACTION BAR (BOTTOM) --- */}
      {isEditMode && selectedIndices.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full z-50 bg-[#121212] border-t border-gray-800 p-4 animate-in slide-in-from-bottom">
              <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                  <div className="text-white font-bold text-sm">{selectedIndices.length} Selected</div>
                  <div className="flex gap-2">
                      {selectedIndices.length === 1 && (
                          <button onClick={handleEditSelected} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-700">
                              <Pencil size={18}/> Edit
                          </button>
                      )}
                      {selectedIndices.length === 2 && (
                          <button onClick={handleSwapSelected} className="bg-[#FF6700] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition">
                              <ArrowRightLeft size={18}/> Swap
                          </button>
                      )}
                      <button onClick={handleDeleteSelected} className="bg-red-900/30 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-900/50">
                          <Trash2 size={18}/> Delete
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- ADD ITEMS MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-[100] sm:p-4 backdrop-blur-sm animate-in slide-in-from-bottom-10">
             <div className="bg-[#121212] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl border-t sm:border border-gray-700 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="font-oswald font-bold text-2xl text-[#FF6700] flex items-center gap-2"><ListPlus size={24}/> ADD ITEMS</h2>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
                </div>
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

      {/* TOOL MODAL (Dark Mode Fixed) */}
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
                    <input placeholder="Tool Name (e.g. Hilti Drill)" value={newTool.name} onChange={e => setNewTool({...newTool, name: e.target.value})} className="bg-zinc-800 border border-gray-700 rounded-lg p-3 w-full text-white outline-none focus:border-[#FF6700]"/>
                    <div className="flex gap-2">
                        <input placeholder="Brand" value={newTool.brand} onChange={e => setNewTool({...newTool, brand: e.target.value})} className="bg-zinc-800 border border-gray-700 rounded-lg p-3 w-full text-white outline-none focus:border-[#FF6700]"/>
                        <input placeholder="Serial #" value={newTool.serial} onChange={e => setNewTool({...newTool, serial: e.target.value})} className="bg-zinc-800 border border-gray-700 rounded-lg p-3 w-full text-white outline-none focus:border-[#FF6700]"/>
                    </div>
                </div>
                <button onClick={addTool} disabled={uploading} className="w-full mt-6 bg-[#FF6700] text-black font-bold py-3 rounded-xl hover:scale-105 transition shadow-[0_0_20px_rgba(255,103,0,0.4)] flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>} SAVE TO RIG
                </button>
            </div>
        </div>
      )}

      {/* EDIT MODAL (Single Item) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-sm rounded-xl p-6 shadow-2xl relative border border-industrial-border bg-black">
            <button onClick={() => setEditingItem(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X /></button>
            <h2 className="font-oswald font-bold text-xl mb-6 text-[#FF6700]">EDIT ITEM</h2>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Name</label>
            <input type="text" value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="bg-gray-900 border border-gray-700 rounded-lg mb-4 w-full p-3 font-bold text-lg text-white" />
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Target Qty</label>
                <input type="number" value={targetQtyInput} onChange={(e) => setTargetQtyInput(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg w-20 text-center font-oswald text-xl p-2 text-[#FF6700]" />
            </div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Color</label>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {colors.map((c) => (
                <button key={c.hex} onClick={() => setEditingItem({ ...editingItem, color: c.hex })} style={{ backgroundColor: c.hex }} className={`h-10 rounded-lg border border-white/10 ${editingItem.color === c.hex ? "ring-2 ring-white" : ""}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => deleteStockItem(editingItem.id)} className="flex-1 bg-red-900/20 text-red-500 border border-red-900/50 py-3 rounded-lg font-bold"><Trash2 size={16} /></button>
              <button onClick={saveStockEdit} className="flex-[3] bg-[#FF6700] text-black py-3 rounded-lg font-bold">SAVE</button>
            </div>
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
