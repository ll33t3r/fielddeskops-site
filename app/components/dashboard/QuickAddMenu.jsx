"use client";

import { useEffect, useState } from "react";
import { FileText, Camera, Package, Wrench, ClipboardSignature, UserPlus, Users, Truck } from "lucide-react";

const ACTIONS = [
  { id: "new-estimate", label: "New Estimate", icon: FileText },
  { id: "take-photo", label: "Take Photo", icon: Camera },
  { id: "add-inventory", label: "Add Inventory", icon: Package },
  { id: "add-tool", label: "Add Tool", icon: Wrench },
  { id: "new-contract", label: "New Contract", icon: ClipboardSignature },
  { id: "add-customer", label: "Add Customer", icon: UserPlus },
  { id: "add-worker", label: "Add Worker", icon: Users },
  { id: "add-rig", label: "Add Rig", icon: Truck },
];

export default function QuickAddMenu({ isOpen, onClose, onActionSelect }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      return undefined;
    }
    setIsVisible(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 px-4">
      <div
        className={`absolute inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-2xl shadow-2xl backdrop-blur-xl p-3 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"
        }`}
      >
        <div className="grid gap-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  if (onActionSelect) onActionSelect(action.id);
                  if (onClose) onClose();
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--hover-surface)] text-[var(--text-main)] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-full bg-[#FF6700]/20 text-[#FF6700] flex items-center justify-center">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-semibold">{action.label}</span>
                </div>
                <span className="text-xs text-[var(--text-sub)]">Tap</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
