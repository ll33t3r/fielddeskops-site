"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Plus, X } from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";

export default function JobSelector() {
  const supabase = createClient();
  const { activeJob, setActiveJob, syncActiveJob, clearActiveJob } = useActiveJob();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [jobName, setJobName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setJobs(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    syncActiveJob();
    loadJobs();
  }, [loadJobs, syncActiveJob]);

  const handleCreate = async (e) => {
    e?.preventDefault?.();
    if (!jobName.trim()) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        title: jobName.trim(),
        status: "ACTIVE",
      })
      .select()
      .single();

    if (!error && data) {
      setJobs((prev) => [data, ...prev]);
      setActiveJob(data);
      setJobName("");
      setShowDropdown(false);
    }
    setCreating(false);
  };

  const handleSelect = (job) => {
    setActiveJob(job);
    setShowDropdown(false);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <form onSubmit={handleCreate} className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF6700] z-10">
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Start or Select Job..."
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="w-full bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-xl py-3 pl-12 pr-28 text-base text-[var(--text-main)] placeholder:text-[var(--text-sub)] focus:outline-none focus:border-[#FF6700] focus:shadow-[0_0_15px_rgba(255,103,0,0.2)] transition-all"
          />
          <button
            type="submit"
            className="absolute right-12 top-1/2 -translate-y-1/2 bg-[#FF6700] text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-[0_0_12px_rgba(255,103,0,0.3)] hover:shadow-[0_0_16px_rgba(255,103,0,0.45)] transition"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowDropdown((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-sub)] hover:text-[#FF6700] z-10"
          >
            <ChevronDown size={18} />
          </button>
        </form>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-[var(--border-color)] rounded-xl shadow-2xl z-30 overflow-hidden">
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

      {activeJob && (
        <div className="flex items-center justify-between bg-[#FF6700]/10 border border-[#FF6700]/30 rounded-lg p-3 mt-3 shadow-[0_0_10px_rgba(255,103,0,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF6700] shadow-[0_0_8px_#FF6700] animate-pulse"></div>
            <div>
              <p className="text-[10px] text-[#FF6700] font-bold uppercase tracking-wider">ACTIVE JOB</p>
              <p className="font-oswald text-sm text-[var(--text-main)] tracking-wide">{activeJob.title}</p>
            </div>
          </div>
          <button onClick={clearActiveJob} className="p-2 hover:bg-[#FF6700]/20 rounded text-[#FF6700]">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
