"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Share, Printer, FileText, Calendar, 
  User, Trash2, CheckCircle2, Loader2, X, Lock, ArrowLeft, Menu, 
  Settings, Plus, ChevronDown, FolderOpen, Clock, Copy, Eye
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
  const [jobMetadata, setJobMetadata] = useState({});
  
  // --- FORM STATE ---
  const [selectedJob, setSelectedJob] = useState("");
  const [isCustomJob, setIsCustomJob] = useState(false);
  const [customJobName, setCustomJobName] = useState("");
  const [clientName, setClientName] = useState("");
  const [contractBody, setContractBody] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [savedSignature, setSavedSignature] = useState(null);

  const [editingTemplate, setEditingTemplate] = useState(null);

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

    const { data: history } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
    if (history) {
        setContracts(history);
        const meta = {};
        history.forEach(p => {
            const time = new Date(p.created_at).getTime();
            if (!meta[p.project_name] || time > meta[p.project_name]) meta[p.project_name] = time;
        });
        setJobMetadata(meta);
        const uniqueJobs = [...new Set(history.map(c => c.project_name))].slice(0, 7);
        setRecentJobs(uniqueJobs);
        if (uniqueJobs.length > 0) setSelectedJob(uniqueJobs[0]);
    }

    const { data: customTemplates } = await supabase.from("contract_templates").select("*").order("created_at", { ascending: false });
    const defaults = [
        { label: "General Service", body: "I, [Client Name], authorize work to begin. Scope: [Details]. Warranty: 30 Days." },
        { label: "Liability Waiver", body: "Customer acknowledges existing conditions. FieldDeskOps not liable for pipe corrosion." }
    ];
    setTemplates([...(customTemplates || []), ...defaults]);
    setLoading(false);
  };

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
        setHasSigned(false);
        showToast("Contract Locked", "success");
    }
    setSaving(false);
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] pb-32">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors"><ArrowLeft size={28} /></Link>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700]">SignOff</h1>
            <p className="text-xs opacity-60">CONTRACTS</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="industrial-card p-3 rounded-xl text-[#FF6700] border border-[var(--border-color)]">
          <Menu size={24} />
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6">
        
        {/* JOB SELECTOR - FIXED UI AND BACKGROUND */}
        <div className="relative mb-6" ref={dropdownRef}>
            {isCustomJob ? (
                <div className="flex items-center gap-2 industrial-card p-4 rounded-xl border-[#FF6700]">
                    <Plus className="text-[#FF6700]" size={20} />
                    <input autoFocus placeholder="NEW PROJECT..." value={customJobName} onChange={e => setCustomJobName(e.target.value.toUpperCase())} onBlur={() => !customJobName && setIsCustomJob(false)} className="bg-transparent text-[var(--text-main)] font-bold uppercase outline-none w-full" />
                    <button onClick={() => setIsCustomJob(false)}><X size={20}/></button>
                </div>
            ) : (
                <>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between industrial-card p-4 rounded-xl hover:border-[#FF6700]">
                        <div className="flex items-center gap-3"><FolderOpen className="text-[#FF6700]" size={22} /><span className="font-bold uppercase truncate">{selectedJob || "SELECT PROJECT"}</span></div>
                        <ChevronDown size={20} className={isDropdownOpen ? "rotate-180" : ""} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-[var(--bg-main)] border-2 border-[var(--border-color)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 space-y-1">
                                {recentJobs?.map(job => (
                                    <button key={job} onClick={() => { setSelectedJob(job); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm ${selectedJob === job ? "bg-[#FF6700] text-black" : "hover:bg-[#FF6700]/10 text-[var(--text-main)]"}`}>{job}</button>
                                ))}
                                <div className="h-px bg-[var(--border-color)] my-2" />
                                <button onClick={() => { setIsCustomJob(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm text-[#FF6700] hover:bg-[#FF6700]/10 flex items-center gap-2"><Plus size={18}/> + NEW PROJECT</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* PAPER UI (ALWAYS WHITE) */}
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl relative min-h-[70vh] flex flex-col border border-gray-300">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div><h1 className="text-3xl font-oswald font-bold uppercase">Work Agreement</h1><p className="text-sm font-bold text-gray-500">{new Date().toLocaleDateString()}</p></div>
                {isSigned && <div className="border-4 border-black text-black font-black px-4 py-1 rounded uppercase rotate-[-12deg] opacity-70 text-2xl font-oswald">LOCKED</div>}
            </div>

            <div className="space-y-6 flex-1">
                <div className="border-b border-gray-300 pb-2">
                    <label className="block text-[10px] font-black uppercase text-gray-400">Recipient</label>
                    {isSigned || hasSigned ? <p className="font-bold text-lg">{clientName}</p> : <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Name..." className="w-full font-bold text-lg outline-none bg-transparent" />}
                </div>

                <div className="relative">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Terms</label>
                    {!isSigned && !hasSigned && (
                        <div className="flex gap-2 overflow-x-auto mb-3 pb-2">
                            {templates?.map(t => (
                                <button key={t.label} onClick={() => setContractBody(t.body)} className="whitespace-nowrap px-3 py-1 bg-zinc-100 border border-zinc-300 rounded-full text-[10px] font-black hover:bg-[#FF6700] transition uppercase">+ {t.label}</button>
                            ))}
                        </div>
                    )}
                    {isSigned || hasSigned ? <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{contractBody}</div> : <textarea value={contractBody} onChange={e => setContractBody(e.target.value)} placeholder="Terms..." className="w-full h-64 font-mono text-sm leading-relaxed bg-zinc-50 p-4 border border-dashed border-gray-300 rounded-lg outline-none" />}
                </div>
            </div>

            <div className="mt-12 border-t-2 border-black pt-6">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Signature</label>
                {isSigned ? <img src={savedSignature} className="h-24 object-contain" /> : (
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-zinc-50">
                        <SignatureCanvas ref={sigPad} penColor="black" onEnd={handleSignatureEnd} canvasProps={{ className: "w-full h-40" }} />
                        <button onClick={clearSignature} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><RotateCcw size={18}/></button>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-8 flex gap-3">
            {!isSigned ? (
                <button onClick={saveContract} disabled={saving} className="flex-1 bg-[#FF6700] text-black font-black py-5 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-xl">
                    {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={28}/>} LOCK & SAVE
                </button>
            ) : (
                <button onClick={() => { setIsSigned(false); setHasSigned(false); setClientName(""); setContractBody(""); }} className="w-full bg-zinc-800 text-white font-black py-5 rounded-2xl">NEW DOCUMENT</button>
            )}
        </div>
      </main>

      {/* SETTINGS DRAWER - CRASH PROOFED */}
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
                  <div className="overflow-y-auto max-h-[70vh] space-y-4">
                      {settingsTab === "HISTORY" ? (
                          contracts?.map(c => (
                              <div key={c.id} className="industrial-card p-4 rounded-xl flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                                    <Eye size={16} className="text-[#FF6700]" onClick={() => { setClientName(c.client_name); setContractBody(c.contract_body); setSelectedJob(c.project_name); setSavedSignature(c.signature_url); setIsSigned(true); setShowSettings(false); }} />
                                  </div>
                                  <span className="font-bold uppercase text-[#FF6700]">{c.project_name}</span>
                                  <span className="text-xs uppercase opacity-60">{c.client_name}</span>
                              </div>
                          ))
                      ) : (
                          <div className="space-y-4">
                              {templates?.map(t => (
                                  <div key={t.label} className="industrial-card p-4 rounded-xl flex justify-between items-center">
                                      <span className="font-bold uppercase text-xs">{t.label}</span>
                                      <Copy size={16} className="text-[#FF6700]" onClick={() => { setContractBody(t.body); setShowSettings(false); }} />
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
      {toast && <div className="fixed bottom-24 right-6 px-6 py-3 rounded bg-green-600 text-white font-black z-[100]">{toast.msg}</div>}
    </div>
  );
}
