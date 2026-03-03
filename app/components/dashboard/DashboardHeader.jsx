"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, Clock, UserCircle2, Plus, Users, Truck, BookUser, Settings } from "lucide-react";

export default function DashboardHeader({
  greeting,
  onOpenJobHistory,
  onOpenQuickAdd,
  onOpenWorkers,
  onOpenFleet,
  onOpenPhoneBook,
  onOpenSettings,
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

  useEffect(() => {
    const handleClosePopouts = (event) => {
      if (event?.detail?.source === "dashboard-header-menu") return;
      setMenuOpen(false);
    };
    window.addEventListener("fdops:close-popouts", handleClosePopouts);
    return () => {
      window.removeEventListener("fdops:close-popouts", handleClosePopouts);
    };
  }, []);

  const handleJobHistory = () => {
    setMenuOpen(false);
    onOpenJobHistory?.();
  };

  const handleAction = (callback) => {
    setMenuOpen(false);
    callback?.();
  };

  return (
    <header className="px-4 sm:px-6 pt-4 pb-3 shrink-0">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[#FF6700] font-bold text-[9px] tracking-[0.25em] uppercase mb-2">FIELDDESKOPS</p>
          <h1 className="text-3xl sm:text-4xl font-oswald font-bold tracking-tight leading-none mb-0.5">
            <span className="text-[#FF6700] drop-shadow-[0_0_12px_rgba(255,103,0,0.5)]">COMMAND</span>
            <span className="text-[var(--text-main)]">CENTER</span>
          </h1>
          <p className="text-[9px] text-[var(--text-sub)] font-medium tracking-wider uppercase opacity-60">{greeting}</p>
        </div>

        <div className="relative z-[120]" ref={menuRef}>
          <button
            onClick={() => {
              if (!menuOpen) {
                window.dispatchEvent(new CustomEvent("fdops:close-popouts", { detail: { source: "dashboard-header-menu" } }));
              }
              setMenuOpen((prev) => !prev);
            }}
            className="p-2 rounded-xl text-[var(--text-sub)] hover:text-[#FF6700] hover:bg-[#FF6700]/10 transition border border-transparent hover:border-[#FF6700]/30"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <Menu size={24} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-2xl z-[120] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-[var(--border-color)] text-xs text-[var(--text-sub)] uppercase tracking-wider px-3 bg-[var(--bg-surface)]">
                More
              </div>
              <button
                onClick={() => handleAction(onOpenQuickAdd)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[#FF6700]/10 hover:text-[#FF6700] transition border-b border-[var(--border-color)]"
              >
                <Plus size={18} className="text-[#FF6700]" />
                Quick Add
              </button>
              <button
                onClick={handleJobHistory}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[#FF6700]/10 hover:text-[#FF6700] transition border-b border-[var(--border-color)]"
              >
                <Clock size={18} className="text-[#FF6700]" />
                Job History
              </button>
              <button
                onClick={() => handleAction(onOpenPhoneBook)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[#FF6700]/10 hover:text-[#FF6700] transition border-b border-[var(--border-color)]"
              >
                <BookUser size={18} className="text-[#FF6700]" />
                Phone Book
              </button>
              <button
                onClick={() => handleAction(onOpenWorkers)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[#FF6700]/10 hover:text-[#FF6700] transition border-b border-[var(--border-color)]"
              >
                <Users size={18} className="text-[#FF6700]" />
                Workers
              </button>
              <button
                onClick={() => handleAction(onOpenFleet)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[#FF6700]/10 hover:text-[#FF6700] transition border-b border-[var(--border-color)]"
              >
                <Truck size={18} className="text-[#FF6700]" />
                Fleet
              </button>
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[#FF6700]/10 hover:text-[#FF6700] transition border-b border-[var(--border-color)]"
              >
                <UserCircle2 size={18} className="text-[#FF6700]" />
                Account
              </Link>
              <button
                onClick={() => handleAction(onOpenSettings)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-main)] hover:bg-[#FF6700]/10 hover:text-[#FF6700] transition"
              >
                <Settings size={18} className="text-[#FF6700]" />
                Settings
              </button>
              <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
                <div className="flex items-center gap-4 text-xs">
                  <Link
                    href="/legal/terms?from=%2Fdashboard"
                    onClick={() => setMenuOpen(false)}
                    className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors"
                  >
                    Terms
                  </Link>
                  <Link
                    href="/legal/privacy?from=%2Fdashboard"
                    onClick={() => setMenuOpen(false)}
                    className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors"
                  >
                    Privacy
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
