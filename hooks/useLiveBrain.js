"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../utils/supabase/client";
import { logError } from "../utils/logger";

export function useLiveBrain() {
  const supabase = useMemo(() => createClient(), []);
  const [jobs, setJobs] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        logError("LiveBrain auth check failed", userError);
        setLoading(false);
        return null;
      }
      const user = userData?.user;
      if (!user) {
        setLoading(false);
        return null;
      }

      const { data: j, error: jobsError } = await supabase
        .from("jobs")
        .select("id, user_id, title, status, customer_id, rig_id, assigned_worker_id, created_at, updated_at, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (jobsError) {
        logError("LiveBrain jobs fetch failed", jobsError);
      }

      const { data: f, error: fleetError } = await supabase
        .from("fleet")
        .select("id, user_id, name, created_at")
        .order("name", { ascending: true });
      if (fleetError) {
        logError("LiveBrain fleet fetch failed", fleetError);
      }

      const { data: c, error: customersError } = await supabase
        .from("customers")
        .select("id, user_id, name, phone, email, address, notes, created_at, updated_at")
        .order("name", { ascending: true });
      if (customersError) {
        logError("LiveBrain customers fetch failed", customersError);
      }

      if (j) setJobs(j);
      if (f) setFleet(f);
      if (c) setCustomers(c);
      return user.id;
    } catch (error) {
      logError("LiveBrain refresh failed", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // 1. Initial Fetch
    let channel;

    const fetchData = async () => {
      try {
        const id = await refresh();

        if (!channel && id) {
          channel = supabase
            .channel("brain-channel")
            .on("postgres_changes", { event: "*", schema: "public", table: "jobs", filter: `user_id=eq.${id}` }, (payload) => {
              if (payload.eventType === "INSERT") {
                setJobs(prev => [payload.new, ...prev]);
              }
              if (payload.eventType === "UPDATE") {
                setJobs(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
              }
              if (payload.eventType === "DELETE") setJobs(prev => prev.filter(item => item.id !== payload.old.id));
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "fleet" }, (payload) => {
              if (payload.eventType === "INSERT") setFleet(prev => [...prev, payload.new]);
              if (payload.eventType === "UPDATE") setFleet(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
              if (payload.eventType === "DELETE") setFleet(prev => prev.filter(item => item.id !== payload.old.id));
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, (payload) => {
              if (payload.eventType === "INSERT") setCustomers(prev => [...prev, payload.new]);
              if (payload.eventType === "UPDATE") setCustomers(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
              if (payload.eventType === "DELETE") setCustomers(prev => prev.filter(item => item.id !== payload.old.id));
            })
            .subscribe();
        }
      } catch (error) {
        logError("LiveBrain initial fetch failed", error);
      }
    };

    fetchData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh, supabase]);

  return { jobs, fleet, customers, loading, refresh };
}
