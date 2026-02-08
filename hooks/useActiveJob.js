"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "../app/utils/supabase/client";
import { logError } from "../utils/logger";

const ACTIVE_JOB_KEY = "fieldDeskOps_activeJob";

const isValidJob = (job) => Boolean(job && typeof job === "object" && job.id);

// A safe hook that doesn"t require wrapping root layout
export function useActiveJob() {
  const [activeJob, setActiveJobState] = useState(null);

  const syncActiveJob = useCallback(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_JOB_KEY);
      if (!saved) {
        setActiveJobState(null);
        return;
      }
      const parsed = JSON.parse(saved);
      if (isValidJob(parsed)) {
        setActiveJobState(parsed);
      } else {
        localStorage.removeItem(ACTIVE_JOB_KEY);
        setActiveJobState(null);
      }
    } catch (e) {
      logError("ActiveJob sync failed", e);
      setActiveJobState(null);
    }
  }, []);

  useEffect(() => {
    syncActiveJob();

    const handleStorageChange = (event) => {
      if (event?.key && event.key !== ACTIVE_JOB_KEY) return;
      syncActiveJob();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("active-job-update", syncActiveJob);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("active-job-update", syncActiveJob);
    };
  }, [syncActiveJob]);

  const setActiveJob = useCallback((job) => {
    if (!isValidJob(job)) {
      localStorage.removeItem(ACTIVE_JOB_KEY);
      setActiveJobState(null);
      window.dispatchEvent(new Event("active-job-update"));
      return;
    }
    setActiveJobState(job);
    localStorage.setItem(ACTIVE_JOB_KEY, JSON.stringify(job));
    window.dispatchEvent(new Event("active-job-update"));
  }, []);

  const clearActiveJob = useCallback(() => {
    localStorage.removeItem(ACTIVE_JOB_KEY);
    setActiveJobState(null);
    window.dispatchEvent(new Event("active-job-update"));
  }, []);

  const completeJob = useCallback(async (jobId) => {
    const supabase = createClient();
    try {
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        return { error: Object.assign(new Error(access.reason || 'Account locked. Renew to edit.'), { readOnly: access.readOnly }) };
      }
      const { error } = await supabase
        .from("jobs")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) {
        logError("ActiveJob completion failed", error, { jobId });
        return { error };
      }

      clearActiveJob();
      return { error: null };
    } catch (error) {
      logError("ActiveJob completion failed", error, { jobId });
      return { error };
    }
  }, [clearActiveJob]);

  return { activeJob, setActiveJob, clearActiveJob, completeJob, syncActiveJob };
}
