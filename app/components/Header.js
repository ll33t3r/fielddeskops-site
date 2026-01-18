"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Header({ title, backLink = "/", actionIcon, onAction, actionLabel }) {
  return (
    <header className="flex items-center justify-between px-5 pt-8 pb-4 bg-[#1a1a1a] border-b border-[#333] sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Link href={backLink} className="glass-btn p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition active:scale-95">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-oswald font-bold tracking-wide text-white uppercase">{title}</h1>
      </div>
      
      {/* Optional Right Action Button */}
      {actionIcon && (
        <button 
          onClick={onAction}
          className="flex items-center gap-2 bg-[#FF6700] text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#e55c00] transition active:scale-95 shadow-[0_0_15px_rgba(255,103,0,0.3)]"
        >
          {actionIcon}
          {actionLabel && <span>{actionLabel}</span>}
        </button>
      )}
    </header>
  );
}
