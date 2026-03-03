"use client";

import { useCallback, useEffect, useState } from "react";
import { logError } from "../../utils/logger";

export default function useJobOperations(supabase, options = {}) {
  const { autoLoad = true } = options;
  const [jobs, setJobs] = useState([]);

  const loadJobs = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        logError("Load jobs auth failed", userError);
        setJobs([]);
        return [];
      }
      const user = userData?.user;
      if (!user) {
        setJobs([]);
        return [];
      }
      const { data, error } = await supabase
        .from("jobs")
        .select("id, user_id, title, status, customer_id, rig_id, assigned_worker_id, created_at, updated_at, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        logError("Load jobs failed", error);
        return null;
      }
      if (data) {
        setJobs(data);
        return data;
      }
      return [];
    } catch (error) {
      logError("Load jobs failed", error);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    if (autoLoad) {
      loadJobs();
    }
  }, [autoLoad, loadJobs]);

  const createJob = useCallback(async (title, options = {}) => {
    if (!title?.trim()) return { data: null, error: null };
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        logError("Create job auth failed", userError);
        return { data: null, error: userError };
      }
      const user = userData?.user;
      if (!user) return { data: null, error: new Error("User not found") };

      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('jobs');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          return {
            data: null,
            error: Object.assign(new Error(limitCheck.reason || 'Account locked. Renew to edit.'), {
              readOnly: true,
              resourceType: 'jobs',
              currentCount: limitCheck.currentCount,
              limit: limitCheck.limit,
              tier: limitCheck.tier,
            }),
          };
        }
        return {
          data: null,
          error: Object.assign(new Error('Limit reached'), {
            limitReached: true,
            resourceType: 'jobs',
            currentCount: limitCheck.currentCount,
            limit: limitCheck.limit,
            tier: limitCheck.tier,
          }),
        };
      }

      const { data, error } = await supabase.from("jobs").insert({
        user_id: user.id,
        title: title.trim(),
        status: "ACTIVE",
        rig_id: options.rig_id || null,
        assigned_worker_id: options.assigned_worker_id || null,
      }).select("id, user_id, title, status, customer_id, rig_id, assigned_worker_id, created_at, updated_at, completed_at").single();

      if (error) {
        logError("Create job failed", error);
        return { data: null, error };
      }

      if (data) {
        await incrementResourceUsage('jobs');
        await loadJobs();
        window.dispatchEvent(new CustomEvent("fdops:jobs-changed", { detail: { action: "create", jobId: data.id } }));
      }

      return { data, error: null };
    } catch (error) {
      logError("Create job failed", error);
      return { data: null, error };
    }
  }, [supabase, loadJobs]);

  const updateJob = useCallback(async (id, updates) => {
    try {
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        return { error: Object.assign(new Error(access.reason || 'Account locked. Renew to edit.'), { readOnly: access.readOnly }) };
      }
      const { error } = await supabase.from("jobs").update(updates).eq("id", id);
      if (!error) {
        await loadJobs();
        window.dispatchEvent(new CustomEvent("fdops:jobs-changed", { detail: { action: "update", jobId: id } }));
      }
      return { error };
    } catch (error) {
      logError("Update job failed", error, { id });
      return { error };
    }
  }, [supabase, loadJobs]);

  const deleteJob = useCallback(async (id) => {
    try {
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        return { error: Object.assign(new Error(access.reason || 'Account locked. Renew to edit.'), { readOnly: access.readOnly }) };
      }
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (!error) {
        await loadJobs();
        window.dispatchEvent(new CustomEvent("fdops:jobs-changed", { detail: { action: "delete", jobId: id } }));
      }
      return { error };
    } catch (error) {
      logError("Delete job failed", error, { id });
      return { error };
    }
  }, [supabase, loadJobs]);

  const assignToJob = useCallback(async (jobId, field, valueId) => {
    try {
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        return { error: Object.assign(new Error(access.reason || 'Account locked. Renew to edit.'), { readOnly: access.readOnly }) };
      }
      const { error } = await supabase.from("jobs").update({ [field]: valueId }).eq("id", jobId);
      if (!error) {
        await loadJobs();
      }
      return { error };
    } catch (error) {
      logError("Assign job field failed", error, { jobId, field });
      return { error };
    }
  }, [supabase, loadJobs]);

  return {
    jobs,
    setJobs,
    loadJobs,
    createJob,
    updateJob,
    deleteJob,
    assignToJob,
  };
}
