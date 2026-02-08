"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "../utils/supabase/client";
import { X, Clock, CheckCircle, RotateCcw, ArrowLeft, Truck } from "lucide-react";

export default function JobHistory({ isOpen, onClose, onReopen }) {
  const supabase = createClient();
  const [historyJobs, setHistoryJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accessError, setAccessError] = useState("");

  const loadHistoryJobs = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setHistoryJobs([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["COMPLETED", "INACTIVE"])
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });
    setHistoryJobs(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (isOpen) {
      loadHistoryJobs();
      setSelectedJob(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, loadHistoryJobs]);

  const updateStatus = async (status, setCompletedAt = false) => {
    if (!selectedJob?.id) return;
    const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
    const access = await getWriteAccessStatus();
    if (!access.allowed) {
      setAccessError(access.reason || "Account locked. Renew to edit.");
      return;
    }
    setUpdating(true);
    const updates = { status };
    if (status === "COMPLETED") updates.completed_at = new Date().toISOString();
    if (status === "ACTIVE") updates.completed_at = null;
    const { data, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", selectedJob.id)
      .select()
      .single();
    setUpdating(false);
    if (!error) {
      if (status === "ACTIVE") {
        setSelectedJob(null);
        await loadHistoryJobs();
        onReopen?.(data ?? { ...selectedJob, status: "ACTIVE", completed_at: null });
        onClose?.();
      } else {
        setSelectedJob(data ?? { ...selectedJob, ...updates });
        await loadHistoryJobs();
      }
    }
  };

  const handleReopen = () => updateStatus("ACTIVE");
  const handleMarkInactive = () => updateStatus("INACTIVE");
  const handleMarkCompleted = () => updateStatus("COMPLETED");

  const handleDelete = async () => {
    if (!selectedJob?.id) return;
    const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
    const access = await getWriteAccessStatus();
    if (!access.allowed) {
      setAccessError(access.reason || "Account locked. Renew to edit.");
      return;
    }
    setDeleting(true);
    const { error } = await supabase.from("jobs").delete().eq("id", selectedJob.id);
    setDeleting(false);
    setShowDeleteConfirm(false);
    if (!error) {
      setSelectedJob(null);
      await loadHistoryJobs();
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[var(--bg-main)] border-l border-[var(--border-color)] shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-label="Job History"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-black/40">
          {selectedJob ? (
            <>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 -ml-2 rounded-lg text-[var(--text-sub)] hover:text-[#FF6700] hover:bg-[#FF6700]/10 transition"
                aria-label="Back to list"
              >
                <ArrowLeft size={20} />
              </button>
              <span className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">Job details</span>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--text-sub)] hover:text-[#FF6700] hover:bg-[#FF6700]/10 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Clock className="text-[#FF6700]" size={22} />
                <h2 className="font-oswald font-bold text-lg text-[var(--text-main)]">Job History</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[var(--text-sub)] hover:text-[#FF6700] hover:bg-[#FF6700]/10 transition"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {accessError && (
            <div className="px-4 pt-4">
              <p className="text-xs text-red-400">{accessError}</p>
            </div>
          )}
          {selectedJob ? (
            /* Detail view (read-only) */
            <div className="p-4 space-y-4">
              <div className="bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-xl p-4">
                <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider mb-1">Title</p>
                <p className="font-oswald text-lg text-[var(--text-main)]">{selectedJob.title}</p>
              </div>
              <div className="grid gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-sub)]">Status</span>
                  <span className="text-[var(--text-main)] font-medium flex items-center gap-1">
                    <CheckCircle size={14} className="text-green-500" /> {selectedJob.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-sub)]">Created</span>
                  <span className="text-[var(--text-main)]">{formatDate(selectedJob.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-sub)]">Completed</span>
                  <span className="text-[var(--text-main)]">{formatDate(selectedJob.completed_at)}</span>
                </div>
                {selectedJob.rig_id && (
                  <div className="flex justify-between text-sm items-center gap-2">
                    <span className="text-[var(--text-sub)] flex items-center gap-1">
                      <Truck size={14} /> Rig
                    </span>
                    <span className="text-[var(--text-main)] truncate font-mono text-xs">{selectedJob.rig_id}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleReopen}
                disabled={reopening}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#FF6700]/20 border border-[#FF6700]/50 text-[#FF6700] hover:bg-[#FF6700]/30 transition disabled:opacity-50"
              >
                {reopening ? (
                  <span className="animate-pulse">Reopening…</span>
                ) : (
                  <>
                    <RotateCcw size={18} /> Reopen job
                  </>
                )}
              </button>
            </div>
          ) : (
            /* List view */
            <>
              <div className="px-4 py-2 border-b border-[var(--border-color)] bg-black/30">
                <p className="text-xs text-[var(--text-sub)] uppercase tracking-wider">
                  Completed jobs
                </p>
              </div>
              {loading ? (
                <div className="p-6 text-center text-[var(--text-sub)] text-sm">Loading…</div>
              ) : historyJobs.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle size={40} className="mx-auto text-[var(--text-sub)] opacity-50 mb-3" />
                  <p className="text-[var(--text-sub)] text-sm">No completed jobs yet.</p>
                  <p className="text-xs text-[var(--text-sub)] opacity-70 mt-1">Mark a job complete from the job selector.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-color)]">
                  {historyJobs.map((job) => (
                    <li key={job.id}>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="w-full text-left px-4 py-4 hover:bg-[#FF6700]/10 transition flex flex-col gap-1"
                      >
                        <span className="font-medium text-[var(--text-main)]">{job.title}</span>
                        <span className="text-xs text-[var(--text-sub)]">
                          Completed {formatDate(job.completed_at)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
