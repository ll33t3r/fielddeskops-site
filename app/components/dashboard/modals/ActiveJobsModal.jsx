"use client";

import { CheckCircle2, X } from "lucide-react";

export default function ActiveJobsModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const { jobs, jobsCount, onSelectJob, onMarkComplete } = data;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto z-50 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl animate-in zoom-in-95 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="font-oswald text-xl text-[#FF6700]">ACTIVE JOBS ({jobsCount})</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {jobs.map((job) => (
            <div key={job.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-3 flex justify-between items-center">
              <div className="flex-1 cursor-pointer" onClick={() => onSelectJob(job)}>
                <p className="font-oswald text-sm text-[var(--text-main)]">{job.title}</p>
                <p className="text-xs text-[var(--text-sub)]">
                  {new Date(job.created_at).toLocaleDateString()}
                  {job.fleet?.name ? ` • ${job.fleet.name}` : ""}
                  {job.crew?.name ? ` • ${job.crew.name}` : ""}
                </p>
              </div>
              <button
                onClick={() => onMarkComplete(job.id)}
                className="p-2 hover:bg-green-500/10 rounded text-[var(--text-sub)] hover:text-green-500 transition"
                title="Mark Complete"
              >
                <CheckCircle2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
