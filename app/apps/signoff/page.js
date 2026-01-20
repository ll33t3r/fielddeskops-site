"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  PenTool, Save, RotateCcw, Download, Printer, 
  FileText, Calendar, User, Trash2, CheckCircle2, Loader2, X, Lock 
} from "lucide-react";
import Header from "../../components/Header";
import SignatureCanvas from "react-signature-canvas";

export default function SignOff() {
  const supabase = createClient();
  const sigPad = useRef({});
  const containerRef = useRef(null);
  
  // STATE
  const [activeTab, setActiveTab] = useState("NEW"); // "NEW" or "HISTORY"
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // FORM STATE
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [contractBody, setContractBody] = useState("");
  
  // STATUS STATE
  const [isSigned, setIsSigned] = useState(false); // Database Saved State
  const [hasSigned, setHasSigned] = useState(false); // Temporary "Wet Ink" State (Locks Form)
  const [savedSignature, setSavedSignature] = useState(null); 

  // TEMPLATES
  const TEMPLATES = [
    { label: "General Service", text: "I, [Client Name], authorize [Your Company] to perform the following work: \n\n1. Scope: \n2. Payment Terms: 50% Deposit, 50% Completion.\n3. Warranty: 30-Day Labor Warranty." },
    { label: "Change Order", text: "CHANGE ORDER REQUEST\n\nOriginal Contract Date: \nAdditional Work Required: \n\nAdditional Cost: $\nNew Completion Date: " },
    { label: "Liability Waiver", text: "I acknowledge that construction work involves risk. I hereby release [Your Company] from liability regarding..." }
  ];

  useEffect(() => { loadHistory(); }, []);

  // --- DATA LOGIC ---
  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("contracts").select("*").order("created_at", { ascending: false });
    if (data) setContracts(data);
  };

  const applyTemplate = (text) => {
    if(contractBody && !confirm("Overwrite current text?")) return;
    setContractBody(text);
  };

  // --- SIGNATURE LOGIC ---
  
  // Triggered when user lifts finger
  const handleSignatureEnd = () => {
      if (!sigPad.current.isEmpty()) {
          setHasSigned(true); // Lock the form
      }
  };

  const clearSignature = () => {
    sigPad.current.clear();
    setHasSigned(false); // Unlock the form
    setIsSigned(false);
    setSavedSignature(null);
  };

  const saveContract = async () => {
    if (!clientName || !contractBody) return alert("Please fill out Client Name and Contract Text.");
    if (sigPad.current.isEmpty()) return alert("Please sign the document.");

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Upload Signature Image
    const sigBlob = await new Promise(resolve => sigPad.current.getCanvas().toBlob(resolve, 'image/png'));
    const fileName = `${user.id}/${Date.now()}-sig.png`;
    
    const { error: uploadError } = await supabase.storage.from("signatures").upload(fileName, sigBlob);
    
    let publicUrl = null;
    if (!uploadError) {
        const { data } = supabase.storage.from("signatures").getPublicUrl(fileName);
        publicUrl = data.publicUrl;
    }

    // 2. Save to DB
    const { data: newContract, error } = await supabase.from("contracts").insert({
        user_id: user.id,
        client_name: clientName,
        project_name: projectName || "Untitled Project",
        contract_body: contractBody,
        signature_url: publicUrl,
        status: "SIGNED"
    }).select().single();

    if (newContract) {
        setContracts([newContract, ...contracts]);
        setSavedSignature(publicUrl);
        setIsSigned(true);
        setHasSigned(false); // Reset temp state as it is now permanently saved
    } else {
        alert("Error saving: " + error.message);
    }
    setSaving(false);
  };

  const deleteContract = async (id) => {
      if(!confirm("Delete this document?")) return;
      await supabase.from("contracts").delete().eq("id", id);
      setContracts(contracts.filter(c => c.id !== id));
  };

  const printContract = () => {
      window.print();
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#121212] text-white font-inter pb-32 print:bg-white print:text-black">
      <style jsx global>{`
        @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <Header title="SIGNOFF" backLink="/" />
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-4">
        
        {/* TABS */}
        <div className="flex bg-[#1a1a1a] p-1 rounded-xl mb-6 border border-white/10 no-print">
            <button onClick={() => setActiveTab("NEW")} className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide transition-all ${activeTab === "NEW" ? "bg-[#FF6700] text-black shadow-lg" : "text-gray-500 hover:text-white"}`}>
                NEW DOCUMENT
            </button>
            <button onClick={() => setActiveTab("HISTORY")} className={`flex-1 py-3 rounded-lg font-bold font-oswald tracking-wide transition-all ${activeTab === "HISTORY" ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"}`}>
                HISTORY
            </button>
        </div>

        {/* === NEW CONTRACT TAB === */}
        {activeTab === "NEW" && (
            <div id="print-area" className="animate-in fade-in slide-in-from-left-4">
                
                {/* PAPER CONTAINER */}
                <div className="bg-[#e5e5e5] text-black p-8 rounded-xl shadow-2xl relative min-h-[80vh] flex flex-col justify-between print:shadow-none print:rounded-none">
                    
                    {/* Header Details */}
                    <div>
                        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                            <div>
                                <h1 className="text-3xl font-oswald font-bold tracking-wide">AGREEMENT / FORM</h1>
                                <p className="text-sm text-gray-600 mt-1">{new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                {isSigned ? (
                                    <div className="border-4 border-black text-black font-bold px-4 py-1 rounded uppercase rotate-[-10deg] opacity-80 text-xl font-oswald tracking-widest">SIGNED DOCUMENT</div>
                                ) : (
                                    <div className="bg-black text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">DRAFT</div>
                                )}
                            </div>
                        </div>

                        {/* Inputs - LOCKED if Signed OR hasSigned (Wet Ink) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Client / Recipient</label>
                                {isSigned || hasSigned ? (
                                    <div className="font-bold text-lg border-b border-gray-300 py-2 flex justify-between items-center">
                                        {clientName}
                                        {hasSigned && !isSigned && <Lock size={14} className="text-gray-400"/>}
                                    </div>
                                ) : (
                                    <input 
                                        className="w-full bg-white border-b-2 border-gray-300 p-2 font-bold focus:border-[#FF6700] outline-none transition" 
                                        placeholder="Enter Name..."
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase mb-1 text-gray-500">Project / Title</label>
                                {isSigned || hasSigned ? (
                                    <div className="font-bold text-lg border-b border-gray-300 py-2 flex justify-between items-center">
                                        {projectName}
                                        {hasSigned && !isSigned && <Lock size={14} className="text-gray-400"/>}
                                    </div>
                                ) : (
                                    <input 
                                        className="w-full bg-white border-b-2 border-gray-300 p-2 font-bold focus:border-[#FF6700] outline-none transition" 
                                        placeholder="e.g. Work Authorization"
                                        value={projectName}
                                        onChange={e => setProjectName(e.target.value)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Templates (Hidden if Signed OR hasSigned) */}
                        {!isSigned && !hasSigned && (
                            <div className="flex gap-2 mb-4 overflow-x-auto no-print pb-2">
                                {TEMPLATES.map(t => (
                                    <button key={t.label} onClick={() => applyTemplate(t.text)} className="whitespace-nowrap px-3 py-1 bg-white border border-gray-300 rounded text-xs font-bold hover:bg-gray-100 transition">
                                        + {t.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Body - LOCKED if Signed OR hasSigned */}
                        <div className="mb-8 relative">
                            <label className="block text-xs font-bold uppercase mb-2 text-gray-500">Terms / Details</label>
                            {isSigned || hasSigned ? (
                                <div className="whitespace-pre-wrap font-mono text-sm bg-white p-4 border rounded relative">
                                    {contractBody}
                                    {hasSigned && !isSigned && (
                                        <div className="absolute top-2 right-2 text-red-500/50 flex items-center gap-1 text-[10px] font-bold uppercase no-print">
                                            <Lock size={12}/> Locked
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <textarea 
                                    className="w-full h-64 bg-white border border-gray-300 rounded p-4 font-mono text-sm focus:border-[#FF6700] outline-none resize-none shadow-inner"
                                    placeholder="Type terms or details here..."
                                    value={contractBody}
                                    onChange={e => setContractBody(e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Signature Area */}
                    <div className="border-t-2 border-black pt-6">
                        <div className="flex justify-between items-end">
                            <div className="w-full">
                                <label className="block text-xs font-bold uppercase mb-2 text-gray-500">Signature</label>
                                
                                {isSigned ? (
                                    <img src={savedSignature} alt="Signature" className="h-24 object-contain border-b border-black w-1/2" />
                                ) : (
                                    <div ref={containerRef} className="relative border-2 border-dashed border-gray-400 rounded bg-white hover:border-[#FF6700] transition">
                                        <SignatureCanvas 
                                            ref={sigPad}
                                            penColor="black"
                                            onEnd={handleSignatureEnd}
                                            velocityFilterWeight={0.7} 
                                            minWidth={1.5}
                                            maxWidth={3.5}
                                            canvasProps={{
                                                className: "w-full rounded cursor-crosshair",
                                                style: { width: '100%', height: '160px' } 
                                            }} 
                                        />
                                        <button onClick={clearSignature} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 no-print" title="Clear Signature & Unlock Form">
                                            <RotateCcw size={16}/>
                                        </button>
                                        {!hasSigned && <div className="absolute bottom-2 right-2 text-[10px] text-gray-300 pointer-events-none uppercase font-bold tracking-widest no-print">Sign Above</div>}
                                    </div>
                                )}
                                
                                <p className="text-xs font-bold mt-2 uppercase tracking-wider">{clientName || "Signed By"}</p>
                            </div>
                        </div>
                    </div>

                    {/* BRANDING FOOTER */}
                    <div className="mt-12 text-center opacity-40">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                             POWERED BY FIELDDESKOPS
                        </p>
                    </div>

                </div>

                {/* Actions Bar */}
                <div className="mt-6 flex gap-3 no-print">
                    {!isSigned ? (
                        <button onClick={saveContract} disabled={saving} className="flex-1 bg-[#FF6700] text-black font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={24}/>}
                            COMPLETE & SAVE
                        </button>
                    ) : (
                        <div className="flex-1 flex gap-3">
                            <button onClick={printContract} className="flex-1 bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-gray-200 transition flex items-center justify-center gap-2">
                                <Printer size={24}/> PRINT / PDF
                            </button>
                            <button onClick={() => { setIsSigned(false); setHasSigned(false); setSavedSignature(null); }} className="px-6 bg-[#333] text-white rounded-xl font-bold hover:bg-red-600 transition">
                                NEW
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === HISTORY TAB === */}
        {activeTab === "HISTORY" && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-4 pb-20">
                {contracts.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">No documents saved yet.</div>
                ) : contracts.map(c => (
                    <div key={c.id} className="glass-panel p-4 rounded-xl flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                                <FileText className="text-[#FF6700]" size={24}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">{c.project_name}</h3>
                                <p className="text-xs text-gray-400 flex items-center gap-2">
                                    <User size={12}/> {c.client_name} • <Calendar size={12}/> {new Date(c.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition">
                            <button onClick={() => {
                                setClientName(c.client_name);
                                setProjectName(c.project_name);
                                setContractBody(c.contract_body);
                                setSavedSignature(c.signature_url);
                                setIsSigned(true);
                                setActiveTab("NEW");
                            }} className="p-2 bg-white/10 rounded hover:bg-white hover:text-black transition">
                                <Printer size={18}/>
                            </button>
                            <button onClick={() => deleteContract(c.id)} className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-900/50 transition">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

      </main>
    </div>
  );
}