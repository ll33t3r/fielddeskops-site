"use client";

import { useEffect, useState } from "react";
import { X, Sun, Moon, RefreshCw, LogOut } from "lucide-react";
import JobsTab from "./tabs/JobsTab";
import WorkersTab from "./tabs/WorkersTab";
import FleetTab from "./tabs/FleetTab";
import CustomersTab from "./tabs/CustomersTab";

const TABS = ["JOBS", "WORKERS", "FLEET", "CUSTOMERS"];

export default function HamburgerMenu({
  isOpen,
  onClose,
  supabase,
  activeJob,
  rigs,
  workers,
  onSelectJob,
  onAssignResources,
  onJobsUpdated,
  onResourcesUpdated,
  theme,
  onToggleTheme,
  onManualRefresh,
  refreshing,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("JOBS");

  useEffect(() => {
    if (!isOpen) return undefined;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousTouchAction = body.style.touchAction;
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    return () => {
      body.style.overflow = previousOverflow || "";
      body.style.touchAction = previousTouchAction || "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in pointer-events-auto" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-96 max-w-[90vw] z-50 bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
        <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] p-5 flex justify-between items-center backdrop-blur-xl z-10">
          <h2 className="font-oswald text-xl text-[#FF6700] drop-shadow-[0_0_8px_rgba(255,103,0,0.4)]">COMMAND MENU</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--hover-surface)] rounded-lg text-[var(--text-sub)] transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-4 gap-1 bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-color)]">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 rounded text-[10px] font-bold transition ${
                  activeTab === tab ? "bg-[#FF6700] text-black shadow-[0_0_12px_rgba(255,103,0,0.3)]" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "JOBS" && (
            <JobsTab
              supabase={supabase}
              activeJob={activeJob}
              rigs={rigs}
              workers={workers}
              onSelectJob={onSelectJob}
              onAssignResources={onAssignResources}
              onJobsUpdated={onJobsUpdated}
            />
          )}

          {activeTab === "WORKERS" && (
            <WorkersTab
              supabase={supabase}
              onResourcesUpdated={onResourcesUpdated}
            />
          )}

          {activeTab === "FLEET" && (
            <FleetTab
              supabase={supabase}
              onResourcesUpdated={onResourcesUpdated}
            />
          )}

          {activeTab === "CUSTOMERS" && (
            <CustomersTab
              supabase={supabase}
              onResourcesUpdated={onResourcesUpdated}
            />
          )}

          <div className="border-t border-[var(--border-color)] pt-6 space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-widest mb-3">SYSTEM</h3>

            <button
              onClick={onToggleTheme}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex items-center justify-between hover:bg-[var(--bg-card)] transition"
            >
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon size={18} className="text-[#FF6700]" /> : <Sun size={18} className="text-[var(--text-sub)]" />}
                <span className="text-sm font-bold text-[var(--text-main)]">{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors ${theme === "dark" ? "bg-[#FF6700]" : "bg-[var(--switch-off-bg)]"}`}>
                <div className={`w-4 h-4 rounded-full bg-[var(--switch-knob)] m-0.5 transition-transform ${theme === "dark" ? "translate-x-5" : ""}`}></div>
              </div>
            </button>

            <button
              onClick={onManualRefresh}
              disabled={refreshing}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex items-center gap-3 hover:bg-[var(--bg-card)] transition"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin text-[#FF6700]" : "text-[var(--text-sub)]"} />
              <span className="text-sm font-bold text-[var(--text-main)]">Refresh Data</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full bg-red-900/20 border border-red-500/30 text-red-500 p-3 rounded-lg flex items-center gap-3 hover:bg-red-900/40 transition font-bold"
            >
              <LogOut size={18} />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
