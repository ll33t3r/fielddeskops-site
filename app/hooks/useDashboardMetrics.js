"use client";

import { useCallback, useState } from "react";

export default function useDashboardMetrics(supabase) {
  const [metrics, setMetrics] = useState({ revenue: 0, jobs: 0, alerts: 0 });
  const [alertList, setAlertList] = useState([]);

  const loadMetrics = useCallback(async () => {
    const { data: bids } = await supabase
      .from("estimates")
      .select("total_price, jobs!inner(status)")
      .eq("jobs.status", "ACTIVE");
    const revenue = bids ? bids.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0) : 0;

    const { data: inventory } = await supabase.from("inventory").select("name, quantity, min_quantity");
    const stockAlerts = inventory?.filter((i) => i.quantity < i.min_quantity).map((i) => ({
      id: "stock-" + Math.random(),
      type: "STOCK",
      title: "LOW STOCK",
      msg: `${i.name}: ${i.quantity} / ${i.min_quantity}`,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500",
    })) || [];

    setAlertList(stockAlerts);
    setMetrics((prev) => ({ ...prev, revenue, alerts: stockAlerts.length }));
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
