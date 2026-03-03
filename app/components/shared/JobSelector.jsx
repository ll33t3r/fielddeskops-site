"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";
import { logError } from "../../../utils/logger";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function JobSelector() {
  const supabase = useMemo(() => createClient(), []);
  const { activeJob, setActiveJob, syncActiveJob, clearActiveJob, completeJob } = useActiveJob();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [jobName, setJobName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'jobs', currentCount: 0, limit: 0, tier: 'free' });

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        logError("Job selector auth failed", userError);
        setJobs([]);
        return;
      }
      const user = userData?.user;
      if (!user) {
        setJobs([]);
        return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("id, user_id, title, status, customer_id, rig_id, assigned_worker_id, created_at, updated_at, completed_at")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

      if (error) {
        logError("Job selector load failed", error);
      }

      setJobs(data || []);
    } catch (error) {
      logError("Job selector load failed", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    syncActiveJob();
    loadJobs();
  }, [loadJobs, syncActiveJob]);

  useEffect(() => {
    const handleClosePopouts = (event) => {
      if (event?.detail?.source === "job-selector") return;
      setShowDropdown(false);
      setError(null);
    };
    window.addEventListener("fdops:close-popouts", handleClosePopouts);
    return () => {
      window.removeEventListener("fdops:close-popouts", handleClosePopouts);
    };
  }, []);

  // When a job is reopened from Job History, refetch list so it appears in the dropdown
  useEffect(() => {
    if (activeJob?.id && activeJob?.status === "ACTIVE" && !jobs.some((j) => j.id === activeJob.id)) {
      loadJobs();
    }
  }, [activeJob?.id, activeJob?.status, jobs, loadJobs]);

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    setError(null);
    const trimmedName = jobName.trim();
    if (!trimmedName) {
      setError("Enter a job name to create.");
      return;
    }

    setCreating(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        logError("Job selector auth failed", userError);
        setError("Please sign in to create a job.");
        return;
      }
      const user = userData?.user;
      if (!user) {
        setError("Please sign in to create a job.");
        return;
      }

      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('jobs');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          setError(limitCheck.reason || "Account locked. Renew to edit.");
          return;
        }
        setUpgradePromptData({ resourceType: 'jobs', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }

      const { data, error: insertError } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          title: trimmedName,
          status: "ACTIVE",
        })
        .select("id, user_id, title, status, customer_id, rig_id, assigned_worker_id, created_at, updated_at, completed_at")
        .single();

      if (insertError) {
        setError(insertError.message || "Failed to create job.");
        return;
      }

      if (data) {
        await incrementResourceUsage('jobs');
        setJobs((prev) => [data, ...prev]);
        setActiveJob(data);
        setJobName("");
        setShowDropdown(false);
      }
    } catch (error) {
      logError("Job selector create failed", error);
      setError("Failed to create job.");
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (job) => {
    setActiveJob(job);
    setError(null);
    setShowDropdown(false);
  };

  const handleMarkComplete = async () => {
    if (!activeJob?.id) return;
    const { error } = await completeJob(activeJob.id);
    if (!error) {
      setJobs((prev) => prev.filter((j) => j.id !== activeJob.id));
    }
  };

  const showError = error;
  const openDropdown = () => {
    window.dispatchEvent(new CustomEvent("fdops:close-popouts", { detail: { source: "job-selector" } }));
    setError(null);
    setShowDropdown(true);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (showDropdown) {
              setShowDropdown(false);
              return;
            }
            openDropdown();
          }}
          className={`relative ${showDropdown ? "z-[120]" : "z-[20]"} w-full min-h-[3rem] bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-left focus:outline-none focus:border-[#FF6700] focus:shadow-[0_0_15px_rgba(255,103,0,0.2)] transition-[border-color,box-shadow] flex items-center justify-between gap-2`}
          aria-expanded={showDropdown}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby={showError ? "job-name-error" : undefined}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#FF6700] shrink-0">
              {activeJob ? <CheckCircle size={16} /> : <Plus size={16} />}
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#FF6700]">
                {activeJob ? "Active job" : "Job"}
              </p>
              <p className="text-sm text-[var(--text-main)] truncate">
                {activeJob?.title || "Start or select job..."}
              </p>
            </div>
          </div>
          <ChevronDown size={18} className="text-[var(--text-sub)] shrink-0" />
        </button>

        {showError && (
          <p id="job-name-error" className="mt-1.5 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => { setShowDropdown(false); setError(null); }} aria-hidden />
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl shadow-2xl z-[120] overflow-hidden">
              <div className="p-2 border-b border-[var(--border-color)] text-xs text-[var(--text-sub)] uppercase tracking-wider px-3 bg-[var(--bg-surface)]">
                Jobs
              </div>
              <form onSubmit={handleCreate} className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2">
                  <input
                    id="job-name"
                    type="text"
                    placeholder="New job name..."
                    value={jobName}
                    onChange={(e) => {
                      setJobName(e.target.value);
                      if (error) setError(null);
                    }}
                    className="flex-1 min-h-[2.5rem] bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-sub)] focus:outline-none focus:border-[#FF6700]"
                  />
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-3 py-2 text-xs font-bold text-black disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creating ? <Loader2 size={14} className="animate-spin" /> : "Create"}
                  </button>
                </div>
              </form>
              {activeJob ? (
                <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
                  <p className="text-xs text-[var(--text-sub)] truncate pr-2">
                    Selected: <span className="text-[var(--text-main)] font-semibold">{activeJob.title}</span>
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleMarkComplete}
                      className="p-1.5 hover:bg-[#FF6700]/15 rounded text-[#FF6700]"
                      title="Mark complete"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      onClick={clearActiveJob}
                      className="p-1.5 hover:bg-[#FF6700]/15 rounded text-[#FF6700]"
                      title="Clear selected job"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : null}
              {loading ? (
                <div className="px-3 py-4 text-xs text-[var(--text-sub)]">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="px-3 py-4 text-xs text-[var(--text-sub)]">No jobs yet. Create one above.</div>
              ) : (
                jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelect(job)}
                    className="w-full text-left px-3 py-3 min-h-[2.5rem] hover:bg-[#FF6700]/10 transition flex justify-between items-center gap-3 group border-b border-[var(--border-color)] last:border-0"
                  >
                    <span className="text-base leading-tight text-[var(--text-main)] group-hover:text-[#FF6700] truncate">
                      {job.title}
                      <span className="text-xs text-[var(--text-sub)] ml-2">
                        • {job.status || "ACTIVE"}
                      </span>
                    </span>
                    <span className="text-xs text-[var(--text-sub)] shrink-0">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {showUpgradePrompt && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          resourceType={upgradePromptData.resourceType}
          currentCount={upgradePromptData.currentCount}
          limit={upgradePromptData.limit}
          tier={upgradePromptData.tier}
        />
      )}

    </div>
  );
}
