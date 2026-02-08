"use client";

import { useCallback, useEffect, useState } from "react";
import { logError, logWarn } from "../../utils/logger";

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
    try {
      const { data, error } = await supabase
        .from("crew")
        .select("id, user_id, name, role, phone, email, status, created_at, updated_at")
        .order("name");
      if (error) {
        logError("Resources load workers failed", error);
        return [];
      }
      if (data) {
        setWorkers(data);
        return data;
      }
      return [];
    } catch (error) {
      logError("Resources load workers failed", error);
      return [];
    }
  }, [includeCrew, supabase]);

  const loadFleet = useCallback(async () => {
    if (!includeFleet) return [];
    try {
      const { data, error } = await supabase
        .from("fleet")
        .select("id, user_id, name, created_at")
        .order("name");
      if (error) {
        logError("Resources load fleet failed", error);
        return [];
      }
      if (data) {
        setFleet(data);
        return data;
      }
      return [];
    } catch (error) {
      logError("Resources load fleet failed", error);
      return [];
    }
  }, [includeFleet, supabase]);

  const loadRigs = useCallback(async () => {
    if (!includeRigs) return [];
    try {
      const { data, error } = await supabase
        .from("fleet")
        .select("id, user_id, name, created_at")
        .order("name");
      if (error) {
        logError("Resources load rigs failed", error);
        return [];
      }
      if (data) {
        setRigs(data);
        return data;
      }
      return [];
    } catch (error) {
      logError("Resources load rigs failed", error);
      return [];
    }
  }, [includeRigs, supabase]);

  const loadCustomers = useCallback(async () => {
    if (!includeCustomers) return [];
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, user_id, name, phone, email, address, notes, created_at, updated_at")
        .order("name");
      if (error) {
        logError("Resources load customers failed", error);
        return [];
      }
      if (data) {
        setCustomers(data);
        return data;
      }
      return [];
    } catch (error) {
      logError("Resources load customers failed", error);
      return [];
    }
  }, [includeCustomers, supabase]);

  const loadResources = useCallback(async () => {
    try {
      const promises = [];
      if (includeCrew) promises.push(loadWorkers());
      if (includeFleet) promises.push(loadFleet());
      if (includeCustomers) promises.push(loadCustomers());
      if (includeRigs) promises.push(loadRigs());
      await Promise.all(promises);
    } catch (error) {
      logError("Resources load all failed", error);
    }
  }, [includeCrew, includeFleet, includeCustomers, includeRigs, loadWorkers, loadFleet, loadCustomers, loadRigs]);

  useEffect(() => {
    if (autoLoad) {
      loadResources();
    }
  }, [autoLoad, loadResources]);

  const addWorker = useCallback(async (newWorker) => {
    if (!newWorker?.name?.trim()) return { data: null, error: null };
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        logError("Resources add worker missing user", userError, { userData });
        return { data: null, error: userError || new Error("Missing authenticated user") };
      }
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('workers');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          return {
            data: null,
            error: Object.assign(new Error(limitCheck.reason || 'Account locked. Renew to edit.'), {
              readOnly: true,
            }),
          };
        }
        return {
          data: null,
          error: Object.assign(new Error('Limit reached'), {
            limitReached: true,
            resourceType: 'workers',
            currentCount: limitCheck.currentCount,
            limit: limitCheck.limit,
            tier: limitCheck.tier,
          }),
        };
      }
      const { data, error } = await supabase.from("crew").insert({
        user_id: userData.user.id,
        name: newWorker.name,
        role: newWorker.role || "Tech",
      }).select("id, user_id, name, role, phone, email, status, created_at, updated_at").single();

      if (error) return { data: null, error };
      await incrementResourceUsage('workers');
      await loadWorkers();
      return { data, error: null };
    } catch (error) {
      logError("Resources add worker failed", error);
      return { data: null, error };
    }
  }, [supabase, loadWorkers]);

  const deleteWorker = useCallback(async (id) => {
    try {
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        return { error: Object.assign(new Error(access.reason || 'Account locked. Renew to edit.'), { readOnly: access.readOnly }) };
      }
      const { error } = await supabase.from("crew").delete().eq("id", id);
      if (!error) {
        await loadWorkers();
      }
      return { error };
    } catch (error) {
      logError("Resources delete worker failed", error, { id });
      return { error };
    }
  }, [supabase, loadWorkers]);

  const addRig = useCallback(async (newRig) => {
    if (!newRig?.name?.trim()) return { data: null, error: null };
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        logError("Resources add rig missing user", userError, { userData });
        return { data: null, error: userError || new Error("Missing authenticated user") };
      }
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('rigs');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          return {
            data: null,
            error: Object.assign(new Error(limitCheck.reason || 'Account locked. Renew to edit.'), {
              readOnly: true,
            }),
          };
        }
        return {
          data: null,
          error: Object.assign(new Error('Limit reached'), {
            limitReached: true,
            resourceType: 'rigs',
            currentCount: limitCheck.currentCount,
            limit: limitCheck.limit,
            tier: limitCheck.tier,
          }),
        };
      }
      const payload = { user_id: userData.user.id, name: newRig.name };
      const { data, error } = await supabase.from("fleet").insert(payload).select().single();
      if (error) return { data: null, error };
      await incrementResourceUsage('rigs');
      await loadFleet();
      return { data, error: null };
    } catch (error) {
      logError("Resources add rig failed", error);
      return { data: null, error };
    }
  }, [supabase, loadFleet]);

  const deleteRig = useCallback(async (id) => {
    try {
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        return { error: Object.assign(new Error(access.reason || 'Account locked. Renew to edit.'), { readOnly: access.readOnly }) };
      }
      const { error } = await supabase.from("fleet").delete().eq("id", id);
      if (!error) {
        await loadFleet();
      }
      return { error };
    } catch (error) {
      logError("Resources delete rig failed", error, { id });
      return { error };
    }
  }, [supabase, loadFleet]);

  const addCustomer = useCallback(async (newCustomer) => {
    const name = newCustomer?.name?.trim();
    if (!name) return { data: null, error: null };

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      logError("Resources add customer missing user", userError, { userData });
      return { data: null, error: userError || new Error("Missing authenticated user") };
    }

    const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
    const limitCheck = await canCreateResource('customers');
    if (!limitCheck.allowed) {
      if (limitCheck.readOnly) {
        return {
          data: null,
          error: Object.assign(new Error(limitCheck.reason || 'Account locked. Renew to edit.'), {
            readOnly: true,
          }),
        };
      }
      return {
        data: null,
        error: Object.assign(new Error('Limit reached'), {
          limitReached: true,
          resourceType: 'customers',
          currentCount: limitCheck.currentCount,
          limit: limitCheck.limit,
          tier: limitCheck.tier,
        }),
      };
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
      logWarn("Resources add customer missing column", { missingColumn });
      // Drop missing column and retry insert.
      const { [missingColumn]: _removed, ...rest } = payload;
      payload = rest;
      result = await insertCustomer(payload);
      retries += 1;
    }
    const { data, error } = result;

    if (error) {
      logError("Resources add customer failed", error, { payload });
      return { data: null, error };
    }
    await incrementResourceUsage('customers');
    await loadCustomers();
    return { data, error: null };
  }, [supabase, loadCustomers]);

  const deleteCustomer = useCallback(async (id) => {
    try {
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        return { error: Object.assign(new Error(access.reason || 'Account locked. Renew to edit.'), { readOnly: access.readOnly }) };
      }
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (!error) {
        await loadCustomers();
      }
      return { error };
    } catch (error) {
      logError("Resources delete customer failed", error, { id });
      return { error };
    }
  }, [supabase, loadCustomers]);

  const updateCustomer = useCallback(async (id, updates) => {
    if (!id) return { error: null };
    const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
    const access = await getWriteAccessStatus();
    if (!access.allowed) {
      return { error: Object.assign(new Error(access.reason || 'Account locked. Renew to edit.'), { readOnly: access.readOnly }) };
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      logError("Resources update customer missing user", userError, { userData });
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
      logWarn("Resources update customer missing column", { missingColumn });
      const { [missingColumn]: _removed, ...rest } = payload;
      payload = rest;
      result = await updateCustomerRow(payload);
      retries += 1;
    }

    const { data, error } = result;
    if (error) {
      logError("Resources update customer failed", error, { payload, id });
    } else {
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
