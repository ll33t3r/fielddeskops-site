"use client";

import { X } from "lucide-react";

export default function AlertsModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const { alertList, onDismissAlert } = data;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl animate-in zoom-in-95 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="font-oswald text-xl text-red-500">SYSTEM ALERTS ({alertList.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {alertList.map((alert, i) => (
            <div key={alert.id} className={`border-l-4 ${alert.border} ${alert.bg} p-3 rounded flex justify-between items-start`}>
              <div>
                <p className={`text-xs font-bold ${alert.color}`}>{alert.title}</p>
                <p className="text-sm text-[var(--text-main)] mt-1">{alert.msg}</p>
              </div>
              <button
                onClick={() => {
                  onDismissAlert(i);
                  if (alertList.length === 1) onClose();
                }}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)] p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
