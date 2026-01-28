"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Share, Printer, FileText, Calendar, 
  User, Trash2, CheckCircle2, Loader2, X, Lock, ArrowLeft, Menu, 
  Settings, Plus, ChevronDown, FolderOpen, Clock, Copy, Eye, Pencil, Pin, PinOff, 
  Camera, Image as ImageIcon, Maximize2, Check, Search, ListPlus, AlertTriangle,
  DollarSign, Brain
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
          "[PHOTO_COUNT]": job.photo_count || 0
        };

        if (estimate) {
          vars["[ESTIMATE_TOTAL]"] = `$${estimate.total_price?.toFixed(2) || "0.00"}`;
          vars["[ESTIMATE_SERVICE]"] = estimate.service_name || "";
        }

        setSmartVariables(vars);
        showToast("Brain loaded!", "success");
      }
    } catch (error) {
      console.error("Error:", error);
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
      { id: "d1", label: "WORK AUTHORIZATION", body: "I, [CUSTOMER], authorize [CONTRACTOR] to proceed with [JOB_NAME].\n\nTERMS: Payment due upon completion.\nESTIMATED COST: [ESTIMATE_TOTAL]", is_pinned: true },
      { id: "d2", label: "LIABILITY WAIVER", body: "[CONTRACTOR] is not responsible for damages resulting from pre-existing conditions discovered during [JOB_NAME].", is_pinned: true },
      { id: "d3", label: "CHANGE ORDER", body: "The following additional work is authorized for [JOB_NAME]:\n\nORIGINAL ESTIMATE: [ESTIMATE_TOTAL]\nADDITIONAL COST: $______\n\nNEW TOTAL: $______", is_pinned: true },
      { id: "d4", label: "FINAL ACCEPTANCE", body: "I, [CUSTOMER], confirm that [CONTRACTOR] has completed [JOB_NAME] to my satisfaction.\n\nCOMPLETION DATE: [DATE]\nFINAL AMOUNT: [ESTIMATE_TOTAL]", is_pinned: true }
    ];
    const merged = [...(dbTemplates || [])];
    defaults.forEach((d) => { if (!merged.find((m) => m.label === d.label)) merged.push(d); });
    setTemplates(merged);
    setLoading(false);
  };

  useEffect(() => { loadAllData(); }, []);
  useEffect(() => { if (selectedJob?.id) loadJobBrainData(selectedJob.id); }, [selectedJob]);

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]"><Loader2 size={32} className="animate-spin text-[#FF6700]" /></div>);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-32">
      <div className="sticky top-0 z-40 bg-[var(--bg-main)] border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors"><ArrowLeft size={28} /></Link>
            <div><p className="text-[9px] font-bold uppercase tracking-widest text-[#FF6700]">FIELDDESKOPS</p><h1 className="text-2xl font-bold uppercase text-[#FF6700]">SignOff</h1></div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-3 rounded-xl text-[#FF6700] border border-[var(--border-color)]"><Menu size={24} /></button>
        </div>
      </div>
      <main className="max-w-4xl mx-auto px-6 mt-6">
        {linkedEstimate && (<div className="mb-6 p-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/5"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-blue-400">ProfitLock Estimate</p><p className="text-xs">{linkedEstimate.service_name}</p></div><p className="text-2xl font-bold text-[#FF6700]">${linkedEstimate.total_price?.toFixed(2)}</p></div></div>)}
        <div className="text-center py-12"><Brain size={48} className="mx-auto text-[#FF6700] mb-4" /><p className="text-sm">Brain features active</p></div>
      </main>
      {toast && (<div className="fixed bottom-24 right-6 px-6 py-3 rounded font-black bg-[#FF6700] text-black">{toast.msg}</div>)}
    </div>
  );
}