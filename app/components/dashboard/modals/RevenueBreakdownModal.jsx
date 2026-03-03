"use client";

import { X } from "lucide-react";

export default function RevenueBreakdownModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const { totalRevenue, rows, formatCurrency } = data;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl animate-in zoom-in-95 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <div>
            <h2 className="font-oswald text-xl text-[#22c55e]">REVENUE BREAKDOWN</h2>
            <p className="text-xs text-[var(--text-sub)] mt-1">
              Total: <span className="text-[var(--text-main)] font-semibold">{formatCurrency(totalRevenue)}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--hover-surface)] rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="text-xs text-[var(--text-sub)]">No active-job revenue available yet.</div>
          ) : (
            rows.map((row) => (
              <div
                key={row.jobId}
                className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <p className="font-oswald text-sm text-[var(--text-main)] truncate">{row.jobTitle}</p>
                <p className="text-sm font-semibold text-[#22c55e] shrink-0">{formatCurrency(row.revenue)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
