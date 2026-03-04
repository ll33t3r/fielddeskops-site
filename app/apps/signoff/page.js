"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { useActiveJob } from "../../../hooks/useActiveJob";
import {
  PenTool, Save, Loader2, X,
  ArrowLeft, Menu, Pin,
  Camera, Image as ImageIcon, ChevronRight,
} from "lucide-react";
import { baseVarKeys, formTypes, TEMPLATES } from "../../../src/data/signOffTemplates";
import Link from "next/link";
import SignOffModals from "./SignOffModals";
import JobSelector from "../../components/shared/JobSelector";
import Toast from "../../components/shared/Toast";
import FormField from "../../components/shared/FormField";
import SubscriptionBanner from "../../components/shared/SubscriptionBanner";
import { buildFieldErrors, inRange, isEmail, isPhone, isRequired } from "../../utils/validation";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { logError } from "../../../utils/logger";
import UpgradePrompt from "@/components/UpgradePrompt";
import { track } from "@vercel/analytics";

export default function SignOff() {
  const supabase = createClient();
  const { activeJob, setActiveJob } = useActiveJob();
  const isOnline = useOnlineStatus();
  const sigPad = useRef({});
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const cursorPositionRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastState, setToastState] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuTab, setMenuTab] = useState("DATA");
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("CUSTOM");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [signedAt, setSignedAt] = useState(null);
  const [savedSignature, setSavedSignature] = useState(null);
  const [attachedPhotos, setAttachedPhotos] = useState([]);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [docReadOnly, setDocReadOnly] = useState(false);
  const [editingVar, setEditingVar] = useState(null);
  const [editingVarValue, setEditingVarValue] = useState("");
  const [showAddVarModal, setShowAddVarModal] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState("");
  const [showSiteSnapModal, setShowSiteSnapModal] = useState(false);
  const [siteSnapPhotos, setSiteSnapPhotos] = useState([]);
  const [selectedSiteSnap, setSelectedSiteSnap] = useState(new Map());
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobCustomer, setNewJobCustomer] = useState("");

  useEffect(() => {
    try {
      if (!sessionStorage.getItem("fdo_first_app_opened")) {
        track("first_app_opened", { app: "signoff" });
        sessionStorage.setItem("fdo_first_app_opened", "1");
      }
    } catch {
      // noop
    }
  }, []);
  
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [clientName, setClientName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [contractBody, setContractBody] = useState("");
  const [hasSigned, setHasSigned] = useState(false);
  const [isDocumentLocked, setIsDocumentLocked] = useState(false);
  const [formType, setFormType] = useState("Standard");
  const [customers, setCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [linkedEstimate, setLinkedEstimate] = useState(null);
  const [jobLinkedData, setJobLinkedData] = useState(null);
  const [smartVariables, setSmartVariables] = useState({});
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'signoff_docs', currentCount: 0, limit: 0, tier: 'free' });

  // Save custom variables to localStorage whenever they change
  useEffect(() => {
    if (selectedJob?.id && Object.keys(smartVariables).length > 0) {
      const customVars = Object.fromEntries(
        Object.entries(smartVariables).filter(([key]) =>
          ![
            "[JOB_NAME]",
            "[DATE]",
            "[JOB_STATUS]",
            "[JOB_ADDRESS]",
            "[ESTIMATE_TOTAL]",
            "[ESTIMATE_SERVICE]",
            "[LABOR_COST]",
            "[MATERIALS_COST]",
            "[CUSTOMER]",
            "[CONTRACTOR]",
          ].includes(key)
        )
      );
      localStorage.setItem(
        `signoff_custom_vars_${selectedJob.id}`,
        JSON.stringify(customVars)
      );
    }
  }, [smartVariables, selectedJob]);

  useEffect(() => {
    if (activeJob?.id && activeJob.id !== selectedJob?.id) {
      setSelectedJob(activeJob);
    }
    if (!activeJob && selectedJob) {
      setSelectedJob(null);
    }
  }, [activeJob, selectedJob]);

  // Save selected job to localStorage
  useEffect(() => {
    if (selectedJob?.id) {
      localStorage.setItem("signoff_selected_job_id", selectedJob.id);
    }
  }, [selectedJob]);

  const vibrate = (p = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p);
  };

  const showToast = (message, type = "success") => {
    setToastState({ message, type });
    setTimeout(() => setToastState(null), 3000);
  };

  const ensureWriteAccess = async () => {
    const { getWriteAccessStatus } = await import('@/lib/subscription/subscriptionHelpers');
    const access = await getWriteAccessStatus();
    if (!access.allowed) {
      showToast(access.reason || "Account locked. Renew to edit.", "error");
      return false;
    }
    return true;
  };

  const openConfirmDialog = ({ title, description, confirmLabel = "Delete", onConfirm }) => {
    setConfirmDialog({ title, description, confirmLabel, onConfirm, loading: false });
  };

  const handleConfirm = async () => {
    if (!confirmDialog?.onConfirm) return;
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      await confirmDialog.onConfirm();
    } finally {
      setConfirmDialog(null);
    }
  };

  const toast = {
    error: (msg) => showToast(msg, "error"),
  };

  // Save cursor position in contentEditable
  const saveCursorPosition = (element) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
  };

  // Restore cursor position
  const restoreCursorPosition = (element, position) => {
    if (position === null) return;

    const selection = window.getSelection();
    const range = document.createRange();

    let charCount = 0;
    let nodeStack = [element];
    let node;
    let foundStart = false;

    while (!foundStart && (node = nodeStack.pop())) {
      if (node.nodeType === 3) {
        const nextCharCount = charCount + node.length;
        if (position >= charCount && position <= nextCharCount) {
          range.setStart(node, position - charCount);
          range.collapse(true);
          foundStart = true;
        }
        charCount = nextCharCount;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const getPhotoDisplayUrl = (photo) => {
    if (!photo) return "";
    const raw = photo.data || photo.photo_url;
    if (raw && (String(raw).startsWith("http") || String(raw).startsWith("data:"))) return raw;
    const path = photo.path || photo.storage_path || raw;
    if (!path || typeof path !== "string") return raw || "";
    return supabase.storage.from("sitesnap_photos").getPublicUrl(path).data.publicUrl;
  };

  const clearSignature = () => {
    if (sigPad.current?.clear) {
      sigPad.current.clear();
      setHasSigned(false);
    }
  };

  const handleSignatureEnd = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      setHasSigned(true);
    }
  };

  // Handle photo file selection (read as base64)
  const handlePhotoFiles = (fileList) => {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList);

    files.forEach((file) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (!result || typeof result !== "string") return;
          setAttachedPhotos((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              data: result,
              timestamp: new Date().toISOString(),
            },
          ]);
        };
        reader.onerror = (err) => {
          logError("SignOff photo read failed", err);
          showToast("Failed to read photo", "error");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        logError("SignOff photo processing failed", error);
        showToast("Photo processing failed", "error");
      }
    });
  };

  // REAL-TIME VARIABLE REPLACEMENT IN CONTRACT BODY
  const getDisplayedContractBody = () => {
    let result = contractBody;
    if (clientName) {
      result = result.replaceAll("[CUSTOMER]", clientName);
    }
    if (contractorName) {
      result = result.replaceAll("[CONTRACTOR]", contractorName);
    }
    Object.keys(smartVariables).forEach((variable) => {
      result = result.replaceAll(variable, smartVariables[variable]);
    });
    return result;
  };

  const loadJobBrainData = async (jobId) => {
    if (!jobId) {
      setSmartVariables({});
      setJobLinkedData(null);
      setLinkedEstimate(null);
      return;
    }
    
    try {
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select("id, title, status, customer_name, contractor_name, address")
        .eq("id", jobId)
        .single();
      if (jobError) {
        showToast("Unable to load job data.", "error");
        logError("SignOff job load failed", jobError, { jobId });
        return;
      }
      if (job) {
        setJobLinkedData(job);
        
        if (job.customer_name) setClientName(job.customer_name);
        if (job.contractor_name) setContractorName(job.contractor_name);
        
        const { data: estimate, error: estimateError } = await supabase
          .from("estimates")
          .select("id, total_price, service_name, created_at")
          .eq("job_id", jobId)
          .maybeSingle();
        if (estimateError) {
          logError("SignOff estimate load failed", estimateError, { jobId });
        }
        if (estimate) setLinkedEstimate(estimate);

        const baseVars = {
          "[JOB_NAME]": job.title || "",
          "[DATE]": new Date().toLocaleDateString(),
          "[JOB_STATUS]": job.status || "Active",
          "[JOB_ADDRESS]": job.address || ""
        };

        if (estimate) {
          baseVars["[ESTIMATE_TOTAL]"] = `$${estimate.total_price?.toFixed(2) || "0.00"}`;
          baseVars["[ESTIMATE_SERVICE]"] = estimate.service_name || "";
          baseVars["[LABOR_COST]"] = `$${estimate.labor_cost?.toFixed(2) || "0.00"}`;
          baseVars["[MATERIALS_COST]"] = `$${estimate.materials_cost?.toFixed(2) || "0.00"}`;
        }

        // Merge persisted custom variables for this job
        let customVars = {};
        try {
          const stored = localStorage.getItem(`signoff_vars_${jobId}`);
          if (stored) {
            customVars = JSON.parse(stored) || {};
          }
        } catch (err) {
          logError("SignOff custom vars load failed", err);
        }

        const customVarsKey = `signoff_custom_vars_${jobId}`;
        const storedCustomVars = localStorage.getItem(customVarsKey);
        if (storedCustomVars) {
          const parsed = JSON.parse(storedCustomVars);
          setSmartVariables((prev) => ({ ...prev, ...parsed }));
        }

        setSmartVariables({
          ...baseVars,
          ...customVars,
        });
      }
    } catch (error) {
      logError("SignOff smart variable load failed", error);
    }
  };

  const applySmartVariables = (text) => {
    let result = text;
    if (clientName) result = result.replaceAll("[CUSTOMER]", clientName);
    if (contractorName) result = result.replaceAll("[CONTRACTOR]", contractorName);
    Object.keys(smartVariables).forEach((variable) => {
      result = result.replaceAll(variable, smartVariables[variable]);
    });
    return result;
  };

  const insertVariable = (variable) => {
    setNewTemplateBody(prev => prev + variable);
  };

  const removeVariableFromTemplate = (variable) => {
    setNewTemplateBody(prev => prev.replaceAll(variable, ""));
  };

  const restoreContract = async (contract) => {
    // Populate ALL fields from contract
    setContractBody(contract.contract_body || "");
    setClientName(contract.client_name || "");
    setContractorName(contract.contractor_name || "");
    setSignedAt(contract.signed_at || null);
    setSavedSignature(contract.signature_data || null);
    setAttachedPhotos([]);
    setDocReadOnly(true);
    
    // Restore job if available
    if (contract.job_id) {
      const job = recentJobs.find(j => j.id === contract.job_id);
      if (job) {
        setSelectedJob(job);
        await loadJobBrainData(job.id);
      }
    }
    
    // Load attached photos for this contract
    try {
      const { data: photoRows, error: photoError } = await supabase
        .from("contract_photos")
        .select("id, photo_data, created_at")
        .eq("contract_id", contract.id)
        .order("display_order", { ascending: true });

      if (photoError) {
        logError("SignOff contract photo load failed", photoError);
      } else if (photoRows) {
        setAttachedPhotos(
          photoRows.map((p) => ({
            id: p.id,
            data: p.photo_data,
            timestamp: p.created_at || null,
          }))
        );
      }
    } catch (err) {
      logError("SignOff contract photo load failed", err);
    }
    
    // Close menu and scroll to top
    setShowMenu(false);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    
    const dateStr = contract.created_at ? new Date(contract.created_at).toLocaleDateString() : "history";
    showToast(`Contract loaded from ${dateStr}`, "success");

    // Open directly in document view (read-only)
    setShowDocPreview(true);
  };

  const loadAllData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUser(user);

      const [contractsRes, jobsRes, templatesRes, customersRes] = await Promise.all([
        supabase.from("contracts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("contract_templates").select("*").eq("user_id", user.id).order("is_pinned", { ascending: false }),
        supabase.from("customers").select("id, name").eq("user_id", user.id).order("name", { ascending: true }),
      ]);

      if (contractsRes.data) setContracts(contractsRes.data);
      if (customersRes.data) setCustomers(customersRes.data || []);
      if (jobsRes.data) {
        setRecentJobs(jobsRes.data);
        if (jobsRes.data.length > 0) {
          const savedJobId = localStorage.getItem("signoff_selected_job_id");
          const jobToSelect = savedJobId
            ? jobsRes.data.find((j) => j.id === savedJobId)
            : jobsRes.data[0];

          if (jobToSelect) {
            setSelectedJob(jobToSelect);
            setActiveJob(jobToSelect);
            await loadJobBrainData(jobToSelect.id);
          }
        }
      }

      if (!templatesRes.data || templatesRes.data.length === 0) {
        await supabase
          .from("contract_templates")
          .insert(
            TEMPLATES.map((t) => ({
              user_id: user.id,
              label: t.label,
              body: t.body,
              category: t.category,
              is_pinned: t.is_pinned,
            }))
          );
      } else {
        const byLabel = new Map();
        const duplicates = [];

        templatesRes.data.forEach((template) => {
          const existing = byLabel.get(template.label);
          if (!existing) {
            byLabel.set(template.label, template);
            return;
          }

          const currentDate = new Date(template.created_at || 0).getTime();
          const existingDate = new Date(existing.created_at || 0).getTime();
          if (currentDate > existingDate) {
            duplicates.push(existing.id);
            byLabel.set(template.label, template);
          } else {
            duplicates.push(template.id);
          }
        });

        if (duplicates.length > 0) {
          await supabase
            .from("contract_templates")
            .delete()
            .in("id", duplicates);
        }
      }

      const { data: refreshedTemplates } = await supabase
        .from("contract_templates")
        .select("id, name, body, category, is_pinned, created_at")
        .eq("user_id", user.id)
        .order("is_pinned", { ascending: false });
      setTemplates(refreshedTemplates || []);
      
      const savedContractor = localStorage.getItem("fdo_last_contractor");
      if (savedContractor) setContractorName(savedContractor);
      
    } catch (error) {
      logError("SignOff load failed", error);
      showToast("Failed to load SignOff data. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveContract = async () => {
    if (!(await ensureWriteAccess())) return;
    const errors = buildFieldErrors({
      contractBody: [{ isValid: isRequired(contractBody), message: "Please enter contract terms." }],
      clientName: [{ isValid: isRequired(clientName), message: "Please enter the customer name." }],
      contractorName: [{ isValid: isRequired(contractorName), message: "Please enter the contractor name." }],
      signature: [{ isValid: hasSigned, message: "Please add a signature before saving." }],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({
        ...prev,
        contractBody: errors.contractBody?.[0]?.message || prev.contractBody,
        clientName: errors.clientName?.[0]?.message || prev.clientName,
        contractorName: errors.contractorName?.[0]?.message || prev.contractorName,
      }));
      showToast(errors.signature ? errors.signature[0].message : "Fix the highlighted fields before saving.", "error");
      return;
    }

    if (!isOnline) {
      showToast("You are offline. Reconnect to save contracts.", "error");
      return;
    }

    setSaving(true);
    vibrate(20);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showToast("Please log in to save contracts.", "error");
        if (authError) logError("SignOff auth failed", authError);
        return;
      }
      
      // Verify signature canvas exists and capture data with error handling
      if (!sigPad.current || !sigPad.current.toDataURL) {
        throw new Error("Signature canvas not available");
      }
      
      let signatureData;
      try {
        signatureData = sigPad.current.toDataURL("image/png");
        if (!signatureData || signatureData.length < 100) {
          throw new Error("Signature data capture failed");
        }
      } catch (sigError) {
        logError("SignOff signature capture failed", sigError);
        throw new Error("Failed to capture signature. Please try signing again.");
      }
      
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('signoff_docs');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          showToast(limitCheck.reason || "Account locked. Renew to edit.", "error");
          return;
        }
        setUpgradePromptData({ resourceType: 'signoff_docs', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }

      const processedBody = applySmartVariables(contractBody);
      const nowIso = new Date().toISOString();
      setSignedAt(nowIso);
      setDocReadOnly(true);

      const { error, data } = await supabase.from("contracts").insert({
        user_id: user.id,
        job_id: selectedJob?.id || null,
        job_name: selectedJob?.title || "Custom Contract",
        client_name: clientName.trim(),
        contractor_name: contractorName.trim(),
        contract_body: processedBody,
        signature_data: signatureData,
        signed_at: nowIso
      }).select("id, signature_data").single();

      if (error) {
        logError("SignOff contract save failed", error);
        throw error;
      }
      await incrementResourceUsage('signoff_docs');

      // Verify signature was saved
      if (data && data.signature_data) {
        localStorage.setItem("fdo_last_contractor", contractorName);
        setSavedSignature(data.signature_data);
        showToast("✓ Contract saved! Signature confirmed.", "success");
        setIsDocumentLocked(true);
      } else {
        throw new Error("Signature data not saved properly");
      }
      
      // Save attached photos for this contract
      if (attachedPhotos.length > 0 && data?.id) {
        const rows = attachedPhotos.map((photo, index) => ({
          contract_id: data.id,
          photo_data: photo.data,
          display_order: index,
        }));
        const { error: photoError } = await supabase
          .from("contract_photos")
          .insert(rows);
        if (photoError) {
          logError("SignOff contract photo save failed", photoError);
        }
      }
      
      // Stay in document view; clear signature pad but keep content
      clearSignature();

    } catch (error) {
      logError("SignOff contract save failed", error);
      showToast(error.message || "Failed to save contract. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!(await ensureWriteAccess())) return;
    const errors = buildFieldErrors({
      contractBody: [{ isValid: isRequired(contractBody), message: "Please enter contract terms." }],
      clientName: [{ isValid: isRequired(clientName), message: "Please enter the customer name." }],
      contractorName: [{ isValid: isRequired(contractorName), message: "Please enter the contractor name." }],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({
        ...prev,
        contractBody: errors.contractBody?.[0]?.message || prev.contractBody,
        clientName: errors.clientName?.[0]?.message || prev.clientName,
        contractorName: errors.contractorName?.[0]?.message || prev.contractorName,
      }));
      showToast("Fix the highlighted fields before saving.", "error");
      return;
    }

    if (!isOnline) {
      showToast("You are offline. Reconnect to save drafts.", "error");
      return;
    }

    setSaving(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showToast("Please log in to save drafts.", "error");
        if (authError) logError("SignOff auth failed", authError);
        return;
      }
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('signoff_docs');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          showToast(limitCheck.reason || "Account locked. Renew to edit.", "error");
          return;
        }
        setUpgradePromptData({ resourceType: 'signoff_docs', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }

      const processedBody = applySmartVariables(contractBody);

      const { data, error } = await supabase
        .from("contracts")
        .insert({
          user_id: user.id,
          job_id: selectedJob?.id || null,
          job_name: selectedJob?.title || "Custom Contract",
          client_name: clientName.trim(),
          contractor_name: contractorName.trim(),
          contract_body: processedBody,
          contract_type: formType || "Standard",
          signed_at: null,
        })
        .select("id")
        .single();

      if (error) throw error;
      await incrementResourceUsage('signoff_docs');

      if (attachedPhotos.length > 0 && data?.id) {
        const photoRows = attachedPhotos.map((photo, index) => ({
          contract_id: data.id,
          photo_data: photo.data,
          display_order: index,
        }));

        const { error: photoError } = await supabase.from("contract_photos").insert(photoRows);
        if (photoError) {
          logError("SignOff draft photo save failed", photoError);
        }
      }

      showToast("Draft saved! Send for signature from History.", "success");

      setClientName("");
      setContractorName("");
      setContractBody("");
      setAttachedPhotos([]);
      setSignedAt(null);
      setSavedSignature(null);
      setHasSigned(false);
      setDocReadOnly(false);
      setIsDocumentLocked(false);
      setFormType("Standard");
      clearSignature();

      await loadAllData();
    } catch (error) {
      logError("SignOff draft save failed", error);
      showToast("Failed to save draft. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteContract = async (contractId) => {
    if (!(await ensureWriteAccess())) return;
    openConfirmDialog({
      title: "Delete contract?",
      description: "This action cannot be undone. The contract and its photos will be permanently removed.",
      confirmLabel: "Delete Contract",
      onConfirm: async () => {
        try {
          const { error: photoError } = await supabase
            .from("contract_photos")
            .delete()
            .eq("contract_id", contractId);

          if (photoError) logError("SignOff contract photo delete failed", photoError);

          const { error } = await supabase
            .from("contracts")
            .delete()
            .eq("id", contractId);

          if (error) throw error;

          showToast("Contract deleted", "success");
          await loadAllData();
        } catch (error) {
          logError("SignOff contract delete failed", error);
          showToast("Failed to delete contract. Please try again.", "error");
        }
      },
    });
  };

  const editDraft = async (contract) => {
    // Restore form data for editing
    setSelectedJob(
      contract.job_id ? recentJobs.find((j) => j.id === contract.job_id) : null
    );
    if (contract.job_id) {
      await loadJobBrainData(contract.job_id);
    }
    setClientName(contract.client_name || "");
    setContractorName(contract.contractor_name || "");
    setContractBody(contract.contract_body || "");
    setFormType(contract.contract_type || "Standard");

    // Load attached photos
    const { data: photos } = await supabase
      .from("contract_photos")
      .select("*")
      .eq("contract_id", contract.id)
      .order("display_order");

    if (photos) {
      setAttachedPhotos(
        photos.map((p) => ({
          id: p.id,
          data: p.photo_data,
          timestamp: p.created_at,
        }))
      );
    }

    setSignedAt(null);
    setSavedSignature(null);
    setHasSigned(false);
    setDocReadOnly(false);
    setShowMenu(false);
    showToast("Draft loaded for editing", "success");
  };

  const generateShareLink = async (contractId) => {
    try {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(36))
        .join("")
        .substring(0, 32);

      const { error } = await supabase
        .from("contract_shares")
        .insert({
          contract_id: contractId,
          share_token: token,
          is_active: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/sign/${token}`;
      const shareText = `Please review and sign this contract:\n\n${shareUrl}\n\nThis link expires in 7 days.`;

      if (navigator.share) {
        await navigator.share({
          title: "Sign Contract",
          text: shareText,
        });
        showToast("Link sent for signature!", "success");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Signing link copied!", "success");
      }
    } catch (error) {
      logError("SignOff share link failed", error);
      showToast("Failed to create signing link. Please try again.", "error");
    }
  };

  const shareSignedContract = (contract) => {
    const shareText = `Contract: ${contract.job_name}\n\nCustomer: ${contract.client_name}\nContractor: ${contract.contractor_name}\nSigned: ${new Date(
      contract.signed_at
    ).toLocaleDateString()}\n\n${contract.contract_body}\n\n✓ This contract has been signed and is legally binding.`;

    if (navigator.share) {
      navigator
        .share({
          title: `Contract - ${contract.job_name}`,
          text: shareText,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      showToast("Contract copied to clipboard", "success");
    }
  };

  const saveTemplate = async (e) => {
    if (!(await ensureWriteAccess())) return;
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    try {
      if (!newTemplateName.trim()) {
        toast.error("Missing Name");
        return;
      }
      if (!newTemplateBody.trim()) {
        toast.error("Missing template text");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save templates");
        throw new Error("Not authenticated");
      }

      const { error } = editingTemplateId
        ? await supabase
            .from("contract_templates")
            .update({
              label: newTemplateName.trim(),
              body: newTemplateBody.trim(),
              category: newTemplateCategory,
            })
            .eq("id", editingTemplateId)
        : await supabase.from("contract_templates").insert({
            user_id: user.id,
            label: newTemplateName.trim(),
            body: newTemplateBody.trim(),
            category: newTemplateCategory,
            is_pinned: false,
          });

      if (error) {
        logError("SignOff template insert failed", error);
        toast.error(error.message || "Template save failed");
        throw error;
      }

      showToast(editingTemplateId ? "Template updated!" : "Template created!", "success");
      setShowTemplateBuilder(false);
      setNewTemplateName("");
      setNewTemplateBody("");
      setNewTemplateCategory("CUSTOM");
      setEditingTemplateId(null);
      await loadAllData();
    } catch (err) {
      logError("SignOff template save failed", err);
      toast.error(err?.message || "Template save failed");
    }
  };

  const handleSiteSnapImport = () => {
    const toAdd = siteSnapPhotos.filter((p) => selectedSiteSnap.has(p.id));
    if (toAdd.length === 0) {
      showToast("Select at least one photo", "error");
      return;
    }

    setAttachedPhotos((prev) => [
      ...prev,
      ...toAdd.map((p) => ({
        id: `sitesnap-${p.id}`,
        data: selectedSiteSnap.get(p.id) || p.displayUrl || p.photo_url || p.photo_data,
        path:
          p.path ||
          p.storage_path ||
          (typeof p.photo_url === "string" &&
          !p.photo_url.startsWith("http") &&
          !p.photo_url.startsWith("data:")
            ? p.photo_url
            : undefined),
        timestamp: p.created_at || new Date().toISOString(),
        sitesnap_photo_id: p.id,
      })),
    ]);
    setShowSiteSnapModal(false);
  };

  const editTemplate = (template) => {
    setEditingTemplateId(template.id);
    setNewTemplateName(template.label || "");
    setNewTemplateBody(template.body || "");
    setNewTemplateCategory(template.category || "CUSTOM");
    setShowTemplateBuilder(true);
  };

  const deleteTemplate = async (templateId) => {
    if (!(await ensureWriteAccess())) return;
    openConfirmDialog({
      title: "Delete template?",
      description: "This action cannot be undone. The template will be permanently removed.",
      confirmLabel: "Delete Template",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("contract_templates")
            .delete()
            .eq("id", templateId);
          if (error) throw error;
          showToast("Template deleted", "success");
          await loadAllData();
        } catch (err) {
          logError("SignOff template delete failed", err);
          showToast("Template delete failed", "error");
        }
      },
    });
  };

  const togglePin = async (template) => {
    if (!(await ensureWriteAccess())) return;
    const pinnedTemplates = templates.filter(t => t.is_pinned);
    
    // Check 5-pin limit
    if (pinnedTemplates.length >= 5 && !template.is_pinned) {
      showToast("Max 5 pins allowed", "error");
      return;
    }
    
    try {
      const { error } = await supabase
        .from("contract_templates")
        .update({ is_pinned: !template.is_pinned })
        .eq("id", template.id);

      if (error) throw error;
      await loadAllData();
      showToast(template.is_pinned ? "Unpinned" : "Pinned", "success");
    } catch (error) {
      logError("SignOff template pin failed", error);
      showToast("Pin failed", "error");
    }
  };

  const pinnedTemplates = templates.filter(t => t.is_pinned);
  const pinnedCount = pinnedTemplates.length;

  // Lock body scroll when menu is open
  useEffect(() => {
    if (showMenu || showTemplateBuilder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMenu, showTemplateBuilder]);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (editorRef.current && cursorPositionRef.current !== null) {
      restoreCursorPosition(editorRef.current, cursorPositionRef.current);
    }
  }, [contractBody]);

  // Real-time contract signature listener
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("contract-signatures")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.signed_at && !payload.old.signed_at) {
            const contractName = payload.new.job_name || "Contract";
            const customerName = payload.new.client_name || "Customer";

            showToast(`✓ ${customerName} just signed ${contractName}!`, "success");
            loadAllData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const checkBuckets = async () => {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) logError("SignOff storage bucket check failed", error);
    };
    checkBuckets();
  }, []);

  useEffect(() => {
    // When job changes, clear old data first and persist custom vars per job
    const prevJobId = (SignOff.prevJobId = SignOff.prevJobId || null);

    // Persist custom variables for previous job
    if (prevJobId && Object.keys(smartVariables).length > 0) {
      const customVars = Object.fromEntries(
        Object.entries(smartVariables).filter(
          ([key]) => !baseVarKeys.includes(key)
        )
      );
      try {
        localStorage.setItem(
          `signoff_vars_${prevJobId}`,
          JSON.stringify(customVars)
        );
      } catch (err) {
        logError("SignOff custom vars persist failed", err);
      }
    }

    if (selectedJob?.id) {
      // Reset contract body if it contains old job data
      if (contractBody && contractBody.includes("[JOB_NAME]")) {
        setContractBody("");
      }
      // Load new job data (includes merging persisted custom vars)
      loadJobBrainData(selectedJob.id);
      SignOff.prevJobId = selectedJob.id;
    } else {
      // Clear everything if no job selected
      setLinkedEstimate(null);
      setSmartVariables({});
      setJobLinkedData(null);
      SignOff.prevJobId = null;
    }
  }, [selectedJob]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 size={32} className="animate-spin text-[#FF6700]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] overflow-y-auto bg-[var(--bg-main)] text-[var(--text-main)] pb-32">
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
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[var(--bg-main)] border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:text-[#FF6700] transition-colors" aria-label="Back to dashboard">
              <ArrowLeft size={28} />
            </Link>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#FF6700]">FIELDDESKOPS</p>
              <h1 className="text-2xl font-bold uppercase tracking-wider" style={{
                color: "#FF6700",
                textShadow: "0 0 10px rgba(255,103,0,0.5), 0 0 20px rgba(255,103,0,0.3), 0 0 30px rgba(255,103,0,0.2)"
              }}>
                SIGNOFF
              </h1>
              <p className="text-[8px] font-bold uppercase tracking-widest" style={{
                color: "#FF6700",
                textShadow: "0 0 8px rgba(255,103,0,0.3)"
              }}>
                SMARTER CONTRACTS
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMenu(true)}
            className="p-3 rounded-xl bg-[var(--bg-card)] text-[#FF6700] border border-[#FF6700]"
            aria-label="Open SignOff menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
      </div>

      <div className="px-6 py-3 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <JobSelector />
      </div>

      {!isOnline ? (
        <div className="max-w-4xl mx-auto px-6 mt-4">
          <div className="bg-red-900/30 border border-red-500/40 text-red-200 text-xs rounded-lg px-3 py-2">
            You are offline. Saving, signing, and sharing are disabled until you reconnect.
          </div>
        </div>
      ) : null}

      <main className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
        {isDocumentLocked && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
            <p className="text-green-400 font-bold">✓ Document Signed - View Only</p>
            <p className="text-sm text-gray-400">This document is locked and cannot be edited</p>
          </div>
        )}
        {/* FORM TYPE */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Form Type</label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            disabled={isDocumentLocked}
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none focus:border-[#FF6700] transition-colors text-[var(--text-main)]"
          >
            {formTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* CUSTOMER - SEARCHABLE DROPDOWN FROM CUSTOMERS TABLE */}
        <div className="space-y-2 relative">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Customer</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              if (formErrors?.clientName) {
                setFormErrors((prev) => ({ ...prev, clientName: "" }));
              }
            }}
            onBlur={() => {
              if (!clientName.trim()) {
                setFormErrors((prev) => ({ ...prev, clientName: "Please enter the customer name." }));
              }
              setTimeout(() => setShowCustomerDropdown(false), 200);
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            placeholder="Search or enter customer name"
            disabled={isDocumentLocked}
            autoComplete="name"
            className={`w-full p-4 rounded-xl bg-[var(--bg-card)] border outline-none transition-colors ${
              formErrors?.clientName ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
            }`}
          />
          {formErrors?.clientName ? (
            <p className="text-xs text-red-500">{formErrors.clientName}</p>
          ) : null}
          {showCustomerDropdown && customers.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg z-20">
              {customers
                .filter((c) => !clientName || c.name?.toLowerCase().includes(clientName.toLowerCase()))
                .slice(0, 20)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setClientName(c.name || "");
                      setShowCustomerDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#FF6700]/10 border-b border-[var(--border-color)] last:border-b-0 text-[var(--text-main)]"
                  >
                    {c.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* CONTRACTOR NAME */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Contractor</label>
          <input
            type="text"
            value={contractorName}
            onChange={(e) => {
              setContractorName(e.target.value);
              if (formErrors?.contractorName) {
                setFormErrors((prev) => ({ ...prev, contractorName: "" }));
              }
            }}
            onBlur={() => {
              if (!contractorName.trim()) {
                setFormErrors((prev) => ({ ...prev, contractorName: "Please enter the contractor name." }));
              }
            }}
            placeholder="Your business name"
            disabled={isDocumentLocked}
            autoComplete="organization"
            className={`w-full p-4 rounded-xl bg-[var(--bg-card)] border outline-none transition-colors ${
              formErrors?.contractorName ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
            }`}
          />
          {formErrors?.contractorName ? (
            <p className="text-xs text-red-500">{formErrors.contractorName}</p>
          ) : null}
        </div>

        {/* PINNED TEMPLATES ROW - SMALLER */}
        {pinnedTemplates.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Quick Templates <span className="text-[#FF6700]">({pinnedCount}/5)</span>
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {pinnedTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    const bodyText = template.body;
                    setTimeout(() => {
                      setContractBody(bodyText);
                    }, 0);
                    vibrate(10);
                  }}
                  className="flex-shrink-0 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#FF6700] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Pin size={12} className="text-[#FF6700]" />
                    <span className="text-xs font-semibold whitespace-nowrap">{template.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        

        {/* LIVE DOCUMENT EDITOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Document
            </label>
            <button
              type="button"
              onClick={() => {
                setDocReadOnly(Boolean(signedAt));
                setShowDocPreview(true);
              }}
              className="flex items-center gap-1 text-[10px] text-blue-300 uppercase tracking-wide hover:text-blue-200"
            >
              <span>Open Full Document</span>
              <ChevronRight size={14} />
            </button>
          </div>
          <div
            ref={editorRef}
            className={`w-full min-h-[240px] p-4 rounded-xl bg-[var(--bg-card)] border outline-none transition-colors text-[var(--text-main)] whitespace-pre-wrap ${
              formErrors?.contractBody ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
            }`}
            contentEditable={!isDocumentLocked}
            suppressContentEditableWarning
            role="textbox"
            aria-label="Contract document editor"
            aria-multiline="true"
            onFocus={(e) => {
              if (!contractBody.trim() && e.currentTarget.textContent === "Enter contract terms or use a pinned template...") {
                e.currentTarget.textContent = "";
              }
            }}
            onInput={(e) => {
              cursorPositionRef.current = saveCursorPosition(e.currentTarget);
              const text = e.currentTarget.innerText || "";
              setContractBody(text);
            }}
            onBlur={(e) => {
              const text = e.currentTarget.innerText || "";
              setContractBody(text);
              if (!text.trim()) {
                setFormErrors((prev) => ({ ...prev, contractBody: "Please enter contract terms." }));
              } else if (formErrors?.contractBody) {
                setFormErrors((prev) => ({ ...prev, contractBody: "" }));
              }
            }}
          >
            {contractBody.trim()
              ? getDisplayedContractBody()
              : "Enter contract terms or use a pinned template..."}
          </div>
          {formErrors?.contractBody ? (
            <p className="text-xs text-red-500 mt-2">{formErrors.contractBody}</p>
          ) : null}
          {attachedPhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {attachedPhotos.map((photo) => (
                <img
                  key={photo.id}
                  src={getPhotoDisplayUrl(photo)}
                  alt="Document attachment"
                  className="w-full h-32 rounded-lg object-cover border border-[var(--border-color)]"
                />
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving || isDocumentLocked || !isOnline}
              className="flex-1 px-6 py-4 rounded-xl border-2 border-[#FF6700] text-[#FF6700] font-bold hover:bg-[#FF6700]/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save as Draft
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setDocReadOnly(Boolean(signedAt));
                setShowDocPreview(true);
              }}
              disabled={isDocumentLocked || !isOnline}
              className="flex-1 px-6 py-4 rounded-xl bg-[#FF6700] text-black font-bold hover:shadow-[0_0_20px_rgba(255,103,0,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <PenTool size={20} />
              Sign &amp; Finalize
            </button>
          </div>
          {!isOnline ? (
            <p className="text-xs text-red-400">Reconnect to save drafts or finalize signatures.</p>
          ) : null}

        {/* ATTACH PHOTOS */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Attach Photos
          </label>
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!isDocumentLocked && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6700] text-black text-sm font-semibold hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-shadow"
                  >
                    <Camera size={16} />
                    Add Photos
                  </button>
                )}
                <button
                  type="button"
                  disabled={!selectedJob}
                  onClick={async () => {
                    if (!selectedJob) {
                      showToast("Select a job first", "error");
                      return;
                    }
                    try {
                      // Try main photos table first
                      const { data: photoRecords, error: tableError } = await supabase
                        .from("photos")
                        .select("id, created_at, storage_path, path, photo_url, photo_data")
                        .eq("job_id", selectedJob.id)
                        .order("created_at", { ascending: false });
                      
                      if (tableError) {
                        logError("SignOff SiteSnap query failed", tableError, { jobId: selectedJob.id });
                        showToast("Unable to load SiteSnap photos.", "error");
                        return;
                      }
                      
                      if (!photoRecords || photoRecords.length === 0) {
                        showToast("No photos found for this job", "error");
                        return;
                      }
                      // Resolve storage paths to public URLs so thumbnails display (do NOT use raw path for img src)
                      const photosWithUrls = photoRecords.map((photo) => {
                        const path = photo.path || photo.storage_path || photo.photo_url;
                        if (path && typeof path === "string" && !path.startsWith("http") && !path.startsWith("data:")) {
                          const publicUrl = supabase.storage.from("sitesnap_photos").getPublicUrl(path).data.publicUrl;
                          return { ...photo, displayUrl: publicUrl };
                        }
                        return { ...photo, displayUrl: photo.photo_url || photo.photo_data || null };
                      });

                      setSiteSnapPhotos(photosWithUrls);
                      setSelectedSiteSnap(new Map());
                      setShowSiteSnapModal(true);
                    } catch (err) {
                      logError("SignOff SiteSnap load failed", err, { jobId: selectedJob?.id });
                      showToast("Failed to load SiteSnap photos.", "error");
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm font-semibold text-[var(--text-main)] hover:border-[#FF6700] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ImageIcon size={16} />
                  Import from SiteSnap
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => {
                  handlePhotoFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="text-[10px] text-[var(--text-sub)]">
                JPG/PNG photos. Attach jobsite proof or import from SiteSnap.
              </p>
            </div>

            {attachedPhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {attachedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group cursor-pointer"
                    onClick={() => {
                      setActivePhoto(photo);
                      setShowPhotoViewer(true);
                    }}
                  >
                    <img
                      src={getPhotoDisplayUrl(photo)}
                      alt="Attached"
                      className="w-full h-24 rounded-lg object-cover border border-[var(--border-color)]"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachedPhotos((prev) =>
                          prev.filter((p) => p.id !== photo.id)
                        );
                      }}
                      className="absolute -top-1 -right-1 rounded-full bg-black/70 text-white p-0.5 opacity-80 hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </main>

      <Toast toast={toastState} onClose={() => setToastState(null)} />

      {confirmDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmDialog(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-red-500/40 bg-[var(--bg-card)] p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-[var(--text-main)] mb-2">
              {confirmDialog.title}
            </h2>
            <p className="text-sm text-[var(--text-sub)] mb-6">
              {confirmDialog.description}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={confirmDialog.loading}
                className="flex-1 bg-[var(--bg-main)] text-[var(--text-main)] font-bold py-3 rounded-lg border border-[var(--border-color)] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmDialog.loading}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-lg disabled:opacity-60"
              >
                {confirmDialog.loading ? "Deleting..." : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <SignOffModals
        modal={{
          showMenu, setShowMenu, menuTab, setMenuTab, jobLinkedData, linkedEstimate, smartVariables, baseVarKeys,
          clientName, contractorName, editingVar, setEditingVar, editingVarValue, setEditingVarValue, setSmartVariables,
          setShowAddVarModal, templates, togglePin, setContractBody, vibrate, setShowTemplateBuilder, contracts,
          restoreContract, showTemplateBuilder, setShowTemplateBuilder, newTemplateName, setNewTemplateName,
          newTemplateBody, setNewTemplateBody, newTemplateCategory, setNewTemplateCategory, insertVariable,
          removeVariableFromTemplate, saveTemplate, showDocPreview, setShowDocPreview, signedAt, savedSignature,
          getDisplayedContractBody, attachedPhotos, getPhotoDisplayUrl, docReadOnly, sigPad, handleSignatureEnd,
          clearSignature, saveContract, saving, contractBody, hasSigned, setClientName, setContractorName,
          setAttachedPhotos, setSignedAt, setSavedSignature, setHasSigned, setDocReadOnly, selectedJob,
          showNewJobModal, setShowNewJobModal, newJobTitle, setNewJobTitle, newJobCustomer, setNewJobCustomer,
          showToast, supabase, setRecentJobs, setSelectedJob, showAddVarModal, setShowAddVarModal, newVarName,
          setNewVarName, newVarValue, setNewVarValue, showSiteSnapModal, setShowSiteSnapModal, siteSnapPhotos,
          selectedSiteSnap, setSelectedSiteSnap, showPhotoViewer, activePhoto, setShowPhotoViewer, setActivePhoto,
          handleSiteSnapImport,
          deleteContract,
          editDraft,
          editTemplate,
          deleteTemplate,
          isOnline,
          setEditingTemplateId,
          onGenerateShareLink: generateShareLink,
          onShareSigned: shareSignedContract,
          onLimitReached: (limitResult) => {
            setUpgradePromptData(limitResult);
            setShowUpgradePrompt(true);
          },
        }}
      />

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        input, textarea, select {
          font-size: 16px !important;
        }
      `}</style>
    </div>
  );
}