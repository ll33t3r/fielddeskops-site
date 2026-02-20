"use client";

import { AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function MetricsBar({
  metrics,
  privacyMode,
  formatCurrency,
  onTogglePrivacyMode,
  onOpenActiveJobsModal,
  onOpenAlertsModal,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 text-center relative group">
        <p className="text-[10px] text-[var(--text-sub)] uppercase font-bold tracking-wider mb-1">Revenue</p>
        <p className="text-[#22c55e] font-oswald text-lg tracking-tight">{formatCurrency(metrics.revenue)}</p>
        <button
          onClick={onTogglePrivacyMode}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
          title={privacyMode ? "Show" : "Hide"}
        >
          {privacyMode ? <EyeOff size={12} className="text-[#FF6700]" /> : <Eye size={12} className="text-[var(--text-sub)]" />}
        </button>
      </div>
      <button
        onClick={onOpenActiveJobsModal}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3 text-center hover:bg-[var(--bg-surface)] transition active:scale-95"
      >
        <p className="text-[10px] text-[var(--text-sub)] uppercase font-bold tracking-wider mb-1">Active Jobs</p>
        <p className="font-oswald text-lg tracking-tight text-[var(--text-main)]">{metrics.jobs}</p>
      </button>
      <button
        onClick={onOpenAlertsModal}
        className={`bg-[var(--bg-card)] border rounded-lg p-3 text-center transition active:scale-95 relative ${
          metrics.alerts > 0 ? "border-red-500/50 bg-red-500/10" : "border-[var(--border-color)]"
        }`}
      >
        {metrics.alerts > 0 && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
        <p className="text-[10px] text-[var(--text-sub)] uppercase font-bold tracking-wider mb-1">System</p>
        <div className="flex items-center justify-center gap-1">
          {metrics.alerts > 0 && <AlertTriangle size={14} className="text-red-500" />}
          <p className={`font-oswald text-lg tracking-tight ${metrics.alerts > 0 ? "text-red-500" : "text-[var(--text-main)]"}`}>
            {metrics.alerts > 0 ? metrics.alerts : "OK"}
          </p>
        </div>
      </button>
    </div>
  );
}
