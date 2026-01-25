"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Share, Printer, FileText, Calendar, 
  User, Trash2, CheckCircle2, Loader2, X, Lock, ArrowLeft, Menu, 
  Settings, Plus, ChevronDown, FolderOpen, Clock, Copy, Eye, Pencil, Pin, PinOff, 
  Camera, Image as ImageIcon, Maximize2, Check, Search, ListPlus, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";

export default function SignOff() {
  const supabase = createClient();
  const sigPad = useRef({});
  const dropdownRef = useRef(null);
  const photoInputRef = useRef(null);
  
  // --- UI STATE ---
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

  // --- DATA STATE ---
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [allJobPhotos, setAllJobPhotos] = useState([]); 
  const [selectedPhotos, setSelectedPhotos] = useState([]); 
  
  // --- FORM STATE ---
  const [selectedJob, setSelectedJob] = useState("");
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

  const vibrate = (p = 10) => { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p); };

  // --- PERSISTENCE: Contractor Identity ---
  useEffect(() => {
    const memory = localStorage.getItem("fdo_last_contractor");
    if (memory) setContractorName(memory);
  }, []);

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  const clearSignature = () => {
    if (sigPad.current.clear) {
      sigPad.current.clear();
      setHasSigned(false);
      setIsSigned(false);
      setSavedSignature(null);
    }
  };

  const handleSignatureEnd = () => { if (sigPad.current && !sigPad.current.isEmpty()) setHasSigned(true); };

  // Fetch Master Job Metadata (Across Apps)
  const syncWithMasterJob = async (jobName) => {
    if (!jobName) return;
    const { data } = await supabase.from("jobs").select("customer_name, contractor_name").eq("job_name", jobName).maybeSingle();
    if (data) {
      if (data.customer_name) setClientName(data.customer_name);
      if (data.contractor_name) setContractorName(data.contractor_name);
    }
  };

  const loadProjectPhotos = async (jobName) => {
    if (!jobName || jobName === "SELECT PROJECT") return;
    const { data } = await supabase.from("site_photos").select("image_url, tag").eq("job_name", jobName).order('created_at', { ascending: false });
    if (data) setAllJobPhotos(data);
  };

  const loadAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: history } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
    const { data: masterJobs } = await supabase.from("jobs").select("job_name").order("updated_at", { ascending: false });

    if (history || masterJobs) {
        if (history) setContracts(history);
        const uniqueJobs = masterJobs ? masterJobs.map(j => j.job_name) : [];
        setRecentJobs(uniqueJobs);
        if (uniqueJobs.length > 0) {
            setSelectedJob(uniqueJobs[0]);
            syncWithMasterJob(uniqueJobs[0]);
        }
    }

    const { data: dbTemplates } = await supabase.from("contract_templates").select("*").order("created_at", { ascending: false });
    const defaults = [
        { id: 'd1', label: "WORK AUTHORIZATION", body: "I, [CUSTOMER], authorize [CONTRACTOR] to proceed. \n\nTERMS: Payment due upon completion.", is_pinned: true },
        { id: 'd2', label: "LIABILITY WAIVER", body: "[CONTRACTOR] is not responsible for damages resulting from pre-existing conditions.", is_pinned: true },
        { id: 'd3', label: "CHANGE ORDER", body: "The following additional work is authorized: \n\nCOST INCREASE: $", is_pinned: true },
        { id: 'd5', label: "FINAL ACCEPTANCE", body: "I, [CUSTOMER], confirm that [CONTRACTOR] has completed work to my satisfaction.", is_pinned: true }
    ];
    const merged = [...(dbTemplates || [])];
    defaults.forEach(d => { if (!merged.find(m => m.label === d.label)) merged.push(d); });
    setTemplates(merged);
    setLoading(false);
  };

  useEffect(() => { loadAllData(); }, []);
  useEffect(() => { 
    if (selectedJob) {
      loadProjectPhotos(selectedJob);
      syncWithMasterJob(selectedJob);
    }
  }, [selectedJob]);

  const renderLiveBody = () => {
    let text = contractBody;
    text = text.replaceAll("[CUSTOMER]", clientName || "__________");
    text = text.replaceAll("[CONTRACTOR]", contractorName || "__________");
    return text;
  };

  const handlePhotoUpload = async (e) => {
      if (!e.target.files?.[0] || !selectedJob) return;
      setSaving(true);
      const file = e.target.files[0];
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${user.id}/${selectedJob.replace(/\s+/g, '_')}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("sitesnap").upload(fileName, file);
      if (!upErr) {
          const publicUrl = supabase.storage.from("sitesnap").getPublicUrl(fileName).data.publicUrl;
          const { data: photoObj } = await supabase.from("site_photos").insert({
              user_id: user.id, job_name: selectedJob, tag: "EVIDENCE", image_url: publicUrl, notes: "Attached via SignOff"
          }).select().single();
          if (photoObj) {
            setAllJobPhotos([photoObj, ...allJobPhotos]);
            setSelectedPhotos([...selectedPhotos, photoObj.image_url]);
            showToast("Photo synced with SiteSnap", "success");
          }
      }
      setSaving(false);
  };

  const togglePhotoSelection = (url) => {
      vibrate(5);
      setSelectedPhotos(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
  };

  const saveContract = async () => {
    const finalJobName = isCustomJob ? customJobName.toUpperCase() : selectedJob;
    if (!finalJobName) return alert("Select a project.");
    const canSave = docType === "PARTS" ? (clientName || contractorName) : (clientName && contractorName);
    if (!canSave) return alert("Fill out names first.");
    
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    localStorage.setItem("fdo_last_contractor", contractorName);

    // 1. UPSERT INTO MASTER JOB TABLE (The Home Source)
    const { data: masterJob } = await supabase.from("jobs").upsert({
      user_id: user.id, job_name: finalJobName, customer_name: clientName, contractor_name: contractorName, updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,job_name' }).select().single();

    let publicUrl = null;
    const finalStatus = hasSigned ? "SIGNED" : "DRAFT";

    if (hasSigned && !isSigned) {
      const sigBlob = await new Promise(r => sigPad.current.getCanvas().toBlob(r, "image/png"));
      const fileName = `${user.id}/sigs/${Date.now()}.png`;
      await supabase.storage.from("signatures").upload(fileName, sigBlob);
      publicUrl = supabase.storage.from("signatures").getPublicUrl(fileName).data.publicUrl;
    }

    const metadata = {
      type: docType,
      parts: docType === "PARTS" ? partsList : null,
      return: docType === "RETURN" ? { reason: returnReason, done: workDone, remaining: workRemaining } : null
    };

    // 2. LINK CONTRACT TO MASTER JOB
    const { data: newDoc } = await supabase.from("contracts").insert({
        user_id: user.id, job_id: masterJob?.id, client_name: clientName, project_name: finalJobName,
        contract_body: docType === "AGREEMENT" ? contractBody : JSON.stringify(metadata), 
        signature_url: publicUrl, status: finalStatus,
        evidence_urls: selectedPhotos
    }).select().single();

    if (newDoc) {
        setContracts([newDoc, ...contracts]);
        setIsCustomJob(false);
        setCustomJobName("");
        if (hasSigned) { setIsSigned(true); setSavedSignature(publicUrl); }
        showToast("Synchronized with Master Job", "success");
    }
    setSaving(false);
  };

  const togglePin = async (templateId) => {
      const pinnedCount = templates.filter(t => t.is_pinned).length;
      const target = templates.find(t => t.id === templateId);
      if (!target.is_pinned && pinnedCount >= 5) return alert("Limit: 5 pinned.");
      const newStatus = !target.is_pinned;
      setTemplates(templates.map(t => t.id === templateId ? {...t, is_pinned: newStatus} : t));
      if (typeof templateId === 'string' && templateId.length > 5) {
          await supabase.from("contract_templates").update({ is_pinned: newStatus }).eq("id", templateId);
      }
  };

  const deleteTemplate = async (t) => {
    if (t.is_pinned) return showToast("Unpin to enable deletion", "error");
    if (!confirm("Delete template?")) return;
    await supabase.from("contract_templates").delete().eq("id", t.id);
    setTemplates(templates.filter(x => x.id !== t.id));
    showToast("Removed", "success");
  };

  const saveNewTemplate = async () => {
    if (!editingTemplate.label || !editingTemplate.body) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("contract_templates").insert({
        user_id: user.id, label: editingTemplate.label.toUpperCase(), body: editingTemplate.body, is_pinned: false
    }).select().single();
    if (data) { setTemplates([data, ...templates]); setEditingTemplate(null); showToast("Created", "success"); }
  };

  const filteredJobs = recentJobs.filter(j => j.toLowerCase().includes(jobSearch.toLowerCase()));
  const filteredHistory = contracts.filter(c => 
    c.client_name?.toLowerCase().includes(historySearch.toLowerCase()) || 
    c.project_name?.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-32 font-inter ${showPhotoPicker || zoomImage ? 'overflow-hidden' : ''}`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4 no-print">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors"><ArrowLeft size={28} /></Link>
          <div><h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] font-oswald">SignOff</h1><p className="text-xs opacity-60 font-black uppercase tracking-tighter">Agreement Engine</p></div>
        </div>
        <button onClick={() => setShowSettings(true)} className="industrial-card p-3 rounded-xl text-[#FF6700] border border-[var(--border-color)] shadow-md transition-transform active:scale-90"><Menu size={24} /></button>
      </div>

      <main className="max-w-4xl mx-auto px-6">
        
        {/* JOB SELECTOR */}
        <div className="relative mb-6 no-print">
            {isCustomJob ? (
                <div className="flex items-center gap-2 industrial-card p-4 rounded-xl border-[#FF6700] shadow-lg animate-in slide-in-from-top duration-200">
                    <Plus className="text-[#FF6700]" size={20} />
                    <input autoFocus placeholder="NEW PROJECT..." value={customJobName} onChange={e => setCustomJobName(e.target.value.toUpperCase())} onBlur={() => !customJobName && setIsCustomJob(false)} className="bg-transparent text-[var(--text-main)] font-bold uppercase outline-none w-full" />
                    <button onClick={() => setIsCustomJob(false)}><X size={20}/></button>
                </div>
            ) : (
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between industrial-card p-4 rounded-xl hover:border-[#FF6700] shadow-sm transition-all">
                    <div className="flex items-center gap-3 text-[var(--text-main)]"><FolderOpen className="text-[#FF6700]" size={22} /><span className="font-bold uppercase tracking-wide truncate">{selectedJob || "SELECT PROJECT"}</span></div>
                    <ChevronDown size={20} className={isDropdownOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                </button>
            )}
            {isDropdownOpen && !isCustomJob && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[var(--bg-main)] border-2 border-[var(--border-color)] rounded-xl z-50 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="p-3 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center gap-2">
                        <Search size={16} className="text-zinc-500" /><input placeholder="SEARCH MASTER LIST..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} className="bg-transparent outline-none text-xs font-black w-full uppercase text-[var(--text-main)]" />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                        {filteredJobs.map(job => (
                            <button key={job} onClick={() => { setSelectedJob(job); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-xs ${selectedJob === job ? "bg-[#FF6700] text-black shadow-md" : "text-[var(--text-main)] hover:bg-[#FF6700]/10 transition-colors"}`}>{job}</button>
                        ))}
                        <button onClick={() => { setIsCustomJob(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-[#FF6700] font-bold text-xs border-t border-[var(--border-color)] mt-2 pt-3">+ NEW PROJECT</button>
                    </div>
                </div>
            )}
        </div>

        {/* DOC SELECTOR */}
        {!isSigned && (
          <div className="flex gap-1 bg-[var(--bg-card)] p-1 rounded-xl mb-4 border border-[var(--border-color)] no-print shadow-sm">
            {["AGREEMENT", "PARTS", "RETURN"].map(type => (
              <button key={type} onClick={() => setDocType(type)} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${docType === type ? 'bg-[#FF6700] text-black shadow-lg' : 'text-zinc-500 hover:text-[var(--text-main)]'}`}>{type}</button>
            ))}
          </div>
        )}

        {/* PAPER UI */}
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl relative min-h-[75vh] flex flex-col border border-gray-300 overflow-hidden">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-3xl font-oswald font-bold uppercase tracking-tight">{docType === "AGREEMENT" ? "Agreement" : docType === "PARTS" ? "Parts Order" : "Return Order"}</h1>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
                </div>
                {isSigned && <div className="border-4 border-[#FF6700] text-[#FF6700] font-black px-4 py-1 rounded uppercase rotate-[-12deg] text-2xl font-oswald flex items-center gap-2 animate-in zoom-in duration-300"><CheckCircle2 size={24}/> SIGNED</div>}
            </div>

            <div className="space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-b border-gray-200 pb-2 relative">
                        <label className="block text-[10px] font-black uppercase text-gray-400">Recipient (Customer)</label>
                        {isSigned ? <p className="font-bold text-lg uppercase py-1">{clientName}</p> : <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="CUSTOMER NAME..." className="w-full font-bold text-lg outline-none bg-transparent uppercase" />}
                    </div>
                    <div className="border-b border-gray-200 pb-2 relative">
                        <label className="block text-[10px] font-black uppercase text-gray-400">Authorized Contractor</label>
                        {isSigned ? <p className="font-bold text-lg uppercase py-1">{contractorName}</p> : <input value={contractorName} onChange={e => setContractorName(e.target.value.toUpperCase())} placeholder="COMPANY / NAME" className="w-full font-bold text-lg outline-none bg-transparent uppercase" />}
                    </div>
                </div>

                {/* MODES */}
                {docType === "AGREEMENT" && (
                  <div className="relative animate-in fade-in duration-300">
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Scope & Terms</label>
                      {!isSigned && (
                          <div className="flex gap-2 overflow-x-auto mb-3 pb-2 no-print scrollbar-hide">
                              {templates.filter(t => t.is_pinned).map(t => (
                                  <button key={t.id} onClick={() => { setContractBody(t.body); vibrate(15); }} className="whitespace-nowrap px-3 py-1 bg-zinc-100 border border-zinc-300 rounded-full text-[10px] font-black hover:bg-[#FF6700] transition shadow-sm uppercase">+ {t.label}</button>
                              ))}
                          </div>
                      )}
                      {isSigned ? <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-zinc-50 rounded border border-gray-100">{renderLiveBody()}</div> : <textarea value={contractBody} onChange={e => setContractBody(e.target.value)} placeholder="Type terms... [CUSTOMER] auto-fills." className="w-full h-80 font-mono text-sm leading-relaxed bg-zinc-50/50 p-4 border border-dashed border-gray-300 rounded-lg outline-none focus:border-[#FF6700] transition" />}
                  </div>
                )}

                {docType === "PARTS" && (
                  <div className="space-y-4 animate-in slide-in-from-right">
                    <label className="block text-[10px] font-black uppercase text-gray-400">Parts Required (INTERNAL)</label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-[8px] font-black text-gray-400 uppercase px-1">
                        <div className="col-span-6">PART NAME</div><div className="col-span-4">MODEL #</div><div className="col-span-2 text-center">QTY</div>
                      </div>
                      {partsList.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center border-b border-gray-100 pb-2 animate-in slide-in-from-left duration-200">
                          <input placeholder="NAME" className="col-span-6 text-xs font-bold uppercase outline-none bg-transparent" value={item.name} onChange={e => { const nl = [...partsList]; nl[idx].name = e.target.value; setPartsList(nl); }} />
                          <input placeholder="SKU" className="col-span-4 text-xs font-mono uppercase outline-none text-gray-400 bg-transparent" value={item.model} onChange={e => { const nl = [...partsList]; nl[idx].model = e.target.value; setPartsList(nl); }} />
                          <input type="number" className="col-span-2 text-xs font-bold text-center outline-none bg-zinc-100 rounded py-1" value={item.qty} onChange={e => { const nl = [...partsList]; nl[idx].qty = e.target.value; setPartsList(nl); }} />
                        </div>
                      ))}
                      {!isSigned && <button onClick={() => setPartsList([...partsList, { name: "", model: "", qty: "1" }])} className="text-[9px] font-black text-[#FF6700] uppercase mt-2 flex items-center gap-1"><Plus size={12}/> Add Line</button>}
                    </div>
                  </div>
                )}

                {docType === "RETURN" && (
                  <div className="space-y-4 animate-in slide-in-from-right">
                    <div><label className="block text-[10px] font-black uppercase text-gray-400">Reason for Return</label><input className="w-full text-sm font-bold uppercase outline-none border-b border-gray-100 py-1" value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="E.G. WEATHER..." /></div>
                    <div><label className="block text-[10px] font-black uppercase text-gray-400">Progress Today</label><textarea className="w-full h-24 text-xs font-mono bg-zinc-50 p-3 rounded outline-none border border-dashed border-gray-200 mt-1" value={workDone} onChange={e => setWorkDone(e.target.value)} placeholder="..." /></div>
                    <div><label className="block text-[10px] font-black uppercase text-gray-400 text-red-500 flex items-center gap-1"><AlertTriangle size={10}/> Pending Tasks</label><textarea className="w-full h-24 text-xs font-mono bg-red-50/30 p-3 rounded outline-none border border-dashed border-red-200 mt-1" value={workRemaining} onChange={e => setWorkRemaining(e.target.value)} placeholder="..." /></div>
                  </div>
                )}

                <div className="mt-8 border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><ImageIcon size={14}/> Evidence Attachments</label>
                        {!isSigned && (
                          <div className="flex gap-2">
                            <button onClick={() => photoInputRef.current.click()} className="text-[10px] font-black text-[#FF6700] uppercase flex items-center gap-1 active:scale-95 transition-transform"><Camera size={12}/> SNAP</button>
                            <button onClick={() => setShowPhotoPicker(true)} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 active:scale-95 transition-transform"><ImageIcon size={12}/> PICKER</button>
                          </div>
                        )}
                        <input type="file" ref={photoInputRef} className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {selectedPhotos.map((url, i) => (
                            <div key={i} className="aspect-square rounded border border-gray-200 overflow-hidden relative shadow-sm group animate-in zoom-in duration-200">
                                <img src={url} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(url)} />
                                {!isSigned && <button onClick={() => setSelectedPhotos(prev => prev.filter(u => u !== url))} className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-600"><X size={10}/></button>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 border-t-2 border-black pt-6 relative">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Signature</label>
                {isSigned ? <img src={savedSignature} className="h-24 object-contain" alt="Signature" /> : (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-zinc-50 hover:border-[#FF6700] transition-colors">
                        <SignatureCanvas ref={sigPad} penColor="black" onEnd={handleSignatureEnd} canvasProps={{ className: "w-full h-40 cursor-crosshair" }} />
                        <button onClick={clearSignature} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 no-print transition-colors"><RotateCcw size={18}/></button>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8 flex gap-3 no-print">
            {!isSigned ? (
                <button onClick={saveContract} disabled={saving} className={`flex-1 font-black py-5 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-xl uppercase ${hasSigned ? 'bg-[#FF6700] text-black shadow-[#FF6700]/30' : 'bg-zinc-800 text-white opacity-80'}`}>
                    {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={28}/>} {hasSigned ? "Save & Sign" : "Save as Draft"}
                </button>
            ) : (
                <div className="flex-1 flex gap-3">
                    <button onClick={() => { 
                      const text = `FDO: ${docType}\nJob: ${selectedJob}\nStatus: SIGNED`;
                      if (navigator.share) navigator.share({ title: `Signed ${docType}`, text });
                      else { navigator.clipboard.writeText(text); showToast("Summary Copied", "success"); }
                    }} className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-xl uppercase hover:bg-blue-700"><Share size={24}/> Share</button>
                    <button onClick={() => { setIsSigned(false); setHasSigned(false); setClientName(""); setContractBody(""); setSelectedPhotos([]); setPartsList([{ name: "", model: "", qty: "1" }]); setDocType("AGREEMENT"); }} className="px-8 bg-zinc-800 text-white font-black rounded-2xl shadow-lg hover:bg-black transition-colors">NEW</button>
                </div>
            )}
        </div>
      </main>

      {/* SETTINGS DRAWER */}
      {showSettings && (
          <div className="fixed inset-0 z-[60] animate-in fade-in duration-200">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-[var(--bg-main)] border-l border-[var(--border-color)] p-6 animate-in slide-in-from-right duration-300 shadow-2xl flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-oswald font-bold text-[#FF6700] tracking-tighter">SETTINGS</h2>
                      <button onClick={() => setShowSettings(false)} className="p-2 text-[var(--text-main)] hover:rotate-90 transition-transform"><X size={28}/></button>
                  </div>
                  <div className="flex border-b border-[var(--border-color)] mb-6">
                      <button onClick={() => setSettingsTab("HISTORY")} className={`flex-1 pb-3 font-black text-[10px] tracking-widest transition-all ${settingsTab === "HISTORY" ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-500"}`}>HISTORY</button>
                      <button onClick={() => setSettingsTab("TEMPLATES")} className={`flex-1 pb-3 font-black text-[10px] tracking-widest transition-all ${settingsTab === "TEMPLATES" ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-500"}`}>TEMPLATES</button>
                  </div>

                  {settingsTab === "HISTORY" ? (
                      <div className="flex-1 flex flex-col min-h-0">
                          <div className="mb-4 relative">
                            <Search className="absolute left-3 top-3 text-zinc-500" size={14} />
                            <input placeholder="SEARCH HISTORY..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-3 pl-9 rounded-lg text-[10px] font-black outline-none text-[var(--text-main)] uppercase focus:border-[#FF6700] transition-colors" />
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                              {filteredHistory.map(c => {
                                  let typeLabel = "AGR";
                                  try { const parsed = JSON.parse(c.contract_body); if (parsed.type) typeLabel = parsed.type.substring(0, 3); } catch(e) {}
                                  return (
                                    <div key={c.id} className="industrial-card p-4 rounded-xl flex flex-col gap-2 border-[var(--border-color)] hover:border-[#FF6700] transition-colors group">
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-500"><Clock size={10}/> {new Date(c.created_at).toLocaleString()}</div>
                                          <div className="flex gap-1 items-center">
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{typeLabel}</span>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded ${c.status === 'SIGNED' ? 'bg-[#FF6700] text-black shadow-sm' : 'bg-[var(--bg-card)] text-zinc-400 border border-[var(--border-color)]'}`}>{c.status}</span>
                                          </div>
                                        </div>
                                        <span className="font-bold uppercase text-[#FF6700] truncate">{c.project_name}</span>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] font-bold opacity-60 uppercase text-[var(--text-main)]">{c.client_name || "Internal"}</span>
                                          <Eye size={18} className="text-[#FF6700] cursor-pointer hover:scale-110 transition" onClick={() => { 
                                            setClientName(c.client_name); 
                                            try {
                                                const parsed = JSON.parse(c.contract_body);
                                                if (parsed.type) setDocType(parsed.type);
                                                if (parsed.parts) setPartsList(parsed.parts);
                                                if (parsed.return) {
                                                    setReturnReason(parsed.return.reason);
                                                    setWorkDone(parsed.return.done);
                                                    setWorkRemaining(parsed.return.remaining);
                                                }
                                            } catch(e) {
                                                setContractBody(c.contract_body);
                                                setDocType("AGREEMENT");
                                            }
                                            setSelectedJob(c.project_name); 
                                            setSavedSignature(c.signature_url); 
                                            setSelectedPhotos(c.evidence_urls || []); 
                                            setIsSigned(c.status === 'SIGNED'); 
                                            setShowSettings(false); 
                                          }} />
                                        </div>
                                    </div>
                                  );
                              })}
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-4 overflow-y-auto flex-1">
                          <button onClick={() => setEditingTemplate({label: "", body: ""})} className="w-full py-4 border-2 border-dashed border-[#FF6700] text-[#FF6700] font-black rounded-xl text-xs hover:bg-[#FF6700]/5 transition-all shadow-sm">+ NEW TEMPLATE</button>
                          {editingTemplate && (
                              <div className="industrial-card p-4 rounded-xl space-y-4 border-[#FF6700] animate-in zoom-in-95 duration-200">
                                  <input placeholder="TEMPLATE TITLE..." value={editingTemplate.label} onChange={e => setEditingTemplate({...editingTemplate, label: e.target.value.toUpperCase()})} className="w-full bg-transparent border-b border-[var(--border-color)] pb-2 font-black text-sm outline-none text-[var(--text-main)]" />
                                  <div className="flex gap-2">
                                    <button onClick={() => setEditingTemplate({...editingTemplate, body: editingTemplate.body + " [CUSTOMER]"})} className="bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] text-[8px] font-black px-2 py-1 rounded shadow-sm hover:border-[#FF6700] transition-colors active:scale-95">+ CUSTOMER</button>
                                    <button onClick={() => setEditingTemplate({...editingTemplate, body: editingTemplate.body + " [CONTRACTOR]"})} className="bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] text-[8px] font-black px-2 py-1 rounded shadow-sm hover:border-[#FF6700] transition-colors active:scale-95">+ COMPANY</button>
                                  </div>
                                  <textarea placeholder="TERMS... use [CUSTOMER] to auto-insert names." value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} className="w-full bg-transparent h-40 text-xs font-mono outline-none resize-none text-[var(--text-main)]" />
                                  <div className="flex gap-2"><button onClick={saveNewTemplate} className="flex-1 bg-[#FF6700] text-black font-black py-2 rounded-lg text-xs hover:bg-[#ff8533] transition-colors">SAVE</button><button onClick={() => setEditingTemplate(null)} className="flex-1 bg-zinc-800 text-white font-black py-2 rounded-lg text-xs">CANCEL</button></div>
                              </div>
                          )}
                          {templates.map(t => (
                              <div key={t.id} className={`industrial-card p-4 rounded-xl flex justify-between items-center border-[var(--border-color)] transition-colors ${t.is_pinned ? 'border-[#FF6700]' : ''}`}>
                                  <div className="flex flex-col"><span className="font-bold uppercase text-[10px] truncate max-w-[120px] text-[var(--text-main)]">{t.label}</span>{t.is_pinned && <span className="text-[8px] font-black text-[#FF6700] flex items-center gap-1"><Pin size={8}/> PINNED</span>}</div>
                                  <div className="flex gap-1">
                                      <button onClick={() => togglePin(t.id)} className={`p-1.5 rounded-lg transition-all ${t.is_pinned ? 'bg-[#FF6700] text-black shadow-md' : 'bg-[var(--bg-card)] text-zinc-500 border border-[var(--border-color)]'}`}>{t.is_pinned ? <Pin size={14}/> : <PinOff size={14}/>}</button>
                                      <button onClick={() => deleteTemplate(t)} className={`p-2 rounded-lg transition-colors ${t.is_pinned ? 'opacity-20 cursor-not-allowed' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-900/50 hover:bg-red-500 hover:text-white'}`}><Trash2 size={14}/></button>
                                      <button onClick={() => { setContractBody(t.body); setShowSettings(false); }} className="p-2 bg-[var(--bg-card)] text-[#FF6700] border border-[#FF6700]/30 rounded-lg hover:bg-[#FF6700] hover:text-black transition-all shadow-sm"><Copy size={14}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* PHOTO PICKER MODAL */}
      {showPhotoPicker && (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-main)] flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
            <h2 className="text-xl font-oswald font-bold text-[#FF6700] tracking-tighter">PHOTO VAULT</h2>
            <button onClick={() => setShowPhotoPicker(false)} className="p-2 text-[var(--text-main)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={32}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
            {allJobPhotos.map((photo, i) => {
              const isPicked = selectedPhotos.includes(photo.image_url);
              return (
                <div key={i} className={`relative aspect-[4/3] rounded-xl overflow-hidden border-4 transition-all duration-200 ${isPicked ? 'border-[#FF6700] scale-95 shadow-lg' : 'border-transparent'}`} onClick={() => togglePhotoSelection(photo.image_url)}>
                  <img src={photo.image_url} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase backdrop-blur-sm">{photo.tag}</div>
                  {isPicked && <div className="absolute inset-0 bg-[#FF6700]/20 flex items-center justify-center"><CheckCircle2 className="text-white bg-[#FF6700] rounded-full p-1 shadow-xl" size={48}/></div>}
                  <button onClick={(e) => { e.stopPropagation(); setZoomImage(photo.image_url); }} className="absolute bottom-2 right-2 p-2 bg-black/60 text-white rounded-lg hover:bg-[#FF6700] transition-colors"><Maximize2 size={16}/></button>
                </div>
              );
            })}
          </div>
          <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
            <button onClick={() => setShowPhotoPicker(false)} className="w-full bg-[#FF6700] text-black font-black py-5 rounded-xl uppercase shadow-lg active:scale-95 transition-transform text-lg">ATTACH ({selectedPhotos.length})</button>
          </div>
        </div>
      )}

      {/* ZOOM LIGHTBOX */}
      {zoomImage && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col animate-in zoom-in duration-200" onClick={() => setZoomImage(null)}>
          <div className="p-6 flex justify-end"><button className="text-white p-2 hover:rotate-90 transition-transform"><X size={40}/></button></div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={zoomImage} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl shadow-black/50" />
          </div>
        </div>
      )}

      {toast && <div className={`fixed bottom-24 right-6 px-6 py-3 rounded font-black z-[100] shadow-2xl border-2 ${toast.type === "error" ? "bg-red-600 border-red-700 text-white" : "bg-[#FF6700] border-[#cc5200] text-black"} animate-in slide-in-from-right`}>{toast.msg}</div>}
    </div>
  );
}
