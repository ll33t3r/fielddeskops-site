"use client";

import { useState } from "react";
import { Users, Trash2 } from "lucide-react";
import useResourcesManagement from "../../../hooks/useResourcesManagement";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function WorkersTab({ supabase, onResourcesUpdated }) {
  const { workers, addWorker, deleteWorker } = useResourcesManagement(supabase, {
    includeFleet: false,
    includeCustomers: false,
  });
  const [newWorker, setNewWorker] = useState({ name: "", role: "" });
  const [accessError, setAccessError] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'workers', currentCount: 0, limit: 0, tier: 'free' });

  const handleAddWorker = async () => {
    if (!newWorker.name.trim()) return;
    const { data, error } = await addWorker(newWorker);
    if (error?.readOnly) {
      setAccessError(error.message || "Account locked. Renew to edit.");
      return;
    }
    if (error?.limitReached) {
      setUpgradePromptData({ resourceType: error.resourceType || 'workers', currentCount: error.currentCount ?? 0, limit: error.limit ?? 0, tier: error.tier || 'free' });
      setShowUpgradePrompt(true);
      return;
    }
    if (!error && data) {
      setNewWorker({ name: "", role: "" });
      await onResourcesUpdated();
    }
  };

  const handleDeleteWorker = async (id) => {
    if (!confirm("Remove worker?")) return;
    const { error } = await deleteWorker(id);
    if (error?.readOnly) {
      setAccessError(error.message || "Account locked. Renew to edit.");
      return;
    }
    if (!error) {
      await onResourcesUpdated();
    }
  };

  return (
    <div className="space-y-4">
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
      <div>
        <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-2 block">Add Worker</label>
        <div className="space-y-2">
          <input
            placeholder="Name..."
            value={newWorker.name}
            onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
          />
          <input
            placeholder="Role (Optional)..."
            value={newWorker.role}
            onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
          />
          <button onClick={handleAddWorker} className="w-full bg-[#FF6700] text-black py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition">
            Add Worker
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">Team ({workers.length})</h3>
        <div className="space-y-2">
          {workers.map((worker) => (
            <div key={worker.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users size={16} className="text-[#FF6700]" />
                <div>
                  <p className="font-bold text-sm text-[var(--text-main)]">{worker.name}</p>
                  <p className="text-xs text-[var(--text-sub)]">{worker.role || "Tech"}</p>
                </div>
              </div>
              <button onClick={() => handleDeleteWorker(worker.id)} className="text-[var(--text-sub)] hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
