"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import {
  PenTool, Save, RotateCcw, FileText, Calendar, User, Trash2, CheckCircle2, Loader2, X,
  ArrowLeft, Menu, Plus, ChevronDown, Clock, Copy, Eye, Pencil, Pin, PinOff,
  Camera, Image as ImageIcon, Maximize2, Check, DollarSign, Brain, ChevronRight,
} from "lucide-react";
import { baseVarKeys, templates as defaultSignOffTemplates, formTypes } from "../../../src/data/signOffTemplates";
import Link from "next/link";
import SignOffModals from "./SignOffModals";

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
  const [formType, setFormType] = useState("Standard");
  const [customers, setCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const vibrate = (p = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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

      const [contractsRes, jobsRes, templatesRes, customersRes] = await Promise.all([
        supabase.from("contracts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("contract_templates").select("*").eq("user_id", user.id).order("is_pinned", { ascending: false }),
        supabase.from("customers").select("id, name").eq("user_id", user.id).order("name", { ascending: true }),
      ]);

      if (contractsRes.data) setContracts(contractsRes.data);
      if (customersRes.data) setCustomers(customersRes.data || []);
      if (jobsRes.data) {
        setRecentJobs(jobsRes.data);
        if (jobsRes.data.length > 0) {
          setSelectedJob(jobsRes.data[0]);
          await loadJobBrainData(jobsRes.data[0].id);
        }
      }

      const merged = [...(templatesRes.data || [])];
      defaultSignOffTemplates.forEach((d) => {
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
        setSavedSignature(data.signature_data);
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

  const saveTemplate = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    try {
      if (!newTemplateName.trim()) {
        showToast("Missing Name", "error");
        return;
      }
      if (!newTemplateBody.trim()) {
        showToast("Missing template text", "error");
        return;
      }

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
        showToast(error.message || "Template save failed", "error");
        throw error;
      }

      showToast("Template created!", "success");
      setShowTemplateBuilder(false);
      setNewTemplateName("");
      setNewTemplateBody("");
      setNewTemplateCategory("CUSTOM");
      await loadAllData();
    } catch (err) {
      console.error("Template save error:", err);
      showToast(err?.message || "Template save failed", "error");
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
  }, [selectedJob]);

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
            value={selectedJob?.id || "NEW"}
            onChange={(e) => {
              if (e.target.value === "NEW") {
                setShowNewJobModal(true);
              } else {
                const job = recentJobs.find(j => j.id === e.target.value);
                setSelectedJob(job || null);
              }
            }}
            className="flex-1 p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] outline-none focus:border-[#FF6700] transition-colors text-[var(--text-main)]"
          >
            <option value="NEW">+ Create New Job</option>
            <option value="">───────────</option>
            {recentJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
        {/* FORM TYPE */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Form Type</label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
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
            onChange={(e) => setClientName(e.target.value)}
            onFocus={() => setShowCustomerDropdown(true)}
            onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
            placeholder="Search or enter customer name"
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none focus:border-[#FF6700] transition-colors"
          />
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
          {previewExpanded && (clientName || contractorName || Object.keys(smartVariables).length > 0 || contractBody.trim()) && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5">
              <div className="px-4 py-3">
                <p className="text-xs text-blue-400 mb-1">Preview:</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {getDisplayedContractBody()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDocReadOnly(Boolean(signedAt));
                  setShowDocPreview(true);
                }}
                className="w-full text-left px-4 pb-3 text-[10px] text-blue-300 uppercase tracking-wide flex items-center justify-between hover:text-blue-200"
              >
                <span>Open Full Document</span>
                <ChevronRight size={14} />
              </button>
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
                      console.log("Querying photos for job:", selectedJob.id);
                      
                      // Try main photos table first
                      const { data: photoRecords, error: tableError } = await supabase
                        .from("photos")
                        .select("*")
                        .eq("job_id", selectedJob.id)
                        .order("created_at", { ascending: false });
                      
                      console.log("Photo query result:", { photoRecords, tableError });
                      
                      if (tableError) {
                        console.error("Table error:", tableError);
                        showToast(`Database error: ${tableError.message}`, "error");
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
                      setSelectedSiteSnap(new Set());
                      setShowSiteSnapModal(true);
                    } catch (err) {
                      console.error("SiteSnap error:", err);
                      showToast("Failed to load photos", "error");
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

      <SignOffModals
        modal={{
          showMenu, setShowMenu, menuTab, setMenuTab, jobLinkedData, linkedEstimate, smartVariables, baseVarKeys,
          clientName, contractorName, editingVar, setEditingVar, editingVarValue, setEditingVarValue, setSmartVariables,
          setShowAddVarModal, templates, togglePin, setContractBody, vibrate, setShowTemplateBuilder, contracts,
          restoreContract, showTemplateBuilder, setShowTemplateBuilder, newTemplateName, setNewTemplateName,
          newTemplateBody, setNewTemplateBody, newTemplateCategory, setNewTemplateCategory, insertVariable,
          removeVariableFromTemplate, saveTemplate, toast, showDocPreview, setShowDocPreview, signedAt, savedSignature,
          getDisplayedContractBody, attachedPhotos, getPhotoDisplayUrl, docReadOnly, sigPad, handleSignatureEnd,
          clearSignature, saveContract, saving, contractBody, hasSigned, setClientName, setContractorName,
          setAttachedPhotos, setSignedAt, setSavedSignature, setHasSigned, setDocReadOnly, selectedJob,
          showNewJobModal, setShowNewJobModal, newJobTitle, setNewJobTitle, newJobCustomer, setNewJobCustomer,
          showToast, supabase, setRecentJobs, setSelectedJob, showAddVarModal, setShowAddVarModal, newVarName,
          setNewVarName, newVarValue, setNewVarValue, showSiteSnapModal, setShowSiteSnapModal, siteSnapPhotos,
          selectedSiteSnap, setSelectedSiteSnap, showPhotoViewer, activePhoto, setShowPhotoViewer, setActivePhoto,
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