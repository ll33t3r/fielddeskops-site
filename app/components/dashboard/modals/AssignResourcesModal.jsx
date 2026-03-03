"use client";

import { X } from "lucide-react";

export default function AssignResourcesModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const { assigningJob, customers, rigs = [], workers = [], onAssign } = data;

  if (!assigningJob) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl animate-in zoom-in-95">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="font-oswald text-lg text-[#FF6700]">ASSIGN TO: {assigningJob.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--hover-surface)] rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider mb-2 block">Customer</label>
            <select
              value={assigningJob.customer_id || ""}
              onChange={(e) => onAssign(assigningJob.id, "customer_id", e.target.value || null)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] focus:border-[#FF6700] outline-none"
            >
              <option value="">None</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider mb-2 block">Rig</label>
            <select
              value={assigningJob.rig_id || ""}
              onChange={(e) => onAssign(assigningJob.id, "rig_id", e.target.value || null)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] focus:border-[#FF6700] outline-none"
            >
              <option value="">None</option>
              {rigs.map((rig) => (
                <option key={rig.id} value={rig.id}>
                  {rig.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wider mb-2 block">Worker</label>
            <select
              value={assigningJob.assigned_worker_id || ""}
              onChange={(e) => onAssign(assigningJob.id, "assigned_worker_id", e.target.value || null)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] focus:border-[#FF6700] outline-none"
            >
              <option value="">None</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={onClose} className="w-full bg-[#FF6700] text-black py-3 rounded-lg font-bold">
            Done
          </button>
        </div>
      </div>
    </>
  );
}
