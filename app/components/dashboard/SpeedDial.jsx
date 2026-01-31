"use client";

import { Plus, DollarSign, Package, Wrench, Camera } from "lucide-react";

const actions = [
  {
    key: "estimate",
    label: "Quick Estimate",
    icon: DollarSign,
    color: "text-green-400",
    glow: "shadow-[0_0_15px_rgba(34,197,94,0.35)]",
  },
  {
    key: "inventory",
    label: "Add Inventory",
    icon: Package,
    color: "text-blue-400",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.35)]",
  },
  {
    key: "tool",
    label: "Add Tool",
    icon: Wrench,
    color: "text-[#FF6700]",
    glow: "shadow-[0_0_15px_rgba(255,103,0,0.35)]",
  },
  {
    key: "photo",
    label: "Take Photo",
    icon: Camera,
    color: "text-purple-400",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.35)]",
  },
];

export default function SpeedDial({
  isOpen,
  onToggle,
  activeJob,
  onQuickEstimate,
  onQuickInventory,
  onQuickTool,
  onQuickPhoto,
}) {
  const handleAction = (key) => {
    if (key === "estimate") onQuickEstimate?.();
    if (key === "inventory") onQuickInventory?.();
    if (key === "tool") onQuickTool?.();
    if (key === "photo") onQuickPhoto?.();
  };

  return (
    <div className="fixed bottom-8 right-6 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-10 fade-in duration-200">
          {!activeJob ? (
            <div className="bg-[var(--bg-card)]/90 border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs text-[var(--text-sub)] backdrop-blur-xl shadow-lg">
              Select a job to use quick actions
            </div>
          ) : (
            actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  onClick={() => handleAction(action.key)}
                  className="flex items-center gap-3 group"
                >
                  <span className="bg-[var(--bg-card)]/90 backdrop-blur-xl text-[var(--text-main)] text-xs px-3 py-1.5 rounded-lg shadow-lg border border-[var(--border-color)] opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                    {action.label}
                  </span>
                  <div className={`w-12 h-12 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-color)] flex items-center justify-center ${action.color} ${action.glow}`}>
                    <Icon size={20} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
      <button
        onClick={onToggle}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(255,103,0,0.4)] transition-all duration-300 ${
          isOpen
            ? "bg-[var(--bg-card)] backdrop-blur-xl text-[var(--text-main)] rotate-45 border border-[var(--border-color)]"
            : "bg-[#FF6700] text-black hover:scale-110"
        }`}
      >
        <Plus size={36} strokeWidth={2.5} />
      </button>
    </div>
  );
}
