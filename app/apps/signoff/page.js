"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Share, Printer, FileText, Calendar, 
  User, Trash2, CheckCircle2, Loader2, X, Lock, ArrowLeft, Menu, 
  Settings, Plus, ChevronDown, FolderOpen, Clock, Copy, Eye, Pencil, Pin, PinOff, 
  Camera, Image as ImageIcon, Maximize2, Check, Search, ListPlus, AlertTriangle,
  DollarSign, Brain, Download, Zap, Filter, ChevronRight, Sparkles
} from "lucide-react";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";

export default function SignOff() {
  const supabase = createClient();
  const sigPad = useRef({});
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuTab, setMenuTab] = useState("DATA");
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("CUSTOM");
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [signedAt, setSignedAt] = useState(null);
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
  const [selectedSiteSnap, setSelectedSiteSnap] = useState(new Set());
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobCustomer, setNewJobCustomer] = useState("");
  
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  
  const [linkedEstimate, setLinkedEstimate] = useState(null);
  const [jobLinkedData, setJobLinkedData] = useState(null);
  const [smartVariables, setSmartVariables] = useState({});
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [clientName, setClientName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [contractBody, setContractBody] = useState("");
  const [hasSigned, setHasSigned] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const baseVarKeys = [
    "[JOB_NAME]",
    "[DATE]",
    "[JOB_STATUS]",
    "[JOB_ADDRESS]",
    "[ESTIMATE_TOTAL]",
    "[ESTIMATE_SERVICE]",
    "[LABOR_COST]",
    "[MATERIALS_COST]",
  ];

  const vibrate = (p = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
          console.error("Photo read error:", err);
          showToast("Failed to read photo", "error");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Photo processing error:", error);
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
      const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      if (job) {
        setJobLinkedData(job);
        
        if (job.customer_name) setClientName(job.customer_name);
        if (job.contractor_name) setContractorName(job.contractor_name);
        
        const { data: estimate } = await supabase.from("estimates").select("*").eq("job_id", jobId).maybeSingle();
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
          console.error("Load custom vars error:", err);
        }

        setSmartVariables({
          ...baseVars,
          ...customVars,
        });
        showToast("Job data loaded", "success");
      }
    } catch (error) {
      console.error("Brain load error:", error);
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
        .select("*")
        .eq("contract_id", contract.id)
        .order("display_order", { ascending: true });

      if (photoError) {
        console.error("Load contract photos error:", photoError);
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
      console.error("Unexpected photo load error:", err);
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

      const [contractsRes, jobsRes, templatesRes] = await Promise.all([
        supabase.from("contracts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("contract_templates").select("*").eq("user_id", user.id).order("is_pinned", { ascending: false })
      ]);

      if (contractsRes.data) setContracts(contractsRes.data);
      if (jobsRes.data) {
        setRecentJobs(jobsRes.data);
        if (jobsRes.data.length > 0) {
          setSelectedJob(jobsRes.data[0]);
          await loadJobBrainData(jobsRes.data[0].id);
        }
      }

      const defaults = [
        { id: "d1", label: "WORK AUTHORIZATION", body: "I, [CUSTOMER], authorize [CONTRACTOR] to proceed with [JOB_NAME].\n\nTERMS: Payment due upon completion.\nESTIMATED COST: [ESTIMATE_TOTAL]", is_pinned: true, category: "AUTHORIZATION" },
        { id: "d2", label: "LIABILITY WAIVER", body: "[CONTRACTOR] is not responsible for damages resulting from pre-existing conditions discovered during [JOB_NAME].", is_pinned: true, category: "LEGAL" },
        { id: "d3", label: "CHANGE ORDER", body: "The following additional work is authorized for [JOB_NAME]:\n\nORIGINAL ESTIMATE: [ESTIMATE_TOTAL]\nADDITIONAL COST: $______\n\nNEW TOTAL: $______", is_pinned: true, category: "CHANGE" },
        { id: "d4", label: "FINAL ACCEPTANCE", body: "I, [CUSTOMER], confirm that [CONTRACTOR] has completed [JOB_NAME] to my satisfaction.\n\nCOMPLETION DATE: [DATE]\nFINAL AMOUNT: [ESTIMATE_TOTAL]", is_pinned: true, category: "COMPLETION" }
      ];
      
      const merged = [...(templatesRes.data || [])];
      defaults.forEach((d) => {
        if (!merged.find((m) => m.label === d.label)) merged.push(d);
      });
      setTemplates(merged);
      
      const savedContractor = localStorage.getItem("fdo_last_contractor");
      if (savedContractor) setContractorName(savedContractor);
      
    } catch (error) {
      console.error("Load error:", error);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveContract = async () => {
    if (!contractBody.trim()) {
      showToast("Add contract text", "error");
      return;
    }
    if (!clientName.trim()) {
      showToast("Add customer name", "error");
      return;
    }
    if (!hasSigned) {
      showToast("Signature required", "error");
      return;
    }

    setSaving(true);
    vibrate(20);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
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
        console.error("Signature toDataURL error:", sigError);
        throw new Error("Failed to capture signature. Please try signing again.");
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
      }).select().single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Verify signature was saved
      if (data && data.signature_data) {
        localStorage.setItem("fdo_last_contractor", contractorName);
        showToast("✓ Contract saved! Signature confirmed.", "success");
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
          console.error("Photo save error:", photoError);
        }
      }
      
      // Stay in document view; clear signature pad but keep content
      clearSignature();

    } catch (error) {
      console.error("Save error:", error);
      showToast(error.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateBody.trim()) {
      showToast("Fill all fields", "error");
      return;
    }

    try {
      console.log("saveTemplate start", {
        newTemplateName,
        newTemplateBodyLength: newTemplateBody.length,
        newTemplateCategory,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast("You must be logged in to save templates", "error");
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from("contract_templates").insert({
        user_id: user.id,
        label: newTemplateName.trim(),
        body: newTemplateBody.trim(),
        category: newTemplateCategory,
        is_pinned: false
      });

      if (error) {
        console.error("Template insert error:", error);
        showToast(`Template save failed: ${error.message}`, "error");
        throw error;
      }

      showToast("Template created!", "success");
      setShowTemplateBuilder(false);
      setNewTemplateName("");
      setNewTemplateBody("");
      setNewTemplateCategory("CUSTOM");
      await loadAllData();

    } catch (error) {
      console.error("Template save error:", error);
      if (!error?.message?.includes("Template save failed")) {
        showToast(error.message || "Template save failed", "error");
      }
    }
  };

  const togglePin = async (template) => {
    if (template.id.startsWith("d")) return;
    
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
      console.error("Pin error:", error);
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
        console.error("Persist custom vars error:", err);
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
  }, [selectedJob, smartVariables, contractBody]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 size={32} className="animate-spin text-[#FF6700]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-32">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[var(--bg-main)] border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors">
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
            </div>
          </div>
          <button
            onClick={() => setShowMenu(true)}
            className="p-3 rounded-xl bg-[var(--bg-card)] text-[#FF6700] border border-[#FF6700]"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* JOB SELECTOR - PRIMARY FUNCTIONALITY */}
      <div className="px-6 py-3 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <FileText size={18} className="text-[#FF6700]" />
          <select
            value={selectedJob?.id || ""}
            onChange={(e) => {
              const job = recentJobs.find(j => j.id === e.target.value);
              setSelectedJob(job || null);
            }}
            className="flex-1 p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:border-[#FF6700] transition-colors text-[var(--text-main)]"
          >
            <option value="">Select Job...</option>
            {recentJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="px-3 py-2 bg-[#FF6700] text-black rounded-lg font-bold text-sm hover:shadow-[0_0_10px_rgba(255,103,0,0.4)] transition-all flex items-center gap-1"
          >
            <Plus size={16} />
            New Job
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
        {/* CUSTOMER NAME */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Customer</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter customer name"
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none focus:border-[#FF6700] transition-colors"
          />
        </div>

        {/* CONTRACTOR NAME */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Contractor</label>
          <input
            type="text"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
            placeholder="Your business name"
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none focus:border-[#FF6700] transition-colors"
          />
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
                    setContractBody(template.body);
                    vibrate(10);
                    showToast("Template applied", "success");
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

        {/* ATTACH PHOTOS */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Attach Photos
          </label>
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6700] text-black text-sm font-semibold hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-shadow"
                >
                  <Camera size={16} />
                  Add Photos
                </button>
                <button
                  type="button"
                  disabled={!selectedJob}
                  onClick={async () => {
                    if (!selectedJob) {
                      showToast("Select a job first", "error");
                      return;
                    }
                    try {
                      const { data, error } = await supabase
                        .from("sitesnap_photos")
                        .select("*")
                        .eq("job_id", selectedJob.id)
                        .order("created_at", { ascending: false });
                      if (error) {
                        console.error("SiteSnap load error:", error);
                        showToast("Failed to load SiteSnap photos", "error");
                        return;
                      }
                      setSiteSnapPhotos(data || []);
                      setSelectedSiteSnap(new Set());
                      setShowSiteSnapModal(true);
                    } catch (err) {
                      console.error("SiteSnap unexpected error:", err);
                      showToast("Failed to load SiteSnap photos", "error");
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
                      src={photo.data}
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

        {/* CONTRACT BODY WITH COLLAPSIBLE PREVIEW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Contract Text
            </label>
            <button
              type="button"
              onClick={() => setPreviewExpanded((prev) => !prev)}
              className="flex items-center gap-1 text-[10px] text-blue-300 uppercase tracking-wide hover:text-blue-200"
            >
              <span>Document Preview</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${previewExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          <textarea
            value={contractBody}
            onChange={(e) => setContractBody(e.target.value)}
            placeholder="Enter contract terms or use a pinned template..."
            rows={12}
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none focus:border-[#FF6700] resize-none transition-colors"
          />
          {(clientName || contractorName || Object.keys(smartVariables).length > 0 || contractBody.trim()) && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5">
              <button
                type="button"
                onClick={() => {
                  setDocReadOnly(Boolean(signedAt));
                  setShowDocPreview(true);
                }}
                className="w-full text-left px-4 pt-3 pb-2 cursor-pointer"
              >
                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wide flex items-center justify-between">
                  <span>Open Full Document</span>
                  <ChevronRight size={14} />
                </p>
              </button>
              {previewExpanded ? (
                <div className="px-4 pb-3">
                  <p className="text-xs text-blue-400 mb-1">Preview:</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {getDisplayedContractBody()}
                  </p>
                </div>
              ) : (
                <div className="px-4 pb-3">
                  <p className="text-xs text-blue-400 mb-1">Summary:</p>
                  <p className="text-sm text-gray-300 truncate">
                    {getDisplayedContractBody() || "Preview your contract as a formatted document."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* POWERED BY FIELDDESKOPS FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--bg-main)] to-transparent py-4 pointer-events-none z-30">
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-wider text-gray-500">
            POWERED BY <span style={{
              color: "#FF6700",
              textShadow: "0 0 8px rgba(255,103,0,0.4)"
            }}>FIELDDESKOPS</span>
          </p>
        </div>
      </div>

      {/* MENU MODAL */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/90 z-50"
            onClick={() => setShowMenu(false)}
            style={{ overflow: 'hidden' }}
          />
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none"
            style={{ overflow: 'hidden' }}
          >
            <div 
              className="bg-[var(--bg-card)] w-full sm:max-w-3xl sm:rounded-2xl rounded-t-3xl h-[600px] overflow-hidden flex flex-col border-2 border-[#FF6700] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="p-6 border-b border-[#FF6700]/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#FF6700]">Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 hover:bg-[#FF6700]/10 rounded-lg text-[#FF6700]"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex gap-2">
                {["DATA", "TEMPLATES", "HISTORY"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMenuTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      menuTab === tab
                        ? "bg-[#FF6700] text-black shadow-[0_0_10px_rgba(255,103,0,0.4)]"
                        : "bg-[#FF6700]/10 text-[#FF6700] hover:bg-[#FF6700]/20"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {menuTab === "DATA" && (
                <div className="space-y-4">
                  {jobLinkedData ? (
                    <>
                      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-3">
                          <Brain size={24} className="text-purple-400" />
                          <div>
                            <p className="font-bold text-sm text-white">Job Data</p>
                            <p className="text-xs text-gray-400">{jobLinkedData.title}</p>
                          </div>
                        </div>
                      </div>

                      {linkedEstimate && (
                        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-blue-400">ProfitLock Estimate</p>
                              <p className="text-xs text-gray-400">{linkedEstimate.service_name}</p>
                            </div>
                            <p className="text-2xl font-bold text-[#FF6700]">
                              ${linkedEstimate.total_price?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-400">Smart Variables</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 rounded-lg bg-[#FF6700]/10 border border-[#FF6700]/30">
                            <p className="text-xs font-mono text-[#FF6700]">[CUSTOMER]</p>
                            <p className="text-xs text-gray-400 truncate">{clientName || "Not set"}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#FF6700]/10 border border-[#FF6700]/30">
                            <p className="text-xs font-mono text-[#FF6700]">[CONTRACTOR]</p>
                            <p className="text-xs text-gray-400 truncate">{contractorName || "Not set"}</p>
                          </div>
                          {Object.keys(smartVariables).map((varName) => (
                            <div
                              key={varName}
                              className="p-3 rounded-lg bg-[#FF6700]/10 border border-[#FF6700]/30 flex flex-col gap-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-mono text-[#FF6700]">{varName}</p>
                                {editingVar === varName ? null : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVar(varName);
                                      setEditingVarValue(smartVariables[varName] || "");
                                    }}
                                    className="text-gray-300 hover:text-white p-1 rounded"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                              </div>
                              {editingVar === varName ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={editingVarValue}
                                    onChange={(e) => setEditingVarValue(e.target.value)}
                                    className="flex-1 px-2 py-1 text-xs rounded bg-black/40 border border-[#FF6700]/40 text-white outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSmartVariables((prev) => ({
                                        ...prev,
                                        [varName]: editingVarValue,
                                      }));
                                      setEditingVar(null);
                                      setEditingVarValue("");
                                    }}
                                    className="px-2 py-1 text-[10px] rounded bg-[#FF6700] text-black font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVar(null);
                                      setEditingVarValue("");
                                    }}
                                    className="px-2 py-1 text-[10px] rounded bg-gray-700 text-white"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 truncate">
                                  {smartVariables[varName] || "Not set"}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddVarModal(true)}
                          className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#FF6700]/40 text-xs text-[#FF6700] hover:bg-[#FF6700]/10"
                        >
                          <Plus size={12} />
                          Add Custom Variable
                        </button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-400">Change Job:</p>
                        <select
                          value={selectedJob?.id || ""}
                          onChange={(e) => {
                            const job = recentJobs.find(j => j.id === e.target.value);
                            setSelectedJob(job || null);
                          }}
                          className="w-full p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none text-[var(--text-main)]"
                        >
                          <option value="">No Job Selected</option>
                          {recentJobs.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">No job selected</p>
                      <p className="text-sm text-gray-500 mt-2">Select a job to link contract data</p>
                    </div>
                  )}
                </div>
              )}

              {menuTab === "TEMPLATES" && (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowTemplateBuilder(true)}
                    className="w-full p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
                    style={{
                      background: "#FF6700",
                      color: "#000",
                      boxShadow: "0 0 20px rgba(255,103,0,0.4)"
                    }}
                  >
                    <Plus size={20} />
                    Create Template
                  </button>

                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white">{template.label}</h3>
                          {template.is_pinned && <Pin size={14} className="text-[#FF6700]" />}
                        </div>
                        <div className="flex gap-2">
                          {!template.id.startsWith("d") && (
                            <button
                              onClick={() => togglePin(template)}
                              className="p-2 hover:bg-[var(--bg-main)] rounded-lg"
                            >
                              {template.is_pinned ? (
                                <PinOff size={16} className="text-gray-400" />
                              ) : (
                                <Pin size={16} className="text-gray-400" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setContractBody(template.body);
                              setShowMenu(false);
                              showToast("Template applied", "success");
                            }}
                            className="px-3 py-1 bg-[#FF6700] text-black rounded-lg text-xs font-bold"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{template.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {menuTab === "HISTORY" && (
                <div className="space-y-3">
                  {contracts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">No contracts yet</p>
                    </div>
                  ) : (
                    contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[#FF6700] transition-colors cursor-pointer"
                        onClick={() => restoreContract(contract)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-white">{contract.job_name}</h3>
                            <p className="text-sm text-gray-400">{contract.client_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(contract.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Eye size={20} className="text-[#FF6700] flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* TEMPLATE BUILDER MODAL */}
      {showTemplateBuilder && (
        <>
          <div 
            className="fixed inset-0 bg-black/90 z-50"
            onClick={() => {
              setShowTemplateBuilder(false);
              setNewTemplateName("");
              setNewTemplateBody("");
            }}
            style={{ overflow: 'hidden' }}
          />
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none"
            style={{ overflow: 'hidden' }}
          >
            <div 
              className="bg-[var(--bg-card)] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-[#FF6700] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="p-6 border-b border-[#FF6700]/30">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#FF6700]">Create Template</h2>
                <button
                  onClick={() => {
                    setShowTemplateBuilder(false);
                    setNewTemplateName("");
                    setNewTemplateBody("");
                  }}
                  className="p-2 hover:bg-[#FF6700]/10 rounded-lg text-[#FF6700]"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Template Name</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Custom Warranty"
                  className="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none text-white"
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="AUTHORIZATION">Authorization</option>
                  <option value="LEGAL">Legal</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="COMPLETION">Completion</option>
                  <option value="CHANGE">Change Order</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Smart Variables (Click to Add/Remove)</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const isInBody = newTemplateBody.includes("[CUSTOMER]");
                      isInBody ? removeVariableFromTemplate("[CUSTOMER]") : insertVariable("[CUSTOMER]");
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                      newTemplateBody.includes("[CUSTOMER]")
                        ? "bg-[#FF6700] text-black border-2 border-[#FF6700]"
                        : "bg-[#FF6700]/10 text-[#FF6700] border border-[#FF6700]/30"
                    }`}
                  >
                    {newTemplateBody.includes("[CUSTOMER]") && <Check size={12} className="inline mr-1" />}
                    [CUSTOMER]
                  </button>
                  <button
                    onClick={() => {
                      const isInBody = newTemplateBody.includes("[CONTRACTOR]");
                      isInBody ? removeVariableFromTemplate("[CONTRACTOR]") : insertVariable("[CONTRACTOR]");
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                      newTemplateBody.includes("[CONTRACTOR]")
                        ? "bg-[#FF6700] text-black border-2 border-[#FF6700]"
                        : "bg-[#FF6700]/10 text-[#FF6700] border border-[#FF6700]/30"
                    }`}
                  >
                    {newTemplateBody.includes("[CONTRACTOR]") && <Check size={12} className="inline mr-1" />}
                    [CONTRACTOR]
                  </button>
                  {Object.keys(smartVariables).map((varName) => {
                    const isInBody = newTemplateBody.includes(varName);
                    return (
                      <button
                        key={varName}
                        onClick={() => isInBody ? removeVariableFromTemplate(varName) : insertVariable(varName)}
                        className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                          isInBody
                            ? "bg-[#FF6700] text-black border-2 border-[#FF6700]"
                            : "bg-[#FF6700]/10 text-[#FF6700] border border-[#FF6700]/30"
                        }`}
                      >
                        {isInBody && <Check size={12} className="inline mr-1" />}
                        {varName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Template Text</label>
                <textarea
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  placeholder="Enter your contract template..."
                  rows={10}
                  className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none resize-none text-white"
                />
              </div>

              <button
                onClick={saveTemplate}
                className="w-full p-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
                style={{
                  background: "#FF6700",
                  color: "#000",
                  boxShadow: "0 0 20px rgba(255,103,0,0.4)"
                }}
              >
                <Save size={20} />
                Save Template
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-24 right-6 px-6 py-3 rounded-xl font-black shadow-lg ${
          toast.type === "error" ? "bg-red-500 text-white" :
          "bg-[#FF6700] text-black"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* FULL-SCREEN DOCUMENT PREVIEW MODAL */}
      {showDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-black shadow-2xl rounded-xl p-8">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowDocPreview(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            {/* SIGNED watermark */}
            {signedAt && (
              <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center">
                <span
                  className="text-6xl font-black text-[#FF6700]/20"
                  style={{ transform: "rotate(-45deg)" }}
                >
                  SIGNED
                </span>
              </div>
            )}

            {/* Document content */}
            <div className="relative">
              {/* Header */}
              <div className="mb-6 pb-3 border-b-4 border-[#FF6700] flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-wide">FieldDeskOps Contract</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Generated on-site with FieldDeskOps SignOff
                  </p>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl font-semibold mb-4">
                {selectedJob?.title || "Contract Agreement"}
              </h1>

              {/* Parties */}
              <div className="mb-4 text-sm">
                <p className="font-semibold">
                  CUSTOMER: <span className="font-normal">{clientName || "________________"}</span>
                </p>
                <p className="font-semibold mt-1">
                  CONTRACTOR:{" "}
                  <span className="font-normal">{contractorName || "________________"}</span>
                </p>
              </div>

              {/* Body */}
              <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">
                {getDisplayedContractBody()}
              </div>

              {/* Attached photos preview */}
              {attachedPhotos.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm font-semibold mb-3">Attached Photos</p>
                  <div className="grid grid-cols-2 gap-3">
                    {attachedPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="w-full h-32 border border-gray-200 rounded-md overflow-hidden"
                      >
                        <img
                          src={photo.data}
                          alt="Contract photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature section - edit vs signed modes */}
              <div className="mt-10 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold mb-3">Client Signature</p>

                {!signedAt && !docReadOnly ? (
                  <>
                    <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
                      <SignatureCanvas
                        ref={sigPad}
                        onEnd={handleSignatureEnd}
                        canvasProps={{
                          className: "w-full h-32",
                          style: { touchAction: "none" },
                        }}
                        penColor="#000000"
                        backgroundColor="#ffffff"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <RotateCcw size={14} />
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={saveContract}
                        disabled={saving || !contractBody.trim() || !clientName.trim() || !hasSigned}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6700] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition-shadow"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Sign &amp; Save
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full h-32 border border-gray-300 rounded-md bg-white flex items-center justify-center text-gray-400 text-xs">
                      Signed contract on file.
                    </div>
                    {signedAt && (
                      <p className="mt-3 text-xs text-gray-600">
                        Signed: {new Date(signedAt).toLocaleString()}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        // Close and reset to fresh form
                        setShowDocPreview(false);
                        setContractBody("");
                        setClientName("");
                        setContractorName("");
                        setAttachedPhotos([]);
                        setSignedAt(null);
                        setHasSigned(false);
                        setDocReadOnly(false);
                      }}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* NEW JOB MODAL */}
      {showNewJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[#FF6700]/40 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#FF6700] uppercase tracking-wide">
                Create Job
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowNewJobModal(false);
                  setNewJobTitle("");
                  setNewJobCustomer("");
                }}
                className="text-[var(--text-sub)] hover:text-[var(--text-main)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-sub)] uppercase font-bold">
                  Job Title
                </label>
                <input
                  type="text"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="e.g. Roof Replacement - Smith Residence"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-sub)] uppercase font-bold">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={newJobCustomer}
                  onChange={(e) => setNewJobCustomer(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewJobModal(false);
                    setNewJobTitle("");
                    setNewJobCustomer("");
                  }}
                  className="px-3 py-2 rounded-lg text-xs bg-gray-800 text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const title = newJobTitle.trim();
                    if (!title) {
                      showToast("Job title is required", "error");
                      return;
                    }
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) {
                        showToast("You must be logged in", "error");
                        return;
                      }
                      const { data, error } = await supabase
                        .from("jobs")
                        .insert({
                          user_id: user.id,
                          title,
                          customer_name: newJobCustomer.trim() || null,
                          status: "ACTIVE",
                        })
                        .select()
                        .single();
                      if (error) {
                        console.error("Create job error:", error);
                        showToast(`Failed to create job: ${error.message}`, "error");
                        return;
                      }
                      setRecentJobs((prev) => [data, ...prev]);
                      setSelectedJob(data);
                      showToast("Job created", "success");
                      setShowNewJobModal(false);
                      setNewJobTitle("");
                      setNewJobCustomer("");
                    } catch (err) {
                      console.error("Create job unexpected error:", err);
                      showToast("Failed to create job", "error");
                    }
                  }}
                  className="px-3 py-2 rounded-lg text-xs bg-[#FF6700] text-black font-bold hover:shadow-[0_0_10px_rgba(255,103,0,0.4)]"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM VARIABLE MODAL */}
      {showAddVarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[#FF6700]/40 rounded-2xl p-5 shadow-2xl relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-[var(--text-sub)] hover:text-[var(--text-main)]"
              onClick={() => {
                setShowAddVarModal(false);
                setNewVarName("");
                setNewVarValue("");
              }}
            >
              <X size={16} />
            </button>
            <h3 className="text-sm font-bold text-[#FF6700] mb-3 uppercase tracking-wide">
              Add Custom Variable
            </h3>
            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-sub)] uppercase font-bold">
                  Variable Name
                </label>
                <input
                  type="text"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="e.g. DEPOSIT_AMOUNT"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] outline-none"
                />
                <p className="text-[10px] text-[var(--text-sub)]">
                  Brackets will be added automatically, e.g. [DEPOSIT_AMOUNT]
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[var(--text-sub)] uppercase font-bold">
                  Value
                </label>
                <input
                  type="text"
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                  placeholder="$500 deposit"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVarModal(false);
                    setNewVarName("");
                    setNewVarValue("");
                  }}
                  className="px-3 py-2 rounded-lg text-xs bg-gray-800 text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const raw = newVarName.trim().toUpperCase().replace(/\s+/g, "_");
                    if (!raw) {
                      showToast("Variable name required", "error");
                      return;
                    }
                    const key = raw.startsWith("[") && raw.endsWith("]")
                      ? raw
                      : `[${raw}]`;
                    setSmartVariables((prev) => ({
                      ...prev,
                      [key]: newVarValue,
                    }));
                    setShowAddVarModal(false);
                    setNewVarName("");
                    setNewVarValue("");
                  }}
                  className="px-3 py-2 rounded-lg text-xs bg-[#FF6700] text-black font-bold hover:shadow-[0_0_10px_rgba(255,103,0,0.4)]"
                >
                  Save Variable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SITESNAP IMPORT MODAL */}
      {showSiteSnapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-[var(--bg-card)] border border-[#FF6700]/40 rounded-2xl p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#FF6700] uppercase tracking-wide">
                Import from SiteSnap
              </h3>
              <button
                type="button"
                className="text-[var(--text-sub)] hover:text-[var(--text-main)]"
                onClick={() => setShowSiteSnapModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            {(!siteSnapPhotos || siteSnapPhotos.length === 0) ? (
              <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-sub)]">
                No SiteSnap photos found for this job.
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3">
                  {siteSnapPhotos.map((photo) => {
                    const checked = selectedSiteSnap.has(photo.id);
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => {
                          setSelectedSiteSnap((prev) => {
                            const next = new Set(prev);
                            if (next.has(photo.id)) next.delete(photo.id);
                            else next.add(photo.id);
                            return next;
                          });
                        }}
                        className={`relative border rounded-lg overflow-hidden ${
                          checked ? "border-[#FF6700]" : "border-[var(--border-color)]"
                        }`}
                      >
                        <img
                          src={photo.photo_url || photo.photo_data}
                          alt="SiteSnap"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/60 rounded-full w-5 h-5 flex items-center justify-center border border-white/40">
                          <input
                            type="checkbox"
                            readOnly
                            checked={checked}
                            className="accent-[#FF6700]"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-3 flex justify-between items-center text-xs">
                  <p className="text-[var(--text-sub)]">
                    Selected: {selectedSiteSnap.size}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSiteSnapModal(false)}
                      className="px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={selectedSiteSnap.size === 0}
                      onClick={() => {
                        const toAdd = siteSnapPhotos.filter((p) =>
                          selectedSiteSnap.has(p.id)
                        );
                        if (toAdd.length > 0) {
                          setAttachedPhotos((prev) => [
                            ...prev,
                            ...toAdd.map((p) => ({
                              id: `sitesnap-${p.id}`,
                              data: p.photo_url || p.photo_data,
                              timestamp: p.created_at || new Date().toISOString(),
                              sitesnap_photo_id: p.id,
                            })),
                          ]);
                        }
                        setShowSiteSnapModal(false);
                      }}
                      className="px-3 py-2 rounded-lg bg-[#FF6700] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Selected ({selectedSiteSnap.size})
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FULL-SIZE PHOTO VIEWER */}
      {showPhotoViewer && activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4">
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => {
              setShowPhotoViewer(false);
              setActivePhoto(null);
            }}
          >
            <X size={24} />
          </button>
          <div className="max-w-3xl max-h-[90vh]">
            <img
              src={activePhoto.data}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}