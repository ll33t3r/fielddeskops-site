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
    const name = newCustomer?.name?.trim();
    if (!name) return { error: null };

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      console.log("Add customer failed: missing user", { userError, userData });
      return { error: userError || new Error("Missing authenticated user") };
    }

    let payload = {
      user_id: userData.user.id,
      name,
      phone: newCustomer.phone?.trim() || null,
      email: newCustomer.email?.trim() || null,
      address: newCustomer.address?.trim() || null,
      notes: newCustomer.notes?.trim() || null,
    };

    const insertCustomer = async (data) => supabase
      .from("customers")
      .insert(data)
      .select()
      .single();

    let result = await insertCustomer(payload);
    let retries = 0;
    while (result.error && retries < 4) {
      const message = result.error?.message || "";
      const match = message.match(/column "(.*)" of relation "customers" does not exist/i);
      if (!match) break;
      const missingColumn = match[1];
      if (!Object.prototype.hasOwnProperty.call(payload, missingColumn)) break;
      console.log("Add customer retry: missing column", missingColumn);
      // Drop missing column and retry insert.
      const { [missingColumn]: _removed, ...rest } = payload;
      payload = rest;
      result = await insertCustomer(payload);
      retries += 1;
    }
    const { data, error } = result;

    if (error) {
      console.log("Add customer insert failed", { error, payload });
    } else {
      console.log("Add customer success", data);
      await loadCustomers();
    }
    return { data, error };
  }, [supabase, loadCustomers]);

  const deleteCustomer = useCallback(async (id) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (!error) {
      await loadCustomers();
    }
    return { error };
  }, [supabase, loadCustomers]);

  const updateCustomer = useCallback(async (id, updates) => {
    if (!id) return { error: null };
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      console.log("Update customer failed: missing user", { userError, userData });
      return { error: userError || new Error("Missing authenticated user") };
    }

    let payload = {
      name: updates?.name?.trim() || null,
      phone: updates?.phone?.trim() || null,
      email: updates?.email?.trim() || null,
      address: updates?.address?.trim() || null,
      notes: updates?.notes?.trim() || null,
    };

    const updateCustomerRow = async (data) => supabase
      .from("customers")
      .update(data)
      .eq("id", id)
      .eq("user_id", userData.user.id)
      .select()
      .single();

    let result = await updateCustomerRow(payload);
    let retries = 0;
    while (result.error && retries < 4) {
      const message = result.error?.message || "";
      const match = message.match(/column "(.*)" of relation "customers" does not exist/i);
      if (!match) break;
      const missingColumn = match[1];
      if (!Object.prototype.hasOwnProperty.call(payload, missingColumn)) break;
      console.log("Update customer retry: missing column", missingColumn);
      const { [missingColumn]: _removed, ...rest } = payload;
      payload = rest;
      result = await updateCustomerRow(payload);
      retries += 1;
    }

    const { data, error } = result;
    if (error) {
      console.log("Update customer failed", { error, payload, id });
    } else {
      console.log("Update customer success", data);
      await loadCustomers();
    }
    return { data, error };
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
    updateCustomer,
  };
}
