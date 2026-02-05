"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";
import { buildFieldErrors, isRequired } from "../../utils/validation";
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
  const [touched, setTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'jobs', currentCount: 0, limit: 0, tier: 'free' });
  const inputRef = useRef(null);

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

  // When a job is reopened from Job History, refetch list so it appears in the dropdown
  useEffect(() => {
    if (activeJob?.id && activeJob?.status === "ACTIVE" && !jobs.some((j) => j.id === activeJob.id)) {
      loadJobs();
    }
  }, [activeJob?.id, activeJob?.status, jobs, loadJobs]);

  const validate = useMemo(
    () => (value) =>
      buildFieldErrors({
        jobName: [{ isValid: isRequired(value), message: "Job name is required." }],
      }),
    []
  );

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    setError(null);
    const nextErrors = validate(jobName);
    setFieldErrors(nextErrors);
    setTouched(true);
    if (Object.keys(nextErrors).length > 0) return;

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
        setUpgradePromptData({ resourceType: 'jobs', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }

      const { data, error: insertError } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          title: jobName.trim(),
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
        setTouched(false);
        setFieldErrors({});
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
    setShowDropdown(false);
  };

  const handleMarkComplete = async () => {
    if (!activeJob?.id) return;
    const { error } = await completeJob(activeJob.id);
    if (!error) {
      setJobs((prev) => prev.filter((j) => j.id !== activeJob.id));
    }
  };

  const fieldError = touched ? fieldErrors.jobName : null;
  const showError = error || fieldError;

  return (
    <div className="w-full">
      <div className="relative">
        <form onSubmit={handleCreate} className="relative z-30 group" noValidate>
          {/* Fixed-height row so Plus/Create/Chevron stay aligned when error shows */}
          <div className="relative min-h-[3rem] flex items-center">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6700] z-10 shrink-0">
              {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            </div>
            <input
              ref={inputRef}
              id="job-name"
              type="text"
              placeholder="Start or Select Job..."
              value={jobName}
              onChange={(e) => {
                const nextValue = e.target.value;
                setJobName(nextValue);
                if (touched) {
                  setFieldErrors(validate(nextValue));
                }
              }}
              onBlur={(event) => {
                setTouched(true);
                setFieldErrors(validate(event.target.value));
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full min-h-[3rem] bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl py-3 pl-12 pr-28 text-base text-[var(--text-main)] placeholder:text-[var(--text-sub)] focus:outline-none focus:border-[#FF6700] focus:shadow-[0_0_15px_rgba(255,103,0,0.2)] transition-all"
              aria-invalid={fieldError ? "true" : "false"}
              aria-describedby={showError ? "job-name-error" : undefined}
            />
            <button
              type="submit"
              className="absolute right-12 top-1/2 -translate-y-1/2 bg-[#FF6700] text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(255,103,0,0.3)] hover:shadow-[0_0_16px_rgba(255,103,0,0.45)] transition shrink-0"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowDropdown((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[#FF6700] z-10 shrink-0"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </form>

        {showError && (
          <p id="job-name-error" className="mt-1.5 text-xs text-red-500" role="alert">
            {error || fieldError}
          </p>
        )}

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => { setShowDropdown(false); setError(null); }} aria-hidden />
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-[var(--border-color)] rounded-xl shadow-2xl z-40 overflow-hidden">
              <div className="p-2 border-b border-[var(--border-color)] text-xs text-[var(--text-sub)] uppercase tracking-wider px-3 bg-black/60">
                Jobs
              </div>
              {loading ? (
                <div className="px-3 py-4 text-xs text-[var(--text-sub)]">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="px-3 py-4 text-xs text-[var(--text-sub)]">No jobs yet. Create one above.</div>
              ) : (
                jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelect(job)}
                    className="w-full text-left px-3 py-2 hover:bg-[#FF6700]/10 transition flex justify-between items-center group border-b border-white/5 last:border-0"
                  >
                    <span className="text-sm text-[var(--text-main)] group-hover:text-[#FF6700]">
                      {job.title}
                      <span className="text-[10px] text-[var(--text-sub)] ml-2">
                        • {job.status || "ACTIVE"}
                      </span>
                    </span>
                    <span className="text-xs text-[var(--text-sub)]">
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

      {activeJob && (
        <div className="flex items-center justify-between bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-lg p-3 mt-3 shadow-[0_0_10px_rgba(255,103,0,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF6700] shadow-[0_0_8px_#FF6700] animate-pulse"></div>
            <div>
              <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider">ACTIVE JOB</p>
              <p className="font-oswald text-sm text-[var(--text-main)] tracking-wide">{activeJob.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleMarkComplete}
              className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]"
              title="Mark complete"
            >
              <CheckCircle size={14} />
            </button>
            <button onClick={clearActiveJob} className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]" title="Clear">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
