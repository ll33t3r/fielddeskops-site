"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";
import { 
  Plus, Minus, Search, Trash2, X, Loader2, Truck, 
  ClipboardList, ChevronDown, AlertTriangle, Settings, 
  RefreshCw, CheckCircle2, Eye, EyeOff, Wrench, 
  Camera, User, LayoutGrid, Users, ListPlus, ArrowLeft, ArrowRightLeft, Pencil, List, Check
} from "lucide-react";
import Link from "next/link";
import JobSelector from "../../components/shared/JobSelector";
import UpgradePrompt from '@/components/UpgradePrompt';
import Toast from "../../components/shared/Toast";
import FormField from "../../components/shared/FormField";
import SubscriptionBanner from "../../components/shared/SubscriptionBanner";
import { buildFieldErrors, inRange, isFileSizeAllowed, isFileTypeAllowed, isRequired } from "../../utils/validation";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { logError } from "../../../utils/logger";
import { track } from "@vercel/analytics";


const THEME_ORANGE = "#FF6700";

const colors = [
  { hex: "#FF6700" }, // Orange
  { hex: "#3B82F6" }, // Blue
  { hex: "#10B981" }, // Green
  { hex: "#EF4444" }, // Red
  { hex: "#8B5CF6" }, // Purple
  { hex: "#F59E0B" }, // Amber
  { hex: "#06B6D4" }, // Cyan
  { hex: "#EC4899" }, // Pink
  { hex: "#6B7280" }, // Gray
  { hex: "#14B8A6" }, // Teal
];

