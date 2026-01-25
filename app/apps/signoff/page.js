"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Share, Printer, FileText, Calendar, 
  User, Trash2, CheckCircle2, Loader2, X, Lock, ArrowLeft, Menu, 
  Settings, Plus, ChevronDown, FolderOpen, Clock, Copy, Eye, Pencil, Pin, PinOff, Briefcase
} from "lucide-react";
import Link from "next/link";
import SignatureCanvas from "react-signature-canvas";

export default function SignOff() {
  const supabase = createClient();
  const sigPad = useRef({});
  const dropdownRef = useRef(null);
  
  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("HISTORY");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- DATA STATE ---
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  
  // --- FORM STATE ---
  const [selectedJob, setSelectedJob] = useState("");
  const [isCustomJob, setIsCustomJob] = useState(false);
  const [customJobName, setCustomJobName] = useState("");
  const [clientName, setClientName] = useState("");
  const [contractorName, setContractorName] = useState("FieldDeskOps"); // Smart Default
  const [contractBody, setContractBody] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [savedSignature, setSavedSignature] = useState(null);

  const [editingTemplate, setEditingTemplate] = useState(null); 

  const vibrate = (p = 10) => { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p); };

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Load History
    const { data: history } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
    if (history) {
        setContracts(history);
        const uniqueJobs = [...new Set(history.map(c => c.project_name))].slice(0, 7);
        setRecentJobs(uniqueJobs);
        if (uniqueJobs.length > 0) setSelectedJob(uniqueJobs[0]);
    }

    // 2. Load Templates
    const { data: dbTemplates } = await supabase.from("contract_templates").select("*").order("created_at", { ascending: false });
    
    // Default system templates (Marked as Pinned by default if DB is empty)
    const defaults = [
        { id: 'd1', label: "WORK AUTHORIZATION", body: "I, [Client Name], authorize [Contractor Name] to proceed with work. \n\nTERMS: Payment due upon completion.", is_pinned: true },
        { id: 'd2', label: "LIABILITY WAIVER", body: "[Contractor Name] is not responsible for damages resulting from pre-existing conditions or hidden structural weaknesses.", is_pinned: true },
        { id: 'd3', label: "CHANGE ORDER", body: "REVISION: [Contractor Name] is authorized to perform additional work. \n\nCOST INCREASE: $", is_pinned: true },
        { id: 'd4', label: "SITE READINESS", body: "Client acknowledges that work area must be clear for [Contractor Name] by start time.", is_pinned: true },
        { id: 'd5', label: "FINAL ACCEPTANCE", body: "I, [Client Name], confirm that [Contractor Name] has completed work to my satisfaction.", is_pinned: true }
    ];

    const all = dbTemplates && dbTemplates.length > 0 ? dbTemplates : defaults;
    setTemplates(all);
    setLoading(false);
  };

  // SMART AUTOFILL LOGIC
  const applySmartTemplate = (templateBody) => {
      vibrate(15);
      let smartText = templateBody;
      smartText = smartText.replaceAll("[Client Name]", clientName || "CLIENT");
      smartText = smartText.replaceAll("[Contractor Name]", contractorName || "CONTRACTOR");
      setContractBody(smartText);
  };

  // PINNING LOGIC (Hard Limit 5)
  const togglePin = async (templateId) => {
      const pinnedCount = templates.filter(t => t.is_pinned).length;
      const target = templates.find(t => t.id === templateId);
      
      if (!target.is_pinned && pinnedCount >= 5) {
          return alert("Max 5 templates allowed on dashboard. Unpin one first.");
      }

      const newPinnedStatus = !target.is_pinned;
      
      // Update Local State
      setTemplates(templates.map(t => t.id === templateId ? {...t, is_pinned: newPinnedStatus} : t));

      // Update Database (if not a default template)
      if (typeof templateId === 'string' && templateId.length > 5) {
          await supabase.from("contract_templates").update({ is_pinned: newPinnedStatus }).eq("id", templateId);
      }
      showToast(newPinnedStatus ? "Template Pinned" : "Template Unpinned", "success");
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
          showToast("Template Saved", "success");
      }
  };

  const handleSignatureEnd = () => { if (!sigPad.current.isEmpty()) setHasSigned(true); };
  const clearSignature = () => { sigPad.current.clear(); setHasSigned(false); setIsSigned(false); setSavedSignature(null); };

  const saveContract = async () => {
    const finalProjectName = isCustomJob ? customJobName.toUpperCase() : selectedJob;
    if (!clientName || !contractBody || !finalProjectName) return alert("Details missing.");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const sigBlob = await new Promise(r => sigPad.current.getCanvas().toBlob(r, "image/png"));
    const fileName = `${user.id}/${Date.now()}-sig.png`;
    await supabase.storage.from("signatures").upload(fileName, sigBlob);
    const publicUrl = supabase.storage.from("signatures").getPublicUrl(fileName).data.publicUrl;

    const { data: newDoc } = await supabase.from("contracts").insert({
        user_id: user.id, client_name: clientName, project_name: finalProjectName,
        contract_body: contractBody, signature_url: publicUrl, status: "SIGNED"
    }).select().single();

    if (newDoc) {
        setContracts([newDoc, ...contracts]);
        setSavedSignature(publicUrl);
        setIsSigned(true);
        showToast("Contract Saved", "success");
    }
    setSaving(false);
  };

  const handleShare = async () => {
    const text = `FIELDDESKOPS AGREEMENT\nJob: ${selectedJob}\nClient: ${clientName}\n\n${contractBody}\n\nStatus: SIGNED`;
    if (navigator.share) await navigator.share({ title: `Agreement: ${clientName}`, text });
    else { navigator.clipboard.writeText(text); showToast("Link Copied", "success"); }
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-32">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors"><ArrowLeft size={28} /></Link>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] font-oswald">SignOff</h1>
            <p className="text-xs opacity-60">CONTRACTS</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="industrial-card p-3 rounded-xl text-[#FF6700] border border-[var(--border-color)]">
          <Menu size={24} />
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6">
        
        {/* JOB SELECTOR */}
        <div className="relative mb-6">
            {isCustomJob ? (
                <div className="flex items-center gap-2 industrial-card p-4 rounded-xl border-[#FF6700]">
                    <Plus className="text-[#FF6700]" size={20} />
                    <input autoFocus placeholder="NEW PROJECT NAME..." value={customJobName} onChange={e => setCustomJobName(e.target.value.toUpperCase())} className="bg-transparent text-[var(--text-main)] font-bold uppercase outline-none w-full" />
                    <button onClick={() => setIsCustomJob(false)}><X size={20}/></button>
                </div>
            ) : (
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between industrial-card p-4 rounded-xl hover:border-[#FF6700] shadow-md">
                    <div className="flex items-center gap-3"><FolderOpen className="text-[#FF6700]" size={22} /><span className="font-bold uppercase tracking-wide truncate">{selectedJob || "SELECT PROJECT"}</span></div>
                    <ChevronDown size={20} className={isDropdownOpen ? "rotate-180" : ""} />
                </button>
            )}
            {isDropdownOpen && !isCustomJob && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[var(--bg-main)] border-2 border-[var(--border-color)] rounded-xl z-50 overflow-hidden shadow-2xl">
                    <div className="p-2 space-y-1">
                        {recentJobs.map(job => (
                            <button key={job} onClick={() => { setSelectedJob(job); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm ${selectedJob === job ? "bg-[#FF6700] text-black" : "text-[var(--text-main)] hover:bg-[#FF6700]/10"}`}>{job}</button>
                        ))}
                        <button onClick={() => { setIsCustomJob(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-[#FF6700] font-bold text-sm">+ NEW PROJECT</button>
                    </div>
                </div>
            )}
        </div>

        {/* PAPER UI */}
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl relative min-h-[70vh] flex flex-col border border-gray-300">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div><h1 className="text-3xl font-oswald font-bold uppercase tracking-tighter">Agreement</h1><p className="text-sm font-bold text-gray-400 uppercase">{new Date().toLocaleDateString()}</p></div>
                {isSigned && <div className="border-4 border-black text-black font-black px-4 py-1 rounded uppercase rotate-[-12deg] opacity-70 text-2xl font-oswald">LOCKED</div>}
            </div>

            <div className="space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-b border-gray-200 pb-2">
                        <label className="block text-[10px] font-black uppercase text-gray-400">Recipient (Customer)</label>
                        {isSigned || hasSigned ? <p className="font-bold text-lg uppercase">{clientName}</p> : <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="CUSTOMER NAME..." className="w-full font-bold text-lg outline-none bg-transparent uppercase" />}
                    </div>
                    <div className="border-b border-gray-200 pb-2">
                        <label className="block text-[10px] font-black uppercase text-gray-400">Authorized Contractor</label>
                        {isSigned || hasSigned ? <p className="font-bold text-lg uppercase">{contractorName}</p> : <input value={contractorName} onChange={e => setContractorName(e.target.value)} placeholder="YOUR COMPANY NAME..." className="w-full font-bold text-lg outline-none bg-transparent uppercase" />}
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Scope of Work & Terms</label>
                    {!isSigned && !hasSigned && (
                        <div className="flex gap-2 overflow-x-auto mb-3 pb-2 scrollbar-hide">
                            {templates.filter(t => t.is_pinned).map(t => (
                                <button key={t.id} onClick={() => applySmartTemplate(t.body)} className="whitespace-nowrap px-3 py-1 bg-zinc-100 border border-zinc-300 rounded-full text-[10px] font-black hover:bg-[#FF6700] transition uppercase">+ {t.label}</button>
                            ))}
                        </div>
                    )}
                    {isSigned || hasSigned ? <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{contractBody}</div> : <textarea value={contractBody} onChange={e => setContractBody(e.target.value)} placeholder="Type scope here..." className="w-full h-80 font-mono text-sm bg-zinc-50 p-4 border border-dashed border-gray-300 rounded-lg outline-none focus:border-[#FF6700] transition" />}
                </div>
            </div>

            <div className="mt-12 border-t-2 border-black pt-6">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Customer Signature</label>
                {isSigned ? <img src={savedSignature} className="h-24 object-contain" /> : (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-zinc-50 hover:border-[#FF6700] transition">
                        <SignatureCanvas ref={sigPad} penColor="black" onEnd={handleSignatureEnd} canvasProps={{ className: "w-full h-40 cursor-crosshair" }} />
                        <button onClick={clearSignature} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 no-print"><RotateCcw size={18}/></button>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8 flex gap-3">
            {!isSigned ? (
                <button onClick={saveContract} disabled={saving} className="flex-1 bg-[#FF6700] text-black font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2 text-xl">
                    {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={28}/>} SAVE & LOCK
                </button>
            ) : (
                <div className="flex-1 flex gap-3">
                    <button onClick={handleShare} className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] transition flex items-center justify-center gap-2 text-xl">
                        <Share size={24}/> SHARE PDF
                    </button>
                    <button onClick={() => { setIsSigned(false); setHasSigned(false); setClientName(""); setContractBody(""); }} className="px-8 bg-zinc-800 text-white font-black rounded-2xl">NEW</button>
                </div>
            )}
        </div>
      </main>

      {/* SETTINGS DRAWER */}
      {showSettings && (
          <div className="fixed inset-0 z-[60] animate-in fade-in">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-[var(--bg-main)] border-l border-[var(--border-color)] p-6 animate-in slide-in-from-right shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-oswald font-bold text-[#FF6700]">CONFIG</h2>
                      <button onClick={() => setShowSettings(false)} className="p-2 text-[var(--text-main)]"><X/></button>
                  </div>
                  <div className="flex border-b border-[var(--border-color)] mb-6">
                      <button onClick={() => setSettingsTab("HISTORY")} className={`flex-1 pb-3 font-black text-xs ${settingsTab === "HISTORY" ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-400"}`}>HISTORY</button>
                      <button onClick={() => setSettingsTab("TEMPLATES")} className={`flex-1 pb-3 font-black text-xs ${settingsTab === "TEMPLATES" ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-400"}`}>TEMPLATES</button>
                  </div>

                  <div className="overflow-y-auto max-h-[70vh] space-y-4 pr-2">
                      {settingsTab === "HISTORY" ? (
                          contracts?.map(c => (
                              <div key={c.id} className="industrial-card p-4 rounded-xl flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                                    <Eye size={16} className="text-[#FF6700] cursor-pointer" onClick={() => { setClientName(c.client_name); setContractBody(c.contract_body); setSelectedJob(c.project_name); setSavedSignature(c.signature_url); setIsSigned(true); setShowSettings(false); }} />
                                  </div>
                                  <span className="font-bold uppercase text-[#FF6700]">{c.project_name}</span>
                                  <span className="text-xs uppercase opacity-60 truncate">{c.client_name}</span>
                              </div>
                          ))
                      ) : (
                          <div className="space-y-4">
                              <button onClick={() => setEditingTemplate({label: "", body: ""})} className="w-full py-4 border-2 border-dashed border-[#FF6700] text-[#FF6700] font-black rounded-xl text-xs">+ CREATE CUSTOM TEMPLATE</button>
                              {editingTemplate && (
                                  <div className="industrial-card p-4 rounded-xl space-y-4 border-[#FF6700]">
                                      <input placeholder="TITLE (E.G. ROOFING)" value={editingTemplate.label} onChange={e => setEditingTemplate({...editingTemplate, label: e.target.value.toUpperCase()})} className="w-full bg-transparent border-b border-[var(--border-color)] pb-2 font-black text-sm outline-none text-[var(--text-main)]" />
                                      <textarea placeholder="TERMS..." value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} className="w-full bg-transparent h-40 text-xs font-mono outline-none resize-none text-[var(--text-main)]" />
                                      <div className="flex gap-2">
                                          <button onClick={saveNewTemplate} className="flex-1 bg-[#FF6700] text-black font-black py-2 rounded-lg text-xs">SAVE</button>
                                          <button onClick={() => setEditingTemplate(null)} className="flex-1 bg-zinc-800 text-white font-black py-2 rounded-lg text-xs">CANCEL</button>
                                      </div>
                                  </div>
                              )}
                              {templates.map(t => (
                                  <div key={t.id} className={`industrial-card p-4 rounded-xl flex justify-between items-center group ${t.is_pinned ? 'border-[#FF6700]' : ''}`}>
                                      <div className="flex flex-col">
                                        <span className="font-bold uppercase text-xs truncate max-w-[180px]">{t.label}</span>
                                        {t.is_pinned && <span className="text-[8px] font-black text-[#FF6700]">PINNED TO DASHBOARD</span>}
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => togglePin(t.id)} className={`p-2 rounded-lg transition ${t.is_pinned ? 'bg-[#FF6700] text-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                            {t.is_pinned ? <Pin size={14}/> : <PinOff size={14}/>}
                                          </button>
                                          <button onClick={() => { applySmartTemplate(t.body); setShowSettings(false); }} className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-[#FF6700] rounded-lg transition"><Copy size={14}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      {toast && <div className="fixed bottom-24 right-6 px-6 py-3 rounded bg-green-600 text-white font-black z-[100] shadow-2xl">{toast.msg}</div>}
    </div>
  );
}
