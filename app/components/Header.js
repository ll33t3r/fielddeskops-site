"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Header({ title, backLink }) {
  
  // THE MASTER BRAND LIST
  // Defines how to split and color the names
  const BRAND_SPLITS = {
    "PROFITLOCK":  ["PROFIT", "LOCK"],
    "LOADOUT":     ["LOAD", "OUT"],
    "TOOLSHED":    ["TOOL", "SHED"],
    "CREWCLOCK":   ["CREW", "CLOCK"],
    "SITESNAP":    ["SITE", "SNAP"],
    "SIGNOFF":     ["SIGN", "OFF"],
    "SAFETYBRIEF": ["SAFETY", "BRIEF"],
    "SUBHUB":      ["SUB", "HUB"],
    "FIELDDESKOPS":["FIELDDESK", "OPS"]
  };

  // 1. Clean the input (Remove spaces, make uppercase)
  // This ensures "Crew Clock" becomes "CREWCLOCK"
  const cleanTitle = title ? title.replace(/\s/g, "").toUpperCase() : "";

  // 2. Check if we have a defined split for this app
  const splitParts = BRAND_SPLITS[cleanTitle];

  return (
    <header className="flex items-center gap-4 p-5 pb-2 bg-[#121212] sticky top-0 z-40 border-b border-white/5 select-none">
      {backLink && (
        <Link href={backLink} className="text-gray-400 hover:text-white transition active:scale-90">
          <ArrowLeft size={24} />
        </Link>
      )}
      
      <h1 className="font-oswald font-bold text-2xl tracking-wide flex items-center gap-0">
        {splitParts ? (
           <>
             {/* Part 1: Brand Orange */}
             <span className="text-[#FF6700]">{splitParts[0]}</span>
             {/* Part 2: White */}
             <span className="text-white">{splitParts[1]}</span>
           </>
        ) : (
           // Fallback: If it's a random page title not in our list
           <span className="text-white">{cleanTitle}</span>
        )}
      </h1>
    </header>
  );
}
