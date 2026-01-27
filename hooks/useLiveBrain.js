"use client";
import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";

export function useLiveBrain() {
  const supabase = createClient();
  const [jobs, setJobs] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: j } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
      const { data: f } = await supabase.from("fleet").select("*").order("name", { ascending: true });
      const { data: c } = await supabase.from("customers").select("*").order("name", { ascending: true });

      if (j) setJobs(j);
      if (f) setFleet(f);
      if (c) setCustomers(c);
      setLoading(false);
    };

    fetchData();

    // 2. Realtime Subscription
    const channel = supabase
      .channel("brain-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, (payload) => {
        if (payload.eventType === "INSERT") setJobs(prev => [payload.new, ...prev]);
        if (payload.eventType === "UPDATE") setJobs(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
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

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { jobs, fleet, customers, loading };
}
