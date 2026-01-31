"use client";

export default function DashboardHeader({
  greeting,
}) {
  return (
    <header className="px-6 pt-4 pb-3 shrink-0">
      <div className="flex items-start mb-3">
        <div>
          <p className="text-[#FF6700] font-bold text-[9px] tracking-[0.25em] uppercase mb-2">FIELDDESKOPS</p>
          <h1 className="text-4xl font-oswald font-bold tracking-tight leading-none mb-0.5">
            <span className="text-[#FF6700] drop-shadow-[0_0_12px_rgba(255,103,0,0.5)]">COMMAND</span>
            <span className="text-[var(--text-main)]">CENTER</span>
          </h1>
          <p className="text-[9px] text-[var(--text-sub)] font-medium tracking-wider uppercase opacity-60">{greeting}</p>
        </div>

      </div>

    </header>
  );
}
