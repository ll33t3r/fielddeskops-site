"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "../app/utils/supabase/client";
import { logError } from "../utils/logger";

const ACTIVE_JOB_KEY_PREFIX = "fieldDeskOps_activeJob";
const LEGACY_ACTIVE_JOB_KEY = "fieldDeskOps_activeJob";

const isValidJob = (job) => Boolean(job && typeof job === "object" && job.id);
const getActiveJobKey = (userId) => `${ACTIVE_JOB_KEY_PREFIX}:${userId}`;
const isActiveJobStorageKey = (key) =>
  key === LEGACY_ACTIVE_JOB_KEY || key?.startsWith(`${ACTIVE_JOB_KEY_PREFIX}:`);

// A safe hook that doesn"t require wrapping root layout
export function useActiveJob() {
  const [activeJob, setActiveJobState] = useState(null);

  const syncActiveJob = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id) {
        setActiveJobState(null);
        return;
      }

      const scopedKey = getActiveJobKey(user.id);
      let saved = localStorage.getItem(scopedKey);

      // One-time migration from legacy global key to user-scoped key.
      if (!saved) {
        const legacySaved = localStorage.getItem(LEGACY_ACTIVE_JOB_KEY);
        if (legacySaved) {
          try {
            const legacyParsed = JSON.parse(legacySaved);
            if (isValidJob(legacyParsed) && (!legacyParsed.user_id || legacyParsed.user_id === user.id)) {
              localStorage.setItem(scopedKey, legacySaved);
              saved = legacySaved;
            }
          } catch {
            // ignore malformed legacy value
          }
          localStorage.removeItem(LEGACY_ACTIVE_JOB_KEY);
        }
      }

      if (!saved) {
        setActiveJobState(null);
        return;
      }

      const parsed = JSON.parse(saved);
      if (!isValidJob(parsed) || (parsed.user_id && parsed.user_id !== user.id)) {
        localStorage.removeItem(scopedKey);
        setActiveJobState(null);
        return;
      }

      // Ensure hydrated active job belongs to the logged-in user and still exists.
      const { data: dbJob, error: jobError } = await supabase
        .from("jobs")
        .select("id, user_id, title, status, customer_id, rig_id, assigned_worker_id, created_at, updated_at, completed_at")
        .eq("id", parsed.id)
        .eq("user_id", user.id)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (jobError || !dbJob) {
        if (jobError) logError("ActiveJob ownership validation failed", jobError, { jobId: parsed.id, userId: user.id });
        localStorage.removeItem(scopedKey);
        setActiveJobState(null);
        return;
      }

      setActiveJobState(dbJob);
    } catch (e) {
      logError("ActiveJob sync failed", e);
      setActiveJobState(null);
    }
  }, []);

  useEffect(() => {
    void syncActiveJob();

    const handleStorageChange = (event) => {
      if (event?.key && !isActiveJobStorageKey(event.key)) return;
      void syncActiveJob();
    };

    const handleActiveJobUpdate = () => {
      void syncActiveJob();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("active-job-update", handleActiveJobUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("active-job-update", handleActiveJobUpdate);
    };
  }, [syncActiveJob]);

  const setActiveJob = useCallback(async (job) => {
    if (!isValidJob(job)) {
      setActiveJobState(null);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) localStorage.removeItem(getActiveJobKey(user.id));
      } catch {
        // ignore
      }
      localStorage.removeItem(LEGACY_ACTIVE_JOB_KEY);
      window.dispatchEvent(new Event("active-job-update"));
      return;
    }

    setActiveJobState(job);

    let ownerId = job.user_id || null;
    if (!ownerId) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      ownerId = user?.id || null;
    }

    if (!ownerId) {
      logError("ActiveJob set failed: missing owner id", null, { jobId: job.id });
      return;
    }

    localStorage.setItem(getActiveJobKey(ownerId), JSON.stringify(job));
    localStorage.removeItem(LEGACY_ACTIVE_JOB_KEY);
    window.dispatchEvent(new Event("active-job-update"));
  }, []);

  const clearActiveJob = useCallback(async () => {
    setActiveJobState(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) localStorage.removeItem(getActiveJobKey(user.id));
    } catch {
      // ignore
    }
    localStorage.removeItem(LEGACY_ACTIVE_JOB_KEY);
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

      await clearActiveJob();
      window.dispatchEvent(new CustomEvent("fdops:jobs-changed", { detail: { action: "complete", jobId } }));
      return { error: null };
    } catch (error) {
      logError("ActiveJob completion failed", error, { jobId });
      return { error };
    }
  }, [clearActiveJob]);

  return { activeJob, setActiveJob, clearActiveJob, completeJob, syncActiveJob };
}
