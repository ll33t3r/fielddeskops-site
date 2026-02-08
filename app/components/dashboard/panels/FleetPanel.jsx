"use client";

import { useState } from "react";
import { Truck, Trash2 } from "lucide-react";
import useResourcesManagement from "../../../hooks/useResourcesManagement";
import PanelContainer from "./PanelContainer";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function FleetPanel({ isOpen, onClose, supabase, onResourcesUpdated }) {
  const { fleet, addRig, deleteRig } = useResourcesManagement(supabase, {
    includeCrew: false,
    includeCustomers: false,
  });
  const [newRig, setNewRig] = useState({ name: "", plate: "" });
  const [accessError, setAccessError] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'rigs', currentCount: 0, limit: 0, tier: 'free' });

  const handleAddRig = async () => {
    if (!newRig.name.trim()) return;
    const { data, error } = await addRig(newRig);
    if (error?.readOnly) {
      setAccessError(error.message || "Account locked. Renew to edit.");
      return;
    }
    if (error?.limitReached) {
      setUpgradePromptData({ resourceType: error.resourceType || 'rigs', currentCount: error.currentCount ?? 0, limit: error.limit ?? 0, tier: error.tier || 'free' });
      setShowUpgradePrompt(true);
      return;
    }
    if (!error) {
      setNewRig({ name: "", plate: "" });
      if (onResourcesUpdated) await onResourcesUpdated();
    }
  };

  const handleDeleteRig = async (id) => {
    if (!confirm("Remove rig?")) return;
    const { error } = await deleteRig(id);
    if (error?.readOnly) {
      setAccessError(error.message || "Account locked. Renew to edit.");
      return;
    }
    if (!error && onResourcesUpdated) {
      await onResourcesUpdated();
    }
  };

  return (
    <PanelContainer isOpen={isOpen} onClose={onClose} title="Fleet">
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
      {accessError && (
        <p className="text-xs text-red-400">{accessError}</p>
      )}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-2 block">Add Rig</label>
          <div className="space-y-2">
            <input
              placeholder="Rig Name..."
              value={newRig.name}
              onChange={(e) => setNewRig({ ...newRig, name: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              placeholder="Plate # (Optional)..."
              value={newRig.plate}
              onChange={(e) => setNewRig({ ...newRig, plate: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <button onClick={handleAddRig} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
              Add Rig
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">Fleet ({fleet.length})</h3>
          <div className="space-y-2">
            {fleet.map((rig) => (
              <div key={rig.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Truck size={16} className="text-[#FF6700]" />
                  <div>
                    <p className="font-bold text-sm text-[var(--text-main)]">{rig.name}</p>
                    <p className="text-xs text-[var(--text-sub)]">{rig.plate_number || "No Plate"}</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteRig(rig.id)} className="text-[var(--text-sub)] hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PanelContainer>
  );
}