export default function LoadOut() {
  const supabase = createClient();
  const { activeJob, setActiveJob, syncActiveJob } = useActiveJob();
  const isOnline = useOnlineStatus();
  
  // --- GLOBAL STATE ---
  const [activeTab, setActiveTab] = useState("STOCK");
  const [rigs, setRigs] = useState([]);
  const [currentRig, setCurrentRig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [savingRig, setSavingRig] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [renameRigName, setRenameRigName] = useState("");
  const [showNewRigForm, setShowNewRigForm] = useState(false);
  const [newRigName, setNewRigName] = useState("");
  const [showRigDeleteConfirm, setShowRigDeleteConfirm] = useState(false);
  const [pendingRigDelete, setPendingRigDelete] = useState(null);
  const toastTimeoutRef = useRef(null);
  const rigDeleteTimeoutRef = useRef(null);

  // --- STOCK STATE ---
  const [items, setItems] = useState([]);
  const [stockSearch, setStockSearch] = useState(""); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [targetQtyInput, setTargetQtyInput] = useState("");
  const [viewMode, setViewMode] = useState("buttons");
  const [massSelectMode, setMassSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  
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

  useEffect(() => {
    try {
      if (!sessionStorage.getItem("fdo_first_app_opened")) {
        track("first_app_opened", { app: "loadout" });
        sessionStorage.setItem("fdo_first_app_opened", "1");
      }
    } catch {
      // noop
    }
  }, []);
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [toolFilter, setToolFilter] = useState("ALL");
  const [newMemberName, setNewMemberName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toolToDelete, setToolToDelete] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'resources', currentCount: 0, limit: 0, tier: 'free' });

  // HAPTIC ENGINE
  const vibrate = (pattern = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
  };

  useEffect(() => { initFleet(); }, []);
  useEffect(() => {
    syncActiveJob();
  }, [syncActiveJob]);
  useEffect(() => {
    const saved = localStorage.getItem("loadout-view-mode");
    if (saved) setViewMode(saved);
  }, []);

  useEffect(() => {
    const handleClosePopouts = (event) => {
      if (event?.detail?.source === "loadout-rig-menu") return;
      setShowSettings(false);
    };
    window.addEventListener("fdops:close-popouts", handleClosePopouts);
    return () => {
      window.removeEventListener("fdops:close-popouts", handleClosePopouts);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (rigDeleteTimeoutRef.current) clearTimeout(rigDeleteTimeoutRef.current);
    };
  }, []);

  const showToast = (message, type = "info", options = {}) => {
    const durationMs = options.durationMs ?? 3000;
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type, durationMs, startAt: Date.now(), ...options });
    if (!options.persistent) {
      toastTimeoutRef.current = setTimeout(() => setToast(null), durationMs);
    }
  };

  const ensureWriteAccess = async () => {
    const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
    const access = await getWriteAccessStatus();
    if (!access.allowed) {
      showToast(access.reason || "Account locked. Renew to edit.", "error");
      return false;
    }
    return true;
  };


  // 1. INIT
  const initFleet = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        showToast("Unable to verify your session. Please log in again.", "error");
        logError("LoadOut auth check failed", userError);
        setLoading(false);
        return;
      }
      if (!user) {
        showToast("Please log in to access LoadOut.", "error");
        setLoading(false);
        return;
      }

      let { data: userRigs, error: rigsError } = await supabase
        .from("fleet")
        .select("id, name, user_id, created_at")
        .order("created_at");

      if (rigsError) {
        showToast("Failed to load rigs. Please try again.", "error");
        logError("LoadOut rig fetch failed", rigsError);
        setLoading(false);
        return;
      }

      if (!userRigs || userRigs.length === 0) {
        if (!(await ensureWriteAccess())) {
          setLoading(false);
          return;
        }
        const { data: newRig, error: newRigError } = await supabase
          .from("fleet")
          .insert({
            user_id: user.id,
            name: "Rig 1",
          })
          .select("id, name, user_id, created_at")
          .single();

        if (newRigError) {
          showToast("Unable to create a default rig. Please try again.", "error");
          logError("LoadOut rig create failed", newRigError);
          setLoading(false);
          return;
        }

        userRigs = [newRig];
      }

      setRigs(userRigs);
      setCurrentRig(userRigs[0]);
      setRenameRigName(userRigs[0].name);

      const { data: team, error: teamError } = await supabase
        .from("team_members")
        .select("id, name, user_id, created_at")
        .order("name");
      if (teamError) {
        showToast("Failed to load team members.", "error");
        logError("LoadOut team fetch failed", teamError);
      }
      if (team) setTeamMembers(team);

      fetchRigData(userRigs[0].id);
    } catch (error) {
      showToast("Unable to load LoadOut data. Please try again.", "error");
      logError("LoadOut init failed", error);
      setLoading(false);
    }
  };

  const fetchRigData = async (rigId) => {
    setLoading(true);

    try {
      const { data: stock, error: stockError } = await supabase
        .from("inventory")
        .select("id, rig_id, name, quantity, min_quantity, color, created_at")
        .eq("rig_id", rigId)
        .order("created_at", { ascending: false });

      if (stockError) {
        showToast("Failed to load inventory items.", "error");
        logError("LoadOut inventory fetch failed", stockError, { rigId });
      } else if (stock) {
        setItems(stock);
      }

      const { data: toolsData, error: toolsError } = await supabase
        .from("tools")
        .select("id, rig_id, name, brand, serial_number, status, assigned_to, photo_url, created_at")
        .eq("rig_id", rigId)
        .order("created_at", { ascending: false });

      if (toolsError) {
        showToast("Failed to load tools.", "error");
        logError("LoadOut tools fetch failed", toolsError, { rigId });
      } else if (toolsData) {
        setTools(toolsData);
      }
    } catch (error) {
      showToast("Unable to load rig data. Please try again.", "error");
      logError("LoadOut rig data failed", error, { rigId });
    } finally {
      setLoading(false);
    }
  };

  const switchRig = (rigId) => {
    vibrate();
    const selected = rigs.find((v) => v.id === rigId);
    if (!selected) {
      showToast("Selected rig not found.", "error");
      return;
    }
    setCurrentRig(selected);
    setRenameRigName(selected.name);
    fetchRigData(rigId);
    setShowSettings(false);
  };

  const createRig = async (providedName) => {
    const trimmed = (providedName ?? newRigName).trim();
    if (!trimmed) {
      setFormErrors((prev) => ({ ...prev, newRig: { name: "Please enter a rig name." } }));
      showToast("Please enter a rig name.", "error");
      return;
    }

    setSavingRig(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        showToast("Please log in to create a rig.", "error");
        if (userError) logError("LoadOut rig auth failed", userError);
        return;
      }

      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('rigs');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          showToast(limitCheck.reason || "Account locked. Renew to edit.", "error");
          return;
        }
        setUpgradePromptData({ resourceType: 'rigs', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }

      const { data: newRig, error } = await supabase
        .from("fleet")
        .insert({
          user_id: user.id,
          name: trimmed,
        })
        .select("id, name, user_id, created_at")
        .single();

      if (error) {
        showToast("Failed to create rig. Please try again.", "error");
        logError("LoadOut rig create failed", error);
        return;
      }

      if (newRig) {
        await incrementResourceUsage('rigs');
        setRigs([...rigs, newRig]);
        setCurrentRig(newRig);
        setNewRigName("");
        setShowNewRigForm(false);
        setFormErrors((prev) => ({ ...prev, newRig: {} }));
        fetchRigData(newRig.id);
        setShowSettings(false);
      }
    } catch (error) {
      showToast("Failed to create rig. Please try again.", "error");
      logError("LoadOut rig create failed", error);
    } finally {
      setSavingRig(false);
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
      if (!(await ensureWriteAccess())) return;
      if (!confirm(`Delete ${selectedIndices.length} items? This cannot be undone.`)) return;
      vibrate(50);
      
      // Get IDs to delete from DB
      const idsToDelete = selectedIndices.map(idx => items[idx].id);
      
      // Update UI
      const newItems = items.filter((_, idx) => !selectedIndices.includes(idx));
      setItems(newItems);
      setSelectedIndices([]);
      
      // DB Delete
      try {
        const { error } = await supabase.from("inventory").delete().in("id", idsToDelete);
        if (error) {
          showToast("Failed to delete selected items. Please try again.", "error");
          logError("LoadOut inventory bulk delete failed", error);
          return;
        }
        showToast("Inventory items deleted.", "success");
      } catch (error) {
        showToast("Failed to delete selected items. Please try again.", "error");
        logError("LoadOut inventory bulk delete failed", error);
      }
  };

  const handleEditSelected = () => {
      if (selectedIndices.length !== 1) return;
      openStockEdit(null, items[selectedIndices[0]]);
      setSelectedIndices([]);
  };

  const toggleMassSelect = () => {
    setMassSelectMode(!massSelectMode);
    setSelectedItems(new Set());
  };

  const toggleItemSelect = (itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const deleteMassSelected = async () => {
    if (!(await ensureWriteAccess())) return;
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Delete ${selectedItems.size} items? This cannot be undone.`)) return;

    vibrate(50);

    // Delete all selected items
    const idsToDelete = Array.from(selectedItems);
    
    try {
      for (const id of idsToDelete) {
        const { error } = await supabase.from("inventory").delete().eq("id", id);
        if (error) {
          showToast("Failed to delete selected items.", "error");
          logError("LoadOut inventory delete failed", error, { id });
          return;
        }
      }

      // Refresh data
      await fetchRigData(currentRig.id);
      
      setSelectedItems(new Set());
      setMassSelectMode(false);
      showToast(`${idsToDelete.length} items deleted.`, "success");
    } catch (error) {
      showToast("Failed to delete selected items.", "error");
      logError("LoadOut inventory delete failed", error);
    }
  };

  // --- UNIFIED BATCH ADD LOGIC ---
  const handleBatchRowChange = (index, field, value) => {
      const newRows = [...batchRows];
      newRows[index][field] = value;
      setBatchRows(newRows);
      setFormErrors((prev) => {
        if (!prev?.batchRows) return prev;
        const rows = [...prev.batchRows];
        if (rows[index]) {
          rows[index] = { ...rows[index], [field]: "" };
        }
        return { ...prev, batchRows: rows };
      });
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
    if (!(await ensureWriteAccess())) return;
    if (!isOnline) {
      showToast("You're offline. Reconnect to add items.", "error");
      return;
    }

    const rowErrors = batchRows.map((row) => ({
      name: !isRequired(row.name) ? "Please enter an item name." : "",
      qty: !inRange(row.qty, 1, 100000) ? "Quantity must be 1 or more." : "",
    }));

    const hasErrors = rowErrors.some((row) => row.name || row.qty);
    if (hasErrors) {
      setFormErrors((prev) => ({ ...prev, batchRows: rowErrors }));
      showToast("Fix the highlighted fields before saving.", "error");
      return;
    }

    setSavingBatch(true);
    try {
      // Get user correctly
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        showToast("Please log in to add inventory items.", "error");
        if (authError) logError("LoadOut auth failed", authError);
        return;
      }

      if (!currentRig?.id) {
        showToast("Select a rig before adding items.", "error");
        return;
      }

      // Import helpers
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      
      let successCount = 0;

      for (const row of batchRows) {
        // ✅ Check limit BEFORE each insert
        const limitCheck = await canCreateResource('items');
        
        if (!limitCheck.allowed) {
          setUpgradePromptData({ resourceType: 'items', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
          setShowUpgradePrompt(true);
          
          if (successCount > 0) {
            await fetchRigData(currentRig.id);
            showToast(`Added ${successCount} items. Upgrade to add more.`, "success");
          }
          
          return; // Stop adding
        }

        const payload = {
          user_id: user.id,
          rig_id: currentRig.id,
          name: row.name.trim(),
          quantity: 1,
          min_quantity: Number(row.qty) || 3,
          color: THEME_ORANGE,
        };

        const { error } = await supabase
          .from("inventory")
          .insert(payload)
          .select("id")
          .single();

        if (error) {
          showToast("Failed to save an inventory item. Please try again.", "error");
          logError("LoadOut inventory insert failed", error);
          return;
        }

        // ✅ Increment usage after successful insert
        await incrementResourceUsage('items');
        successCount++;
      }

      await fetchRigData(currentRig.id);
      showToast(`${batchRows.length} inventory items added.`, "success");
      setBatchRows([{ name: "", qty: "3" }]);
      setShowAddModal(false);
      setFormErrors((prev) => ({ ...prev, batchRows: [] }));
    } catch (error) {
      showToast("Failed to add inventory items. Please try again.", "error");
      logError("LoadOut batch save failed", error);
    } finally {
      setSavingBatch(false);
    }
};


  const updateStockQty = async (id, currentQty, change) => {
    vibrate(5); 
    if (!(await ensureWriteAccess())) return;
    const newQty = Math.max(0, Number(currentQty) + change);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    try {
      const { error } = await supabase.from("inventory").update({ quantity: newQty }).eq("id", id);
      if (error) {
        showToast("Failed to update inventory quantity.", "error");
        logError("LoadOut inventory update failed", error, { id });
      }
    } catch (error) {
      showToast("Failed to update inventory quantity.", "error");
      logError("LoadOut inventory update failed", error, { id });
    }
  };

  const openStockEdit = (e, item) => {
      if(e) e.stopPropagation();
      vibrate();
      setShowSettings(false);
      setEditingItem(item);
      setTargetQtyInput(item.min_quantity.toString());
  };

  const saveStockEdit = async () => {
    if (!editingItem) return;
    vibrate();
    if (!(await ensureWriteAccess())) return;
    const editErrors = buildFieldErrors({
      name: [{ isValid: isRequired(editingItem.name), message: "Please enter an item name." }],
      minQty: [{ isValid: inRange(targetQtyInput, 0, 100000), message: "Target quantity must be 0 or more." }],
    });

    if (Object.keys(editErrors).length > 0) {
      setFormErrors((prev) => ({ ...prev, editItem: editErrors }));
      showToast("Fix the highlighted fields before saving.", "error");
      return;
    }

    setSavingEdit(true);
    try {
      const newMin = Number(targetQtyInput) || 0;
      const updatedItem = { ...editingItem, min_quantity: newMin };
      setItems(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i));
      const { error } = await supabase.from("inventory").update({ name: updatedItem.name, color: updatedItem.color, min_quantity: updatedItem.min_quantity, quantity: updatedItem.quantity }).eq("id", updatedItem.id);
      if (error) {
        showToast("Failed to update inventory item.", "error");
        logError("LoadOut inventory update failed", error, { id: updatedItem.id });
        return;
      }
      setEditingItem(null);
      setFormErrors((prev) => ({ ...prev, editItem: {} }));
      showToast("Inventory item updated.", "success");
    } catch (error) {
      showToast("Failed to update inventory item.", "error");
      logError("LoadOut inventory update failed", error, { id: editingItem.id });
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteStockItem = async (id) => {
    if (!(await ensureWriteAccess())) return;
    const item = items.find((entry) => entry.id === id);
    if (!confirm(`Delete ${item?.name || "this item"}? This cannot be undone.`)) return;
    vibrate();
    setItems(prev => prev.filter(i => i.id !== id));
    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) {
        showToast("Failed to delete inventory item.", "error");
        logError("LoadOut inventory delete failed", error, { id });
      } else {
        showToast("Inventory item deleted.", "success");
      }
    } catch (error) {
      showToast("Failed to delete inventory item.", "error");
      logError("LoadOut inventory delete failed", error, { id });
    } finally {
      setEditingItem(null);
    }
  };

  // 3. TOOL ACTIONS
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 8 * 1024 * 1024;
    if (!isFileTypeAllowed(file, allowedTypes)) {
      showToast("Unsupported image type. Use JPG, PNG, or WebP.", "error");
      return;
    }
    if (!isFileSizeAllowed(file, maxBytes)) {
      showToast("Photo too large. Max size is 8MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result);
    reader.readAsDataURL(file);
    setNewPhoto(file);
  };

  const addTool = async () => {
    if (!(await ensureWriteAccess())) return;
    const toolErrors = buildFieldErrors({
      name: [{ isValid: isRequired(newTool.name), message: "Please enter a tool name." }],
    });
    if (Object.keys(toolErrors).length > 0) {
      setFormErrors((prev) => ({ ...prev, tool: toolErrors }));
      showToast("Fix the highlighted fields before saving.", "error");
      return;
    }

    if (!isOnline) {
      showToast("You're offline. Reconnect to add tools.", "error");
      return;
    }

    vibrate();
    setUploading(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      showToast("Please log in to add tools.", "error");
      if (authError) logError("LoadOut auth failed", authError);
      setUploading(false);
      return;
    }
    if (!currentRig?.id) {
      showToast("Select a rig first", "error");
      setUploading(false);
      return;
    }

    try {
      let finalPhotoUrl = null;

      if (newPhoto) {
        const fileName = `${user.id}/${Date.now()}-${newPhoto.name}`;
        let uploadError = null;

        for (let attempt = 0; attempt < 3; attempt++) {
          const { error } = await supabase.storage
            .from("tool-photos")
            .upload(fileName, newPhoto);
          if (!error) {
            uploadError = null;
            break;
          }
          uploadError = error;
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }

        if (uploadError) {
          showToast("Unable to upload tool photo. Please try again.", "error");
          logError("LoadOut tool photo upload failed", uploadError);
          return;
        }

        const { data } = supabase.storage
          .from("tool-photos")
          .getPublicUrl(fileName);
        finalPhotoUrl = data.publicUrl;
      }

      const { data, error } = await supabase
        .from("tools")
        .insert({
          user_id: user.id,
          rig_id: currentRig.id,
          name: newTool.name.trim(),
          brand: newTool.brand?.trim() || null,
          serial_number: newTool.serial?.trim() || null,
          photo_url: finalPhotoUrl,
          status: "IN_RIG",
        })
        .select("id")
        .single();

      if (error) {
        showToast("Failed to save tool. Please try again.", "error");
        logError("LoadOut tool save failed", error);
        return;
      }

      if (data) {
        // Don't manually update state - fetch fresh from database
        await fetchRigData(currentRig.id);

        setShowAddTool(false);
        setNewTool({ name: "", brand: "", serial: "" });
        setNewPhoto(null);
        setPhotoPreview(null);
        setFormErrors((prev) => ({ ...prev, tool: {} }));
        showToast("Tool added successfully!", "success");
      }
    } catch (error) {
      showToast("Failed to save tool. Please try again.", "error");
      logError("LoadOut tool save failed", error);
    } finally {
      setUploading(false);
    }
  };

  const updateToolStatus = async (id, status, memberId = null) => {
    vibrate();
    if (!(await ensureWriteAccess())) return;
    
    const currentTool = tools.find((t) => t.id === id);

    let finalAssignedTo = memberId;
    
    if (status === "BROKEN" && memberId !== null) {
      // Keep the passed memberId (should be current user)
      finalAssignedTo = memberId;
    } else if (status === "IN_RIG") {
      // Clear assignment when returning to rig
      finalAssignedTo = null;
    }
    
    const previousTools = tools;
    setTools(
      tools.map((t) =>
        t.id === id ? { ...t, status, assigned_to: finalAssignedTo } : t
      )
    );
    setSelectedAsset(null);

    try {
      const { error } = await supabase
        .from("tools")
        .update({ status, assigned_to: finalAssignedTo })
        .eq("id", id);

      if (error) {
        setTools(previousTools);
        showToast("Failed to update tool status.", "error");
        logError("LoadOut tool status update failed", error, { id, status });
        return;
      }
      
      if (status === "CHECKED_OUT" && activeJob?.id && currentRig?.id) {
        const { error: jobError } = await supabase
          .from("jobs")
          .update({ rig_id: currentRig.id })
          .eq("id", activeJob.id);
        if (!jobError) {
          setActiveJob({ ...activeJob, rig_id: currentRig.id });
        } else {
          showToast("Failed to link this rig to the active job.", "error");
          logError("LoadOut job rig assignment failed", jobError, { jobId: activeJob.id });
        }
      }
    } catch (error) {
      setTools(previousTools);
      showToast("Failed to update tool status.", "error");
      logError("LoadOut tool status update failed", error, { id, status });
    }
  };

  const deleteTool = async (id) => {
    const tool = tools.find((t) => t.id === id);
    setToolToDelete(tool);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTool = async () => {
    if (!toolToDelete) return;
    if (!(await ensureWriteAccess())) return;
    
    vibrate(50);
    setTools(tools.filter((t) => t.id !== toolToDelete.id));
    try {
      const { error } = await supabase.from("tools").delete().eq("id", toolToDelete.id);
      if (error) {
        showToast("Failed to delete tool. Please try again.", "error");
        logError("LoadOut tool delete failed", error, { id: toolToDelete.id });
        return;
      }

      setShowDeleteConfirm(false);
      setToolToDelete(null);
      showToast("Tool deleted.", "success");
    } catch (error) {
      showToast("Failed to delete tool. Please try again.", "error");
      logError("LoadOut tool delete failed", error, { id: toolToDelete.id });
    }
  };

  // 4. TEAM ACTIONS
  const addTeamMember = async () => {
    if (!(await ensureWriteAccess())) return;
    const errors = buildFieldErrors({
      name: [{ isValid: isRequired(newMemberName), message: "Please enter a team member name." }],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, teamMember: errors }));
      showToast("Enter a team member name before saving.", "error");
      return;
    }

    vibrate();
    setSavingMember(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showToast("Please log in to manage team members.", "error");
        if (authError) logError("LoadOut auth failed", authError);
        return;
      }
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('workers');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          showToast(limitCheck.reason || "Account locked. Renew to edit.", "error");
          return;
        }
        setUpgradePromptData({ resourceType: 'workers', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }
      const { data, error } = await supabase
        .from("team_members")
        .insert({ user_id: user.id, name: newMemberName.trim() })
        .select("id, name, user_id, created_at")
        .single();
      if (error) {
        showToast("Failed to add team member. Please try again.", "error");
        logError("LoadOut team add failed", error);
        return;
      }
      if (data) {
        await incrementResourceUsage('workers');
        setTeamMembers([...teamMembers, data]);
        setNewMemberName("");
        setFormErrors((prev) => ({ ...prev, teamMember: {} }));
        showToast("Team member added.", "success");
      }
    } catch (error) {
      showToast("Failed to add team member. Please try again.", "error");
      logError("LoadOut team add failed", error);
    } finally {
      setSavingMember(false);
    }
  };

  const deleteTeamMember = async (id) => {
    if (!(await ensureWriteAccess())) return;
    const member = teamMembers.find((entry) => entry.id === id);
    if (!confirm(`Remove ${member?.name || "this team member"}? This cannot be undone.`)) return;
    vibrate();
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    try {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) {
        showToast("Failed to remove team member.", "error");
        logError("LoadOut team delete failed", error, { id });
      } else {
        showToast("Team member removed.", "success");
      }
    } catch (error) {
      showToast("Failed to remove team member.", "error");
      logError("LoadOut team delete failed", error, { id });
    }
  };

  // 5. GLOBAL MENU
  const handleRenameRig = async () => {
    if (!(await ensureWriteAccess())) return;
    const errors = buildFieldErrors({
      name: [{ isValid: isRequired(renameRigName), message: "Please enter a rig name." }],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, rigName: errors }));
      showToast("Enter a rig name before saving.", "error");
      return;
    }

    vibrate();
    setSavingRig(true);
    try {
      const updatedRigs = rigs.map(v => v.id === currentRig.id ? {...v, name: renameRigName.trim()} : v);
      setRigs(updatedRigs);
      setCurrentRig({...currentRig, name: renameRigName.trim()});
      const { error } = await supabase.from("fleet").update({ name: renameRigName.trim() }).eq("id", currentRig.id);
      if (error) {
        showToast("Failed to rename rig.", "error");
        logError("LoadOut rig rename failed", error, { id: currentRig.id });
        return;
      }
      setFormErrors((prev) => ({ ...prev, rigName: {} }));
      showToast("Rig renamed.", "success");
    } catch (error) {
      showToast("Failed to rename rig.", "error");
      logError("LoadOut rig rename failed", error, { id: currentRig?.id });
    } finally {
      setSavingRig(false);
    }
  };

  const handleDeleteRig = async () => {
    if (!(await ensureWriteAccess())) return;
    if (rigs.length === 1) {
      showToast("Cannot delete your only rig.", "error");
      return;
    }
    if (pendingRigDelete) {
      showToast("Finish the current delete/undo action first.", "info");
      return;
    }
    setShowRigDeleteConfirm(true);
  };

  const performRigDelete = async (rigId) => {
    const { error: inventoryError } = await supabase.from("inventory").delete().eq("rig_id", rigId);
    if (inventoryError) {
      logError("LoadOut rig inventory delete failed", inventoryError, { id: rigId });
      return { ok: false, message: "Failed to delete rig inventory." };
    }

    const { error: toolsError } = await supabase.from("tools").delete().eq("rig_id", rigId);
    if (toolsError) {
      logError("LoadOut rig tools delete failed", toolsError, { id: rigId });
      return { ok: false, message: "Failed to delete rig tools." };
    }

    const { error: rigError } = await supabase.from("fleet").delete().eq("id", rigId);
    if (rigError) {
      logError("LoadOut rig delete failed", rigError, { id: rigId });
      return { ok: false, message: "Failed to delete rig." };
    }

    return { ok: true };
  };

  const restoreDeletedRig = async (snapshot) => {
    const { rig, inventoryRows, toolRows } = snapshot;
    const { data: restoredRig, error: restoreRigError } = await supabase
      .from("fleet")
      .insert({ user_id: rig.user_id, name: rig.name })
      .select("id, name, user_id, created_at")
      .single();

    if (restoreRigError || !restoredRig) {
      logError("LoadOut rig restore failed", restoreRigError, { sourceRigId: rig.id });
      throw new Error("Unable to restore rig.");
    }

    if (inventoryRows.length > 0) {
      const payload = inventoryRows.map((row) => ({
        user_id: row.user_id,
        rig_id: restoredRig.id,
        name: row.name,
        quantity: row.quantity,
        min_quantity: row.min_quantity,
        color: row.color,
      }));
      const { error: restoreInventoryError } = await supabase.from("inventory").insert(payload);
      if (restoreInventoryError) {
        logError("LoadOut inventory restore failed", restoreInventoryError, { rigId: restoredRig.id });
        throw new Error("Unable to restore rig inventory.");
      }
    }

    if (toolRows.length > 0) {
      const payload = toolRows.map((row) => ({
        user_id: row.user_id,
        rig_id: restoredRig.id,
        name: row.name,
        brand: row.brand,
        serial_number: row.serial_number,
        status: row.status,
        assigned_to: row.assigned_to,
        photo_url: row.photo_url,
      }));
      const { error: restoreToolsError } = await supabase.from("tools").insert(payload);
      if (restoreToolsError) {
        logError("LoadOut tools restore failed", restoreToolsError, { rigId: restoredRig.id });
        throw new Error("Unable to restore rig tools.");
      }
    }

    setRigs((prev) => [...prev, restoredRig]);
    setCurrentRig(restoredRig);
    setRenameRigName(restoredRig.name);
    await fetchRigData(restoredRig.id);
  };

  const undoDeleteRig = async (snapshotOverride = null) => {
    const snapshot = snapshotOverride || pendingRigDelete?.snapshot;
    if (!snapshot) return;
    if (rigDeleteTimeoutRef.current) clearTimeout(rigDeleteTimeoutRef.current);
    setPendingRigDelete(null);
    setToast(null);

    try {
      await restoreDeletedRig(snapshot);
      showToast("Rig restored.", "success");
    } catch (error) {
      showToast(error.message || "Unable to restore rig.", "error");
      logError("LoadOut rig undo failed", error, { sourceRigId: snapshot.rig?.id });
    }
  };

  const confirmDeleteRig = async () => {
    if (!currentRig?.id) {
      setShowRigDeleteConfirm(false);
      return;
    }

    const rigToDelete = currentRig;
    const fallbackRig = rigs.find((v) => v.id !== rigToDelete.id) || null;
    setShowRigDeleteConfirm(false);
    setShowSettings(false);
    vibrate();

    try {
      const [inventorySnapshot, toolsSnapshot] = await Promise.all([
        supabase.from("inventory").select("id, user_id, rig_id, name, quantity, min_quantity, color").eq("rig_id", rigToDelete.id),
        supabase.from("tools").select("id, user_id, rig_id, name, brand, serial_number, status, assigned_to, photo_url").eq("rig_id", rigToDelete.id),
      ]);

      if (inventorySnapshot.error) {
        showToast("Unable to prepare rig deletion.", "error");
        logError("LoadOut rig delete snapshot inventory failed", inventorySnapshot.error, { id: rigToDelete.id });
        return;
      }
      if (toolsSnapshot.error) {
        showToast("Unable to prepare rig deletion.", "error");
        logError("LoadOut rig delete snapshot tools failed", toolsSnapshot.error, { id: rigToDelete.id });
        return;
      }

      setRigs((prev) => prev.filter((rig) => rig.id !== rigToDelete.id));
      if (fallbackRig) {
        setCurrentRig(fallbackRig);
        setRenameRigName(fallbackRig.name);
        setItems([]);
        setTools([]);
      }

      const deleteResult = await performRigDelete(rigToDelete.id);
      if (!deleteResult.ok) {
        showToast(deleteResult.message, "error");
        setRigs((prev) => [...prev, rigToDelete]);
        setCurrentRig(rigToDelete);
        setRenameRigName(rigToDelete.name);
        await fetchRigData(rigToDelete.id);
        return;
      }

      if (fallbackRig?.id) {
        await fetchRigData(fallbackRig.id);
      }

      const undoWindowMs = 5000;
      const snapshot = {
        rig: rigToDelete,
        inventoryRows: inventorySnapshot.data || [],
        toolRows: toolsSnapshot.data || [],
      };
      setPendingRigDelete({ snapshot });

      if (rigDeleteTimeoutRef.current) clearTimeout(rigDeleteTimeoutRef.current);
      rigDeleteTimeoutRef.current = setTimeout(() => {
        setPendingRigDelete(null);
        setToast(null);
      }, undoWindowMs);

      showToast(`Rig "${rigToDelete.name}" deleted.`, "info", {
        durationMs: undoWindowMs,
        persistent: true,
        actionLabel: "Undo",
        onAction: () => undoDeleteRig(snapshot),
        showProgress: true,
      });
    } catch (error) {
      showToast("Failed to delete rig.", "error");
      logError("LoadOut rig delete failed", error, { id: currentRig?.id });
    }
  };

  const copyShoppingList = () => {
    vibrate();
    const toBuy = items.filter(i => i.quantity < i.min_quantity);
    if (toBuy.length === 0) { showToast("Nothing to buy!", "success"); return; }
    let text = `🛒 ${currentRig.name.toUpperCase()} SHOPPING LIST:\n`;
    toBuy.forEach(i => text += `- ${i.name} (${i.quantity}/${i.min_quantity})\n`);
    try {
      navigator.clipboard.writeText(text);
      showToast("Shopping list copied.", "success");
      setShowSettings(false);
    } catch (error) {
      showToast("Unable to copy list. Please try again.", "error");
      logError("LoadOut copy list failed", error);
    }
  };

  const restockAll = async () => {
    if (!(await ensureWriteAccess())) return;
    if (!confirm("Auto-refill low items to target quantities?")) return;
    vibrate();
    const updates = items.map(i => i.quantity < i.min_quantity ? { ...i, quantity: i.min_quantity } : i);
    setItems(updates);
    try {
      await Promise.all(
        updates.map(async (item) => {
          const previousItem = items.find((o) => o.id === item.id);
          if (previousItem && item.quantity !== previousItem.quantity) {
            const { error } = await supabase.from("inventory").update({ quantity: item.quantity }).eq("id", item.id);
            if (error) {
              throw error;
            }
          }
        })
      );
      setShowSettings(false);
      showToast("Inventory restocked.", "success");
    } catch (error) {
      showToast("Failed to restock inventory.", "error");
      logError("LoadOut restock failed", error);
    }
  };


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
      <SubscriptionBanner />
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-[var(--bg-main)] border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:text-[#FF6700] transition-colors" aria-label="Back to dashboard">
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
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-2">
        <JobSelector />
      </div>

      {!isOnline ? (
        <div className="max-w-6xl mx-auto px-6 pt-2">
          <div className="bg-red-900/30 border border-red-500/40 text-red-200 text-xs rounded-lg px-3 py-2">
            You are offline. Changes will not sync until you reconnect.
          </div>
        </div>
      ) : null}

      <main className="max-w-6xl mx-auto px-6 pt-2">
        
        {/* TOP BAR - RIG SELECTOR (Z-40 to fix stacking) */}
        <div className="mb-4 bg-industrial-card border border-industrial-border p-2.5 rounded-xl relative z-40">
          <div className="relative w-full">
            <button
              onClick={() => {
                vibrate();
                if (!showSettings) {
                  window.dispatchEvent(new CustomEvent("fdops:close-popouts", { detail: { source: "loadout-rig-menu" } }));
                }
                setShowSettings(!showSettings);
              }}
              className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-[#FF6700]/10 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Truck className="text-[#FF6700] shrink-0" size={18} />
                <div className="min-w-0 text-left">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#FF6700]">Current Rig</p>
                  <p className="text-base font-bold text-[var(--text-main)] truncate">{currentRig ? currentRig.name : "Loading..."}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[var(--text-sub)] uppercase tracking-wide">{rigs.length} rigs</span>
                <Settings size={18} className={`text-industrial-muted transition-transform ${showSettings ? "rotate-90 text-foreground" : ""}`} />
              </div>
            </button>

            {/* SETTINGS MENU (Z-50) */}
            {showSettings && (
              <div className="absolute top-full left-0 mt-3 w-full lg:w-[28rem] max-h-[min(72vh,34rem)] overflow-y-auto hide-scrollbar bg-[#0a0a0a] rounded-xl shadow-2xl z-50 animate-in fade-in border border-[var(--border-color)]">
                <div className="p-2 border-b border-[var(--border-color)] text-xs text-[var(--text-sub)] uppercase tracking-wider px-3 bg-black/60">
                  Rig menu
                </div>
                <div className="p-4 space-y-4">
                  <div className="pb-4 border-b border-[var(--border-color)] space-y-2">
                    <label className="text-xs text-[var(--text-sub)] font-bold uppercase">Switch Rig</label>
                    {rigs.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => switchRig(v.id)}
                        className={`w-full text-left text-sm p-2.5 rounded transition ${
                          v.id === currentRig.id
                            ? "text-[#FF6700] bg-[#FF6700]/10 border border-[#FF6700]/30"
                            : "text-[var(--text-main)] hover:bg-[#FF6700]/10 border border-transparent"
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setShowNewRigForm(true);
                        if (formErrors?.newRig?.name) {
                          setFormErrors((prev) => ({ ...prev, newRig: { ...prev.newRig, name: "" } }));
                        }
                      }}
                      className="w-full text-left text-xs font-bold text-[#FF6700] p-2.5 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> New Rig
                    </button>
                    {showNewRigForm ? (
                      <div className="mt-2 space-y-2">
                        <input
                          value={newRigName}
                          onChange={(e) => {
                            setNewRigName(e.target.value);
                            if (formErrors?.newRig?.name) {
                              setFormErrors((prev) => ({ ...prev, newRig: { ...prev.newRig, name: "" } }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              createRig();
                            }
                          }}
                          autoFocus
                          placeholder="New rig name"
                          className={`bg-[var(--bg-main)] border rounded p-2.5 text-sm w-full text-[var(--text-main)] outline-none ${
                            formErrors?.newRig?.name ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => createRig()}
                            disabled={savingRig}
                            className="bg-[#FF6700] text-black rounded px-3 py-2 text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Create Rig
                          </button>
                          <button
                            onClick={() => {
                              setShowNewRigForm(false);
                              setNewRigName("");
                              setFormErrors((prev) => ({ ...prev, newRig: {} }));
                            }}
                            className="text-xs text-[var(--text-sub)] hover:text-[var(--text-main)] px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                        {formErrors?.newRig?.name ? <p className="text-xs text-red-500">{formErrors.newRig.name}</p> : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="pb-4 border-b border-[var(--border-color)]">
                    <label className="text-xs text-[var(--text-sub)] font-bold uppercase mb-1 block">Rig Name</label>
                    <div className="flex gap-2">
                      <input
                        value={renameRigName}
                        onChange={(e) => {
                          setRenameRigName(e.target.value);
                          if (formErrors?.rigName?.name) {
                            setFormErrors((prev) => ({ ...prev, rigName: { ...prev.rigName, name: "" } }));
                          }
                        }}
                        className={`bg-[var(--bg-main)] border rounded p-2.5 text-sm flex-1 text-[var(--text-main)] outline-none ${
                          formErrors?.rigName?.name ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                        }`}
                      />
                      <button
                        onClick={handleRenameRig}
                        disabled={savingRig}
                        className="bg-[#FF6700] text-black rounded px-3 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 />
                      </button>
                    </div>
                    {formErrors?.rigName?.name ? <p className="text-xs text-red-500 mt-2">{formErrors.rigName.name}</p> : null}
                  </div>

                  {activeTab === "STOCK" && (
                    <div className="pb-4 border-b border-[var(--border-color)]">
                      <label className="text-xs text-[var(--text-sub)] font-bold uppercase mb-2 block">Interface</label>
                      <button
                        onClick={() => {
                          vibrate();
                          setIsEditMode(!isEditMode);
                          setShowSettings(false);
                          setSelectedIndices([]);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isEditMode ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)]"
                        }`}
                      >
                        <span className="font-bold text-sm flex items-center gap-2">{isEditMode ? <Eye /> : <EyeOff />} {isEditMode ? "EDITING ON" : "STANDARD"}</span>
                      </button>
                    </div>
                  )}

                  <div className="pb-4 border-b border-[var(--border-color)]">
                    <button
                      onClick={() => {
                        vibrate();
                        setShowTeamModal(true);
                        setShowSettings(false);
                      }}
                      className="w-full flex items-center gap-2 text-sm text-[var(--text-main)] p-2.5 rounded hover:bg-[#FF6700]/10 border border-[var(--border-color)] justify-center font-bold transition"
                    >
                      <Users size={16} /> MANAGE TEAM
                    </button>
                  </div>

                  <div className="space-y-2 pb-4 border-b border-[var(--border-color)]">
                    <button onClick={copyShoppingList} className="w-full flex items-center gap-2 text-sm text-[var(--text-main)] p-2.5 rounded hover:bg-[#FF6700]/10 transition">
                      <ClipboardList size={16} /> Copy Shopping List
                    </button>
                    <button onClick={restockAll} className="w-full flex items-center gap-2 text-sm text-green-500 p-2.5 rounded hover:bg-green-900/20">
                      <RefreshCw size={16} /> Restock All
                    </button>
                  </div>

                  <div className="pt-1">
                    <button onClick={handleDeleteRig} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 p-2.5">
                      <Trash2 size={14} /> Delete Rig
                    </button>
                  </div>
                </div>
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
                <div className="sticky top-0 z-30 bg-[var(--bg-main)] pt-2 pb-4 flex gap-2 h-16 border-b border-[var(--border-color)]">
                    <div className="relative flex-1 h-full flex items-center">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted pointer-events-none" size={20} />
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
                      aria-label={viewMode === "buttons" ? "Switch to list view" : "Switch to button view"}
                    >
                      {viewMode === "buttons" ? <List size={24} /> : <LayoutGrid size={24} />}
                    </button>
                    <button
                      onClick={() => {
                        vibrate();
                        toggleMassSelect();
                      }}
                      className={`h-full px-4 rounded-xl font-bold flex items-center justify-center transition border shrink-0 ${
                        massSelectMode 
                          ? "bg-[#FF6700] text-black border-[#FF6700]" 
                          : "bg-industrial-card text-foreground border-industrial-border hover:bg-white/5"
                      }`}
                      title={massSelectMode ? "Exit Mass Select" : "Mass Select & Delete"}
                      aria-label={massSelectMode ? "Exit mass select" : "Enter mass select"}
                    >
                      {massSelectMode ? <X size={24} /> : <Trash2 size={24} />}
                    </button>
                    <button
                      onClick={() => { vibrate(); setShowSettings(false); setShowAddModal(true); }}
                      className="bg-[#FF6700] text-black h-full px-6 rounded-xl font-bold flex items-center justify-center hover:scale-105 transition shadow-lg shrink-0"
                      aria-label="Add inventory item"
                    >
                        <Plus size={32} />
                    </button>
                </div>

                {/* THE CONTROL DECK GRID */}
                {viewMode === "buttons" ? (
                  // EXISTING BUTTON GRID - Keep as is
                  filteredItems.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[var(--text-sub)]">
                      No items yet. Click "Add" to start tracking inventory.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-24 select-none">
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
                  )
                ) : (
                  // NEW LIST VIEW
                  filteredItems.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[var(--text-sub)]">
                      No items yet. Click "Add" to start tracking inventory.
                    </div>
                  ) : (
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
                            if (massSelectMode) toggleItemSelect(item.id);
                          }}
                          className={`bg-industrial-card border rounded-xl p-4 flex items-center justify-between transition-all ${
                            isEditMode || massSelectMode ? "cursor-pointer hover:bg-white/5" : ""
                          } ${isSelected ? "ring-2 ring-[#FF6700] bg-[#FF6700]/10" : "border-white/5"} ${
                            isLowStock ? "ring-2 ring-red-500 bg-red-500/5" : ""
                          } ${massSelectMode && selectedItems.has(item.id) ? "ring-2 ring-red-500 bg-red-500/10" : ""}`}
                        >
                          {/* Left: Name + Stock Status */}
                          <div className="flex-1 flex items-center gap-4">
                            {massSelectMode && (
                              <div
                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                                  selectedItems.has(item.id) 
                                    ? "bg-red-500 border-red-500" 
                                    : "border-gray-600"
                                }`}
                              >
                                {selectedItems.has(item.id) && <Check size={16} className="text-white" />}
                              </div>
                            )}
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
                          {!isEditMode && !massSelectMode ? (
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
                          ) : massSelectMode && selectedItems.has(item.id) ? (
                            <Trash2 size={20} className="text-red-500" />
                          ) : null}
                        </div>
                      );
                    })}
                    </div>
                  )
                )}
                
                {/* Mass Delete Floating Action Bar */}
                {massSelectMode && selectedItems.size > 0 && (
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom">
                    <div className="bg-red-500 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4">
                      <span className="font-bold">{selectedItems.size} Selected</span>
                      <button
                        onClick={deleteMassSelected}
                        className="bg-white text-red-500 px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition"
                      >
                        <Trash2 size={18} />
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedItems(new Set())}
                        className="text-white/80 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                )}
            </div>
        )}

        {/* TAB 2: TOOLS */}
        {activeTab === "TOOLS" && (
            <div className="animate-in fade-in slide-in-from-right-4">
                <div className="sticky top-0 z-30 bg-background pt-2 pb-4 flex gap-2 h-16">
                    <div className="relative flex-1 h-full flex items-center">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted pointer-events-none" size={20} />
                        <input type="text" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)} placeholder="Search tools..." className="input-field rounded-xl pl-12 pr-4 w-full h-full bg-industrial-card border-none text-lg shadow-sm" />
                    </div>
                    <button onClick={() => { vibrate(); setShowSettings(false); setShowAddTool(true); }} className="bg-[#FF6700] text-black h-full px-6 rounded-xl font-bold flex items-center justify-center hover:scale-105 transition shadow-lg shrink-0">
                        <Plus size={32} />
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                    {[{k:"ALL", l:"All Tools"}, {k:"OUT", l:"Checked Out"}, {k:"BROKEN", l:"Broken"}].map(f => (
                        <button key={f.k} onClick={() => { vibrate(); setToolFilter(f.k); }} className={`p-2 rounded text-xs font-bold border transition ${toolFilter === f.k ? "bg-[#FF6700] text-black border-[#FF6700]" : "border-industrial-border text-industrial-muted"}`}>{f.l}</button>
                    ))}
                </div>
                <div className="space-y-3 pb-20">
                    {filteredTools.length === 0 ? (
                      <div className="text-center py-10 text-industrial-muted">
                        No tools yet. Click "Register Tool" to add one.
                      </div>
                    ) : filteredTools.map(tool => (
                        <div key={tool.id} className={`glass-panel p-4 rounded-xl relative transition-all duration-300 ${tool.status === "BROKEN" ? "border-red-900/50 bg-red-900/5" : ""} ${selectedAsset === tool.id ? "ring-1 ring-[#FF6700]" : ""}`}>
                            <div className="flex gap-4 cursor-pointer" onClick={() => { vibrate(); setSelectedAsset(selectedAsset === tool.id ? null : tool.id); }}>
                                <div className="w-16 h-16 rounded-lg bg-black/40 flex-shrink-0 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {tool.photo_url ? <img src={tool.photo_url} alt={tool.name} className="w-full h-full object-cover"/> : <Wrench size={20} className="text-gray-600"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg leading-tight truncate pr-2 text-foreground">{tool.name}</h3>
                                        <div className="flex items-start gap-2">
                                          {tool.status === "IN_RIG" && <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded">IN RIG</span>}
                                          {tool.status === "CHECKED_OUT" && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded">OUT</span>}
                                          {tool.status === "BROKEN" && (
                                            <>
                                              <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-1 rounded">
                                                BROKEN
                                              </span>
                                              {tool.assigned_to && (
                                                <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                                                  <AlertTriangle size={10} />
                                                  Last user: {teamMembers.find((m) => m.id === tool.assigned_to)?.name || "Unknown"}
                                                </p>
                                              )}
                                            </>
                                          )}
                                          {selectedAsset === tool.id && null}
                                        </div>
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
                                        <div className="mt-4 pt-4 border-t border-industrial-border animate-in slide-in-from-top-2">
                                          <div className="flex gap-2 items-center">
                                            {/* Left: Report Broken Button */}
                                            <button
                                              onClick={() => {
                                                updateToolStatus(tool.id, "BROKEN", tool.assigned_to);
                                              }}
                                              className="px-4 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 hover:bg-red-900/40 transition flex items-center gap-2"
                                            >
                                              <AlertTriangle size={18} />
                                              <span className="text-sm font-bold">Report Broken</span>
                                            </button>

                                            {/* Center: Technician Selector */}
                                            <div className="relative flex-1">
                                              <select
                                                onChange={(e) => {
                                                  if (e.target.value) {
                                                    updateToolStatus(tool.id, "CHECKED_OUT", e.target.value);
                                                  }
                                                }}
                                                className="w-full bg-industrial-card border border-industrial-border rounded-lg px-3 py-2 text-sm text-foreground outline-none appearance-none focus:border-[#FF6700] cursor-pointer"
                                              >
                                                <option value="">Select Technician...</option>
                                                {teamMembers.map((m) => (
                                                  <option key={m.id} value={m.id}>
                                                    {m.name}
                                                  </option>
                                                ))}
                                              </select>
                                              <ChevronDown size={14} className="absolute right-3 top-3 text-industrial-muted pointer-events-none" />
                                            </div>

                                            {/* Right: Delete Button */}
                                            <button
                                              onClick={() => deleteTool(tool.id)}
                                              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-500 transition flex items-center gap-2"
                                            >
                                              <Trash2 size={18} />
                                              <span className="text-sm font-bold">Delete</span>
                                            </button>
                                          </div>
                                        </div>
                                    ) : tool.status === "BROKEN" ? (
                                        <div className="mt-4 pt-4 border-t border-industrial-border animate-in slide-in-from-top-2">
                                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                                            <p className="text-xs text-red-400 flex items-center gap-2">
                                              <AlertTriangle size={14} />
                                              <span>Tool marked as broken</span>
                                              {tool.assigned_to ? (
                                                <span className="font-bold ml-2 text-red-300">
                                                  Last used by: {teamMembers.find((m) => m.id === tool.assigned_to)?.name || "Unknown User"}
                                                </span>
                                              ) : (
                                                <span className="font-bold ml-2 text-gray-500">
                                                  (No user recorded)
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                          <div className="flex gap-2">
                                            {/* Left: Mark as Fixed */}
                                            <button
                                              onClick={() => updateToolStatus(tool.id, "IN_RIG", null)}
                                              className="flex-1 bg-green-500/20 border border-green-500/50 hover:bg-green-500/40 py-2 rounded-lg font-bold text-sm transition text-green-400 flex items-center justify-center gap-2"
                                            >
                                              <CheckCircle2 size={18} />
                                              Mark as Fixed
                                            </button>

                                            {/* Right: Delete Button */}
                                            <button
                                              onClick={() => deleteTool(tool.id)}
                                              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-500 transition flex items-center gap-2"
                                            >
                                              <Trash2 size={18} />
                                              <span className="text-sm font-bold">Delete</span>
                                            </button>
                                          </div>
                                        </div>
                                    ) : tool.status === "CHECKED_OUT" ? (
                                        <div className="mt-4 pt-4 border-t border-industrial-border animate-in slide-in-from-top-2">
                                          <div className="flex gap-2 items-center">
                                            {/* Left: Report Broken Button */}
                                            <button
                                              onClick={() => {
                                                updateToolStatus(tool.id, "BROKEN", tool.assigned_to);
                                              }}
                                              className="px-4 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 hover:bg-red-900/40 transition flex items-center gap-2"
                                            >
                                              <AlertTriangle size={18} />
                                              <span className="text-sm font-bold">Report Broken</span>
                                            </button>

                                            {/* Center: Return to Rig Button */}
                                            <button
                                              onClick={() => updateToolStatus(tool.id, "IN_RIG", null)}
                                              className="flex-1 bg-industrial-card hover:bg-white hover:text-black py-2 rounded-lg font-bold text-sm transition text-foreground"
                                            >
                                              RETURN TO RIG
                                            </button>

                                            {/* Right: Delete Button */}
                                            <button
                                              onClick={() => deleteTool(tool.id)}
                                              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:bg-red-900/20 hover:border-red-500/50 hover:text-red-500 transition flex items-center gap-2"
                                            >
                                              <Trash2 size={18} />
                                              <span className="text-sm font-bold">Delete</span>
                                            </button>
                                          </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateToolStatus(tool.id, "IN_RIG", null)} className="flex-1 bg-industrial-card hover:bg-white hover:text-black py-2 rounded-lg font-bold text-sm transition text-foreground">RETURN TO RIG</button>
                                            <button
                                              onClick={() => deleteTool(tool.id)}
                                              className="px-3 py-2 text-industrial-muted hover:text-foreground transition"
                                            >
                                              <Trash2 size={18}/>
                                            </button>
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

      {showRigDeleteConfirm && currentRig && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[#0a0a0a] shadow-2xl">
            <div className="p-5 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle size={18} />
                Delete Rig
              </h3>
              <p className="text-sm text-[var(--text-main)] mt-2">
                You are about to delete <span className="font-semibold">{currentRig.name}</span> and all of its inventory and tools.
              </p>
              <p className="text-xs text-[var(--text-sub)] mt-2">
                After you confirm, the rig is deleted immediately. Undo is only available for 5 seconds.
              </p>
            </div>
            <div className="p-5 flex gap-3">
              <button
                onClick={() => setShowRigDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] hover:border-[#FF6700]/40 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRig}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition"
              >
                Delete Rig
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD ITEMS MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-[100] sm:p-4 backdrop-blur-sm animate-in slide-in-from-bottom-10">
          <div className="bg-[#121212] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl border-t sm:border border-gray-700 max-h-[90vh] flex flex-col">
            
            {/* Fixed header */}
            <div className="p-6 border-b border-gray-700 shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="font-oswald font-bold text-2xl text-[#FF6700] flex items-center gap-2">
                  <ListPlus size={24} />
                  ADD ITEMS
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {batchRows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                  <span className="text-gray-600 font-mono text-xs w-4">{idx + 1}</span>
                  <input
                    placeholder="Item Name (e.g. Wire Nuts)"
                    value={row.name}
                    onChange={(e) => handleBatchRowChange(idx, "name", e.target.value)}
                    onBlur={() => {
                      if (!row.name.trim()) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          const rows = [...(next.batchRows || [])];
                          rows[idx] = { ...(rows[idx] || {}), name: "Please enter an item name." };
                          next.batchRows = rows;
                          return next;
                        });
                      }
                    }}
                    className={`flex-1 bg-black/40 border rounded-lg p-3 text-white outline-none ${
                      formErrors?.batchRows?.[idx]?.name ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-[#FF6700]"
                    }`}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={row.qty}
                    onChange={(e) => handleBatchRowChange(idx, "qty", e.target.value)}
                    onBlur={() => {
                      if (!inRange(row.qty, 1, 100000)) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          const rows = [...(next.batchRows || [])];
                          rows[idx] = { ...(rows[idx] || {}), qty: "Quantity must be 1 or more." };
                          next.batchRows = rows;
                          return next;
                        });
                      }
                    }}
                    className={`w-16 bg-black/40 border rounded-lg p-3 text-center text-[#FF6700] outline-none ${
                      formErrors?.batchRows?.[idx]?.qty ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-[#FF6700]"
                    }`}
                  />
                  {batchRows.length > 1 && (
                    <button onClick={() => removeBatchRow(idx)} className="text-gray-600 hover:text-red-500 p-2">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {formErrors?.batchRows?.some?.((row) => row?.name || row?.qty) ? (
                <p className="text-xs text-red-500">Please fix the highlighted rows.</p>
              ) : null}
              
              <button
                onClick={addBatchRow}
                className="w-full py-3 border border-dashed border-gray-800 rounded-lg text-gray-500 flex justify-center items-center gap-2 hover:border-gray-500 hover:text-white"
              >
                <Plus size={16} />
                Add Row
              </button>
            </div>

            {/* Fixed save button at bottom */}
            <div className="p-6 border-t border-gray-700 shrink-0">
              <button
                onClick={saveBatch}
                disabled={savingBatch}
                className="w-full bg-[#FF6700] text-black font-bold py-4 rounded-xl text-xl hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingBatch ? "SAVING..." : "SAVE ITEMS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOOL MODAL (Dark Mode Fixed) */}
      {showAddTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-industrial-border bg-industrial-bg">
                <button type="button" onClick={() => setShowAddTool(false)} className="absolute top-4 right-4 text-industrial-muted hover:text-foreground"><X size={20}/></button>
                <h2 className="font-oswald font-bold text-xl mb-6 text-[#FF6700]">REGISTER TOOL</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTool();
                  }}
                  className="contents"
                >
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
                    <FormField id="tool-name" label="Tool Name" required error={formErrors?.tool?.name}>
                      <input
                        id="tool-name"
                        placeholder="Hilti drill"
                        value={newTool.name}
                        onChange={e => {
                          setNewTool({...newTool, name: e.target.value});
                          if (formErrors?.tool?.name) {
                            setFormErrors((prev) => ({ ...prev, tool: { ...prev.tool, name: "" } }));
                          }
                        }}
                        onBlur={() => {
                          if (!newTool.name.trim()) {
                            setFormErrors((prev) => ({ ...prev, tool: { ...prev.tool, name: "Please enter a tool name." } }));
                          }
                        }}
                        className={`bg-zinc-800 border rounded-lg p-3 w-full text-white outline-none ${
                          formErrors?.tool?.name ? "border-red-500 focus:border-red-500" : "border-gray-700 focus:border-[#FF6700]"
                        }`}
                      />
                    </FormField>
                    <div className="flex gap-2">
                        <FormField id="tool-brand" label="Brand">
                          <input
                            id="tool-brand"
                            placeholder="DeWalt"
                            value={newTool.brand}
                            onChange={e => setNewTool({...newTool, brand: e.target.value})}
                            className="bg-zinc-800 border border-gray-700 rounded-lg p-3 w-full text-white outline-none focus:border-[#FF6700]"
                          />
                        </FormField>
                        <FormField id="tool-serial" label="Serial #">
                          <input
                            id="tool-serial"
                            placeholder="SN-00123"
                            value={newTool.serial}
                            onChange={e => setNewTool({...newTool, serial: e.target.value})}
                            className="bg-zinc-800 border border-gray-700 rounded-lg p-3 w-full text-white outline-none focus:border-[#FF6700]"
                          />
                        </FormField>
                    </div>
                </div>
                <button type="submit" disabled={uploading} className="w-full mt-6 bg-[#FF6700] text-black font-bold py-3 rounded-xl hover:scale-105 transition shadow-[0_0_20px_rgba(255,103,0,0.4)] flex items-center justify-center gap-2">
                    {uploading ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={18}/>} SAVE TO RIG
                </button>
                </form>
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
            <input
              type="text"
              value={editingItem.name}
              onChange={(e) => {
                setEditingItem({ ...editingItem, name: e.target.value });
                if (formErrors?.editItem?.name) {
                  setFormErrors((prev) => ({ ...prev, editItem: { ...prev.editItem, name: "" } }));
                }
              }}
              onBlur={() => {
                if (!editingItem.name.trim()) {
                  setFormErrors((prev) => ({ ...prev, editItem: { ...prev.editItem, name: "Please enter an item name." } }));
                }
              }}
              className={`bg-gray-900 border rounded-lg mb-4 w-full p-3 font-bold text-lg text-white ${
                formErrors?.editItem?.name ? "border-red-500 focus:border-red-500" : "border-gray-700"
              }`}
            />
            {formErrors?.editItem?.name ? (
              <p className="text-xs text-red-500 mb-2">{formErrors.editItem.name}</p>
            ) : null}
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Target Qty</label>
                <input
                  type="number"
                  value={targetQtyInput}
                  onChange={(e) => {
                    setTargetQtyInput(e.target.value);
                    if (formErrors?.editItem?.minQty) {
                      setFormErrors((prev) => ({ ...prev, editItem: { ...prev.editItem, minQty: "" } }));
                    }
                  }}
                  onBlur={() => {
                    if (!inRange(targetQtyInput, 0, 100000)) {
                      setFormErrors((prev) => ({ ...prev, editItem: { ...prev.editItem, minQty: "Target quantity must be 0 or more." } }));
                    }
                  }}
                  className={`bg-gray-900 border rounded-lg w-20 text-center font-oswald text-xl p-2 text-[#FF6700] ${
                    formErrors?.editItem?.minQty ? "border-red-500 focus:border-red-500" : "border-gray-700"
                  }`}
                />
            </div>
            {formErrors?.editItem?.minQty ? (
              <p className="text-xs text-red-500 mb-3">{formErrors.editItem.minQty}</p>
            ) : null}
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Color</label>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {colors.map((c) => (
                <button key={c.hex} onClick={() => setEditingItem({ ...editingItem, color: c.hex })} style={{ backgroundColor: c.hex }} className={`h-10 rounded-lg border border-white/10 ${editingItem.color === c.hex ? "ring-2 ring-white" : ""}`} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => deleteStockItem(editingItem.id)} className="flex-1 bg-red-900/20 text-red-500 border border-red-900/50 py-3 rounded-lg font-bold"><Trash2 size={16} /></button>
              <button
                onClick={saveStockEdit}
                disabled={savingEdit}
                className="flex-[3] bg-[#FF6700] text-black py-3 rounded-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingEdit ? "SAVING..." : "SAVE"}
              </button>
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
                    <input
                      placeholder="Enter Name (e.g. Mike)"
                      value={newMemberName}
                      onChange={e => {
                        setNewMemberName(e.target.value);
                        if (formErrors?.teamMember?.name) {
                          setFormErrors((prev) => ({ ...prev, teamMember: { ...prev.teamMember, name: "" } }));
                        }
                      }}
                      onBlur={() => {
                        if (!newMemberName.trim()) {
                          setFormErrors((prev) => ({
                            ...prev,
                            teamMember: { name: "Please enter a team member name." },
                          }));
                        }
                      }}
                      className={`input-field rounded-lg p-2 flex-1 ${
                        formErrors?.teamMember?.name ? "border-red-500 focus:border-red-500" : ""
                      }`}
                    />
                    <button
                      onClick={addTeamMember}
                      disabled={savingMember}
                      className="bg-[#FF6700] text-black font-bold px-4 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Plus/>
                    </button>
                </div>
                {formErrors?.teamMember?.name ? (
                  <p className="text-xs text-red-500 mb-4">{formErrors.teamMember.name}</p>
                ) : null}
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

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* DELETE TOOL CONFIRMATION MODAL */}
      {showDeleteConfirm && toolToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-[#1a1a1a] border-2 border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Delete Tool?</h2>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-white font-bold text-lg mb-1">{toolToDelete.name}</p>
              {toolToDelete.brand && (
                <p className="text-gray-400 text-sm">{toolToDelete.brand}</p>
              )}
              {toolToDelete.serial_number && (
                <p className="text-gray-400 text-xs mt-1">SN: {toolToDelete.serial_number}</p>
              )}
            </div>
            
            <p className="text-gray-300 text-sm mb-6">
              This action cannot be undone. The tool will be permanently removed from your inventory.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setToolToDelete(null);
                }}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTool}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete Tool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE PROMPT MODAL */}
      {showUpgradePrompt && (
        <UpgradePrompt 
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          resourceType={upgradePromptData.resourceType}
          currentCount={upgradePromptData.currentCount}
          limit={upgradePromptData.limit}
          tier={upgradePromptData.tier}
        />
      )}
    </div>
  );
}

