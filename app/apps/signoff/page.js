"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Share, Printer, FileText, Calendar, 
  User, Trash2, CheckCircle2, Loader2, X, Lock, ArrowLeft, Menu, 
  Settings, Plus, ChevronDown, FolderOpen, Clock, Copy, Eye, Pencil, Pin, PinOff, 
  Camera, Image as ImageIcon, Maximize2, Check, Search
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
  const [searchQuery, setSearchQuery] = useState("");

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
  const [contractorName, setContractorName] = useState(""); // LEGAL SAFETY: Defaults to empty
  const [contractBody, setContractBody] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [savedSignature, setSavedSignature] = useState(null);

  const [editingTemplate, setEditingTemplate] = useState(null); 

  const vibrate = (p = 10) => { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p); };

  // --- COMPONENT FUNCTIONS ---

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  const clearSignature = () => {
    if (sigPad.current.clear) {
      sigPad.current.clear();
      setHasSigned(false);
    }
  };

  const handleSignatureEnd = () => { 
    if (sigPad.current && !sigPad.current.isEmpty()) {
      setHasSigned(true);
      vibrate(20);
    }
  };

  const loadProjectPhotos = async (jobName) => {
    if (!jobName || jobName === "SELECT PROJECT") return;
    const { data } = await supabase.from("site_photos").select("image_url, tag, created_at").eq("job_name", jobName).order('created_at', { ascending: false });
    if (data) setAllJobPhotos(data);
  };

  const loadAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: history } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
    const { data: photoData } = await supabase.from("site_photos").select("job_name, created_at");

    if (history || photoData) {
        if (history) setContracts(history);
        
        // Activity-First Sorting: Combine projects from both sources
        const combined = [
          ...(history ? history.map(c => ({ name: c.project_name, date: new Date(c.created_at) })) : []),
          ...(photoData ? photoData.map(p => ({ name: p.job_name, date: new Date(p.created_at) })) : [])
        ];

        // Sort by most recent date, then unique names
        const sortedUnique = combined
          .sort((a, b) => b.date - a.date)
          .reduce((acc, current) => {
            if (!acc.find(item => item === current.name)) acc.push(current.name);
            return acc;
          }, []);

        setRecentJobs(sortedUnique.slice(0, 20));
        if (sortedUnique.length > 0) setSelectedJob(sortedUnique[0]);
    }

    const { data: dbTemplates } = await supabase.from("contract_templates").select("*").order("created_at", { ascending: false });
    const defaults = [
        { id: 'd1', label: "WORK AUTHORIZATION", body: "I, [Client Name], authorize [Contractor Name] to proceed with work. \n\nTERMS: Payment due upon completion.", is_pinned: true },
        { id: 'd2', label: "LIABILITY WAIVER", body: "[Contractor Name] is not responsible for damages resulting from pre-existing conditions or hidden structural weaknesses.", is_pinned: true },
        { id: 'd3', label: "CHANGE ORDER", body: "REVISION: [Contractor Name] is authorized to perform additional work. \n\nCOST INCREASE: $", is_pinned: true },
        { id: 'd4', label: "SITE READINESS", body: "Client acknowledges that work area must be clear for [Contractor Name] by start time.", is_pinned: true },
        { id: 'd5', label: "FINAL ACCEPTANCE", body: "I, [Client Name], confirm that [Contractor Name] has completed work to my satisfaction.", is_pinned: true }
    ];
    const merged = [...(dbTemplates || [])];
    defaults.forEach(d => { if (!merged.find(m => m.label === d.label)) merged.push(d); });
    setTemplates(merged);
    setLoading(false);
  };

  useEffect(() => { loadAllData(); }, []);

  useEffect(() => {
    if (selectedJob) loadProjectPhotos(selectedJob);
  }, [selectedJob]);

  const applySmartTemplate = (templateBody) => {
      vibrate(15);
      let smartText = templateBody.replaceAll("[Client Name]", clientName || "[CLIENT NAME]");
      smartText = smartText.replaceAll("[Contractor Name]", contractorName || "[CONTRACTOR NAME]");
      setContractBody(smartText);
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
    const finalProjectName = isCustomJob ? customJobName.toUpperCase() : selectedJob;
    if (!clientName || !contractBody || !finalProjectName) return alert("Fill out all fields.");
    
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    let publicUrl = null;
    let currentStatus = "DRAFT";

    // Only upload signature if it exists
    if (hasSigned && !isSigned) {
      const sigBlob = await new Promise(r => sigPad.current.getCanvas().toBlob(r, "image/png"));
      const fileName = `${user.id}/sigs/${Date.now()}.png`;
      await supabase.storage.from("signatures").upload(fileName, sigBlob);
      publicUrl = supabase.storage.from("signatures").getPublicUrl(fileName).data.publicUrl;
      currentStatus = "SIGNED";
    }

    const { data: newDoc } = await supabase.from("contracts").insert({
        user_id: user.id, client_name: clientName, project_name: finalProjectName,
        contract_body: contractBody, signature_url: publicUrl, status: currentStatus,
        evidence_urls: selectedPhotos
    }).select().single();

    if (newDoc) {
        setContracts([newDoc, ...contracts]);
        if (!recentJobs.includes(finalProjectName)) setRecentJobs([finalProjectName, ...recentJobs.slice(0, 14)]);
        setSelectedJob(finalProjectName);
        setIsCustomJob(false);
        setCustomJobName("");
        if (currentStatus === "SIGNED") {
          setSavedSignature(publicUrl);
          setIsSigned(true);
          showToast("Agreement Signed & Saved", "success");
        } else {
          showToast("Draft Saved to History", "success");
        }
    }
    setSaving(false);
  };

  const togglePin = async (templateId) => {
      const pinnedCount = templates.filter(t => t.is_pinned).length;
      const target = templates.find(t => t.id === templateId);
      if (!target.is_pinned && pinnedCount >= 5) return alert("Dashboard limit: 5 pinned.");
      const newStatus = !target.is_pinned;
      setTemplates(templates.map(t => t.id === templateId ? {...t, is_pinned: newStatus} : t));
      if (typeof templateId === 'string' && templateId.length > 5) {
          await supabase.from("contract_templates").update({ is_pinned: newStatus }).eq("id", templateId);
      }
  };

  const deleteTemplate = async (template) => {
    if (template.is_pinned) {
      return showToast("Unpin template before deleting", "error");
    }
    if (!confirm("Delete this template permanently?")) return;
    await supabase.from("contract_templates").delete().eq("id", template.id);
    setTemplates(templates.filter(t => t.id !== template.id));
    showToast("Template Deleted", "success");
  };

  const saveNewTemplate = async () => {
    if (!editingTemplate.label || !editingTemplate.body) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("contract_templates").insert({
        user_id: user.id, label: editingTemplate.label.toUpperCase(), body: editingTemplate.body, is_pinned: false
    }).select().single();
    if (data) {
        setTemplates([data, ...templates]);
        setEditingTemplate(null);
        showToast("Template Created", "success");
    }
  };

  // Job Search Logic
  const filteredJobs = recentJobs.filter(j => j.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-32 font-inter ${showPhotoPicker || zoomImage ? 'overflow-hidden' : ''}`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4 no-print">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors"><ArrowLeft size={28} /></Link>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] font-oswald">SignOff</h1>
            <p className="text-xs opacity-60 font-bold tracking-widest uppercase">Agreement Suite</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="industrial-card p-3 rounded-xl text-[#FF6700] border border-[var(--border-color)]">
          <Menu size={24} />
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6">
        
        {/* SEARCHABLE JOB SELECTOR */}
        <div className="relative mb-6 no-print">
            {isCustomJob ? (
                <div className="flex items-center gap-2 industrial-card p-4 rounded-xl border-[#FF6700]">
                    <Plus className="text-[#FF6700]" size={20} />
                    <input autoFocus placeholder="NEW PROJECT NAME..." value={customJobName} onChange={e => setCustomJobName(e.target.value.toUpperCase())} className="bg-transparent text-[var(--text-main)] font-bold uppercase outline-none w-full" />
                    <button onClick={() => setIsCustomJob(false)}><X size={20}/></button>
                </div>
            ) : (
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between industrial-card p-4 rounded-xl hover:border-[#FF6700] shadow-md transition-all">
                    <div className="flex items-center gap-3"><FolderOpen className="text-[#FF6700]" size={22} /><span className="font-bold uppercase tracking-wide truncate">{selectedJob || "SELECT PROJECT"}</span></div>
                    <ChevronDown size={20} className={isDropdownOpen ? "rotate-180" : ""} />
                </button>
            )}
            {isDropdownOpen && !isCustomJob && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[var(--bg-main)] border-2 border-[var(--border-color)] rounded-xl z-50 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center gap-2">
                        <Search size={16} className="text-zinc-500" />
                        <input placeholder="SEARCH JOBS..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent outline-none text-xs font-black w-full uppercase" />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                        {filteredJobs.map(job => (
                            <button key={job} onClick={() => { setSelectedJob(job); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-xs ${selectedJob === job ? "bg-[#FF6700] text-black" : "text-[var(--text-main)] hover:bg-[#FF6700]/10"}`}>{job}</button>
                        ))}
                        <button onClick={() => { setIsCustomJob(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-[#FF6700] font-bold text-xs border-t border-[var(--border-color)] mt-2 pt-3">+ NEW PROJECT</button>
                    </div>
                </div>
            )}
        </div>

        {/* PAPER UI */}
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl relative min-h-[75vh] flex flex-col border border-gray-300">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div><h1 className="text-3xl font-oswald font-bold uppercase tracking-tighter">Agreement</h1><p className="text-sm font-bold text-gray-400 uppercase">{new Date().toLocaleDateString()}</p></div>
                {/* BRAND ORANGE SIGNED STAMP */}
                {(isSigned || hasSigned) && (
                    <div className="border-4 border-[#FF6700] text-[#FF6700] font-black px-4 py-1 rounded uppercase rotate-[-12deg] opacity-90 text-2xl font-oswald flex items-center gap-2">
                        <CheckCircle2 size={24}/> SIGNED
                    </div>
                )}
            </div>

            <div className="space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-b border-gray-200 pb-2 relative">
                        <label className="block text-[10px] font-black uppercase text-gray-400">Recipient (Customer)</label>
                        {isSigned ? (
                           <div className="flex items-center justify-between"><p className="font-bold text-lg uppercase py-1">{clientName}</p><Check size={16} className="text-[#FF6700]"/></div>
                        ) : (
                           <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="CUSTOMER NAME..." className="w-full font-bold text-lg outline-none bg-transparent uppercase" />
                        )}
                    </div>
                    <div className="border-b border-gray-200 pb-2 relative">
                        <label className="block text-[10px] font-black uppercase text-gray-400">Authorized Contractor</label>
                        {isSigned ? (
                           <div className="flex items-center justify-between"><p className="font-bold text-lg uppercase py-1">{contractorName}</p><Check size={16} className="text-[#FF6700]"/></div>
                        ) : (
                           <input value={contractorName} onChange={e => setContractorName(e.target.value.toUpperCase())} placeholder="CO. NAME / LICENSE #" className="w-full font-bold text-lg outline-none bg-transparent uppercase" />
                        )}
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Scope & Terms</label>
                    {!isSigned && (
                        <div className="flex gap-2 overflow-x-auto mb-3 pb-2 scrollbar-hide no-print">
                            {templates.filter(t => t.is_pinned).map(t => (
                                <button key={t.id} onClick={() => applySmartTemplate(t.body)} className="whitespace-nowrap px-3 py-1 bg-zinc-100 border border-zinc-300 rounded-full text-[10px] font-black hover:bg-[#FF6700] transition uppercase">+ {t.label}</button>
                            ))}
                        </div>
                    )}
                    {isSigned ? (
                        <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-zinc-50 rounded border border-gray-100">{contractBody}</div>
                    ) : (
                        <textarea value={contractBody} onChange={e => setContractBody(e.target.value)} placeholder="Type terms here..." className="w-full h-80 font-mono text-sm leading-relaxed bg-zinc-50/50 p-4 border border-dashed border-gray-300 rounded-lg outline-none focus:border-[#FF6700] transition" />
                    )}
                </div>

                <div className="mt-8 border-t border-gray-100 pt-6">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 flex items-center gap-2"><ImageIcon size={14}/> Evidence Attachments</label>
                    <div className="grid grid-cols-4 gap-3">
                        {selectedPhotos.map((url, i) => (
                            <div key={i} className="aspect-square rounded border border-gray-200 overflow-hidden relative shadow-sm group">
                                <img src={url} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(url)} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 border-t-2 border-black pt-6 relative">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Customer Signature</label>
                {isSigned ? <img src={savedSignature} className="h-24 object-contain" alt="Signature" /> : (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-zinc-50 hover:border-[#FF6700] transition">
                        <SignatureCanvas ref={sigPad} penColor="black" onEnd={handleSignatureEnd} canvasProps={{ className: "w-full h-40 cursor-crosshair" }} />
                        <button onClick={clearSignature} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 no-print"><RotateCcw size={18}/></button>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8 flex gap-3 no-print">
            {!isSigned ? (
                <button onClick={saveContract} disabled={saving} className={`flex-1 font-black py-5 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-xl uppercase ${hasSigned ? 'bg-[#FF6700] text-black' : 'bg-zinc-800 text-white opacity-60'}`}>
                    {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={28}/>} {hasSigned ? "Save & Sign" : "Save as Draft"}
                </button>
            ) : (
                <div className="flex-1 flex gap-3">
                    <button onClick={handleShare} className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] transition flex items-center justify-center gap-2 text-xl uppercase"><Share size={24}/> Share PDF</button>
                    <button onClick={() => { setIsSigned(false); setHasSigned(false); setClientName(""); setContractBody(""); setSelectedPhotos([]); }} className="px-8 bg-zinc-800 text-white font-black rounded-2xl">NEW</button>
                </div>
            )}
        </div>
      </main>

      {/* SETTINGS DRAWER */}
      {showSettings && (
          <div className="fixed inset-0 z-[60] animate-in fade-in">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-[var(--bg-main)] border-l border-[var(--border-color)] p-6 animate-in slide-in-from-right shadow-2xl flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-oswald font-bold text-[#FF6700]">SETTINGS</h2>
                      <button onClick={() => setShowSettings(false)} className="p-2 text-[var(--text-main)]"><X/></button>
                  </div>
                  <div className="flex border-b border-[var(--border-color)] mb-6">
                      <button onClick={() => setSettingsTab("HISTORY")} className={`flex-1 pb-3 font-black text-[10px] tracking-widest ${settingsTab === "HISTORY" ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-500"}`}>HISTORY</button>
                      <button onClick={() => setSettingsTab("TEMPLATES")} className={`flex-1 pb-3 font-black text-[10px] tracking-widest ${settingsTab === "TEMPLATES" ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-500"}`}>TEMPLATES</button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {settingsTab === "HISTORY" ? (
                          contracts?.map(c => (
                              <div key={c.id} className="industrial-card p-4 rounded-xl flex flex-col gap-2 relative">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase">
                                      <Clock size={12}/> {new Date(c.created_at).toLocaleString()}
                                      <span className={`px-2 py-0.5 rounded ${c.status === 'SIGNED' ? 'bg-[#FF6700] text-black' : 'bg-zinc-800 text-zinc-400'}`}>{c.status}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <Eye size={18} className="text-[#FF6700] cursor-pointer" onClick={() => { setClientName(c.client_name); setContractBody(c.contract_body); setSelectedJob(c.project_name); setSavedSignature(c.signature_url); setSelectedPhotos(c.evidence_urls || []); setIsSigned(c.status === 'SIGNED'); setShowSettings(false); }} />
                                    </div>
                                  </div>
                                  <span className="font-bold uppercase text-[#FF6700] truncate">{c.project_name}</span>
                                  <span className="text-[10px] font-bold opacity-60 uppercase">{c.client_name}</span>
                              </div>
                          ))
                      ) : (
                          <div className="space-y-4">
                              <button onClick={() => setEditingTemplate({label: "", body: ""})} className="w-full py-4 border-2 border-dashed border-[#FF6700] text-[#FF6700] font-black rounded-xl text-xs">+ CUSTOM TEMPLATE</button>
                              {editingTemplate && (
                                  <div className="industrial-card p-4 rounded-xl space-y-4 border-[#FF6700]">
                                      <input placeholder="TITLE..." value={editingTemplate.label} onChange={e => setEditingTemplate({...editingTemplate, label: e.target.value.toUpperCase()})} className="w-full bg-transparent border-b border-[var(--border-color)] pb-2 font-black text-sm outline-none text-[var(--text-main)]" />
                                      <textarea placeholder="TERMS..." value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} className="w-full bg-transparent h-40 text-xs font-mono outline-none resize-none text-[var(--text-main)]" />
                                      <div className="flex gap-2">
                                          <button onClick={saveNewTemplate} className="flex-1 bg-[#FF6700] text-black font-black py-2 rounded-lg text-xs">SAVE</button>
                                          <button onClick={() => setEditingTemplate(null)} className="flex-1 bg-zinc-800 text-white font-black py-2 rounded-lg text-xs">CANCEL</button>
                                      </div>
                                  </div>
                              )}
                              {templates.map(t => (
                                  <div key={t.id} className={`industrial-card p-4 rounded-xl flex justify-between items-center ${t.is_pinned ? 'border-[#FF6700]' : 'border-[var(--border-color)]'}`}>
                                      <div className="flex flex-col"><span className="font-bold uppercase text-[10px] truncate max-w-[120px]">{t.label}</span>{t.is_pinned && <span className="text-[8px] font-black text-[#FF6700]">PINNED</span>}</div>
                                      <div className="flex gap-1">
                                          <button onClick={() => togglePin(t.id)} className={`p-1.5 rounded ${t.is_pinned ? 'bg-[#FF6700] text-black' : 'bg-zinc-800 text-zinc-500'}`}>{t.is_pinned ? <Pin size={14}/> : <PinOff size={14}/>}</button>
                                          <button onClick={() => deleteTemplate(t)} className={`p-1.5 rounded ${t.is_pinned ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed' : 'bg-red-900/20 text-red-500'}`}><Trash2 size={14}/></button>
                                          <button onClick={() => { applySmartTemplate(t.body); setShowSettings(false); }} className="p-1.5 bg-zinc-800 text-[#FF6700] rounded"><Copy size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {zoomImage && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col animate-in zoom-in duration-150" onClick={() => setZoomImage(null)}>
          <div className="p-6 flex justify-end"><button className="text-white p-2"><X size={40}/></button></div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={zoomImage} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
          </div>
        </div>
      )}

      {toast && <div className={`fixed bottom-24 right-6 px-6 py-3 rounded font-black z-[100] shadow-2xl border-2 ${toast.type === "error" ? "bg-red-600 border-red-700" : "bg-green-600 border-green-700"} text-white`}>{toast.msg}</div>}
    </div>
  );
}
