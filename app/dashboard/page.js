"use client";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { useActiveJob } from "../../hooks/useActiveJob";
import useDashboardPageState from "../hooks/useDashboardPageState";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import MetricsBar from "../components/dashboard/MetricsBar";
import AppsGrid from "../components/dashboard/AppsGrid";
import SpeedDial from "../components/dashboard/SpeedDial";
import ActiveJobsModal from "../components/dashboard/modals/ActiveJobsModal";
import AlertsModal from "../components/dashboard/modals/AlertsModal";
import AssignResourcesModal from "../components/dashboard/modals/AssignResourcesModal";
import HamburgerMenu from "../components/dashboard/HamburgerMenu";
import JobSelector from "../components/shared/JobSelector";
import QuickEstimateModal from "../components/dashboard/quickadd/QuickEstimateModal";
import QuickInventoryModal from "../components/dashboard/quickadd/QuickInventoryModal";
import QuickToolModal from "../components/dashboard/quickadd/QuickToolModal";
import QuickPhotoModal from "../components/dashboard/quickadd/QuickPhotoModal";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { activeJob, setActiveJob, syncActiveJob } = useActiveJob();

  const [showHamburger, setShowHamburger] = useState(false);
  const [showActiveJobsModal, setShowActiveJobsModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [assigningJob, setAssigningJob] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [privacyMode, setPrivacyMode] = useState(true);
  const [showQuickEstimate, setShowQuickEstimate] = useState(false);
  const [showQuickInventory, setShowQuickInventory] = useState(false);
  const [showQuickTool, setShowQuickTool] = useState(false);
  const [showQuickPhoto, setShowQuickPhoto] = useState(false);

  const {
    loading,
    greeting,
    showSpeedDial,
    setShowSpeedDial,
    refreshing,
    manualRefresh,
    metrics,
    alertList,
    dismissAlert,
    jobs,
    fleet,
    customers,
    rigs,
    workers,
    handleUpdateJob,
    handleAssignToJob,
    refreshJobsData,
    loadResources,
    refreshDashboardData,
  } = useDashboardPageState({ supabase, router, setActiveJob });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedPrivacy = localStorage.getItem("privacyMode");
    if (savedPrivacy !== null) {
      setPrivacyMode(savedPrivacy === "true");
    }
  }, []);

  useEffect(() => {
    syncActiveJob();
  }, [syncActiveJob]);


  const formatCurrency = (val) => {
    if (privacyMode) return "****";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  const togglePrivacyMode = () => {
    const newMode = !privacyMode;
    setPrivacyMode(newMode);
    localStorage.setItem("privacyMode", newMode.toString());
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  const handleQuickAddSaved = async () => {
    await refreshDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6700]" size={40} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] font-inter overflow-hidden flex flex-col relative selection:bg-[#FF6700] selection:text-black transition-colors">
      <DashboardHeader
        greeting={greeting}
        onOpenHamburger={() => setShowHamburger(true)}
      />

      <div className="px-6 mb-3">
        <JobSelector />
      </div>

      <div className="px-6 pb-3 shrink-0">
          <MetricsBar
          metrics={metrics}
          privacyMode={privacyMode}
          formatCurrency={formatCurrency}
          onTogglePrivacyMode={togglePrivacyMode}
          onOpenActiveJobsModal={() => setShowActiveJobsModal(true)}
          onOpenAlertsModal={() => metrics.alerts > 0 ? setShowAlertsModal(true) : alert("No system alerts!")}
        />
      </div>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <AppsGrid activeJob={activeJob} />
      </main>

      <div className="pb-4 text-center shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest">
          <span className="text-[var(--text-sub)] opacity-40">POWERED BY </span>
          <span className="text-[#FF6700]">FIELDDESKOPS</span>
        </p>
      </div>

      <SpeedDial
        isOpen={showSpeedDial}
        onToggle={() => setShowSpeedDial(!showSpeedDial)}
        activeJob={activeJob}
        onQuickEstimate={() => {
          setShowSpeedDial(false);
          setShowQuickEstimate(true);
        }}
        onQuickInventory={() => {
          setShowSpeedDial(false);
          setShowQuickInventory(true);
        }}
        onQuickTool={() => {
          setShowSpeedDial(false);
          setShowQuickTool(true);
        }}
        onQuickPhoto={() => {
          setShowSpeedDial(false);
          setShowQuickPhoto(true);
        }}
      />

      <ActiveJobsModal
        isOpen={showActiveJobsModal}
        onClose={() => setShowActiveJobsModal(false)}
        data={{
          jobs: jobs.filter((job) => job.status === "ACTIVE"),
          jobsCount: metrics.jobs,
          onSelectJob: (job) => {
            setActiveJob(job);
            setShowActiveJobsModal(false);
          },
          onMarkComplete: (jobId) => handleUpdateJob(jobId, { status: "COMPLETED" }),
        }}
      />

      <AlertsModal
        isOpen={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
        data={{
          alertList,
          onDismissAlert: (index) => dismissAlert(index),
        }}
      />

      <HamburgerMenu
        isOpen={showHamburger}
        onClose={() => setShowHamburger(false)}
        supabase={supabase}
        activeJob={activeJob}
        rigs={rigs}
        workers={workers}
        onSelectJob={(job) => {
          setActiveJob(job);
          setShowHamburger(false);
        }}
        onAssignResources={(job) => {
          setAssigningJob(job);
          setShowHamburger(false);
        }}
        onJobsUpdated={refreshJobsData}
        onResourcesUpdated={loadResources}
        theme={theme}
        onToggleTheme={toggleTheme}
        onManualRefresh={manualRefresh}
        refreshing={refreshing}
        onLogout={handleLogout}
      />

      <AssignResourcesModal
        isOpen={Boolean(assigningJob)}
        onClose={() => setAssigningJob(null)}
        data={{
          assigningJob,
          customers,
          fleet,
          rigs,
          workers,
          onAssign: handleAssignToJob,
        }}
      />

      <QuickEstimateModal
        isOpen={showQuickEstimate}
        onClose={() => setShowQuickEstimate(false)}
        activeJob={activeJob}
        onSaved={handleQuickAddSaved}
      />
      <QuickInventoryModal
        isOpen={showQuickInventory}
        onClose={() => setShowQuickInventory(false)}
        activeJob={activeJob}
        onSaved={handleQuickAddSaved}
      />
      <QuickToolModal
        isOpen={showQuickTool}
        onClose={() => setShowQuickTool(false)}
        activeJob={activeJob}
        onSaved={handleQuickAddSaved}
      />
      <QuickPhotoModal
        isOpen={showQuickPhoto}
        onClose={() => setShowQuickPhoto(false)}
        activeJob={activeJob}
        onSaved={handleQuickAddSaved}
      />
    </div>
  );
}
