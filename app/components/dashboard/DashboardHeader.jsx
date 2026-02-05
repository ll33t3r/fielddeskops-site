"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Clock } from "lucide-react";

export default function DashboardHeader({
  greeting,
  onOpenJobHistory,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [menuOpen]);

  const handleJobHistory = () => {
    setMenuOpen(false);
    onOpenJobHistory?.();
  };

  return (
    <header className="px-6 pt-4 pb-3 shrink-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[#FF6700] font-bold text-[9px] tracking-[0.25em] uppercase mb-2">FIELDDESKOPS</p>
          <h1 className="text-4xl font-oswald font-bold tracking-tight leading-none mb-0.5">
            <span className="text-[#FF6700] drop-shadow-[0_0_12px_rgba(255,103,0,0.5)]">COMMAND</span>
            <span className="text-[var(--text-main)]">CENTER</span>
          </h1>
          <p className="text-[9px] text-[var(--text-sub)] font-medium tracking-wider uppercase opacity-60">{greeting}</p>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-[var(--text-sub)] hover:text-[#FF6700] hover:bg-[#FF6700]/10 transition border border-transparent hover:border-[#FF6700]/30"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <Menu size={24} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={handleJobHistory}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[#FF6700]/10 hover:text-[#FF6700] transition"
              >
                <Clock size={18} className="text-[#FF6700]" />
                Job History
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
