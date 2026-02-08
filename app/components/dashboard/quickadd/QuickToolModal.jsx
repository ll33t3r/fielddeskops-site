"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";

export default function QuickToolModal({ isOpen, onClose, activeJob, onSaved }) {
  const supabase = createClient();
  const [toolName, setToolName] = useState("");
  const [brand, setBrand] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [rigId, setRigId] = useState("");
  const [assignToJob, setAssignToJob] = useState(true);
  const [rigs, setRigs] = useState([]);
  const [loadingRigs, setLoadingRigs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setMessage("");
    setError("");
    setToolName("");
    setBrand("");
    setSerialNumber("");
    setRigId("");
    setAssignToJob(true);

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
    if (!toolName.trim()) {
      setError("Tool name is required.");
      return;
    }
    if (!rigId) {
      setError("Assigned rig is required.");
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
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        setError(access.reason || "Account locked. Renew to edit.");
        return;
      }

      const { error: insertError } = await supabase
        .from("tools")
        .insert({
          user_id: user.id,
          name: toolName.trim(),
          brand: brand.trim() || null,
          serial_number: serialNumber.trim() || null,
          rig_id: rigId,
          status: "IN_RIG",
          job_id: assignToJob ? activeJob?.id || null : null,
        });

      if (insertError) throw insertError;

      setMessage("Tool added! Open LoadOut to manage");
      window.dispatchEvent(new Event("tools-updated"));
      onSaved?.();
      setTimeout(() => {
        onClose?.();
      }, 800);
    } catch (err) {
      setError(err?.message || "Error adding tool");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="font-oswald text-lg text-[#FF6700]">QUICK TOOL</h2>
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
              placeholder="Tool Name"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              placeholder="Brand (optional)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              placeholder="Serial Number (optional)"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <select
              value={rigId}
              onChange={(e) => setRigId(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] focus:border-[#FF6700] outline-none"
            >
              <option value="">Assign Rig (required)</option>
              {rigs.map((rig) => (
                <option key={rig.id} value={rig.id}>
                  {rig.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-[var(--text-sub)]">
              <input
                type="checkbox"
                checked={assignToJob}
                onChange={(e) => setAssignToJob(e.target.checked)}
              />
              Assign to current job
            </label>
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
            {saving ? "Saving..." : "Add Tool"}
          </button>
        </div>
      </div>
    </>
  );
}
