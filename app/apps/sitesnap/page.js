"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Camera, Trash2, Printer, AlertTriangle, CheckCircle2, FileText, 
  Loader2, Upload, Share, FileDigit, ArrowLeft, X, Menu, 
  MoreVertical, Eye, ArrowRightLeft, FolderOpen, ListPlus
} from "lucide-react";
import Link from "next/link";

const THEME_ORANGE = "#FF6700";

export default function SiteSnap() {
  const supabase = createClient();
  
  // --- GLOBAL STATE ---
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  
  // --- SELECTION & BLUEPRINT STATE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // --- FORM STATE ---
  const [jobs, setJobs] = useState([]); 
  const [selectedJob, setSelectedJob] = useState("");
  const [customJob, setCustomJob] = useState("");
  const [tag, setTag] = useState("BEFORE");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileType, setFileType] = useState("image"); 
  
  const [showReportModal, setShowReportModal] = useState(false);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // HAPTIC ENGINE
  const vibrate = (pattern = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: bids } = await supabase.from("bids").select("project_name").order("created_at", { ascending: false });
    if (bids) {
        const uniqueJobs = [...new Set(bids.map(b => b.project_name))];
        setJobs(uniqueJobs);
    }

    const { data: savedPhotos } = await supabase.from("site_photos").select("*").order("created_at", { ascending: false });
    if (savedPhotos) setPhotos(savedPhotos);
    
    // Auto-select most recent job if available
    if (savedPhotos && savedPhotos.length > 0) {
        setSelectedJob(savedPhotos[0].job_name);
    }
    
    setLoading(false);
  };

  // --- BLUEPRINT ACTIONS (Multi-Select) ---
  const toggleSelection = (index) => {
    vibrate(15);
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIndices.length} entries?`)) return;
    vibrate(50);
    const idsToDelete = selectedIndices.map(idx => filteredPhotos[idx].id);
    const { error } = await supabase.from("site_photos").delete().in("id", idsToDelete);
    if (!error) {
      setPhotos(prev => prev.filter(p => !idsToDelete.includes(p.id)));
      setSelectedIndices([]);
      showToast("Items Deleted", "success");
    }
  };

  const handleSwapSelected = () => {
    if (selectedIndices.length !== 2) return;
    vibrate(30);
    const newPhotos = [...photos]; // Note: Complex since photos are filtered, simplified for UI here
    const indexA = selectedIndices[0];
    const indexB = selectedIndices[1];
    
    const temp = newPhotos[indexA];
    newPhotos[indexA] = newPhotos[indexB];
    newPhotos[indexB] = temp;
    
    setPhotos(newPhotos);
    setSelectedIndices([]);
    showToast("Order Updated", "success");
  };

  // --- UPLOAD ACTIONS ---
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToUpload(file);
      if (file.type.includes("pdf")) {
        setFileType("pdf");
        setPreview("PDF_ICON"); 
      } else {
        setFileType("image");
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const savePhoto = async () => {
    const finalJobName = customJob || selectedJob;
    if (!finalJobName || finalJobName === "custom") return alert("Enter a Job Name");
    if (!fileToUpload) return alert("Select a file first");

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const ext = fileType === "pdf" ? "pdf" : "jpg";
    const fileName = `${user.id}/${finalJobName.replace(/\s/g, "_")}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from("sitesnap").upload(fileName, fileToUpload);
    if (uploadError) {
      alert("Upload Failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("sitesnap").getPublicUrl(fileName);
    const { data: newEntry } = await supabase.from("site_photos").insert({
      user_id: user.id, job_name: finalJobName, tag: tag, notes: notes, image_url: publicUrl
    }).select().single();

    if (newEntry) {
      setPhotos([newEntry, ...photos]);
      setPreview(null);
      setFileToUpload(null);
      setNotes("");
      showToast("Saved to Gallery", "success");
    }
    setUploading(false);
  };

  const handleShareReport = async () => {
    const activePhotos = photos.filter(p => p.job_name === selectedJob);
    let text = `📸 FIELD REPORT: ${selectedJob}\nDate: ${new Date().toLocaleDateString()}\n\n`;
    activePhotos.forEach(p => {
        text += `[${p.tag}] ${p.notes || "No notes"}\nView: ${p.image_url}\n\n`;
    });

    if (navigator.share) {
      await navigator.share({ title: `Report: ${selectedJob}`, text: text });
    } else {
      navigator.clipboard.writeText(text);
      showToast("Report Copied", "success");
    }
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  // --- FILTERS ---
  const filteredPhotos = photos.filter(p => p.job_name === selectedJob);
  const uniqueJobsFromPhotos = [...new Set(photos.map(p => p.job_name))];

  return (
    <div className={`min-h-screen bg-background text-foreground font-inter pb-32 ${showReportModal ? "overflow-hidden h-screen" : ""}`}>
      
      {/* 1. BLUEPRINT HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:text-[#FF6700] transition-colors text-foreground">
            <ArrowLeft size={28} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] font-oswald">SiteSnap</h1>
            <p className="text-xs text-foreground font-bold tracking-widest opacity-60">JOB DOCUMENTATION</p>
          </div>
        </div>
        <button onClick={() => { vibrate(); setShowArchive(!showArchive); }} className="industrial-card p-3 rounded-xl text-[#FF6700]">
          <Menu size={24} />
        </button>
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-2">
        
        {/* 2. JOB SELECTOR (Persistence) */}
        <div className="flex items-center gap-2 mb-6 bg-industrial-card border border-industrial-border p-3 rounded-xl z-40 relative">
            <FolderOpen className="text-[#FF6700] shrink-0" size={20} />
            <select 
                value={selectedJob} 
                onChange={(e) => { vibrate(); setSelectedJob(e.target.value); setSelectedIndices([]); }}
                className="bg-transparent text-foreground font-bold uppercase outline-none w-full appearance-none cursor-pointer"
            >
                {jobs.map(j => <option key={j} value={j} className="bg-zinc-900">{j}</option>)}
                <option value="custom" className="bg-zinc-900">+ New Job Name</option>
            </select>
            {selectedJob === "custom" && (
                <input autoFocus placeholder="Enter Job Name" value={customJob} onChange={e => setCustomJob(e.target.value)} className="absolute inset-0 bg-zinc-900 rounded-xl px-10 text-white font-bold uppercase border border-[#FF6700]" />
            )}
        </div>

        {/* 3. UPLOAD CONTROL DECK */}
        <div className="industrial-card rounded-2xl p-5 mb-8 border border-industrial-border shadow-2xl">
            <div className="grid grid-cols-3 gap-2 mb-4">
                {["BEFORE", "AFTER", "DOCS"].map(t => (
                    <button key={t} onClick={() => { vibrate(); setTag(t); }} className={`py-3 rounded-lg font-bold text-xs border transition-all ${tag === t ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-black/20 border-white/5 text-industrial-muted"}`}>
                        {t}
                    </button>
                ))}
            </div>

            {!preview ? (
                <div className="grid grid-cols-2 gap-3 h-28 mb-4">
                    <button onClick={() => cameraInputRef.current.click()} className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-industrial-muted hover:border-[#FF6700] hover:bg-[#FF6700]/5 transition">
                        <Camera size={28} className="mb-1" />
                        <span className="font-oswald text-[10px] uppercase font-bold">SNAP PHOTO</span>
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-industrial-muted hover:border-[#FF6700] hover:bg-[#FF6700]/5 transition">
                        <Upload size={28} className="mb-1" />
                        <span className="font-oswald text-[10px] uppercase font-bold">UPLOAD PDF</span>
                    </button>
                    <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,application/pdf" className="hidden" />
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#FF6700] mb-4 bg-black/40 h-48 group">
                    {fileType === "pdf" ? (
                        <div className="h-full flex flex-col items-center justify-center text-red-500">
                            <FileDigit size={48} />
                            <span className="font-bold text-xs mt-2">PDF READY</span>
                        </div>
                    ) : (
                        <img src={preview} className="w-full h-full object-cover" />
                    )}
                    <button onClick={() => { setPreview(null); setFileToUpload(null); }} className="absolute top-2 right-2 bg-black/80 p-2 rounded-full text-white"><X size={18}/></button>
                </div>
            )}

            <input placeholder="Add Notes (Optional)..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-zinc-800 border border-white/5 rounded-xl p-4 w-full mb-4 text-white outline-none focus:border-[#FF6700] transition-all" />

            <button onClick={savePhoto} disabled={uploading} className="w-full bg-[#FF6700] text-black font-bold font-oswald text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition active:scale-95">
                {uploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {uploading ? "UPLOADING..." : "SAVE TO JOB SNAP"}
            </button>
        </div>

        {/* 4. DYNAMIC GALLERY HEADER */}
        <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-oswald font-bold uppercase tracking-tight text-foreground">{selectedJob} ({filteredPhotos.length})</h2>
            <div className="flex gap-2">
                <button onClick={() => { vibrate(); setIsEditMode(!isEditMode); setSelectedIndices([]); }} className={`p-2 rounded-lg border transition ${isEditMode ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-industrial-card border-white/5 text-industrial-muted"}`}>
                    <CheckCircle2 size={18} />
                </button>
                <button onClick={() => { vibrate(); setShowReportModal(true); }} className="bg-blue-600 text-white p-2 rounded-lg font-bold flex items-center gap-2 text-xs">
                    <Share size={14} /> REPORT
                </button>
            </div>
        </div>

        {/* 5. THE BLUEPRINT GRID */}
        <div className="grid grid-cols-3 gap-3 pb-32">
            {filteredPhotos.length === 0 ? (
                <div className="col-span-3 text-center py-10 text-industrial-muted opacity-40 italic">No photos for this job yet.</div>
            ) : filteredPhotos.map((p, idx) => {
                const isSelected = selectedIndices.includes(idx);
                const isItemPdf = p.image_url.toLowerCase().includes(".pdf");
                return (
                    <div 
                        key={p.id} 
                        onClick={() => isEditMode ? toggleSelection(idx) : setFullScreenImage(p)}
                        className={`relative h-36 rounded-xl overflow-hidden shadow-lg border transition-all 
                            ${isEditMode ? "cursor-pointer active:scale-95" : "cursor-zoom-in"}
                            ${isSelected ? "ring-4 ring-[#FF6700] scale-90 border-transparent" : "border-white/5"}`}
                    >
                        {isItemPdf ? (
                            <div className="h-full bg-zinc-800 flex items-center justify-center text-red-500">
                                <FileDigit size={32} />
                            </div>
                        ) : (
                            <img src={p.image_url} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-1 left-1">
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold border 
                                ${p.tag === "BEFORE" ? "bg-red-500 text-white" : p.tag === "AFTER" ? "bg-green-500 text-white" : "bg-yellow-500 text-black"}`}>
                                {p.tag}
                            </span>
                        </div>
                        {isEditMode && (
                             <div className={`absolute inset-0 flex items-center justify-center ${isSelected ? "bg-[#FF6700]/20" : "bg-black/40"}`}>
                                {isSelected && <CheckCircle2 className="text-white" size={24} />}
                             </div>
                        )}
                    </div>
                );
            })}
        </div>

        {/* 6. SMART ACTION BAR (FROM BLUEPRINT) */}
        {isEditMode && selectedIndices.length > 0 && (
            <div className="fixed bottom-0 left-0 w-full z-50 bg-[#121212] border-t border-gray-800 p-4 animate-in slide-in-from-bottom">
                <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                    <div className="text-white font-bold text-sm">{selectedIndices.length} Selected</div>
                    <div className="flex gap-2">
                        {selectedIndices.length === 2 && (
                            <button onClick={handleSwapSelected} className="bg-[#FF6700] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                <ArrowRightLeft size={18}/> Swap
                            </button>
                        )}
                        <button onClick={handleDeleteSelected} className="bg-red-900/30 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                            <Trash2 size={18}/> Delete
                        </button>
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* --- HAMBURGER ARCHIVE MENU --- */}
      {showArchive && (
          <div className="fixed inset-0 z-[60] animate-in fade-in">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowArchive(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#121212] border-l border-white/5 p-6 animate-in slide-in-from-right shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xl font-oswald font-bold text-[#FF6700]">JOB ARCHIVE</h2>
                      <button onClick={() => setShowArchive(false)} className="text-industrial-muted hover:text-white"><X /></button>
                  </div>
                  <div className="space-y-3 overflow-y-auto max-h-[80vh]">
                      {uniqueJobsFromPhotos.map(job => (
                          <button 
                            key={job} 
                            onClick={() => { vibrate(); setSelectedJob(job); setShowArchive(false); }}
                            className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${selectedJob === job ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-white/5 border-white/5 text-industrial-muted hover:bg-white/10"}`}
                          >
                              <span className="font-bold uppercase text-sm truncate">{job}</span>
                              <CheckCircle2 size={16} className={selectedJob === job ? "opacity-100" : "opacity-0"} />
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- FULL SCREEN INSPECT --- */}
      {fullScreenImage && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col p-4 animate-in zoom-in">
              <div className="flex justify-between items-center mb-4">
                  <div className="text-white">
                      <h3 className="font-bold uppercase">{fullScreenImage.job_name}</h3>
                      <p className="text-xs opacity-60">{fullScreenImage.tag} • {new Date(fullScreenImage.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => setFullScreenImage(null)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20"><X size={28}/></button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                  {fullScreenImage.image_url.toLowerCase().includes(".pdf") ? (
                       <iframe src={fullScreenImage.image_url} className="w-full h-full rounded-xl" />
                  ) : (
                       <img src={fullScreenImage.image_url} className="w-full max-h-[80vh] object-contain rounded-xl" />
                  )}
              </div>
              {fullScreenImage.notes && (
                  <div className="mt-4 p-4 bg-zinc-900 rounded-xl border border-white/10">
                      <p className="text-white italic text-sm">"{fullScreenImage.notes}"</p>
                  </div>
              )}
          </div>
      )}

      {/* --- REPORT MODAL --- */}
      {showReportModal && (
          <div className="fixed inset-0 z-[70] bg-white text-black p-8 overflow-auto animate-in fade-in">
              <div className="max-w-3xl mx-auto pb-20">
                  <div className="flex justify-between items-end border-b-4 border-[#FF6700] pb-6 mb-8">
                      <div>
                          <h1 className="text-4xl font-oswald font-bold">SITE REPORT</h1>
                          <p className="text-zinc-500 uppercase font-bold tracking-widest text-sm">JOB: {selectedJob}</p>
                      </div>
                      <button onClick={() => setShowReportModal(false)} className="bg-black text-white p-3 rounded-xl no-print"><X /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                      {filteredPhotos.map(p => (
                          <div key={p.id} className="border border-zinc-200 p-2 rounded-lg break-inside-avoid">
                              <img src={p.image_url} className="w-full h-48 object-cover rounded mb-2" />
                              <div className="flex justify-between text-[10px] font-bold mb-1">
                                  <span className="text-[#FF6700]">{p.tag}</span>
                                  <span className="text-zinc-400">{new Date(p.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs italic text-zinc-700">"{p.notes || "No notes provided."}"</p>
                          </div>
                      ))}
                  </div>
                  <div className="fixed bottom-8 left-0 w-full no-print px-8">
                      <button onClick={handleShareReport} className="w-full bg-[#FF6700] text-black font-bold py-4 rounded-2xl shadow-2xl hover:scale-105 transition flex items-center justify-center gap-2 text-xl">
                          <Share size={24} /> SEND JOB REPORT
                      </button>
                  </div>
              </div>
          </div>
      )}

      {toast && <div className={`fixed bottom-24 right-6 px-6 py-3 rounded shadow-xl font-bold text-white z-[80] animate-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-green-600" : "bg-blue-600"}`}>{toast.msg}</div>}
      
      <div className="mt-12 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-muted">
          POWERED BY <span className="text-[#FF6700]">FIELDDESKOPS</span>
        </p>
      </div>
    </div>
  );
}
