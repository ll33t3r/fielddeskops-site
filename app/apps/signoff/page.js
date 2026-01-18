"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  FileText, Eraser, Check, Plus, 
  Download, FileSignature, ShieldAlert, BadgeDollarSign, Import
} from "lucide-react";
import Header from "../../components/Header";

export default function SignOff() {
  const supabase = createClient();
  const canvasRef = useRef(null);
  
  // STATE
  const [bids, setBids] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [agreementDate, setAgreementDate] = useState("");
  const [contractType, setContractType] = useState("STANDARD");
  
  const [isSignatureSaved, setIsSignatureSaved] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showStamp, setShowStamp] = useState(false);

  // 1. INIT & LOAD DATA
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setAgreementDate(today);
    loadBids();
    setupCanvas();

    const saved = localStorage.getItem("signoff_agreement");
    if (saved) {
      const agreement = JSON.parse(saved);
      setProjectName(agreement.projectName || "");
      setScopeOfWork(agreement.scopeOfWork || "");
      setAgreementDate(agreement.agreementDate || today);
      if (agreement.signatureDataUrl) {
        setSignatureImage(agreement.signatureDataUrl);
        setIsSignatureSaved(true);
        setTimeout(() => setShowStamp(true), 100);
      }
    }
  }, []);

  // Fetch Bids from ProfitLock DB
  const loadBids = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("bids").select("id, project_name, sale_price, materials").order("created_at", { ascending: false });
    if (data) setBids(data);
  };

  // 2. CANVAS LOGIC (Graph Paper & Blue Ink)
  const setupCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    setTimeout(() => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 200;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#00008b";
        }
    }, 100);
  };

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (!isSignatureSaved) setupCanvas();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSignatureSaved]);

  // Drawing Handlers
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    if (isSignatureSaved) return;
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDraw = (e) => {
    if (!isDrawing || isSignatureSaved) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
    canvasRef.current?.getContext("2d").closePath();
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setIsSignatureSaved(false);
    setSignatureImage(null);
    setShowStamp(false);
  };

  // 3. ACTIONS & TEMPLATES
  const handleImportBid = (e) => {
    const bidId = e.target.value;
    if (!bidId) return;
    const bid = bids.find(b => b.id.toString() === bidId);
    if (bid) {
        setProjectName(bid.project_name);
        const text = `Contract for ${bid.project_name}.\n\nTotal Estimate: $${bid.sale_price}\nIncludes materials listed in estimate.\n`;
        setScopeOfWork(text);
    }
  };

  const addTemplate = (type) => {
    let text = "";
    if (type === "LIABILITY") text = "\n[LIABILITY WAIVER]\nContractor is not responsible for pre-existing damage to plumbing, electrical, or structural elements discovered during work.\n";
    if (type === "PAYMENT") text = "\n[PAYMENT TERMS]\n50% Deposit required to schedule. Balance due immediately upon substantial completion.\n";
    if (type === "CHANGE") {
        setContractType("CHANGE_ORDER");
        text = "\n[CHANGE ORDER]\nThis agreement modifies the original contract. All additional costs listed above are due immediately.\n";
    }
    setScopeOfWork(prev => prev + text);
  };

  const saveAgreement = () => {
    if (!projectName || !scopeOfWork) return alert("Please fill out the contract details.");
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const blank = document.createElement("canvas");
    blank.width = canvas.width; blank.height = canvas.height;
    if (dataUrl === blank.toDataURL()) return alert("Please sign the document.");

    setSignatureImage(dataUrl);
    setIsSignatureSaved(true);
    const payload = { projectName, scopeOfWork, agreementDate, signatureDataUrl: dataUrl };
    localStorage.setItem("signoff_agreement", JSON.stringify(payload));
    setTimeout(() => setShowStamp(true), 100);
  };

  const newAgreement = () => {
    if(!confirm("Clear current agreement?")) return;
    setProjectName(""); setScopeOfWork(""); setIsSignatureSaved(false); setShowStamp(false); setSignatureImage(null);
    setTimeout(setupCanvas, 100);
  };

  return (
    <div className="min-h-screen bg-industrial-bg text-white font-inter pb-20">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400 ;600&family=Oswald:wght@500;700&display=swap');
        .font-oswald { font-family: 'Oswald', sans-serif; }
        
        .paper-bg {
            background-color: #f5f5f5;
            background-image: radial-gradient(#ccc 1px, transparent 1px);
            background-size: 20px 20px;
            color: #1a1a1a;
        }
        .stamp-enter {
            animation: stamp-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            opacity: 0;
            transform: scale(2) rotate(-15deg);
        }
        @keyframes stamp-bounce {
            0% { opacity: 0; transform: scale(3) rotate(-15deg); }
            50% { opacity: 1; transform: scale(0.8) rotate(-15deg); }
            100% { opacity: 1; transform: scale(1) rotate(-15deg); }
        }
      `}</style>

      {/* HEADER */}
      <Header title="SIGNOFF" backLink="/" />

      <main className="max-w-2xl mx-auto px-6 space-y-6">
        
        {/* SECTION 1: CONTRACT DETAILS */}
        <div className="glass-panel rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-industrial-border pb-2">
                <h2 className="font-oswald text-lg text-gray-200">CONTRACT DETAILS</h2>
                <div className="flex gap-2">
                    {/* PROFITLOCK INTEGRATION */}
                    <div className="relative">
                        <select 
                            onChange={handleImportBid}
                            className="input-field rounded-lg p-2 text-xs pr-6 appearance-none"
                        >
                            <option value="">Import Bid...</option>
                            {bids.map(b => <option key={b.id} value={b.id}>{b.project_name} (${b.sale_price})</option>)}
                        </select>
                        <Import size={12} className="absolute right-2 top-2.5 text-gray-500 pointer-events-none"/>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Project Name</label>
                    <input 
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        disabled={isSignatureSaved}
                        className="input-field rounded-lg p-3 w-full disabled:opacity-50"
                        placeholder="e.g. Smith Kitchen Remodel"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Agreement Date</label>
                        <input 
                            type="date"
                            value={agreementDate}
                            onChange={(e) => setAgreementDate(e.target.value)}
                            disabled={isSignatureSaved}
                            className="input-field rounded-lg p-3 w-full disabled:opacity-50"
                        />
                    </div>
                    <div>
                         <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Type</label>
                         <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-industrial-border">
                             <button onClick={() => setContractType("STANDARD")} className={`flex-1 text-xs font-bold rounded py-2 ${contractType === "STANDARD" ? "bg-industrial-orange text-black" : "text-gray-500"}`}>STD</button>
                             <button onClick={() => addTemplate("CHANGE")} className={`flex-1 text-xs font-bold rounded py-2 ${contractType === "CHANGE_ORDER" ? "bg-red-600 text-white" : "text-gray-500"}`}>CHANGE</button>
                         </div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-1">
                        <label className="text-xs font-bold text-gray-500 uppercase block">Scope of Work</label>
                        {/* SMART TEMPLATES */}
                        {!isSignatureSaved && (
                            <div className="flex gap-2">
                                <button onClick={() => addTemplate("PAYMENT")} title="Add Payment Terms" className="text-[10px] bg-[#333] hover:bg-industrial-orange hover:text-black px-2 py-1 rounded text-gray-300 transition flex items-center gap-1"><BadgeDollarSign size={10}/> TERMS</button>
                                <button onClick={() => addTemplate("LIABILITY")} title="Add Liability Waiver" className="text-[10px] bg-[#333] hover:bg-red-600 hover:text-white px-2 py-1 rounded text-gray-300 transition flex items-center gap-1"><ShieldAlert size={10}/> WAIVER</button>
                            </div>
                        )}
                    </div>
                    <textarea 
                        value={scopeOfWork}
                        onChange={(e) => setScopeOfWork(e.target.value)}
                        disabled={isSignatureSaved}
                        rows={6}
                        className="input-field rounded-lg p-3 w-full font-mono text-sm disabled:opacity-50"
                        placeholder="Describe work, materials, and costs..."
                    />
                </div>
            </div>
        </div>

        {/* SECTION 2: THE PAPER CONTRACT & SIGNATURE */}
        <div className="relative">
            <div className="paper-bg rounded-xl p-6 shadow-2xl overflow-hidden min-h-[300px] border-t-8 border-gray-300 relative">
                {/* Paper Header */}
                <div className="flex justify-between border-b-2 border-gray-300 pb-2 mb-4">
                    <span className="font-oswald text-xl font-bold uppercase text-gray-800">{contractType.replace("_", " ")}</span>
                    <span className="font-mono text-sm text-gray-600">{agreementDate}</span>
                </div>
                
                <div className="mb-6 font-serif text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {scopeOfWork || "(Scope of work will appear here...)"}
                </div>

                {/* SIGNATURE AREA */}
                <div className="mt-8">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">ACCEPTED BY (SIGN BELOW):</p>
                    
                    {/* CANVAS CONTAINER */}
                    <div className="relative border-2 border-dashed border-gray-400 rounded bg-white h-48 w-full touch-none">
                        {!isSignatureSaved ? (
                            <canvas 
                                ref={canvasRef}
                                onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
                                onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
                                className="w-full h-full cursor-crosshair"
                            />
                        ) : (
                            <img src={signatureImage} className="w-full h-full object-contain" />
                        )}

                        {/* STAMP ANIMATION */}
                        {showStamp && (
                            <div className="stamp-enter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-green-600 text-green-600 font-black text-4xl p-2 rounded transform -rotate-12 opacity-80 pointer-events-none whitespace-nowrap">
                                SIGNED & LOCKED
                            </div>
                        )}
                    </div>
                    
                    {!isSignatureSaved && <p className="text-[10px] text-gray-400 mt-1 text-center">Use finger or mouse to sign.</p>}
                </div>
            </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-4 pb-12">
            {!isSignatureSaved ? (
                <>
                    <button onClick={clearPad} className="border border-industrial-border text-gray-400 font-bold py-4 rounded-xl hover:bg-[#262626] transition flex justify-center items-center gap-2">
                        <Eraser size={20}/> CLEAR
                    </button>
                    <button onClick={saveAgreement} className="bg-industrial-orange text-black font-bold shadow-[0_0_20px_rgba(255,103,0,0.4)] py-4 rounded-xl hover:bg-industrial-orange/90 transition flex justify-center items-center gap-2">
                        <Check size={20}/> SIGN & LOCK
                    </button>
                </>
            ) : (
                <>
                    <button onClick={newAgreement} className="border border-industrial-border text-gray-400 font-bold py-4 rounded-xl hover:bg-[#262626] transition flex justify-center items-center gap-2">
                        <Plus size={20}/> NEW AGREEMENT
                    </button>
                    <button onClick={() => window.print()} className="bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition flex justify-center items-center gap-2">
                        <Download size={20}/> PRINT / PDF
                    </button>
                </>
            )}
        </div>

      </main>
    </div>
  );
}
