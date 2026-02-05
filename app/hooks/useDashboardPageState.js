"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveBrain } from "../../hooks/useLiveBrain";
import useDashboardMetrics from "./useDashboardMetrics";
import useJobOperations from "./useJobOperations";
import useResourcesManagement from "./useResourcesManagement";

export default function useDashboardPageState({ supabase, router, setActiveJob }) {
  const { jobs: liveJobs, refresh: refreshBrain } = useLiveBrain();
  const { metrics, alertList, loadMetrics, setJobsCount, dismissAlert } = useDashboardMetrics(supabase);
  const { jobs, setJobs, loadJobs, createJob, updateJob, assignToJob } = useJobOperations(supabase, { autoLoad: false });
  const { fleet, customers, rigs, workers, loadResources } = useResourcesManagement(supabase, { includeRigs: true, autoLoad: false });

  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("HELLO");
  const [quickJobName, setQuickJobName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const inputRef = useRef(null);
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening");
  }, []);

  useEffect(() => {
    if (!liveJobs) return;
    setJobs(liveJobs);
    setJobsCount(liveJobs.filter((job) => job.status === "ACTIVE").length);
    const refreshFromLive = async () => {
      const loadedJobs = await loadJobs();
      if (loadedJobs && loadedJobs.length > 0) {
        setJobsCount(loadedJobs.filter((job) => job.status === "ACTIVE").length);
      }
    };
    refreshFromLive();
  }, [liveJobs, loadJobs, setJobs, setJobsCount]);

  const loadDashboardData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/welcome");
      return;
    }

    await loadMetrics();
    const loadedJobs = await loadJobs();
    if (loadedJobs) {
      setJobsCount(loadedJobs.filter((job) => job.status === "ACTIVE").length);
    }
    await loadResources();
    setLoading(false);
  }, [supabase, router, loadMetrics, loadJobs, loadResources, setJobsCount]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'jobs', currentCount: 0, limit: 0, tier: 'free' });

  const handleCreateJob = useCallback(async () => {
    if (!quickJobName.trim()) return;
    setIsCreating(true);

    const { data, error } = await createJob(quickJobName);
    if (error?.limitReached) {
      setUpgradePromptData({
        resourceType: error.resourceType || 'jobs',
        currentCount: error.currentCount ?? 0,
        limit: error.limit ?? 0,
        tier: error.tier || 'free',
      });
      setShowUpgradePrompt(true);
    } else if (error) {
      alert(error.message || "Error creating job");
    } else if (data) {
      setActiveJob(data);
      setQuickJobName("");
      setShowJobDropdown(false);
      await refreshBrain();
      const loadedJobs = await loadJobs();
      if (loadedJobs) {
        setJobsCount(loadedJobs.filter((job) => job.status === "ACTIVE").length);
      }
    }
    setIsCreating(false);
  }, [quickJobName, createJob, setActiveJob, refreshBrain, loadJobs, setJobsCount]);

  const selectExistingJob = useCallback((job) => {
    setActiveJob(job);
    setQuickJobName("");
    setShowJobDropdown(false);
  }, [setActiveJob]);

  const handleUpdateJob = useCallback(async (id, updates) => {
    const { error } = await updateJob(id, updates);
    if (!error) {
      await refreshBrain();
    }
  }, [updateJob, refreshBrain]);

  const handleAssignToJob = useCallback(async (jobId, field, valueId) => {
    const { error } = await assignToJob(jobId, field, valueId);
    if (!error) {
      await refreshBrain();
    }
  }, [assignToJob, refreshBrain]);

  const refreshJobsData = useCallback(async () => {
    await refreshBrain();
    const loadedJobs = await loadJobs();
    if (loadedJobs) {
      setJobsCount(loadedJobs.filter((job) => job.status === "ACTIVE").length);
    }
  }, [refreshBrain, loadJobs, setJobsCount]);

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 800);
  }, [loadDashboardData]);

  const refreshDashboardData = useCallback(async () => {
    await refreshBrain();
    await loadDashboardData();
  }, [refreshBrain, loadDashboardData]);

  const recentJobs = useMemo(() => {
    if (!jobs) return [];
    const activeJobs = jobs.filter((job) => String(job.status || "").toUpperCase() === "ACTIVE");
    return (activeJobs.length ? activeJobs : jobs).slice(0, 5);
  }, [jobs]);

  return {
    loading,
    greeting,
    quickJobName,
    setQuickJobName,
    isCreating,
    showJobDropdown,
    setShowJobDropdown,
    inputRef,
    showSpeedDial,
    setShowSpeedDial,
    refreshing,
    manualRefresh,
    metrics,
    alertList,
    dismissAlert,
    liveJobs,
    jobs,
    fleet,
    customers,
    rigs,
    workers,
    recentJobs,
    handleCreateJob,
    selectExistingJob,
    handleUpdateJob,
    handleAssignToJob,
    refreshJobsData,
    loadResources,
    refreshDashboardData,
    showUpgradePrompt,
    setShowUpgradePrompt,
    upgradePromptData,
  };
}
