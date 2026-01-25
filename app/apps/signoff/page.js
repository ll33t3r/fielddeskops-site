"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Share, Printer, FileText, Calendar, 
  User, Trash2, CheckCircle2, Loader2, X, Lock, ArrowLeft, Menu, 
  Settings, Plus, ChevronDown, FolderOpen, Clock, Copy
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
  const [settingsTab, setSettingsTab] = useState("HISTORY"); // "HISTORY" or "TEMPLATES"
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- JOB & TEMPLATE DATA ---
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  
  // --- FORM STATE ---
  const [selectedJob, setSelectedJob] = useState("");
  const [isCustomJob, setIsCustomJob] = useState(false);
  const [customJobName, setCustomJobName] = useState("");
  const [clientName, setClientName] = useState("");
  const [contractBody, setContractBody] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [savedSignature, setSavedSignature] = useState(null);

  // --- TEMPLATE EDITOR STATE ---
  const [editingTemplate, setEditingTemplate] = useState(null); // {label, body}

  const vibrate = (p = 10) => { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p); };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    // 2. Load Templates (Custom + Defaults)
    const { data: customTemplates } = await supabase.from("contract_templates").select("*").order("created_at", { ascending: false });
    const defaults = [
        { label: "General Service", body: "I, [Client Name], authorize work to begin. Scope: [Details]. Warranty: 30 Days." },
        { label: "Liability Waiver", body: "Customer acknowledges existing conditions. FieldDeskOps not liable for pipe corrosion." }
    ];
    setTemplates([...(customTemplates || []), ...defaults]);
    setLoading(false);
  };

  // --- SIGNATURE ACTIONS ---
  const handleSignatureEnd = () => { if (!sigPad.current.isEmpty()) setHasSigned(true); };
  const clearSignature = () => { sigPad.current.clear(); setHasSigned(false); setIsSigned(false); setSavedSignature(null); };

  const saveContract = async () => {
    const finalProjectName = isCustomJob ? customJobName.toUpperCase() : selectedJob;
    if (!clientName || !contractBody || !finalProjectName) return alert("Missing form details.");
    if (sigPad.current.isEmpty()) return alert("Signature required.");

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const sigBlob = await new Promise(r => sigPad.current.getCanvas().toBlob(r, "image/png"));
    const fileName = `${user.id}/${Date.now()}-sig.png`;
    const { error: upErr } = await supabase.storage.from("signatures").upload(fileName, sigBlob);
    
    let publicUrl = null;
    if (!upErr) publicUrl = supabase.storage.from("signatures").getPublicUrl(fileName).data.publicUrl;

    const { data: newDoc } = await supabase.from("contracts").insert({
        user_id: user.id, client_name: clientName, project_name: finalProjectName,
        contract_body: contractBody, signature_url: publicUrl, status: "SIGNED"
    }).select().single();

    if (newDoc) {
        setContracts([newDoc, ...contracts]);
        setSavedSignature(publicUrl);
        setIsSigned(true);
        setHasSigned(false);
        showToast("Contract Locked & Saved", "success");
    }
    setSaving(false);
  };

  const handleShare = async () => {
    const text = `FIELDDESKOPS AGREEMENT\nProject: ${selectedJob}\nClient: ${clientName}\n\nTerms:\n${contractBody}\n\nStatus: SIGNED`;
    if (navigator.share) {
        await navigator.share({ title: `Agreement: ${clientName}`, text });
    } else {
        navigator.clipboard.writeText(text);
        showToast("Summary Copied to Clipboard", "success");
    }
  };

  const saveNewTemplate = async () => {
      if (!editingTemplate.label || !editingTemplate.body) return;
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("contract_templates").insert({
          user_id: user.id, label: editingTemplate.label, body: editingTemplate.body
      }).select().single();
      if (data) {
          setTemplates([data, ...templates]);
          setEditingTemplate(null);
          showToast("Template Saved", "success");
      }
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  return (
    <div className={`min-h-screen bg-background text-foreground pb-32 ${showSettings ? "overflow-hidden h-screen" : ""}`}>
      
      {/* 1. HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4 no-print">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors"><ArrowLeft size={28} /></Link>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] font-oswald">SignOff</h1>
            <p className="text-xs font-bold tracking-widest opacity-60">CONTRACTS & WAIVERS</p>
          </div>
        </div>
        <button onClick={() => { vibrate(); setShowSettings(true); }} className="industrial-card p-3 rounded-xl text-[#FF6700] border border-zinc-200 dark:border-white/5 shadow-md">
          <Menu size={24} />
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-2">
        
        {/* 2. JOB SELECTOR (Consistency with SiteSnap) */}
        <div className="relative mb-6 no-print" ref={dropdownRef}>
            {isCustomJob ? (
                <div className="flex items-center gap-2 industrial-card bg-zinc-100 dark:bg-zinc-900 border border-[#FF6700] p-4 rounded-xl shadow-lg">
                    <Plus className="text-[#FF6700]" size={20} />
                    <input autoFocus placeholder="NEW PROJECT NAME..." value={customJobName} onChange={e => setCustomJobName(e.target.value.toUpperCase())} onBlur={() => !customJobName && setIsCustomJob(false)} className="bg-transparent text-foreground font-bold uppercase outline-none w-full" />
                    <button onClick={() => setIsCustomJob(false)}><X size={20}/></button>
                </div>
            ) : (
                <>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-card border border-zinc-200 dark:border-white/5 p-4 rounded-xl hover:border-[#FF6700] shadow-md transition-all">
                        <div className="flex items-center gap-3"><FolderOpen className="text-[#FF6700]" size={22} /><span className="font-bold uppercase tracking-wide truncate">{selectedJob || "SELECT PROJECT"}</span></div>
                        <ChevronDown size={20} className={`text-zinc-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-background border border-zinc-200 dark:border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                            <div className="p-2 space-y-1">
                                {recentJobs.map(job => (
                                    <button key={job} onClick={() => { setSelectedJob(job); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-between ${selectedJob === job ? "bg-[#FF6700] text-black" : "text-foreground hover:bg-zinc-100 dark:hover:bg-white/5"}`}>{job}</button>
                                ))}
                                <div className="h-px bg-zinc-200 dark:bg-white/5 my-2" />
                                <button onClick={() => { setIsCustomJob(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm text-[#FF6700] hover:bg-[#FF6700]/10 flex items-center gap-2"><Plus size={18}/> + NEW PROJECT</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* 3. PAPER UI (CONTRACT) */}
        <div id="print-area" className="bg-white text-black p-8 rounded-xl shadow-2xl relative min-h-[80vh] flex flex-col border border-gray-300 print:shadow-none print:border-none">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div><h1 className="text-3xl font-oswald font-bold uppercase">Work Agreement</h1><p className="text-sm font-bold text-gray-500">{new Date().toLocaleDateString()}</p></div>
                {isSigned && <div className="border-4 border-black text-black font-black px-4 py-1 rounded uppercase rotate-[-12deg] opacity-70 text-2xl font-oswald">LOCKED</div>}
            </div>

            <div className="space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-b border-gray-300 pb-2">
                        <label className="block text-[10px] font-black uppercase text-gray-400">Recipient Name</label>
                        {isSigned || hasSigned ? <p className="font-bold text-lg">{clientName}</p> : <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full Name..." className="w-full font-bold text-lg outline-none bg-transparent" />}
                    </div>
                </div>

                <div className="relative">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Terms & Scope</label>
                    {!isSigned && !hasSigned && (
                        <div className="flex gap-2 overflow-x-auto no-print mb-3 pb-2 scrollbar-hide">
                            {templates.map(t => (
                                <button key={t.label} onClick={() => setContractBody(t.body)} className="whitespace-nowrap px-3 py-1 bg-zinc-100 border border-zinc-300 rounded-full text-[10px] font-black hover:bg-[#FF6700] hover:text-black transition uppercase">+ {t.label}</button>
                            ))}
                        </div>
                    )}
                    {isSigned || hasSigned ? (
                        <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{contractBody}</div>
                    ) : (
                        <textarea value={contractBody} onChange={e => setContractBody(e.target.value)} placeholder="Type terms here..." className="w-full h-80 font-mono text-sm leading-relaxed bg-zinc-50/50 p-4 border border-dashed border-gray-300 rounded-lg outline-none focus:border-[#FF6700] transition" />
                    )}
                </div>
            </div>

            <div className="mt-12 border-t-2 border-black pt-6">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Client Signature</label>
                {isSigned ? (
                    <img src={savedSignature} className="h-24 object-contain" alt="Signature" />
                ) : (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-zinc-50 hover:border-[#FF6700] transition">
                        <SignatureCanvas ref={sigPad} penColor="black" onEnd={handleSignatureEnd} canvasProps={{ className: "w-full h-40 cursor-crosshair" }} />
                        <button onClick={clearSignature} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 no-print"><RotateCcw size={18}/></button>
                        {!hasSigned && <p className="absolute bottom-2 right-4 text-[10px] font-black text-gray-300 uppercase pointer-events-none">Sign Here</p>}
                    </div>
                )}
                <p className="text-xs font-black mt-2 uppercase tracking-widest">{clientName || "Signed By Client"}</p>
            </div>
        </div>

        {/* 4. ACTIONS */}
        <div className="mt-8 flex gap-3 no-print">
            {!isSigned ? (
                <button onClick={saveContract} disabled={saving} className="flex-1 bg-[#FF6700] text-black font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2 text-xl">
                    {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={28}/>} LOCK & SAVE
                </button>
            ) : (
                <div className="flex-1 flex gap-3">
                    <button onClick={handleShare} className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] transition flex items-center justify-center gap-2 text-xl">
                        <Share size={24}/> SHARE DOCUMENT
                    </button>
                    <button onClick={() => { setIsSigned(false); setHasSigned(false); setClientName(""); setContractBody(""); }} className="px-8 bg-zinc-800 text-white font-black rounded-2xl hover:bg-red-600 transition">NEW</button>
                </div>
            )}
        </div>
      </main>

      {/* 5. SETTINGS DRAWER (HISTORY & TEMPLATES) */}
      {showSettings && (
          <div className="fixed inset-0 z-[60] animate-in fade-in">
              <div className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowSettings(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-background border-l border-zinc-200 dark:border-white/5 p-6 animate-in slide-in-from-right shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-oswald font-bold text-[#FF6700]">CONFIG</h2>
                      <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 transition"><X/></button>
                  </div>

                  <div className="flex border-b border-zinc-200 dark:border-white/5 mb-6">
                      <button onClick={() => setSettingsTab("HISTORY")} className={`flex-1 pb-3 font-black text-sm tracking-widest transition-all ${settingsTab === "HISTORY" ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-400"}`}>HISTORY</button>
                      <button onClick={() => setSettingsTab("TEMPLATES")} className={`flex-1 pb-3 font-black text-sm tracking-widest transition-all ${settingsTab === "TEMPLATES" ? "text-[#FF6700] border-b-2 border-[#FF6700]" : "text-zinc-400"}`}>TEMPLATES</button>
                  </div>

                  <div className="overflow-y-auto max-h-[70vh] space-y-4 pr-2 custom-scrollbar">
                      {settingsTab === "HISTORY" ? (
                          contracts.length === 0 ? <p className="text-center opacity-20 py-10 italic">No history found</p> : contracts.map(c => (
                              <div key={c.id} className="industrial-card p-4 rounded-xl flex flex-col gap-2 relative group">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold"><Clock size={12}/>{new Date(c.created_at).toLocaleDateString()}</div>
                                      <div className="flex gap-2">
                                          <button onClick={() => { setClientName(c.client_name); setContractBody(c.contract_body); setSelectedJob(c.project_name); setSavedSignature(c.signature_url); setIsSigned(true); setShowSettings(false); }} className="p-1.5 hover:text-[#FF6700] transition"><Eye size={16}/></button>
                                          <button onClick={async () => { if(confirm("Delete?")) { await supabase.from("contracts").delete().eq("id", c.id); setContracts(contracts.filter(x => x.id !== c.id)); } }} className="p-1.5 hover:text-red-500 transition"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                                  <span className="font-bold uppercase text-sm text-[#FF6700]">{c.project_name}</span>
                                  <span className="text-xs font-bold opacity-60 uppercase">{c.client_name}</span>
                              </div>
                          ))
                      ) : (
                          <div className="space-y-6">
                              <button onClick={() => setEditingTemplate({label: "", body: ""})} className="w-full py-3 bg-[#FF6700]/10 border border-dashed border-[#FF6700] text-[#FF6700] rounded-xl font-black text-xs flex items-center justify-center gap-2">+ CREATE NEW TEMPLATE</button>
                              {editingTemplate && (
                                  <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl border border-[#FF6700] space-y-3">
                                      <input placeholder="TEMPLATE NAME (E.G. PLUMBING WAIVER)" value={editingTemplate.label} onChange={e => setEditingTemplate({...editingTemplate, label: e.target.value.toUpperCase()})} className="w-full bg-transparent font-black text-xs outline-none border-b border-zinc-200 dark:border-white/10 pb-2" />
                                      <textarea placeholder="TEMPLATE TERMS..." value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} className="w-full bg-transparent text-xs font-mono h-32 outline-none resize-none" />
                                      <div className="flex gap-2">
                                          <button onClick={saveNewTemplate} className="flex-1 bg-[#FF6700] text-black py-2 rounded-lg font-black text-xs">SAVE</button>
                                          <button onClick={() => setEditingTemplate(null)} className="flex-1 bg-zinc-800 text-white py-2 rounded-lg font-black text-xs">CANCEL</button>
                                      </div>
                                  </div>
                              )}
                              {templates.map(t => (
                                  <div key={t.label} className="industrial-card p-4 rounded-xl flex justify-between items-center">
                                      <span className="font-bold uppercase text-xs truncate max-w-[70%]">{t.label}</span>
                                      <button onClick={() => setContractBody(t.body)} className="p-2 hover:text-[#FF6700] transition" title="Use Template"><Copy size={16}/></button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {toast && <div className="fixed bottom-24 right-6 px-6 py-3 rounded shadow-xl font-black text-white bg-green-600 animate-in slide-in-from-bottom-5 z-[100]">{toast.msg}</div>}
    </div>
  );
}
