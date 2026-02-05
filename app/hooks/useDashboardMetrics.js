"use client";

import { useCallback, useState } from "react";
import { logError } from "../../utils/logger";

export default function useDashboardMetrics(supabase) {
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, alerts: 0 });
  const [alertList, setAlertList] = useState([]);

  const loadMetrics = useCallback(async () => {
    try {
      const { data: bids, error: bidsError } = await supabase
        .from("estimates")
        .select("total_price, jobs!inner(status)")
        .eq("jobs.status", "ACTIVE");
      if (bidsError) {
        logError("Dashboard metrics revenue failed", bidsError);
      }
      const revenue = bids ? bids.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0) : 0;

      // Only show low-stock alerts for inventory in existing rigs (fleet).
      // Orphaned rows (e.g. after rig delete) or stale data are ignored.
      const { data: fleetRows, error: fleetError } = await supabase
        .from("fleet")
        .select("id");
      if (fleetError) {
        logError("Dashboard metrics fleet failed", fleetError);
      }
      const fleetIds = fleetRows?.map((r) => r.id) ?? [];
      let stockAlerts = [];
      if (fleetIds.length > 0) {
        const { data: inventory, error: inventoryError } = await supabase
          .from("inventory")
          .select("id, name, quantity, min_quantity, rig_id")
          .in("rig_id", fleetIds);
        if (inventoryError) {
          logError("Dashboard metrics inventory failed", inventoryError);
        }
        const minQty = (i) => i.min_quantity != null ? Number(i.min_quantity) : 0;
        stockAlerts = (inventory ?? [])
          .filter((i) => Number(i.quantity) < minQty(i))
          .map((i) => ({
            id: "stock-" + (i.id ?? Math.random()),
            type: "STOCK",
            title: "LOW STOCK",
            msg: `${i.name}: ${i.quantity} / ${i.min_quantity ?? 0}`,
            color: "text-red-500",
            bg: "bg-red-500/10",
            border: "border-red-500",
          }));
      }

      setAlertList(stockAlerts);
      setMetrics((prev) => ({ ...prev, revenue, alerts: stockAlerts.length }));
    } catch (error) {
      logError("Dashboard metrics load failed", error);
    }
  }, [supabase]);

  const setJobsCount = useCallback((count) => {
    setMetrics((prev) => ({ ...prev, jobs: count }));
  }, []);

  const dismissAlert = useCallback((index) => {
    setAlertList((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      setMetrics((metricsPrev) => ({ ...metricsPrev, alerts: next.length }));
      return next;
    });
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlertList([]);
    setMetrics((prev) => ({ ...prev, alerts: 0 }));
  }, []);

  return {
    metrics,
    alertList,
    loadMetrics,
    setJobsCount,
    dismissAlert,
    clearAllAlerts,
  };
}
