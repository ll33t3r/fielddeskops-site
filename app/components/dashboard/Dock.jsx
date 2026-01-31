"use client";

import { useState } from "react";
import { Settings, Users, Plus, Truck, BookUser } from "lucide-react";

const BUTTONS = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "workers", label: "Workers", icon: Users },
  { id: "quickadd", label: "Quick Add", icon: Plus, primary: true },
  { id: "fleet", label: "Fleet", icon: Truck },
  { id: "phonebook", label: "Phone Book", icon: BookUser },
];

export default function Dock({ onButtonClick }) {
  const [activeButton, setActiveButton] = useState(null);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-3 pointer-events-none h-24">
      <div className="mx-auto max-w-xl pointer-events-auto h-full">
        <div className="grid grid-cols-5 gap-2 items-center h-full rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          {BUTTONS.map((button) => {
            const Icon = button.icon;
            const isActive = activeButton === button.id;
            const isPrimary = button.primary;
            return (
              <div key={button.id} className="flex flex-col items-center justify-end">
                <button
                  onClick={() => {
                    setActiveButton(button.id);
                    if (onButtonClick) onButtonClick(button.id);
                  }}
                  className={[
                    "relative flex items-center justify-center transition-all",
                    "min-h-[48px] min-w-[48px] rounded-xl",
                    isPrimary
                      ? "h-16 w-16 bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.5)]"
                      : "bg-white/5 text-[var(--text-sub)] hover:text-[var(--text-main)]",
                    isActive && !isPrimary ? "text-[#FF6700] shadow-[0_0_12px_rgba(255,103,0,0.45)]" : "",
                  ].join(" ")}
                  aria-label={button.label}
                >
                  <Icon size={isPrimary ? 26 : 20} strokeWidth={2.2} />
                  {isActive && !isPrimary && (
                    <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-[#FF6700]" />
                  )}
                </button>
                <span className={`mt-1 text-[9px] font-bold uppercase tracking-wider ${isPrimary ? "text-[#FF6700]" : "text-[var(--text-sub)]"}`}>
                  {button.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
