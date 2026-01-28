"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Share, Printer, FileText, Calendar, 
  User, Trash2, CheckCircle2, Loader2, X, Lock, ArrowLeft, Menu, 
  Settings, Plus, ChevronDown, FolderOpen, Clock, Copy, Eye, Pencil, Pin, PinOff, 
  Camera, Image as ImageIcon, Maximize2, Check, Search, ListPlus, AlertTriangle,
  DollarSign, Brain, Download, Zap, Filter, ChevronRight
} from "lucide-react";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";

export default function SignOff() {
  const supabase = createClient();
  const sigPad = useRef({});
  const photoInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("HISTORY");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [jobSearch, setJobSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [docType, setDocType] = useState("AGREEMENT");
  
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [allJobPhotos, setAllJobPhotos] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  
  const [linkedEstimate, setLinkedEstimate] = useState(null);
  const [jobBrainData, setJobBrainData] = useState(null);
  const [smartVariables, setSmartVariables] = useState({});
  
  const [selectedJob, setSelectedJob] = useState(null);
  const [isCustomJob, setIsCustomJob] = useState(false);
  const [customJobName, setCustomJobName] = useState("");
  const [clientName, setClientName] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [contractBody, setContractBody] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [savedSignature, setSavedSignature] = useState(null);
  const [partsList, setPartsList] = useState([{ name: "", model: "", qty: "1" }]);
  const [returnReason, setReturnReason] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [workRemaining, setWorkRemaining] = useState("");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("ALL");

  const vibrate = (p = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p);
  };

  useEffect(() => {
    const memory = localStorage.getItem("fdo_last_contractor");
    if (memory) setContractorName(memory);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const clearSignature = () => {
    if (sigPad.current.clear) {
      sigPad.current.clear();
      setHasSigned(false);
      setIsSigned(false);
      setSavedSignature(null);
    }
  };

  const handleSignatureEnd = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) setHasSigned(true);
  };

  const loadJobBrainData = async (jobId) => {
    if (!jobId) return;
    try {
      const { data: job } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      if (job) {
        setJobBrainData(job);
        if (job.customer_name) setClientName(job.customer_name);
        if (job.contractor_name) setContractorName(job.contractor_name);

        const { data: estimate } = await supabase.from("estimates").select("*").eq("job_id", jobId).maybeSingle();
        if (estimate) setLinkedEstimate(estimate);

        const { data: photos } = await supabase.from("photos").select("*").eq("job_id", jobId).order("created_at", { ascending: false });
        if (photos) setAllJobPhotos(photos);

        const vars = {
          "[JOB_NAME]": job.title || "",
          "[CUSTOMER]": job.customer_name || "",
          "[CONTRACTOR]": job.contractor_name || "",
          "[DATE]": new Date().toLocaleDateString(),
          "[PHOTO_COUNT]": job.photo_count || 0,
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
        showToast("🧠 Brain loaded!", "success");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Brain load failed", "error");
    }
  };

  const applySmartVariables = (text) => {
    let result = text;
    Object.keys(smartVariables).forEach((variable) => {
      result = result.split(variable).join(smartVariables[variable]);
    });
    return result;
  };

  const loadAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: history } = await supabase.from("contracts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const { data: jobs } = await supabase.from("jobs").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });

    if (history) setContracts(history);
    if (jobs && jobs.length > 0) {
      setRecentJobs(jobs);
      setSelectedJob(jobs[0]);
      await loadJobBrainData(jobs[0].id);
    }

    const { data: dbTemplates } = await supabase.from("contract_templates").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const defaults = [
      { id: "d1", label: "WORK AUTHORIZATION", body: "I, [CUSTOMER], authorize [CONTRACTOR] to proceed with [JOB_NAME].\n\nTERMS: Payment due upon completion.\nESTIMATED COST: [ESTIMATE_TOTAL]", is_pinned: true, category: "AUTHORIZATION" },
      { id: "d2", label: "LIABILITY WAIVER", body: "[CONTRACTOR] is not responsible for damages resulting from pre-existing conditions discovered during [JOB_NAME].", is_pinned: true, category: "LEGAL" },
      { id: "d3", label: "CHANGE ORDER", body: "The following additional work is authorized for [JOB_NAME]:\n\nORIGINAL ESTIMATE: [ESTIMATE_TOTAL]\nADDITIONAL COST: $______\n\nNEW TOTAL: $______", is_pinned: true, category: "CHANGE" },
      { id: "d4", label: "FINAL ACCEPTANCE", body: "I, [CUSTOMER], confirm that [CONTRACTOR] has completed [JOB_NAME] to my satisfaction.\n\nCOMPLETION DATE: [DATE]\nFINAL AMOUNT: [ESTIMATE_TOTAL]", is_pinned: true, category: "COMPLETION" },
      { id: "d5", label: "PAYMENT SCHEDULE", body: "Payment schedule for [JOB_NAME]:\n\nDEPOSIT: 30% ([ESTIMATE_TOTAL] × 0.3)\nMID-POINT: 40% upon completion of phase 1\nFINAL: 30% upon project completion", is_pinned: false, category: "PAYMENT" },
      { id: "d6", label: "WARRANTY TERMS", body: "[CONTRACTOR] provides a warranty for [JOB_NAME]:\n\nWARRANTY PERIOD: 12 months from [DATE]\nCOVERAGE: All workmanship and materials provided by [CONTRACTOR]", is_pinned: false, category: "LEGAL" }
    ];
    const merged = [...(dbTemplates || [])];
    defaults.forEach((d) => { if (!merged.find((m) => m.label === d.label)) merged.push(d); });
    setTemplates(merged);
    setLoading(false);
  };

  const saveContract = async () => {
    if (!contractBody.trim()) {
      showToast("Add contract text", "error");
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
      const signatureData = sigPad.current.toDataURL();
      
      const processedBody = applySmartVariables(contractBody);

      const { data, error } = await supabase.from("contracts").insert({
        user_id: user.id,
        job_id: selectedJob?.id || null,
        job_name: selectedJob?.title || customJobName,
        client_name: clientName,
        contractor_name: contractorName,
        contract_type: docType,
        contract_body: processedBody,
        signature_data: signatureData,
        photo_ids: selectedPhotos.map(p => p.id),
        parts_list: docType === "PARTS_RETURN" ? partsList : null,
        return_reason: docType === "PARTS_RETURN" ? returnReason : null,
        work_done: docType === "PROGRESS_REPORT" ? workDone : null,
        work_remaining: docType === "PROGRESS_REPORT" ? workRemaining : null,
        created_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;

      localStorage.setItem("fdo_last_contractor", contractorName);
      showToast("✓ Contract saved!", "success");
      
      setContracts([data, ...contracts]);
      clearSignature();
      setContractBody("");
      setSelectedPhotos([]);
      setPartsList([{ name: "", model: "", qty: "1" }]);
      setReturnReason("");
      setWorkDone("");
      setWorkRemaining("");

    } catch (error) {
      console.error("Error:", error);
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const exportToPDF = async (contract) => {
    showToast("PDF export coming soon", "info");
  };

  const filteredTemplates = templates.filter(t => {
    if (templateFilter === "ALL") return true;
    if (templateFilter === "PINNED") return t.is_pinned;
    return t.category === templateFilter;
  });

  const filteredJobs = recentJobs.filter(j =>
    j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.customer_name?.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const filteredHistory = contracts.filter(c =>
    c.job_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(historySearch.toLowerCase())
  );

  useEffect(() => { loadAllData(); }, []);
  useEffect(() => { if (selectedJob?.id) loadJobBrainData(selectedJob.id); }, [selectedJob]);

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
              <h1 className="text-2xl font-bold uppercase text-[#FF6700]">SignOff</h1>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-xl text-[#FF6700] border border-[var(--border-color)]"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 mt-6 space-y-6">
        {/* ESTIMATE LINK CARD */}
        {linkedEstimate && (
          <div className="p-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Zap size={16} />
                  ProfitLock Estimate
                </p>
                <p className="text-xs text-gray-400">{linkedEstimate.service_name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#FF6700]">
                  ${linkedEstimate.total_price?.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">Labor + Materials</p>
              </div>
            </div>
          </div>
        )}

        {/* JOB SELECTOR */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider">Select Job</label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <FileText size={20} className="text-[#FF6700]" />
                {selectedJob ? selectedJob.title : "Custom Job"}
              </span>
              <ChevronDown size={20} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 max-h-96 overflow-auto">
                <div className="p-3 border-b border-[var(--border-color)]">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setIsCustomJob(true);
                    setIsDropdownOpen(false);
                    setJobBrainData(null);
                    setLinkedEstimate(null);
                  }}
                  className="w-full p-4 hover:bg-[var(--bg-main)] flex items-center gap-3 border-b border-[var(--border-color)]"
                >
                  <Plus size={20} className="text-[#FF6700]" />
                  <span>Custom Job</span>
                </button>

                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => {
                      setSelectedJob(job);
                      setIsCustomJob(false);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full p-4 hover:bg-[var(--bg-main)] text-left border-b border-[var(--border-color)] last:border-b-0"
                  >
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-sm text-gray-400">{job.customer_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BRAIN STATUS */}
        {jobBrainData && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <Brain size={24} className="text-purple-400" />
              <div className="flex-1">
                <p className="font-bold text-sm">Brain Active</p>
                <p className="text-xs text-gray-400">Smart variables loaded from {jobBrainData.title}</p>
              </div>
              <CheckCircle2 size={20} className="text-green-400" />
            </div>
          </div>
        )}

        {/* TEMPLATE LIBRARY BUTTON */}
        <button
          onClick={() => setShowTemplateLibrary(true)}
          className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-[#FF6700] transition-colors flex items-center justify-center gap-3"
        >
          <FolderOpen size={20} className="text-[#FF6700]" />
          <span className="font-bold">Template Library</span>
          <span className="text-xs bg-[#FF6700] text-black px-2 py-1 rounded">{templates.length}</span>
        </button>

        {/* CLIENT INFO */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider">Client Name</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter client name"
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none"
          />
        </div>

        {/* CONTRACTOR INFO */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider">Contractor Name</label>
          <input
            type="text"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
            placeholder="Your business name"
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none"
          />
        </div>

        {/* CONTRACT BODY */}
        <div className="space-y-3">
          <label className="text-sm font-bold uppercase tracking-wider">Contract Text</label>
          <textarea
            value={contractBody}
            onChange={(e) => setContractBody(e.target.value)}
            placeholder="Enter contract terms or select a template..."
            rows={10}
            className="w-full p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] outline-none resize-none"
          />
          {jobBrainData && (
            <div className="text-xs text-gray-400">
              <p className="font-bold mb-2">Available variables:</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(smartVariables).map((varName) => (
                  <span key={varName} className="px-2 py-1 bg-[var(--bg-main)] rounded border border-[var(--border-color)]">
                    {varName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIGNATURE PAD */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider">Client Signature</label>
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

        {/* SAVE BUTTON */}
        <button
          onClick={saveContract}
          disabled={saving || !contractBody.trim() || !hasSigned}
          className="w-full p-5 rounded-xl bg-[#FF6700] text-black font-black text-lg uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {saving ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 size={24} />
              Save Contract
            </>
          )}
        </button>
      </main>

      {/* TEMPLATE LIBRARY MODAL */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-[var(--bg-card)] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Template Library</h2>
                <button
                  onClick={() => setShowTemplateLibrary(false)}
                  className="p-2 hover:bg-[var(--bg-main)] rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* FILTER TABS */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {["ALL", "PINNED", "AUTHORIZATION", "LEGAL", "PAYMENT", "COMPLETION", "CHANGE"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTemplateFilter(filter)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-bold ${
                      templateFilter === filter
                        ? "bg-[#FF6700] text-black"
                        : "bg-[var(--bg-main)] text-gray-400"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-xl border border-[var(--border-color)] hover:border-[#FF6700] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{template.label}</h3>
                      {template.is_pinned && <Pin size={14} className="text-[#FF6700]" />}
                    </div>
                    <button
                      onClick={() => {
                        setContractBody(template.body);
                        setShowTemplateLibrary(false);
                        showToast("Template applied", "success");
                      }}
                      className="px-3 py-1 bg-[#FF6700] text-black rounded-lg text-xs font-bold"
                    >
                      Use
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{template.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-[var(--bg-card)] w-full sm:max-w-3xl sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Contract History</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-[var(--bg-main)] rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contracts..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No contracts yet</p>
                </div>
              ) : (
                filteredHistory.map((contract) => (
                  <div
                    key={contract.id}
                    className="p-4 rounded-xl border border-[var(--border-color)] hover:border-[#FF6700] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold">{contract.job_name}</h3>
                        <p className="text-sm text-gray-400">{contract.client_name}</p>
                      </div>
                      <button
                        onClick={() => exportToPDF(contract)}
                        className="p-2 hover:bg-[var(--bg-main)] rounded-lg"
                      >
                        <Download size={20} className="text-[#FF6700]" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(contract.created_at).toLocaleDateString()} • {contract.contract_type}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-24 right-6 px-6 py-3 rounded-xl font-black shadow-lg ${
          toast.type === "error" ? "bg-red-500 text-white" :
          toast.type === "info" ? "bg-blue-500 text-white" :
          "bg-[#FF6700] text-black"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}