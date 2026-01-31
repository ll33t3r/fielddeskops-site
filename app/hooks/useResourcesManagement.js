"use client";

import { useCallback, useEffect, useState } from "react";

export default function useResourcesManagement(supabase, options = {}) {
  const {
    includeCrew = true,
    includeFleet = true,
    includeCustomers = true,
    includeRigs = false,
    autoLoad = true,
  } = options;

  const [workers, setWorkers] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rigs, setRigs] = useState([]);

  const loadWorkers = useCallback(async () => {
    if (!includeCrew) return [];
    const { data } = await supabase.from("crew").select("*").order("name");
    if (data) {
      setWorkers(data);
      return data;
    }
    return [];
  }, [includeCrew, supabase]);

  const loadFleet = useCallback(async () => {
    if (!includeFleet) return [];
    const { data } = await supabase.from("fleet").select("*").order("name");
    if (data) {
      setFleet(data);
      return data;
    }
    return [];
  }, [includeFleet, supabase]);

  const loadRigs = useCallback(async () => {
    if (!includeRigs) return [];
    const { data } = await supabase.from("fleet").select("*").order("name");
    if (data) {
      setRigs(data);
      return data;
    }
    return [];
  }, [includeRigs, supabase]);

  const loadCustomers = useCallback(async () => {
    if (!includeCustomers) return [];
    const { data } = await supabase.from("customers").select("*").order("name");
    if (data) {
      setCustomers(data);
      return data;
    }
    return [];
  }, [includeCustomers, supabase]);

  const loadResources = useCallback(async () => {
    const promises = [];
    if (includeCrew) promises.push(loadWorkers());
    if (includeFleet) promises.push(loadFleet());
    if (includeCustomers) promises.push(loadCustomers());
    if (includeRigs) promises.push(loadRigs());
    await Promise.all(promises);
  }, [includeCrew, includeFleet, includeCustomers, includeRigs, loadWorkers, loadFleet, loadCustomers, loadRigs]);

  useEffect(() => {
    if (autoLoad) {
      loadResources();
    }
  }, [autoLoad, loadResources]);

  const addWorker = useCallback(async (newWorker) => {
    if (!newWorker?.name?.trim()) return { data: null, error: null };
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("crew").insert({
      user_id: user.id,
      name: newWorker.name,
      role: newWorker.role || "Tech",
    }).select().single();

    if (data && !error) {
      await loadWorkers();
    }
    return { data, error };
  }, [supabase, loadWorkers]);

  const deleteWorker = useCallback(async (id) => {
    const { error } = await supabase.from("crew").delete().eq("id", id);
    if (!error) {
      await loadWorkers();
    }
    return { error };
  }, [supabase, loadWorkers]);

  const addRig = useCallback(async (newRig) => {
    if (!newRig?.name?.trim()) return { error: null };
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("fleet").insert({
      user_id: user.id,
      name: newRig.name,
      plate_number: newRig.plate || "",
    });
    if (!error) {
      await loadFleet();
    }
    return { error };
  }, [supabase, loadFleet]);

  const deleteRig = useCallback(async (id) => {
    const { error } = await supabase.from("fleet").delete().eq("id", id);
    if (!error) {
      await loadFleet();
    }
    return { error };
  }, [supabase, loadFleet]);

  const addCustomer = useCallback(async (newCustomer) => {
    if (!newCustomer?.name?.trim()) return { error: null };
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("customers").insert({
      user_id: user.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      address: newCustomer.address,
      notes: newCustomer.notes,
    });
    if (!error) {
      await loadCustomers();
    }
    return { error };
  }, [supabase, loadCustomers]);

  const deleteCustomer = useCallback(async (id) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) {
      await loadCustomers();
    }
    return { error };
  }, [supabase, loadCustomers]);

  return {
    workers,
    fleet,
    customers,
    rigs,
    loadWorkers,
    loadFleet,
    loadCustomers,
    loadRigs,
    loadResources,
    addWorker,
    deleteWorker,
    addRig,
    deleteRig,
    addCustomer,
    deleteCustomer,
  };
}
