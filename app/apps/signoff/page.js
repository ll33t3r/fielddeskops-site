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
  const [menuTab, setMenuTab] = useState("BRAIN");
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("CUSTOM");
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [signedAt, setSignedAt] = useState(null);
  const [attachedPhotos, setAttachedPhotos] = useState([]);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  
  const [linkedEstimate, setLinkedEstimate] = useState(null);
  const [jobBrainData, setJobBrainData] = useState(null);
  const [smartVariables, setSmartVariables] = useState({});
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [clientName, setClientName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [contractBody, setContractBody] = useState("");
  const [hasSigned, setHasSigned] = useState(false);

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
      setJobBrainData(null);
      setLinkedEstimate(null);
      return;
    }
    
    try {
      const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      if (job) {
        setJobBrainData(job);
        
        if (job.customer_name) setClientName(job.customer_name);
        if (job.contractor_name) setContractorName(job.contractor_name);
        
        const { data: estimate } = await supabase.from("estimates").select("*").eq("job_id", jobId).maybeSingle();
        if (estimate) setLinkedEstimate(estimate);

        const vars = {
          "[JOB_NAME]": job.title || "",
          "[DATE]": new Date().toLocaleDateString(),
          "[JOB_STATUS]": job.status || "Active",
          "[JOB_ADDRESS]": job.address || ""
        };

        if (estimate) {
          vars["[ESTIMATE_TOTAL]"] = `$${estimate.total_price?.toFixed(2) || "0.00"}`;
          vars["[ESTIMATE_SERVICE]"] = estimate.service_name || "";
          vars["[LABOR_COST]"] = `$${estimate.labor_cost?.toFixed(2) || "0.00"}`;
          vars["[MATERIALS_COST]"] = `$${estimate.materials_cost?.toFixed(2) || "0.00"}`;
        }

        setSmartVariables(vars);
        showToast("🧠 Brain loaded", "success");
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
      
      await loadAllData();
      clearSignature();
      setContractBody("");
      setAttachedPhotos([]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("contract_templates").insert({
        user_id: user.id,
        label: newTemplateName.trim(),
        body: newTemplateBody.trim(),
        category: newTemplateCategory,
        is_pinned: false
      });

      if (error) throw error;

      showToast("Template created!", "success");
      setShowTemplateBuilder(false);
      setNewTemplateName("");
      setNewTemplateBody("");
      setNewTemplateCategory("CUSTOM");
      await loadAllData();

    } catch (error) {
      console.error("Template save error:", error);
      showToast("Template save failed", "error");
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
    // When job changes, clear old data first
    if (selectedJob?.id) {
      // Clear old linked estimate and smart variables
      setLinkedEstimate(null);
      setSmartVariables({});
      // Reset contract body if it contains old job data
      if (contractBody && contractBody.includes("[JOB_NAME]")) {
        setContractBody("");
      }
      // Load new job data
      loadJobBrainData(selectedJob.id);
    } else {
      // Clear everything if no job selected
      setLinkedEstimate(null);
      setSmartVariables({});
      setJobBrainData(null);
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
            onClick={() => {
              // Navigate to command center to create new job
              window.location.href = "/";
            }}
            className="px-3 py-2 bg-[#FF6700] text-black rounded-lg font-bold text-sm hover:shadow-[0_0_10px_rgba(255,103,0,0.4)] transition-all flex items-center gap-1"
          >
            <Plus size={16} />
            New Job
          </button>
        </div>
        {selectedJob && (
          <div className="mt-2 text-xs text-[var(--text-sub)] flex items-center gap-2">
            {selectedJob.customer_name && (
              <>
                <span>{selectedJob.customer_name}</span>
                <span>•</span>
              </>
            )}
            <span className="text-[#FF6700]">Job Linked</span>
          </div>
        )}
      </div>

      <main className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
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

        {/* ATTACH PHOTOS */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Attach Photos
          </label>
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6700] text-black text-sm font-semibold hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition-shadow"
              >
                <Camera size={16} />
                Add Photos
              </button>
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
                JPG/PNG photos. Attach jobsite proof.
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

        {/* CONTRACT BODY WITH LIVE PREVIEW */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Contract Text</label>
          <textarea
            value={contractBody}
            onChange={(e) => setContractBody(e.target.value)}
            placeholder="Enter contract terms or use a pinned template..."
            rows={12}
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none focus:border-[#FF6700] resize-none transition-colors"
          />
          {(clientName || contractorName || Object.keys(smartVariables).length > 0) && contractBody.includes("[") && (
            <button
              type="button"
              onClick={() => setShowDocPreview(true)}
              className="w-full text-left p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              <p className="text-xs font-bold text-blue-400 mb-2">Live Preview:</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{getDisplayedContractBody()}</p>
              <p className="mt-2 text-[10px] text-blue-300 uppercase tracking-wide">
                Click to open full document view
              </p>
            </button>
          )}
        </div>

        {/* SIGNATURE PAD */}
        <div className="space-y-2" id="signoff-signature-pad">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Client Signature</label>
            {hasSigned && (
              <button
                onClick={clearSignature}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <RotateCcw size={14} />
                Clear
              </button>
            )}
          </div>
          <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigPad}
              onEnd={handleSignatureEnd}
              canvasProps={{
                className: "w-full h-48",
                style: { touchAction: "none" }
              }}
              penColor="#000000"
              backgroundColor="#ffffff"
            />
          </div>
        </div>

        {/* SAVE BUTTON - GLOWY ORANGE */}
        <button
          onClick={saveContract}
          disabled={saving || !contractBody.trim() || !hasSigned || !clientName.trim()}
          className="w-full p-5 rounded-xl font-black text-lg uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
          style={{
            background: "#FF6700",
            color: "#000",
            boxShadow: "0 0 20px rgba(255,103,0,0.4), 0 0 40px rgba(255,103,0,0.2)",
            border: "2px solid #FF6700"
          }}
        >
          {saving ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={24} />
              Save Contract
            </>
          )}
        </button>
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
              className="bg-[var(--bg-card)] w-full sm:max-w-3xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-[#FF6700] pointer-events-auto"
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
                {["BRAIN", "TEMPLATES", "HISTORY"].map((tab) => (
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
              {menuTab === "BRAIN" && (
                <div className="space-y-4">
                  {jobBrainData ? (
                    <>
                      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                        <div className="flex items-center gap-3 mb-3">
                          <Brain size={24} className="text-purple-400" />
                          <div>
                            <p className="font-bold text-sm text-white">Job Linked</p>
                            <p className="text-xs text-gray-400">{jobBrainData.title}</p>
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
                        <p className="text-sm font-bold text-gray-400">Smart Variables Available:</p>
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
                              className="p-3 rounded-lg bg-[#FF6700]/10 border border-[#FF6700]/30"
                            >
                              <p className="text-xs font-mono text-[#FF6700]">{varName}</p>
                              <p className="text-xs text-gray-400 truncate">{smartVariables[varName]}</p>
                            </div>
                          ))}
                        </div>
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

              {/* Signature section */}
              <div className="mt-10 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold mb-3">Client Signature</p>
                <div className="w-full h-32 border border-gray-300 rounded-md bg-white flex items-center justify-center text-gray-400 text-xs">
                  Signature will appear here after signing below.
                </div>
                {signedAt && (
                  <p className="mt-3 text-xs text-gray-600">
                    Signed: {new Date(signedAt).toLocaleString()}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowDocPreview(false);
                    // Scroll to signature pad on main page
                    setTimeout(() => {
                      const el = document.querySelector("#signoff-signature-pad");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }, 50);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF6700] text-black font-semibold hover:shadow-[0_0_15px_rgba(255,103,0,0.4)] transition-shadow"
                >
                  <PenTool size={16} />
                  Sign This Document
                </button>
              </div>
            </div>
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