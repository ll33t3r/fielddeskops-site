"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function QuickInventoryModal({ isOpen, onClose, activeJob, onSaved }) {
  const supabase = createClient();
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [minQuantity, setMinQuantity] = useState("0");
  const [rigId, setRigId] = useState("");
  const [color, setColor] = useState("");
  const [rigs, setRigs] = useState([]);
  const [loadingRigs, setLoadingRigs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'items', currentCount: 0, limit: 0, tier: 'free' });

  useEffect(() => {
    if (!isOpen) return;
    setMessage("");
    setError("");
    setItemName("");
    setQuantity("1");
    setMinQuantity("0");
    setRigId("");
    setColor("");

    const loadRigs = async () => {
      setLoadingRigs(true);
      try {
        const { data } = await supabase.from("fleet").select("id, name").order("name");
        setRigs(data || []);
      } finally {
        setLoadingRigs(false);
      }
    };

    loadRigs();
  }, [isOpen, supabase]);

  const handleSave = async () => {
    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated.");
        return;
      }
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('items');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          setError(limitCheck.reason || 'Account locked. Renew to edit.');
          return;
        }
        setUpgradePromptData({ resourceType: 'items', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }
      const { error: insertError } = await supabase
        .from("inventory")
        .insert({
          user_id: user.id,
          name: itemName.trim(),
          quantity: Number(quantity) || 0,
          min_quantity: Number(minQuantity) || 0,
          rig_id: rigId || null,
          color: color.trim() || null,
          job_id: activeJob?.id || null,
        });

      if (insertError) throw insertError;
      await incrementResourceUsage('items');

      setMessage("Item added! Open LoadOut to edit details");
      window.dispatchEvent(new Event("inventory-updated"));
      onSaved?.();
      setTimeout(() => {
        onClose?.();
      }, 800);
    } catch (err) {
      setError(err?.message || "Error adding item");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="font-oswald text-lg text-[#FF6700]">QUICK INVENTORY</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-[var(--text-sub)] uppercase tracking-widest font-bold">
            Job: <span className="text-[var(--text-main)]">{activeJob?.title || "No Active Job"}</span>
          </div>

          <div className="space-y-3">
            <input
              placeholder="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              type="number"
              placeholder="Min Quantity"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <select
              value={rigId}
              onChange={(e) => setRigId(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] focus:border-[#FF6700] outline-none"
            >
              <option value="">Assign Rig (optional)</option>
              {rigs.map((rig) => (
                <option key={rig.id} value={rig.id}>
                  {rig.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Color (optional)"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
          </div>

          {loadingRigs && (
            <div className="text-xs text-[var(--text-sub)] flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#FF6700]" />
              Loading rigs...
            </div>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}
          {message && <div className="text-sm text-green-400">{message}</div>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#FF6700] text-black py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(255,103,0,0.35)] hover:shadow-[0_0_25px_rgba(255,103,0,0.5)] transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add Item"}
          </button>
        </div>
      </div>
    </>
  );
}
