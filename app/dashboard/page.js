"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "../utils/supabase/client";
import { useActiveJob } from "../../hooks/useActiveJob";
import useDashboardPageState from "../hooks/useDashboardPageState";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import MetricsBar from "../components/dashboard/MetricsBar";
import AppsGrid from "../components/dashboard/AppsGrid";
import QuickAddMenu from "../components/dashboard/QuickAddMenu";
import ActiveJobsModal from "../components/dashboard/modals/ActiveJobsModal";
import AlertsModal from "../components/dashboard/modals/AlertsModal";
import AssignResourcesModal from "../components/dashboard/modals/AssignResourcesModal";
import Dock from "../components/dashboard/Dock";
import SettingsPanel from "../components/dashboard/panels/SettingsPanel";
import WorkersPanel from "../components/dashboard/panels/WorkersPanel";
import FleetPanel from "../components/dashboard/panels/FleetPanel";
import PhoneBookPanel from "../components/dashboard/panels/PhoneBookPanel";
import JobSelector from "../components/shared/JobSelector";
import QuickEstimateModal from "../components/dashboard/quickadd/QuickEstimateModal";
import QuickInventoryModal from "../components/dashboard/quickadd/QuickInventoryModal";
import QuickToolModal from "../components/dashboard/quickadd/QuickToolModal";
import QuickPhotoModal from "../components/dashboard/quickadd/QuickPhotoModal";
import JobHistory from "../components/JobHistory";
import UpgradePrompt from "@/components/UpgradePrompt";
import SubscriptionBanner from "../components/shared/SubscriptionBanner";
import Toast from "../components/shared/Toast";
import Link from "next/link";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      router.replace('/auth/login?message=Please sign in again.');
      return;
    }
  }, [supabase, router]);

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6700]" />
      </div>
    );
  }
  const searchParams = useSearchParams();
  const { activeJob, setActiveJob, syncActiveJob } = useActiveJob();

  const [toast, setToast] = useState(null);
  const [showActiveJobsModal, setShowActiveJobsModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [assigningJob, setAssigningJob] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [privacyMode, setPrivacyMode] = useState(true);
  const [showQuickEstimate, setShowQuickEstimate] = useState(false);
  const [showQuickInventory, setShowQuickInventory] = useState(false);
  const [showQuickTool, setShowQuickTool] = useState(false);
  const [showQuickPhoto, setShowQuickPhoto] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showWorkersPanel, setShowWorkersPanel] = useState(false);
  const [showFleetPanel, setShowFleetPanel] = useState(false);
  const [showPhoneBookPanel, setShowPhoneBookPanel] = useState(false);
  const [showPhoneBookPanelAddMode, setShowPhoneBookPanelAddMode] = useState(false);
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [showJobHistory, setShowJobHistory] = useState(false);

  const {
    loading,
    greeting,
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
    showUpgradePrompt,
    setShowUpgradePrompt,
    upgradePromptData,
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

  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      setToast({
        message: "Subscription activated. You are now on Pro.",
        type: "success",
      });
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const isPanelOpen = showSettingsPanel || showWorkersPanel || showFleetPanel || showPhoneBookPanel;
    if (!isPanelOpen) return undefined;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow || "";
    };
  }, [showSettingsPanel, showWorkersPanel, showFleetPanel, showPhoneBookPanel]);


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
    try {
      await supabase.auth.signOut({ scope: "global" });
    } finally {
      // Extra cleanup to avoid stale browser-auth state after logout.
      if (typeof window !== "undefined") {
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith("sb-"))
          .forEach((key) => window.localStorage.removeItem(key));
      }
      router.replace("/auth/login");
      router.refresh();
    }
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
      <SubscriptionBanner />
      <Toast toast={toast} onClose={() => setToast(null)} />
      {showUpgradePrompt && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          resourceType={upgradePromptData.resourceType}
          currentCount={upgradePromptData.currentCount}
          limit={upgradePromptData.limit}
          tier={upgradePromptData.tier}
        />
      )}
      <DashboardHeader
        greeting={greeting}
        onOpenJobHistory={() => setShowJobHistory(true)}
      />

      <div className="px-4 sm:px-6 mb-3">
        <JobSelector />
      </div>

      <div className="px-4 sm:px-6 pb-3 shrink-0">
          <MetricsBar
          metrics={metrics}
          privacyMode={privacyMode}
          formatCurrency={formatCurrency}
          onTogglePrivacyMode={togglePrivacyMode}
          onOpenActiveJobsModal={() => setShowActiveJobsModal(true)}
          onOpenAlertsModal={() => metrics.alerts > 0 ? setShowAlertsModal(true) : alert("No system alerts!")}
        />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="w-full flex items-center justify-center pb-16 sm:pb-32">
          <AppsGrid activeJob={activeJob} />
        </div>
      </main>

      <div className="pb-4 text-center shrink-0 space-y-2">
        <p className="text-[9px] font-bold uppercase tracking-widest">
          <span className="text-[var(--text-sub)] opacity-40">POWERED BY </span>
          <span className="text-[#FF6700]">FIELDDESKOPS</span>
        </p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <Link href="/legal/terms?from=%2Fdashboard" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors">
            Terms
          </Link>
          <Link href="/legal/privacy?from=%2Fdashboard" className="text-[var(--text-sub)] hover:text-[#FF6700] transition-colors">
            Privacy
          </Link>
        </div>
      </div>

      <QuickAddMenu
        isOpen={showQuickAddMenu}
        onClose={() => setShowQuickAddMenu(false)}
        onActionSelect={(actionType) => {
          if (actionType === "new-estimate") setShowQuickEstimate(true);
          if (actionType === "take-photo") setShowQuickPhoto(true);
          if (actionType === "add-inventory") setShowQuickInventory(true);
          if (actionType === "add-tool") setShowQuickTool(true);
          if (actionType === "new-contract") router.push("/apps/signoff");
          if (actionType === "add-customer") {
            setShowPhoneBookPanel(true);
            setShowPhoneBookPanelAddMode(true);
          }
          if (actionType === "add-worker") setShowWorkersPanel(true);
          if (actionType === "add-rig") setShowFleetPanel(true);
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
          onMarkComplete: (jobId) => handleUpdateJob(jobId, { status: "COMPLETED", completed_at: new Date().toISOString() }),
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

      <Dock
        onButtonClick={(type) => {
          if (type === "settings") setShowSettingsPanel(true);
          if (type === "workers") setShowWorkersPanel(true);
          if (type === "fleet") setShowFleetPanel(true);
          if (type === "phonebook") {
            setShowPhoneBookPanelAddMode(false);
            setShowPhoneBookPanel(true);
          }
          if (type === "quickadd") setShowQuickAddMenu(true);
        }}
      />

      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        privacyMode={privacyMode}
        onTogglePrivacyMode={togglePrivacyMode}
        onLogout={handleLogout}
      />
      <WorkersPanel
        isOpen={showWorkersPanel}
        onClose={() => setShowWorkersPanel(false)}
        supabase={supabase}
        onResourcesUpdated={loadResources}
      />
      <FleetPanel
        isOpen={showFleetPanel}
        onClose={() => setShowFleetPanel(false)}
        supabase={supabase}
        onResourcesUpdated={loadResources}
      />
      <PhoneBookPanel
        isOpen={showPhoneBookPanel}
        onClose={() => {
          setShowPhoneBookPanel(false);
          setShowPhoneBookPanelAddMode(false);
        }}
        supabase={supabase}
        onResourcesUpdated={loadResources}
        onSelectCustomer={() => {}}
        startInAddMode={showPhoneBookPanelAddMode}
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

      <JobHistory
        isOpen={showJobHistory}
        onClose={() => setShowJobHistory(false)}
        onReopen={(job) => {
          setActiveJob({ ...job, status: "ACTIVE", completed_at: null });
        }}
      />
    </div>
  );
}
