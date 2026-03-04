"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";
import { 
  Trash2, Save, FileText, Menu, X, ArrowLeft, Plus, Loader2, 
  Lock, ChevronDown, Box, Clock, 
  Eye, EyeOff, Search
} from "lucide-react";
import Link from "next/link";
import JobSelector from "../../components/shared/JobSelector";
import Toast from "../../components/shared/Toast";
import FormField from "../../components/shared/FormField";
import SubscriptionBanner from "../../components/shared/SubscriptionBanner";
import { buildFieldErrors, inRange, isNumber, isRequired, roundCurrency } from "../../utils/validation";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { logError } from "../../../utils/logger";
import UpgradePrompt from "@/components/UpgradePrompt";
import { track } from "@vercel/analytics";

export default function ProfitLock() {
  const supabase = createClient();
  const { activeJob, setActiveJob, syncActiveJob } = useActiveJob();
  const isOnline = useOnlineStatus();
  
  const [allJobs, setAllJobs] = useState([]);
  const [estimateHistory, setEstimateHistory] = useState([]); 
  const [customer, setCustomer] = useState(null);

  const [mode, setMode] = useState("SIMPLE");
  
  const [profitMethod, setProfitMethod] = useState("MARKUP");
  const [profitLocked, setProfitLocked] = useState(true);
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  const [discountType, setDiscountType] = useState("DOLLAR");
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const [showMethodDetails, setShowMethodDetails] = useState(false);
  
  const [simpleMaterials, setSimpleMaterials] = useState(""); 
  const [simpleHours, setSimpleHours] = useState("");
  
  const [lineItems, setLineItems] = useState([
      { id: 1, description: "Materials", quantity: "", unit_cost: "" },
      { id: 2, description: "Labor", quantity: "", unit_cost: "" }
  ]); 

  const [hourlyRate, setHourlyRate] = useState(100);
  const [targetValue, setTargetValue] = useState(50);
  const [taxRate, setTaxRate] = useState(8.5);
  const [includeTax, setIncludeTax] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("DUE_ON_RECEIPT");
  const [quoteValidDays, setQuoteValidDays] = useState(30);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showProfitDetails, setShowProfitDetails] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [savingEstimate, setSavingEstimate] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [menuTab, setMenuTab] = useState("PROFIT");
  
  const [showJobSelect, setShowJobSelect] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'resources', currentCount: 0, limit: 0, tier: 'free' });
  const [hasHydrated, setHasHydrated] = useState(false);
  const [jobCostEstimate, setJobCostEstimate] = useState({
    labor: "",
    materials: "",
    subcontractors: "",
    overhead: "",
  });
  const [jobCostEntries, setJobCostEntries] = useState([]);
  const [jobCostForm, setJobCostForm] = useState({
    category: "labor",
    amount: "",
    enteredBy: "",
    note: "",
  });
  const [savingJobCostEstimate, setSavingJobCostEstimate] = useState(false);
  const [savingJobCostEntry, setSavingJobCostEntry] = useState(false);
  const [loadingJobCosting, setLoadingJobCosting] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem("fdo_first_app_opened")) {
        track("first_app_opened", { app: "profitlock" });
        sessionStorage.setItem("fdo_first_app_opened", "1");
      }
    } catch {
      // noop
    }
  }, []);

  const JOB_COST_CATEGORIES = [
    { key: "labor", label: "Labor" },
    { key: "materials", label: "Materials" },
    { key: "subcontractors", label: "Subcontractors" },
    { key: "overhead", label: "Overhead" },
  ];

  useEffect(() => { 
      loadData(); 
      loadSettings();
      const savedMode = localStorage.getItem("profitlock_mode");
      if (savedMode === "SIMPLE" || savedMode === "ADVANCED") {
        setMode(savedMode);
      }
      const savedDiscountType = localStorage.getItem("profitlock_discount_type");
      if (savedDiscountType === "DOLLAR" || savedDiscountType === "PERCENT") {
        setDiscountType(savedDiscountType);
      }
      setHasHydrated(true);
  }, []);

  useEffect(() => {
    syncActiveJob();
  }, [syncActiveJob]);

  useEffect(() => {
    if (activeJob?.customer_id) {
      loadCustomer(activeJob.customer_id);
    } else {
      setCustomer(null);
    }
  }, [activeJob]);

  useEffect(() => {
    if (showMenu || showJobSelect) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showMenu, showJobSelect]);

  useEffect(() => {
    localStorage.setItem("profitlock_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("profitlock_discount_type", discountType);
  }, [discountType]);

  const loadSettings = () => {
      const saved = localStorage.getItem("profitlock_config");
      if (saved) {
          const config = JSON.parse(saved);
          setHourlyRate(config.hourlyRate || 100);
          setTargetValue(config.targetValue || 50);
          setProfitMethod(config.profitMethod || "MARKUP");
          setTaxRate(config.taxRate || 8.5);
          setIncludeTax(config.includeTax || false);
          setPaymentTerms(config.paymentTerms || "DUE_ON_RECEIPT");
          setQuoteValidDays(config.quoteValidDays || 30);
      }
  };

  const saveSettings = () => {
      const config = {
          hourlyRate,
          targetValue,
          profitMethod,
          taxRate,
          includeTax,
          paymentTerms,
          quoteValidDays
      };
      localStorage.setItem("profitlock_config", JSON.stringify(config));
  };

  useEffect(() => {
    saveSettings();
  }, [hourlyRate, targetValue, profitMethod, taxRate, includeTax, paymentTerms, quoteValidDays]);

  const resetJobCostingState = () => {
    setJobCostEstimate({
      labor: "",
      materials: "",
      subcontractors: "",
      overhead: "",
    });
    setJobCostEntries([]);
    setJobCostForm({
      category: "labor",
      amount: "",
      enteredBy: "",
      note: "",
    });
    setLoadingJobCosting(false);
  };

  const loadJobCosting = async (jobId) => {
    if (!jobId) {
      resetJobCostingState();
      return;
    }

    setLoadingJobCosting(true);
    try {
      const [
        estimateRes,
        entriesRes,
      ] = await Promise.all([
        supabase
          .from("job_cost_estimates")
          .select("labor_estimate, materials_estimate, subcontractors_estimate, overhead_estimate")
          .eq("job_id", jobId)
          .maybeSingle(),
        supabase
          .from("job_cost_entries")
          .select("id, category, amount, note, entered_by, incurred_at, created_at")
          .eq("job_id", jobId)
          .order("incurred_at", { ascending: false })
          .limit(100),
      ]);

      if (estimateRes.error) {
        logError("ProfitLock job cost estimate fetch failed", estimateRes.error, { jobId });
      } else {
        const estimate = estimateRes.data;
        setJobCostEstimate({
          labor: estimate?.labor_estimate != null ? String(estimate.labor_estimate) : "",
          materials: estimate?.materials_estimate != null ? String(estimate.materials_estimate) : "",
          subcontractors: estimate?.subcontractors_estimate != null ? String(estimate.subcontractors_estimate) : "",
          overhead: estimate?.overhead_estimate != null ? String(estimate.overhead_estimate) : "",
        });
      }

      if (entriesRes.error) {
        logError("ProfitLock job cost entries fetch failed", entriesRes.error, { jobId });
      } else {
        setJobCostEntries(entriesRes.data || []);
      }
    } catch (error) {
      logError("ProfitLock job costing load failed", error, { jobId });
    } finally {
      setLoadingJobCosting(false);
    }
  };

  useEffect(() => {
    if (activeJob?.id) {
      loadJobCosting(activeJob.id);
    } else {
      resetJobCostingState();
    }
  }, [activeJob?.id]);

  useEffect(() => {
    if (!activeJob?.id) return undefined;

    const channel = supabase
      .channel(`profitlock-job-costing-${activeJob.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_cost_entries", filter: `job_id=eq.${activeJob.id}` },
        () => {
          loadJobCosting(activeJob.id);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_cost_estimates", filter: `job_id=eq.${activeJob.id}` },
        () => {
          loadJobCosting(activeJob.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJob?.id]);

  const loadCustomer = async (customerId) => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email, address, notes")
        .eq("id", customerId)
        .single();
      if (error) {
        showToast("Unable to load customer details.", "error");
        logError("ProfitLock customer fetch failed", error, { customerId });
        return;
      }
      setCustomer(data);
    } catch (error) {
      showToast("Unable to load customer details.", "error");
      logError("ProfitLock customer fetch failed", error, { customerId });
    }
  };

  const loadData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        if (userError) logError("ProfitLock auth check failed", userError);
        return;
      }

      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, status, customer_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (jobsError) {
        showToast("Failed to load jobs. Please try again.", "error");
        logError("ProfitLock jobs fetch failed", jobsError);
      } else {
        setAllJobs(jobs || []);
      }

      const { data: est, error: estError } = await supabase
        .from("estimates")
        .select("id, total_price, created_at, jobs(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (estError) {
        showToast("Failed to load estimates. Please try again.", "error");
        logError("ProfitLock estimates fetch failed", estError);
      } else {
        setEstimateHistory(est || []);
      }
    } catch (error) {
      showToast("Failed to load ProfitLock data. Please try again.", "error");
      logError("ProfitLock data fetch failed", error);
    }
  };

  const handleCreateJob = async () => {
    const errors = buildFieldErrors({
      title: [{ isValid: isRequired(newJobTitle), message: "Please enter a job title." }],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, newJob: errors }));
      showToast("Please enter a job title.", "error");
      return;
    }

    if (!isOnline) {
      showToast("You're offline. Reconnect to create a job.", "error");
      return;
    }

    setSavingJob(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showToast("Please log in to create a job.", "error");
        if (authError) logError("ProfitLock auth failed", authError);
        return;
      }
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const jobLimitCheck = await canCreateResource('jobs');
      if (!jobLimitCheck.allowed) {
        if (jobLimitCheck.readOnly) {
          showToast(jobLimitCheck.reason || "Account locked. Renew to edit.", "error");
          return;
        }
        setUpgradePromptData({ resourceType: 'jobs', currentCount: jobLimitCheck.currentCount, limit: jobLimitCheck.limit, tier: jobLimitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }
      const { data: job, error } = await supabase.from("jobs").insert({
        user_id: user.id,
        title: newJobTitle.trim(),
        status: "ACTIVE"
      }).select("id, title, status, customer_id, created_at").single();

      if (error) {
        showToast("Failed to create job. Please try again.", "error");
        logError("ProfitLock job create failed", error);
        return;
      }
      await incrementResourceUsage('jobs');
      setActiveJob(job);
      setAllJobs([job, ...allJobs]);
      setNewJobTitle("");
      setShowCreateJob(false);
      setShowJobSelect(false);
      setFormErrors((prev) => ({ ...prev, newJob: {} }));
      showToast("Job created successfully!", "success");
    } catch (error) {
      showToast("Failed to create job. Please try again.", "error");
      logError("ProfitLock job create failed", error);
    } finally {
      setSavingJob(false);
    }
  };


  const filteredJobs = allJobs.filter(j => 
    j.title?.toLowerCase().includes(jobSearch.toLowerCase()) &&
    (j.status === "ACTIVE" || j.status === "PENDING")
  );

  const getJobCostEstimateValue = (key) => {
    return roundCurrency(parseFloat(jobCostEstimate[key]) || 0);
  };

  const handleSaveJobCostEstimate = async () => {
    if (!activeJob?.id) {
      showToast("Select a job before saving job costs.", "error");
      return;
    }
    if (!isOnline) {
      showToast("You're offline. Reconnect to save.", "error");
      return;
    }

    setSavingJobCostEstimate(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        showToast("Please log in to save job costs.", "error");
        if (userError) logError("ProfitLock job cost auth failed", userError);
        return;
      }
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        showToast(access.reason || "Account locked. Renew to edit.", "error");
        return;
      }

      const laborEstimate = getJobCostEstimateValue("labor");
      const materialsEstimate = getJobCostEstimateValue("materials");
      const subcontractorsEstimate = getJobCostEstimateValue("subcontractors");
      const overheadEstimate = getJobCostEstimateValue("overhead");
      const totalEstimate = roundCurrency(
        laborEstimate + materialsEstimate + subcontractorsEstimate + overheadEstimate
      );

      const { error } = await supabase
        .from("job_cost_estimates")
        .upsert({
          user_id: user.id,
          job_id: activeJob.id,
          labor_estimate: laborEstimate,
          materials_estimate: materialsEstimate,
          subcontractors_estimate: subcontractorsEstimate,
          overhead_estimate: overheadEstimate,
          total_estimate: totalEstimate,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,job_id" });

      if (error) {
        showToast("Failed to save job budget.", "error");
        logError("ProfitLock job cost estimate save failed", error, { jobId: activeJob.id });
        return;
      }

      showToast("Job budget saved.", "success");
      await loadJobCosting(activeJob.id);
    } catch (error) {
      showToast("Failed to save job budget.", "error");
      logError("ProfitLock job cost estimate save failed", error, { jobId: activeJob?.id });
    } finally {
      setSavingJobCostEstimate(false);
    }
  };

  const handleAddJobCostEntry = async () => {
    if (!activeJob?.id) {
      showToast("Select a job before logging costs.", "error");
      return;
    }
    if (!isOnline) {
      showToast("You're offline. Reconnect to save.", "error");
      return;
    }
    if (!inRange(jobCostForm.amount, 0, 100000000)) {
      showToast("Enter a valid actual cost amount.", "error");
      return;
    }

    setSavingJobCostEntry(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        showToast("Please log in to save job costs.", "error");
        if (userError) logError("ProfitLock job cost auth failed", userError);
        return;
      }
      const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
      const access = await getWriteAccessStatus();
      if (!access.allowed) {
        showToast(access.reason || "Account locked. Renew to edit.", "error");
        return;
      }

      const { error } = await supabase.from("job_cost_entries").insert({
        user_id: user.id,
        job_id: activeJob.id,
        category: jobCostForm.category,
        amount: roundCurrency(parseFloat(jobCostForm.amount) || 0),
        entered_by: jobCostForm.enteredBy?.trim() || null,
        note: jobCostForm.note?.trim() || null,
        incurred_at: new Date().toISOString(),
      });

      if (error) {
        showToast("Failed to log actual cost.", "error");
        logError("ProfitLock job cost entry save failed", error, { jobId: activeJob.id });
        return;
      }

      setJobCostForm((prev) => ({
        ...prev,
        amount: "",
        note: "",
      }));
      showToast("Actual cost logged.", "success");
      await loadJobCosting(activeJob.id);
    } catch (error) {
      showToast("Failed to log actual cost.", "error");
      logError("ProfitLock job cost entry save failed", error, { jobId: activeJob?.id });
    } finally {
      setSavingJobCostEntry(false);
    }
  };

  /**
   * ProfitLock totals (all currency rounded to 2 decimals).
   * - Subtotal: SIMPLE = materials + (hours × hourlyRate); ADVANCED = sum of (qty × unit_cost) per line.
   * - Discount: dollar or % of subtotal, capped at subtotal so cost ≥ 0.
   * - Cost: subtotal − discount.
   * - Markup: price = cost × (1 + target% / 100).
   * - Margin: price = cost / (1 − target%/100), with target% capped at 99.99% to avoid division by zero.
   * - Profit = price − cost. Display margin = (profit / price) × 100 when price > 0.
   * - Tax = price × (taxRate/100) when includeTax; total = price + tax.
   */
  const calculateTotals = () => {
    let subtotal = 0;

    if (mode === "SIMPLE") {
        const mat = parseFloat(simpleMaterials) || 0;
        const labor = (parseFloat(simpleHours) || 0) * hourlyRate;
        subtotal = mat + labor;
    } else {
        lineItems.forEach(item => {
            const itemCost = (parseFloat(item.unit_cost) || 0) * (parseFloat(item.quantity) || 0);
            subtotal += itemCost;
        });
    }
    subtotal = roundCurrency(subtotal);

    let discount = 0;
    if (showDiscount && parseFloat(discountAmount)) {
      if (discountType === "DOLLAR") {
        discount = parseFloat(discountAmount);
      } else {
        discount = subtotal * (parseFloat(discountAmount) / 100);
      }
      discount = roundCurrency(Math.min(discount, subtotal));
    }
    const cost = roundCurrency(subtotal - discount);

    let price = 0;
    if (profitMethod === "MARKUP") {
      price = cost * (1 + targetValue / 100);
    } else {
      const marginDecimal = Math.min(targetValue / 100, 0.9999);
      price = cost / (1 - marginDecimal);
    }
    price = roundCurrency(price);

    const tax = includeTax ? roundCurrency(price * (taxRate / 100)) : 0;
    const total = roundCurrency(price + tax);

    return { subtotal, discount, cost, price, tax, total };
  };

  const { subtotal, discount, cost, price, tax, total } = calculateTotals();
  const estimatedByCategory = {
    labor: getJobCostEstimateValue("labor"),
    materials: getJobCostEstimateValue("materials"),
    subcontractors: getJobCostEstimateValue("subcontractors"),
    overhead: getJobCostEstimateValue("overhead"),
  };
  const actualByCategory = JOB_COST_CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = 0;
    return acc;
  }, {});
  jobCostEntries.forEach((entry) => {
    const key = entry.category;
    if (Object.prototype.hasOwnProperty.call(actualByCategory, key)) {
      actualByCategory[key] = roundCurrency(actualByCategory[key] + (Number(entry.amount) || 0));
    }
  });

  const estimatedJobCostTotal = roundCurrency(
    estimatedByCategory.labor +
    estimatedByCategory.materials +
    estimatedByCategory.subcontractors +
    estimatedByCategory.overhead
  );
  const actualJobCostTotal = roundCurrency(
    actualByCategory.labor +
    actualByCategory.materials +
    actualByCategory.subcontractors +
    actualByCategory.overhead
  );
  const budgetRemaining = roundCurrency(estimatedJobCostTotal - actualJobCostTotal);
  const projectedFinalCost = roundCurrency(
    JOB_COST_CATEGORIES.reduce((acc, cat) => {
      return acc + Math.max(estimatedByCategory[cat.key], actualByCategory[cat.key]);
    }, 0)
  );
  const hasActualJobCosts = mode === "ADVANCED" && actualJobCostTotal > 0;
  const effectiveCost = hasActualJobCosts ? actualJobCostTotal : cost;
  const effectiveProfit = roundCurrency(price - effectiveCost);
  const effectiveMargin = price > 0 ? roundCurrency((effectiveProfit / price) * 100) : 0;
  const isBelowTarget = profitMethod === "MARGIN" && effectiveMargin < targetValue;

  const addLineItem = () => setLineItems([...lineItems, { id: Date.now(), description: "", quantity: "", unit_cost: "" }]);
  const updateLineItem = (id, field, value) => {
      setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
      if (formErrors?.lineItems?.[id]?.[field]) {
        setFormErrors((prev) => ({
          ...prev,
          lineItems: { ...(prev.lineItems || {}), [id]: { ...(prev.lineItems?.[id] || {}), [field]: "" } }
        }));
      }
  };
  const removeLineItem = (id) => setLineItems(lineItems.filter(item => item.id !== id));

  const handleSave = async () => {
    const errors = buildFieldErrors({
      job: [{ isValid: !!activeJob, message: "Select a job before saving." }],
      simpleMaterials: [
        { isValid: mode !== "SIMPLE" || isNumber(simpleMaterials), message: "Enter a materials cost." },
      ],
      simpleHours: [
        { isValid: mode !== "SIMPLE" || isNumber(simpleHours), message: "Enter the labor hours." },
      ],
    });

    if (mode === "ADVANCED") {
      const lineItemErrors = {};
      lineItems.forEach((item) => {
        const itemErrors = {};
        if (!isRequired(item.description)) itemErrors.description = "Add a description.";
        if (!inRange(item.quantity, 0, 100000)) itemErrors.quantity = "Enter a quantity.";
        if (!inRange(item.unit_cost, 0, 1000000)) itemErrors.unit_cost = "Enter a unit cost.";
        if (Object.keys(itemErrors).length > 0) {
          lineItemErrors[item.id] = itemErrors;
        }
      });
      if (Object.keys(lineItemErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, lineItems: lineItemErrors }));
        showToast("Fix the highlighted line items before saving.", "error");
        return;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({
        ...prev,
        simpleMaterials: errors.simpleMaterials ? errors.simpleMaterials[0]?.message : prev.simpleMaterials,
        simpleHours: errors.simpleHours ? errors.simpleHours[0]?.message : prev.simpleHours,
        estimate: errors.job ? { job: errors.job[0]?.message } : prev.estimate,
      }));
      showToast(errors.job ? errors.job[0]?.message : "Fix the highlighted fields before saving.", "error");
      return;
    }

    if (!isOnline) {
      showToast("You're offline. Reconnect to save.", "error");
      return;
    }

    setSavingEstimate(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      showToast("Please log in to save estimates.", "error");
      if (authError) logError("ProfitLock auth failed", authError);
      setSavingEstimate(false);
      return;
    }

    const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
    const estimateLimitCheck = await canCreateResource('estimates');
    if (!estimateLimitCheck.allowed) {
      if (estimateLimitCheck.readOnly) {
        showToast(estimateLimitCheck.reason || "Account locked. Renew to edit.", "error");
        setSavingEstimate(false);
        return;
      }
      setSavingEstimate(false);
      setUpgradePromptData({ resourceType: 'estimates', currentCount: estimateLimitCheck.currentCount, limit: estimateLimitCheck.limit, tier: estimateLimitCheck.tier });
      setShowUpgradePrompt(true);
      return;
    }

    const estimateData = {
        user_id: user.id,
        job_id: activeJob.id,
        customer_id: activeJob.customer_id || null,
        estimate_number: `EST-${Date.now().toString().slice(-6)}`,
        subtotal: roundCurrency(price),
        tax: roundCurrency(tax),
        total_price: roundCurrency(total),
        status: "DRAFT",
        notes: `${profitMethod}: ${targetValue}% | Payment: ${paymentTerms}`
    };

    try {
      const { data: estimate, error } = await supabase
        .from("estimates")
        .insert(estimateData)
        .select("id")
        .single();

      if (error) { 
        showToast("Failed to save estimate. Please try again.", "error");
        logError("ProfitLock estimate save failed", error);
        return;
      }
      await incrementResourceUsage('estimates');

      if (mode === "ADVANCED") {
        const items = lineItems
          .filter(item => item.description && (item.quantity || item.unit_cost))
          .map(item => {
            const qty = parseFloat(item.quantity) || 0;
            const unit = parseFloat(item.unit_cost) || 0;
            return {
              estimate_id: estimate.id,
              description: item.description,
              quantity: roundCurrency(qty),
              unit_price: roundCurrency(unit),
              total: roundCurrency(qty * unit)
            };
          });
        if (items.length > 0) {
          const { error: lineError } = await supabase.from("line_items").insert(items);
          if (lineError) {
            showToast("Estimate saved, but line items failed to save.", "error");
            logError("ProfitLock line items save failed", lineError);
          }
        }
      } else {
        const items = [];
        const mat = parseFloat(simpleMaterials) || 0;
        const hrs = parseFloat(simpleHours) || 0;
        if (mat > 0) {
          items.push({ estimate_id: estimate.id, description: "Materials", quantity: 1, unit_price: roundCurrency(mat), total: roundCurrency(mat) });
        }
        if (hrs > 0) {
          items.push({ estimate_id: estimate.id, description: "Labor", quantity: roundCurrency(hrs), unit_price: roundCurrency(hourlyRate), total: roundCurrency(hrs * hourlyRate) });
        }
        if (items.length > 0) {
          const { error: lineError } = await supabase.from("line_items").insert(items);
          if (lineError) {
            showToast("Estimate saved, but line items failed to save.", "error");
            logError("ProfitLock line items save failed", lineError);
          }
        }
      }

      showToast("Estimate saved successfully!", "success");
      await loadData();
      setFormErrors((prev) => ({ ...prev, estimate: {} }));
    } catch (error) {
      showToast("Failed to save estimate. Please try again.", "error");
      logError("ProfitLock estimate save failed", error);
    } finally {
      setSavingEstimate(false);
    }
  };

  const loadEstimate = async (estId) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showToast("Please log in to load estimates.", "error");
        if (authError) logError("ProfitLock auth failed", authError);
        return;
      }
      const { data: est, error } = await supabase
        .from("estimates")
        .select("id, line_items(id, description, quantity, unit_price)")
        .eq("id", estId)
        .eq("user_id", user.id)
        .single();
      if (error) {
        showToast("Unable to load estimate details.", "error");
        logError("ProfitLock estimate fetch failed", error, { estId });
        return;
      }
      if (!est) return;
    
      const items = est.line_items || [];
      if (mode === "SIMPLE") {
        const matItem = items.find(i => i.description === "Materials");
        const laborItem = items.find(i => i.description === "Labor");
        setSimpleMaterials(matItem ? matItem.unit_price.toString() : "");
        setSimpleHours(laborItem ? laborItem.quantity.toString() : "");
      } else {
        setLineItems(items.length > 0 ? items.map(i => ({
          id: i.id,
          description: i.description,
          quantity: i.quantity.toString(),
          unit_cost: i.unit_price.toString()
        })) : [
          { id: 1, description: "Materials", quantity: "", unit_cost: "" },
          { id: 2, description: "Labor", quantity: "", unit_cost: "" }
        ]);
      }
      setShowMenu(false);
    } catch (error) {
      showToast("Unable to load estimate details.", "error");
      logError("ProfitLock estimate fetch failed", error, { estId });
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setShowDiscount(false);
    setDiscountAmount("");
  };

  const showToast = (message, type = "info") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + quoteValidDays);

  if (!hasHydrated) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-main)] text-[var(--text-main)] font-inter flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#FF6700]" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-main)] text-[var(--text-main)] font-inter flex flex-col relative overflow-hidden selection:bg-[#FF6700] selection:text-black">
      <SubscriptionBanner />
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
      <header className="p-4 shrink-0 z-10 border-b border-[var(--border-color)]">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Link href="/dashboard" className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#FF6700] hover:text-[#FF6700] transition" aria-label="Back to dashboard">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-[11px] font-oswald font-bold text-[#FF6700] tracking-wide uppercase">FIELDDESKOPS</h1>
                    <p className="text-2xl font-oswald font-bold text-[#FF6700] tracking-wide uppercase drop-shadow-[0_0_8px_rgba(255,103,0,0.5)]">PROFITLOCK</p>
                </div>
            </div>
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 rounded-lg bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:scale-105 transition active:scale-95"
              aria-label="Open settings menu"
            >
                <Menu size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-4 my-3">
        <JobSelector />
      </div>

      {!isOnline ? (
        <div className="mx-4 mb-3">
          <div className="bg-red-900/30 border border-red-500/40 text-red-200 text-xs rounded-lg px-3 py-2">
            You are offline. Calculations still work, but saves are disabled.
          </div>
        </div>
      ) : null}

      {isInvoiceMode ? (
          <div className="flex-1 p-4 bg-white text-black m-3 rounded-lg shadow-2xl relative flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-start shrink-0">
                  <div>
                      <h2 className="text-2xl font-oswald font-bold uppercase">ESTIMATE</h2>
                      <p className="text-xs font-bold text-gray-500 uppercase">{activeJob?.title}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-gray-400">Valid Until</p>
                      <p className="font-mono font-bold text-sm">{validUntilDate.toLocaleDateString()}</p>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                      <thead>
                          <tr className="border-b border-gray-300">
                              <th className="py-1 text-xs font-black uppercase text-gray-600">Description</th>
                              <th className="py-1 text-xs font-black uppercase text-gray-600 text-right">Qty</th>
                              <th className="py-1 text-xs font-black uppercase text-gray-600 text-right">Total</th>
                          </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                          {mode === "SIMPLE" ? (
                              <>
                                {parseFloat(simpleMaterials) > 0 && (
                                  <tr className="border-b border-gray-100">
                                    <td className="py-2 font-bold">Materials</td>
                                    <td className="py-2 text-right">1</td>
                                    <td className="py-2 text-right">${(parseFloat(simpleMaterials)).toFixed(2)}</td>
                                  </tr>
                                )}
                                {parseFloat(simpleHours) > 0 && (
                                  <tr className="border-b border-gray-100">
                                    <td className="py-2 font-bold">Labor</td>
                                    <td className="py-2 text-right">{parseFloat(simpleHours).toFixed(2)} hrs</td>
                                    <td className="py-2 text-right">${((parseFloat(simpleHours))*hourlyRate).toFixed(2)}</td>
                                  </tr>
                                )}
                              </>
                          ) : (
                              lineItems.filter(item => item.description && (parseFloat(item.quantity) > 0 || parseFloat(item.unit_cost) > 0)).map((item, i) => (
                                  <tr key={i} className="border-b border-gray-100">
                                      <td className="py-2 font-bold">{item.description}</td>
                                      <td className="py-2 text-right">{parseFloat(item.quantity).toFixed(2)}</td>
                                      <td className="py-2 text-right">${((parseFloat(item.unit_cost) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}</td>
                                  </tr>
                              ))
                          )}
                          {showDiscount && parseFloat(discountAmount) > 0 && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 font-bold text-red-600">Discount</td>
                              <td></td>
                              <td className="py-2 text-right text-red-600">-${discount.toFixed(2)}</td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>

              <div className="bg-black text-white p-4 rounded-lg flex justify-between items-end mt-4 shrink-0">
                  <div>
                      <p className="text-xs font-black text-gray-300 uppercase">Amount Due</p>
                      <p className="text-xs text-gray-300 mt-1">{paymentTerms === "DUE_ON_RECEIPT" && "Due on receipt"}</p>
                  </div>
                  <p className="text-4xl font-oswald font-bold text-[#FF6700]">${total.toFixed(2)}</p>
              </div>

              <button onClick={() => setIsInvoiceMode(false)} className="absolute top-3 right-3 p-1 bg-gray-300 rounded-full hover:bg-gray-400 transition"><X size={16} className="text-black"/></button>
          </div>
      ) : (
      <main
        className={`flex-1 p-3 sm:p-4 max-w-2xl mx-auto w-full space-y-3 sm:space-y-4 ${
          mode === "ADVANCED" ? "overflow-y-auto hide-scrollbar pb-20" : "overflow-hidden pb-6"
        }`}
      >
        <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border-color)] space-y-4">
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleModeChange("SIMPLE")}
                className={`flex-1 py-2 text-sm font-bold rounded transition ${mode === "SIMPLE" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-surface)] border border-[var(--border-color)]"}`}
              >
                Simple
              </button>
              <button 
                onClick={() => handleModeChange("ADVANCED")}
                className={`flex-1 py-2 text-sm font-bold rounded transition ${mode === "ADVANCED" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-surface)] border border-[var(--border-color)]"}`}
              >
                Advanced
              </button>
            </div>

            {mode === "SIMPLE" ? (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase"><Box size={10} className="inline mr-1"/>Materials</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)] font-bold">$</span>
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={simpleMaterials} 
                              onChange={e => {
                                setSimpleMaterials(e.target.value);
                                if (formErrors?.simpleMaterials) {
                                  setFormErrors((prev) => ({ ...prev, simpleMaterials: "" }));
                                }
                              }} 
                              onBlur={() => {
                                if (!inRange(simpleMaterials, 0, 1000000)) {
                                  setFormErrors((prev) => ({ ...prev, simpleMaterials: "Please enter a valid materials cost." }));
                                }
                              }}
                              placeholder="0"
                              className={`w-full bg-[var(--input-bg)] border rounded-lg p-3 pl-7 text-center font-mono font-bold outline-none transition text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-20 ${
                                formErrors?.simpleMaterials ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                              }`} 
                              style={{ fontSize: '16px' }}
                            />
                        </div>
                        {formErrors?.simpleMaterials ? (
                          <p className="text-xs text-red-500">{formErrors.simpleMaterials}</p>
                        ) : null}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase"><Clock size={10} className="inline mr-1"/>Labor (Hrs)</label>
                        <input 
                          type="number" 
                          inputMode="decimal"
                          value={simpleHours} 
                          onChange={e => {
                            setSimpleHours(e.target.value);
                            if (formErrors?.simpleHours) {
                              setFormErrors((prev) => ({ ...prev, simpleHours: "" }));
                            }
                          }} 
                          onBlur={() => {
                            if (!inRange(simpleHours, 0, 100000)) {
                              setFormErrors((prev) => ({ ...prev, simpleHours: "Please enter valid labor hours." }));
                            }
                          }}
                          placeholder="0"
                          className={`w-full bg-[var(--input-bg)] border rounded-lg p-3 text-center font-mono font-bold outline-none transition text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-20 ${
                            formErrors?.simpleHours ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                          }`} 
                          style={{ fontSize: '16px' }}
                        />
                        {formErrors?.simpleHours ? (
                          <p className="text-xs text-red-500">{formErrors.simpleHours}</p>
                        ) : null}
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {lineItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                                <input 
                                  placeholder="Item" 
                                  value={item.description} 
                                  onChange={(e) => updateLineItem(item.id, "description", e.target.value)} 
                                  onBlur={() => {
                                    if (!item.description.trim()) {
                                      setFormErrors((prev) => ({
                                        ...prev,
                                        lineItems: { ...(prev.lineItems || {}), [item.id]: { ...(prev.lineItems?.[item.id] || {}), description: "Add a description." } }
                                      }));
                                    }
                                  }}
                                  className={`w-full bg-[var(--input-bg)] border rounded p-2 text-xs font-bold outline-none text-[var(--input-text)] ${
                                    formErrors?.lineItems?.[item.id]?.description ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                                  }`} 
                                  style={{ fontSize: '16px' }}
                                />
                            </div>
                            <div className="col-span-2">
                                <input 
                                  placeholder="Qty" 
                                  type="number" 
                                  inputMode="decimal"
                                  value={item.quantity} 
                                  onChange={(e) => updateLineItem(item.id, "quantity", e.target.value)} 
                                  onBlur={() => {
                                    if (!inRange(item.quantity, 0, 100000)) {
                                      setFormErrors((prev) => ({
                                        ...prev,
                                        lineItems: { ...(prev.lineItems || {}), [item.id]: { ...(prev.lineItems?.[item.id] || {}), quantity: "Enter a quantity." } }
                                      }));
                                    }
                                  }}
                                  className={`w-full bg-[var(--input-bg)] border rounded p-2 text-xs text-center outline-none text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-20 ${
                                    formErrors?.lineItems?.[item.id]?.quantity ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                                  }`} 
                                  style={{ fontSize: '16px' }}
                                />
                            </div>
                            <div className="col-span-3">
                                <input 
                                  placeholder="$" 
                                  type="number" 
                                  inputMode="decimal"
                                  value={item.unit_cost} 
                                  onChange={(e) => updateLineItem(item.id, "unit_cost", e.target.value)} 
                                  onBlur={() => {
                                    if (!inRange(item.unit_cost, 0, 1000000)) {
                                      setFormErrors((prev) => ({
                                        ...prev,
                                        lineItems: { ...(prev.lineItems || {}), [item.id]: { ...(prev.lineItems?.[item.id] || {}), unit_cost: "Enter a unit cost." } }
                                      }));
                                    }
                                  }}
                                  className={`w-full bg-[var(--input-bg)] border rounded p-2 text-xs text-center outline-none text-[var(--input-text)] placeholder:text-[var(--text-sub)] placeholder:opacity-20 ${
                                    formErrors?.lineItems?.[item.id]?.unit_cost ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                                  }`} 
                                  style={{ fontSize: '16px' }}
                                />
                            </div>
                            <div className="col-span-2 text-center">
                                <button onClick={() => removeLineItem(item.id)} className="text-[var(--text-sub)] hover:text-red-500 transition"><Trash2 size={14}/></button>
                            </div>
                            {(formErrors?.lineItems?.[item.id]?.description || formErrors?.lineItems?.[item.id]?.quantity || formErrors?.lineItems?.[item.id]?.unit_cost) ? (
                              <div className="col-span-12 text-xs text-red-500">
                                {formErrors?.lineItems?.[item.id]?.description || formErrors?.lineItems?.[item.id]?.quantity || formErrors?.lineItems?.[item.id]?.unit_cost}
                              </div>
                            ) : null}
                        </div>
                    ))}
                    <button onClick={addLineItem} className="w-full py-2 border border-dashed border-[var(--border-color)] text-[var(--text-sub)] rounded text-xs font-bold hover:text-[#FF6700] hover:border-[#FF6700] transition uppercase">+ Add</button>
                    
                    {!showDiscount && (
                      <button onClick={() => setShowDiscount(true)} className="w-full py-2 border border-dashed border-red-500 text-[var(--text-sub)] rounded text-xs font-bold hover:text-red-500 hover:bg-red-500/5 transition uppercase">- Discount</button>
                    )}

                    {showDiscount && (
                      <div className="grid grid-cols-12 gap-2 items-center bg-red-500/5 border border-red-500/30 rounded p-2">
                        <div className="col-span-5">
                          <p className="text-xs font-bold text-red-500">Discount</p>
                        </div>
                        <div className="col-span-2 flex gap-1">
                          <button 
                            onClick={() => setDiscountType("DOLLAR")}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition ${discountType === "DOLLAR" ? "bg-red-500 text-black" : "bg-black/20 text-red-500 border border-red-500/30"}`}
                          >
                            $
                          </button>
                          <button 
                            onClick={() => setDiscountType("PERCENT")}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition ${discountType === "PERCENT" ? "bg-red-500 text-black" : "bg-black/20 text-red-500 border border-red-500/30"}`}
                          >
                            %
                          </button>
                        </div>
                        <div className="col-span-3">
                          <input 
                            placeholder="0" 
                            type="number" 
                            inputMode="decimal"
                            value={discountAmount} 
                            onChange={(e) => {
                              setDiscountAmount(e.target.value);
                              if (formErrors?.discountAmount) {
                                setFormErrors((prev) => ({ ...prev, discountAmount: "" }));
                              }
                            }} 
                            onBlur={() => {
                              const max = discountType === "PERCENT" ? 100 : 1000000;
                              if (!inRange(discountAmount, 0, max)) {
                                setFormErrors((prev) => ({
                                  ...prev,
                                  discountAmount: discountType === "PERCENT"
                                    ? "Enter a discount between 0 and 100%."
                                    : "Enter a valid discount amount.",
                                }));
                              }
                            }}
                            className={`w-full bg-black/20 border rounded p-2 text-xs text-center outline-none text-red-500 placeholder:text-red-500 placeholder:opacity-30 ${
                              formErrors?.discountAmount ? "border-red-500 focus:border-red-500" : "border-red-500/30 focus:border-red-500"
                            }`} 
                            style={{ fontSize: '16px' }}
                          />
                        </div>
                        <div className="col-span-2 text-center">
                          <button onClick={() => { setShowDiscount(false); setDiscountAmount(""); }} className="text-[var(--text-sub)] hover:text-red-500 transition"><X size={14}/></button>
                        </div>
                        {formErrors?.discountAmount ? (
                          <div className="col-span-12 text-xs text-red-500">{formErrors.discountAmount}</div>
                        ) : null}
                      </div>
                    )}
                </div>
            )}

            {mode === "ADVANCED" && (
            <div className="bg-[var(--bg-surface)] rounded-lg p-4 border border-[var(--border-color)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-[var(--text-sub)] uppercase tracking-wider">Job Costing Dashboard</p>
                  <p className="text-[11px] text-[var(--text-sub)]">Live budget vs actual for {activeJob?.title || "selected job"}</p>
                </div>
                {loadingJobCosting ? <Loader2 size={14} className="animate-spin text-[#FF6700]" /> : null}
              </div>

              {!activeJob?.id ? (
                <p className="text-xs text-[var(--text-sub)]">Select a job to manage job costing.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {JOB_COST_CATEGORIES.map((cat) => (
                      <div key={cat.key} className="space-y-1">
                        <label className="text-[10px] font-black text-[var(--text-sub)] uppercase">{cat.label} Budget</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-sub)]">$</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={jobCostEstimate[cat.key]}
                            onChange={(e) => setJobCostEstimate((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2 pl-6 text-xs text-[var(--input-text)] outline-none focus:border-[#FF6700]"
                            style={{ fontSize: "16px" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveJobCostEstimate}
                    disabled={savingJobCostEstimate}
                    className="w-full py-2 bg-[#FF6700] text-black font-bold text-xs uppercase rounded hover:bg-[#ff8533] transition disabled:opacity-50"
                  >
                    {savingJobCostEstimate ? "Saving Budget..." : "Save Job Budget"}
                  </button>

                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <label className="text-[10px] font-black text-[var(--text-sub)] uppercase block mb-1">Category</label>
                      <select
                        value={jobCostForm.category}
                        onChange={(e) => setJobCostForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--input-text)] outline-none focus:border-[#FF6700]"
                        style={{ fontSize: "16px" }}
                      >
                        {JOB_COST_CATEGORIES.map((cat) => (
                          <option key={cat.key} value={cat.key}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <label className="text-[10px] font-black text-[var(--text-sub)] uppercase block mb-1">Actual Cost</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-sub)]">$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={jobCostForm.amount}
                          onChange={(e) => setJobCostForm((prev) => ({ ...prev, amount: e.target.value }))}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2 pl-6 text-xs text-[var(--input-text)] outline-none focus:border-[#FF6700]"
                          style={{ fontSize: "16px" }}
                        />
                      </div>
                    </div>
                    <div className="col-span-4">
                      <button
                        onClick={handleAddJobCostEntry}
                        disabled={savingJobCostEntry}
                        className="w-full py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-xs font-bold uppercase hover:border-[#FF6700] hover:text-[#FF6700] transition disabled:opacity-50"
                      >
                        {savingJobCostEntry ? "Logging..." : "Log Cost"}
                      </button>
                    </div>
                    <div className="col-span-6">
                      <input
                        value={jobCostForm.enteredBy}
                        onChange={(e) => setJobCostForm((prev) => ({ ...prev, enteredBy: e.target.value }))}
                        placeholder="Crew/Admin name (optional)"
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] outline-none focus:border-[#FF6700]"
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                    <div className="col-span-6">
                      <input
                        value={jobCostForm.note}
                        onChange={(e) => setJobCostForm((prev) => ({ ...prev, note: e.target.value }))}
                        placeholder="Note (optional)"
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] outline-none focus:border-[#FF6700]"
                        style={{ fontSize: "16px" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[var(--bg-card)] rounded p-3 border border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-sub)] uppercase font-black">Original Estimate</p>
                      <p className="text-lg font-oswald font-bold">${estimatedJobCostTotal.toFixed(2)}</p>
                    </div>
                    <div className="bg-[var(--bg-card)] rounded p-3 border border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-sub)] uppercase font-black">Actual Cost</p>
                      <p className="text-lg font-oswald font-bold">${actualJobCostTotal.toFixed(2)}</p>
                    </div>
                    <div className="bg-[var(--bg-card)] rounded p-3 border border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-sub)] uppercase font-black">Budget Remaining</p>
                      <p className={`text-lg font-oswald font-bold ${budgetRemaining >= 0 ? "text-green-500" : "text-red-500"}`}>${budgetRemaining.toFixed(2)}</p>
                    </div>
                    <div className="bg-[var(--bg-card)] rounded p-3 border border-[var(--border-color)]">
                      <p className="text-[10px] text-[var(--text-sub)] uppercase font-black">Projected Final</p>
                      <p className="text-lg font-oswald font-bold">${projectedFinalCost.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {JOB_COST_CATEGORIES.map((cat) => {
                      const budget = estimatedByCategory[cat.key] || 0;
                      const actual = actualByCategory[cat.key] || 0;
                      const pctUsed = budget > 0 ? Math.min((actual / budget) * 100, 999) : 0;
                      return (
                        <div key={`progress-${cat.key}`} className="bg-[var(--bg-card)] rounded p-2 border border-[var(--border-color)]">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold">{cat.label}</span>
                            <span className="text-[var(--text-sub)]">
                              ${actual.toFixed(2)} / ${budget.toFixed(2)} ({pctUsed.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 rounded bg-black/30 overflow-hidden">
                            <div
                              className={`h-full ${pctUsed <= 100 ? "bg-[#FF6700]" : "bg-red-500"}`}
                              style={{ width: `${Math.min(pctUsed, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-[var(--text-sub)] uppercase font-black">Recent Actual Cost Entries</p>
                    {jobCostEntries.length === 0 ? (
                      <p className="text-xs text-[var(--text-sub)]">No costs logged yet.</p>
                    ) : (
                      jobCostEntries.slice(0, 8).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-xs">
                          <div>
                            <p className="font-bold capitalize">{entry.category}</p>
                            <p className="text-[var(--text-sub)]">
                              {entry.entered_by ? `${entry.entered_by} • ` : ""}
                              {entry.note || "No note"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-oswald text-sm">${Number(entry.amount || 0).toFixed(2)}</p>
                            <p className="text-[10px] text-[var(--text-sub)]">{new Date(entry.incurred_at || entry.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            )}

            <div className="bg-[var(--bg-surface)] rounded-lg p-6 border border-[var(--border-color)] text-center">
                <p className="text-xs text-[var(--text-sub)] uppercase tracking-wider font-black mb-1">Quoted Price</p>
                <p className="text-5xl font-oswald font-bold text-[var(--text-main)] tracking-tight">${price.toFixed(0)}</p>
            </div>

            <div className="flex gap-2">
                <button onClick={() => setIsInvoiceMode(true)} className="flex-1 py-3 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] font-bold text-xs uppercase rounded-lg hover:bg-[var(--bg-card)] transition flex items-center justify-center gap-2">
                    <FileText size={16}/> Preview
                </button>
                <button onClick={handleSave} disabled={savingEstimate || !activeJob} className="flex-[2] py-3 bg-[#FF6700] text-black font-bold text-xs uppercase rounded-lg shadow-[0_0_20px_rgba(255,103,0,0.4)] hover:shadow-[0_0_30px_rgba(255,103,0,0.6)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingEstimate ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} {savingEstimate ? "SAVING..." : "SAVE"}
                </button>
            </div>

        </div>
      </main>
      )}

      {/* JOB SELECT MODAL */}
      {showJobSelect && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowJobSelect(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-[51] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-2xl max-h-[75vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
              <h2 className="font-oswald text-lg font-bold text-[#FF6700]">SELECT JOB</h2>
              <button onClick={() => setShowJobSelect(false)}><X size={18}/></button>
            </div>
            
            <div className="p-3 border-b border-[var(--border-color)]">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" size={14}/>
                <input 
                  placeholder="Search..." 
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded pl-8 pr-2 py-2 text-xs text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                  aria-label="Search jobs"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <button 
                onClick={() => { setShowJobSelect(false); setShowCreateJob(true); }}
                className="w-full p-2 bg-[#FF6700] text-black font-bold rounded text-xs hover:bg-[#ff8533] transition flex items-center justify-center gap-2"
              >
                <Plus size={14}/> NEW JOB
              </button>
              
              {filteredJobs.length === 0 ? (
                <p className="text-xs text-[var(--text-sub)] text-center py-4">No jobs found. Create a new job to get started.</p>
              ) : filteredJobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => { setActiveJob(job); setShowJobSelect(false); }}
                  className={`w-full text-left p-2 rounded border text-xs transition font-bold ${activeJob?.id === job.id ? "bg-[#FF6700]/10 border-[#FF6700]" : "bg-[var(--bg-surface)] border-[var(--border-color)]"}`}
                >
                  <p>{job.title}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CREATE JOB MODAL */}
      {showCreateJob && (
        <>
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowCreateJob(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-[51] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-2xl p-4">
            <h2 className="font-oswald text-lg font-bold text-[#FF6700] mb-3">CREATE JOB</h2>
            <FormField label="Job Title" required error={formErrors?.newJob?.title}>
              <input 
                autoFocus
                placeholder="Kitchen remodel" 
                value={newJobTitle}
                onChange={(e) => {
                  setNewJobTitle(e.target.value);
                  if (formErrors?.newJob?.title) {
                    setFormErrors((prev) => ({ ...prev, newJob: { ...prev.newJob, title: "" } }));
                  }
                }}
                onBlur={() => {
                  if (!newJobTitle.trim()) {
                    setFormErrors((prev) => ({ ...prev, newJob: { title: "Please enter a job title." } }));
                  }
                }}
                autoComplete="off"
                className={`w-full bg-[var(--input-bg)] border rounded p-3 text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] outline-none ${
                  formErrors?.newJob?.title ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                }`}
                style={{ fontSize: '16px' }}
              />
            </FormField>
            <button 
              onClick={handleCreateJob}
              disabled={savingJob}
              className="w-full py-3 bg-[#FF6700] text-black font-bold text-xs uppercase rounded hover:bg-[#ff8533] transition disabled:opacity-50"
            >
              {savingJob ? <Loader2 className="animate-spin inline mr-2" size={14}/> : ""} {savingJob ? "Creating..." : "Create"}
            </button>
          </div>
        </>
      )}

      {/* CONTROL PANEL */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm pointer-events-auto z-40" onClick={() => setShowMenu(false)} />
            <div className="w-80 max-w-[85vw] bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full shadow-2xl p-4 flex flex-col overflow-y-auto z-50 pointer-events-auto relative">
                
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-[var(--bg-card)] pb-2 z-10">
                    <h2 className="font-oswald text-base font-bold text-[#FF6700] uppercase">SETTINGS</h2>
                    <button onClick={() => setShowMenu(false)} className="p-1 hover:bg-[var(--bg-surface)] rounded"><X size={18}/></button>
                </div>

                {/* TABS */}
                <div className="grid grid-cols-3 gap-1 bg-[var(--bg-surface)] p-1 rounded mb-4 border border-[var(--border-color)]">
                  {["PROFIT", "CONFIG", "HISTORY"].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setMenuTab(tab)}
                      className={`py-2 rounded text-xs font-bold transition ${menuTab === tab ? "bg-[#FF6700] text-black" : "text-[var(--text-sub)] hover:text-[var(--text-main)]"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* PROFIT TAB */}
                {menuTab === "PROFIT" && (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowMethodMenu(!showMethodMenu)}
                      className="w-full p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] rounded text-xs font-bold text-left flex items-center justify-between hover:bg-[var(--input-bg)] transition"
                    >
                      <span>Profit Method</span>
                      <ChevronDown size={14} className={`transition ${showMethodMenu ? "rotate-180" : ""}`}/>
                    </button>

                    {showMethodMenu && (
                      <button
                        onClick={() => setShowMethodDetails(!showMethodDetails)}
                        className="w-full p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] rounded text-xs font-bold text-left flex items-center justify-between hover:bg-[var(--input-bg)] transition"
                      >
                        <span>View Details</span>
                        <ChevronDown size={14} className={`transition ${showMethodDetails ? "rotate-180" : ""}`}/>
                      </button>
                    )}

                    {showMethodDetails && (
                      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded p-3 space-y-3">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-[var(--text-sub)] uppercase block">Method</label>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setProfitMethod("MARKUP")}
                              className={`flex-1 py-2 text-xs font-bold rounded transition ${profitMethod === "MARKUP" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-card)] border border-[var(--border-color)]"}`}
                            >
                              Markup
                            </button>
                            <button 
                              onClick={() => setProfitMethod("MARGIN")}
                              className={`flex-1 py-2 text-xs font-bold rounded transition ${profitMethod === "MARGIN" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-card)] border border-[var(--border-color)]"}`}
                            >
                              Margin
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-[var(--text-sub)] uppercase block">Target Value</label>
                          <input 
                            type="number" 
                            inputMode="decimal"
                            value={targetValue} 
                            onChange={e => {
                              setTargetValue(parseFloat(e.target.value) || 0);
                              if (formErrors?.targetValue) {
                                setFormErrors((prev) => ({ ...prev, targetValue: "" }));
                              }
                            }} 
                            onBlur={() => {
                              if (!inRange(targetValue, 0, 100)) {
                                setFormErrors((prev) => ({ ...prev, targetValue: "Enter a target between 0 and 100." }));
                              }
                            }}
                            className={`w-full bg-[var(--input-bg)] border rounded p-2 text-sm text-[var(--input-text)] font-bold outline-none ${
                              formErrors?.targetValue ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                            }`} 
                            style={{ fontSize: '16px' }}
                          />
                          {formErrors?.targetValue ? (
                            <p className="text-xs text-red-500 mt-1">{formErrors.targetValue}</p>
                          ) : null}
                          <p className="text-[10px] text-[var(--text-sub)] mt-2">
                            {profitMethod === "MARKUP" ? (
                              <>Cost <span className="text-[var(--text-sub)]">×</span> (1 <span className="text-[var(--text-sub)]">+</span> {targetValue}) <span className="text-[var(--text-sub)]">=</span> Price</>
                            ) : (
                              <>Cost <span className="text-[var(--text-sub)]">÷</span> (1 <span className="text-[var(--text-sub)]">−</span> {targetValue}) <span className="text-[var(--text-sub)]">=</span> Price</>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className={`p-3 rounded bg-[var(--bg-surface)] border border-[var(--border-color)]`}>
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-black text-[var(--text-sub)] uppercase">Profit {profitLocked && <Lock size={10} className="text-green-500 inline ml-1"/>}</p>
                            <button onClick={() => setShowProfitDetails(!showProfitDetails)} className="p-1 hover:bg-black/20 rounded">
                                {showProfitDetails ? <EyeOff size={14}/> : <Eye size={14}/>}
                            </button>
                        </div>
                        
                        {showProfitDetails ? (
                            <div className="mt-2">
                                <p className={`text-xl font-oswald font-bold ${effectiveProfit > 0 ? "text-green-500" : "text-red-500"}`}>${effectiveProfit.toFixed(2)}</p>
                                <p className="text-xs text-[var(--text-sub)] mt-1">Margin: {effectiveMargin.toFixed(1)}%</p>
                                {isBelowTarget && profitLocked && <p className="text-xs text-green-500 font-bold mt-1">✓ ProfitLock protecting</p>}
                            </div>
                        ) : (
                            <p className="text-xl font-oswald font-bold text-[var(--text-sub)] opacity-30 mt-2">****</p>
                        )}
                    </div>

                    <button onClick={() => setProfitLocked(!profitLocked)} className={`w-full p-2 rounded border text-xs font-bold transition ${profitLocked ? "bg-green-900/20 border-green-500/50 text-green-500 hover:bg-green-900/30" : "bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[#FF6700]"}`}>
                        {profitLocked ? "🔒 ProfitLock ON" : "🔓 ProfitLock OFF"}
                    </button>
                  </div>
                )}

                {/* CONFIG TAB */}
                {menuTab === "CONFIG" && (
                  <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-1 block">Hourly Rate</label>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-sub)]">$</span>
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={hourlyRate} 
                              onChange={e => {
                                setHourlyRate(parseFloat(e.target.value) || 0);
                                if (formErrors?.settings?.hourlyRate) {
                                  setFormErrors((prev) => ({ ...prev, settings: { ...prev.settings, hourlyRate: "" } }));
                                }
                              }} 
                              onBlur={() => {
                                if (!inRange(hourlyRate, 0, 10000)) {
                                  setFormErrors((prev) => ({ ...prev, settings: { ...(prev.settings || {}), hourlyRate: "Enter a valid hourly rate." } }));
                                }
                              }}
                              className={`w-full bg-[var(--input-bg)] border rounded p-2 pl-6 text-xs text-[var(--input-text)] font-bold outline-none ${
                                formErrors?.settings?.hourlyRate ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                              }`} 
                              style={{ fontSize: '16px' }}
                            />
                        </div>
                        {formErrors?.settings?.hourlyRate ? (
                          <p className="text-xs text-red-500 mt-1">{formErrors.settings.hourlyRate}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-2 block">Discount Type</label>
                        <div className="flex gap-2">
                          <button onClick={() => setDiscountType("DOLLAR")} className={`flex-1 py-2 text-xs font-bold rounded transition ${discountType === "DOLLAR" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-card)] border border-[var(--border-color)]"}`}>Dollar ($)</button>
                          <button onClick={() => setDiscountType("PERCENT")} className={`flex-1 py-2 text-xs font-bold rounded transition ${discountType === "PERCENT" ? "bg-[#FF6700] text-black" : "bg-[var(--bg-card)] border border-[var(--border-color)]"}`}>Percent (%)</button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-2 block">Tax</label>
                        <div className="flex items-center justify-between p-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded mb-2">
                          <span className="text-xs font-bold">Include</span>
                          <button 
                            onClick={() => setIncludeTax(!includeTax)}
                            className={`w-8 h-4 rounded-full transition-colors ${includeTax ? "bg-[#FF6700]" : "bg-gray-700"}`}
                          >
                            <div className={`w-3 h-3 rounded-full bg-black m-0.5 transition-transform ${includeTax ? "translate-x-4" : ""}`}></div>
                          </button>
                        </div>
                        {includeTax && (
                          <div>
                            <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-1 block">Rate</label>
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={taxRate} 
                              onChange={e => {
                                setTaxRate(parseFloat(e.target.value) || 0);
                                if (formErrors?.settings?.taxRate) {
                                  setFormErrors((prev) => ({ ...prev, settings: { ...prev.settings, taxRate: "" } }));
                                }
                              }} 
                              onBlur={() => {
                                if (!inRange(taxRate, 0, 25)) {
                                  setFormErrors((prev) => ({ ...prev, settings: { ...(prev.settings || {}), taxRate: "Enter a tax rate between 0 and 25%." } }));
                                }
                              }}
                              className={`w-full bg-[var(--input-bg)] border rounded p-2 text-xs text-[var(--input-text)] font-bold outline-none ${
                                formErrors?.settings?.taxRate ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                              }`} 
                              style={{ fontSize: '16px' }}
                            />
                            {formErrors?.settings?.taxRate ? (
                              <p className="text-xs text-red-500 mt-1">{formErrors.settings.taxRate}</p>
                            ) : null}
                          </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-1 block">Payment Terms</label>
                        <select 
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded p-2 text-xs text-[var(--input-text)] font-bold outline-none focus:border-[#FF6700]"
                          style={{ fontSize: '16px' }}
                        >
                          <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                          <option value="NET_15">Net 15</option>
                          <option value="NET_30">Net 30</option>
                          <option value="DEPOSIT_50">50% Deposit</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-black text-[var(--text-sub)] uppercase mb-1 block">Quote Valid For</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            inputMode="numeric"
                            value={quoteValidDays} 
                          onChange={e => {
                            setQuoteValidDays(parseInt(e.target.value) || 30);
                            if (formErrors?.settings?.quoteValidDays) {
                              setFormErrors((prev) => ({ ...prev, settings: { ...prev.settings, quoteValidDays: "" } }));
                            }
                          }} 
                          onBlur={() => {
                            if (!inRange(quoteValidDays, 1, 365)) {
                              setFormErrors((prev) => ({ ...prev, settings: { ...(prev.settings || {}), quoteValidDays: "Enter 1-365 days." } }));
                            }
                          }}
                          className={`flex-1 bg-[var(--input-bg)] border rounded p-2 text-xs text-[var(--input-text)] font-bold outline-none ${
                            formErrors?.settings?.quoteValidDays ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                          }`} 
                            style={{ fontSize: '16px' }}
                          />
                          <span className="text-xs text-[var(--text-sub)]">days</span>
                        </div>
                      {formErrors?.settings?.quoteValidDays ? (
                        <p className="text-xs text-red-500 mt-1">{formErrors.settings.quoteValidDays}</p>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* HISTORY TAB */}
                {menuTab === "HISTORY" && (
                  <div className="space-y-2">
                    <p className="text-xs font-black text-[var(--text-sub)] uppercase mb-2">Recent ({estimateHistory.length})</p>
                    {estimateHistory.slice(0,8).map(est => (
                        <button 
                          key={est.id} 
                          onClick={() => { loadEstimate(est.id); }}
                          className="w-full text-left p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] hover:bg-[var(--input-bg)] transition text-xs"
                        >
                            <p className="font-bold text-[var(--text-main)]">{est.jobs?.title}</p>
                            <p className="text-[var(--text-sub)]">${est.total_price?.toFixed(0)}</p>
                        </button>
                    ))}
                    {estimateHistory.length === 0 && <p className="text-xs text-[var(--text-sub)] text-center py-4">No estimates yet</p>}
                  </div>
                )}

            </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
