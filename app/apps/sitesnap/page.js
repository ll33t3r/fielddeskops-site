"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Camera, Trash2, FileText, Printer, ArrowLeft, 
  AlertTriangle, CheckCircle, File, Loader2, Upload, Share, FileDigit 
} from "lucide-react";
import Link from "next/link";

export default function SiteSnap() {
  const supabase = createClient();
  
  // STATE
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // FORM STATE
  const [jobs, setJobs] = useState([]); 
  const [selectedJob, setSelectedJob] = useState("");
  const [customJob, setCustomJob] = useState("");
  const [tag, setTag] = useState("BEFORE");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileType, setFileType] = useState("image"); // 'image' or 'pdf'
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. LOAD DATA
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load Jobs
    const { data: bids } = await supabase.from("bids").select("project_name").order("created_at", { ascending: false });
    if (bids) setJobs(bids.map(b => b.project_name));

    // Load Photos/Docs
    const { data: savedPhotos } = await supabase
      .from("site_photos")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (savedPhotos) setPhotos(savedPhotos);
    setLoading(false);
  };

  // 2. HANDLE FILE SELECTION (Camera or Upload)
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToUpload(file);
      
      // Check type
      if (file.type.includes("pdf")) {
        setFileType("pdf");
        setPreview("PDF_ICON"); // Placeholder for logic
      } else {
        setFileType("image");
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  // 3. UPLOAD TO SUPABASE
  const savePhoto = async () => {
    const finalJobName = customJob || selectedJob;
    if (!finalJobName) return alert("Select or enter a Job Name");
    if (!fileToUpload) return alert("Select a file first");

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Path: user_id/job_name/timestamp.ext
    const ext = fileType === "pdf" ? "pdf" : "jpg";
    const fileName = `${user.id}/${finalJobName.replace(/\s/g, "_")}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("sitesnap")
      .upload(fileName, fileToUpload);

    if (uploadError) {
      alert("Upload Failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage.from("sitesnap").getPublicUrl(fileName);

    // Save DB Entry
    const { data: newEntry } = await supabase.from("site_photos").insert({
      user_id: user.id,
      job_name: finalJobName,
      tag: tag,
      notes: notes,
      image_url: publicUrl
    }).select().single();

    if (newEntry) {
      setPhotos([newEntry, ...photos]);
      setPreview(null);
      setFileToUpload(null);
      setNotes("");
    }
    
    setUploading(false);
  };

  // 4. DELETE
  const deletePhoto = async (id) => {
    if(!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("site_photos").delete().eq("id", id);
    if (!error) {
      setPhotos(photos.filter(p => p.id !== id));
    }
  };

  // 5. SHARE HANDLER
  const handleShare = async () => {
    const text = `Field Report Generated: ${new Date().toLocaleDateString()}\n${photos.length} Items Logged.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "FieldDeskOps Report",
          text: text,
          url: window.location.href // Shares link to app
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      alert("Share feature not supported on this device. Use Print/PDF.");
    }
  };

  const getTagStyle = (t) => {
    if (t === "BEFORE") return "bg-red-900/40 text-red-500 border-red-900";
    if (t === "AFTER") return "bg-green-900/40 text-green-500 border-green-900";
    return "bg-yellow-900/40 text-yellow-500 border-yellow-900";
  };

  // Helper to check if URL is PDF (for rendering history)
  const isPdf = (url) => url && url.toLowerCase().includes(".pdf");

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-inter pb-20">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Oswald:wght@500;700&display=swap');
        .font-oswald { font-family: 'Oswald', sans-serif; }
        @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; color: black; }
            .no-print { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <header className="max-w-xl mx-auto px-6 pt-8 pb-4 flex items-center gap-3 no-print">
        <Link href="/" className="text-gray-400 hover:text-white"><ArrowLeft /></Link>
        <h1 className="text-3xl font-oswald font-bold tracking-wide">
           SITE<span className="text-[#FF6700]">SNAP</span>
        </h1>
      </header>

      <main className="max-w-xl mx-auto px-6">
        
        {/* === UPLOAD CARD === */}
        <div className="bg-[#262626] border border-[#404040] rounded-xl p-4 shadow-xl mb-8 no-print">
            
            {/* JOB SELECTOR */}
            <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Select Job</label>
                <select 
                    value={selectedJob} 
                    onChange={(e)=>setSelectedJob(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 text-white focus:border-[#FF6700] outline-none mb-2"
                >
                    <option value="">-- Select Active Job --</option>
                    {jobs.map(j => <option key={j} value={j}>{j}</option>)}
                    <option value="custom">Other / New Job</option>
                </select>
                {(selectedJob === "custom" || selectedJob === "") && (
                    <input 
                        type="text" 
                        placeholder="Or type Job Name..." 
                        value={customJob}
                        onChange={(e)=>setCustomJob(e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 text-white focus:border-[#FF6700] outline-none"
                    />
                )}
            </div>

            {/* TAGS */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={()=>setTag("BEFORE")} className={`p-3 rounded-lg font-bold text-sm border-2 flex flex-col items-center gap-1 ${tag==="BEFORE" ? "bg-red-600 border-red-600 text-white" : "bg-[#1a1a1a] border-[#333] text-gray-500"}`}><AlertTriangle size={20} /> BEFORE</button>
                <button onClick={()=>setTag("AFTER")} className={`p-3 rounded-lg font-bold text-sm border-2 flex flex-col items-center gap-1 ${tag==="AFTER" ? "bg-green-600 border-green-600 text-white" : "bg-[#1a1a1a] border-[#333] text-gray-500"}`}><CheckCircle size={20} /> AFTER</button>
                <button onClick={()=>setTag("DOCS")} className={`p-3 rounded-lg font-bold text-sm border-2 flex flex-col items-center gap-1 ${tag==="DOCS" ? "bg-yellow-600 border-yellow-600 text-white" : "bg-[#1a1a1a] border-[#333] text-gray-500"}`}><File size={20} /> DOCS</button>
            </div>

            {/* ACTION BUTTONS (CAMERA / UPLOAD) */}
            {!preview ? (
                <div className="grid grid-cols-2 gap-3 h-32 mb-4">
                    <button 
                        onClick={()=>cameraInputRef.current.click()}
                        className="border-2 border-dashed border-[#404040] rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#FF6700] hover:text-[#FF6700] bg-[#1a1a1a] transition"
                    >
                        <Camera size={32} className="mb-2" />
                        <span className="font-oswald text-sm">TAKE PHOTO</span>
                    </button>
                    <button 
                        onClick={()=>fileInputRef.current.click()}
                        className="border-2 border-dashed border-[#404040] rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#FF6700] hover:text-[#FF6700] bg-[#1a1a1a] transition"
                    >
                        <Upload size={32} className="mb-2" />
                        <span className="font-oswald text-sm">UPLOAD FILE</span>
                    </button>
                    
                    {/* HIDDEN INPUTS */}
                    <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,application/pdf" className="hidden" />
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#FF6700] mb-4 bg-black flex items-center justify-center h-48">
                    {fileType === 'pdf' ? (
                        <div className="text-center text-red-500">
                             <FileDigit size={48} className="mx-auto mb-2" />
                             <span className="font-bold">PDF DOCUMENT SELECTED</span>
                        </div>
                    ) : (
                        <img src={preview} className="w-full h-full object-cover" />
                    )}
                    <button onClick={()=>{setPreview(null); setFileToUpload(null)}} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:bg-red-600"><Trash2 size={20}/></button>
                </div>
            )}

            {/* NOTES & SAVE */}
            <input 
                type="text" 
                placeholder="Notes (e.g. Receipt for supplies)" 
                value={notes}
                onChange={(e)=>setNotes(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#404040] rounded-lg p-3 text-white focus:border-[#FF6700] outline-none mb-3"
            />
            <button 
                onClick={savePhoto}
                disabled={uploading}
                className="w-full bg-[#FF6700] text-black font-oswald font-bold text-lg py-4 rounded-lg hover:bg-[#cc5200] transition flex items-center justify-center gap-2"
            >
                {uploading ? <Loader2 className="animate-spin" /> : <Camera />} 
                {uploading ? "SAVING..." : "SAVE PHOTO / DOCUMENT"}
            </button>
        </div>

        {/* === GALLERY === */}
        <div className="flex justify-between items-end mb-4 no-print">
            <h2 className="text-xl font-oswald font-bold text-white">HISTORY ({photos.length})</h2>
            {photos.length > 0 && (
                <button onClick={()=>setShowPrintModal(true)} className="text-xs bg-[#333] px-3 py-1.5 rounded flex items-center gap-2 hover:bg-white hover:text-black transition">
                    <Printer size={14} /> REPORTS
                </button>
            )}
        </div>

        {loading ? <Loader2 className="animate-spin text-[#FF6700] mx-auto no-print" /> : (
            <div className="space-y-4 no-print">
                {photos.map(p => (
                    <div key={p.id} className="bg-[#262626] border border-[#404040] rounded-xl overflow-hidden shadow-lg flex">
                        <div className="w-1/3 bg-black flex items-center justify-center relative">
                            {isPdf(p.image_url) ? (
                                <Link href={p.image_url} target="_blank" className="text-gray-400 hover:text-white flex flex-col items-center">
                                    <FileDigit size={32} />
                                    <span className="text-[10px] mt-1">OPEN PDF</span>
                                </Link>
                            ) : (
                                <img src={p.image_url} className="w-full h-32 object-cover" />
                            )}
                            <div className="absolute top-1 left-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getTagStyle(p.tag)}`}>{p.tag}</span>
                            </div>
                        </div>
                        <div className="w-2/3 p-3 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-md leading-tight">{p.job_name}</h3>
                                <p className="text-xs text-gray-500 mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                {p.notes ? <p className="text-xs text-gray-300 italic truncate w-3/4">{p.notes}</p> : <span></span>}
                                <button onClick={()=>deletePhoto(p.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      {/* === PRINT/SHARE MODAL === */}
      {showPrintModal && (
        <div id="print-area" className="bg-white text-black min-h-screen p-8 fixed inset-0 z-50 overflow-auto">
            <div className="max-w-4xl mx-auto">
                <div className="border-b-4 border-[#FF6700] pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-oswald font-bold text-black">FIELD REPORT</h1>
                        <p className="text-gray-500 mt-2">Generated: {new Date().toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold font-oswald text-[#FF6700]">SITE<span className="text-black">SNAP</span></h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {photos.map(p => (
                        <div key={p.id} className="break-inside-avoid mb-4">
                            <div className="border border-gray-200 rounded p-2">
                                {isPdf(p.image_url) ? (
                                    <div className="h-48 flex flex-col items-center justify-center bg-gray-50 border border-dashed mb-2">
                                        <FileDigit size={40} className="text-gray-400" />
                                        <span className="text-xs text-gray-500 mt-2">[PDF DOCUMENT ATTACHED]</span>
                                    </div>
                                ) : (
                                    <img src={p.image_url} className="w-full h-48 object-contain bg-gray-50 mb-2" />
                                )}
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold">{p.tag}</span>
                                    <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-sm">{p.job_name}</h3>
                                {p.notes && <p className="text-xs italic text-gray-600 mt-1">"{p.notes}"</p>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* MODAL ACTION BUTTONS */}
                <div className="no-print fixed bottom-8 right-8 flex gap-3">
                    <button onClick={handleShare} className="bg-blue-600 text-white px-6 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition flex items-center gap-2">
                        <Share size={20} /> SHARE
                    </button>
                    <button onClick={()=>window.print()} className="bg-black text-white px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition flex items-center gap-2">
                        <Printer size={20} /> PRINT PDF
                    </button>
                </div>
                
                <button onClick={()=>setShowPrintModal(false)} className="no-print fixed top-8 right-8 bg-gray-200 text-black p-2 rounded-full hover:bg-gray-300">
                    <ArrowLeft />
                </button>
            </div>
        </div>
      )}

    </div>
  );
}
