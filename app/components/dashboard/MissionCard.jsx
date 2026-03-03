"use client";

import { MapPin, Phone, User, Truck, FileText, Camera, Wrench, MoreHorizontal, DollarSign } from "lucide-react";
import useJobDetails from "../../hooks/useJobDetails";

const statusStyles = {
  ACTIVE: "bg-green-500/15 text-green-400 border-green-500/30",
  INACTIVE: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  COMPLETED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const contractStyles = {
  signed: "bg-green-500/15 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  not_started: "bg-gray-500/15 text-gray-300 border-gray-500/30",
};

export default function MissionCard({ jobId, isActive, onSelect, onQuickAction }) {
  const {
    job,
    customer,
    rig,
    estimateTotal,
    contractStatus,
    photoCount,
    toolsCount,
    loading,
    error,
  } = useJobDetails(jobId);

  const status = job?.status || "INACTIVE";
  const statusClass = statusStyles[status] || statusStyles.INACTIVE;
  const contractClass = contractStyles[contractStatus] || contractStyles.not_started;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  return (
    <div
      onClick={() => onSelect?.(job)}
      className={`rounded-2xl border backdrop-blur-xl transition-all duration-200 cursor-pointer ${
        isActive
          ? "border-[#FF6700] shadow-[0_0_18px_rgba(255,103,0,0.35)]"
          : "border-[var(--border-color)] hover:border-[#FF6700]/60"
      } bg-[var(--bg-card)]/70`}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-oswald text-xl font-bold text-[var(--text-main)] tracking-wide">
              {job?.title || "Loading job..."}
            </h3>
            {job?.created_at && (
              <p className="text-[10px] text-[var(--text-sub)] uppercase tracking-widest mt-1">
                {new Date(job.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusClass}`}>
            {status}
          </span>
        </div>

        {error && (
          <div className="text-xs text-red-400">Failed to load job details.</div>
        )}

        {loading ? (
          <div className="text-xs text-[var(--text-sub)]">Loading details...</div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                <User size={14} className="text-[#FF6700]" />
                <span className="font-semibold">{customer?.name || "No customer"}</span>
              </div>
              {customer?.phone && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-sub)]">
                  <Phone size={12} />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer?.address && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-sub)]">
                  <MapPin size={12} />
                  <span>{customer.address}</span>
                </div>
              )}
              {rig?.name && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-sub)]">
                  <Truck size={12} className="text-[#FF6700]" />
                  <span>{rig.name}</span>
                </div>
              )}
              {job?.crew?.name && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-sub)]">
                  <User size={12} className="text-[#FF6700]" />
                  <span>{job.crew.name}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3">
                <div className="flex items-center gap-2 text-[var(--text-sub)] mb-1">
                  <DollarSign size={12} />
                  <span>Estimate</span>
                </div>
                <div className="text-[var(--text-main)] font-bold">
                  {estimateTotal > 0 ? formatCurrency(estimateTotal) : "No estimate"}
                </div>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3">
                <div className="flex items-center gap-2 text-[var(--text-sub)] mb-1">
                  <FileText size={12} />
                  <span>Contract</span>
                </div>
                <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${contractClass}`}>
                  {contractStatus === "signed"
                    ? "Signed"
                    : contractStatus === "pending"
                    ? "Pending"
                    : "Not started"}
                </span>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3">
                <div className="flex items-center gap-2 text-[var(--text-sub)] mb-1">
                  <Camera size={12} />
                  <span>Photos</span>
                </div>
                <div className="text-[var(--text-main)] font-bold">{photoCount} photos</div>
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3">
                <div className="flex items-center gap-2 text-[var(--text-sub)] mb-1">
                  <Wrench size={12} />
                  <span>Tools</span>
                </div>
                <div className="text-[var(--text-main)] font-bold">{toolsCount} tools</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-5 pb-5 flex flex-wrap gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction?.("estimate", job);
          }}
          className="px-3 py-1.5 rounded-lg bg-[#FF6700] text-black text-xs font-bold hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition"
        >
          Estimate
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction?.("photos", job);
          }}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold border border-[var(--border-color)] hover:border-[#FF6700]/70 transition"
        >
          Photos
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction?.("contract", job);
          }}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold border border-[var(--border-color)] hover:border-[#FF6700]/70 transition"
        >
          Contract
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction?.("tools", job);
          }}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold border border-[var(--border-color)] hover:border-[#FF6700]/70 transition"
        >
          Tools
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction?.("more", job);
          }}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-bold border border-[var(--border-color)] hover:border-[#FF6700]/70 transition flex items-center gap-1"
        >
          <MoreHorizontal size={14} />
          More
        </button>
      </div>
    </div>
  );
}
