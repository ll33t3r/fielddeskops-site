"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Camera, Trash2, Printer, AlertTriangle, CheckCircle2, FileText, 
  Loader2, Upload, Share, FileDigit, ArrowLeft, X, Menu, 
  MoreVertical, Eye, ArrowRightLeft, FolderOpen, ListPlus, Pencil, ChevronDown, Clock
} from "lucide-react";
import Link from "next/link";

export default function SiteSnap() {
  const supabase = createClient();
  
  // --- GLOBAL STATE ---
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  
  // --- UI & SELECTION STATE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- JOB DATA STATE ---
  const [allJobs, setAllJobs] = useState([]); 
  const [jobMetadata, setJobMetadata] = useState({}); 
  const [selectedJob, setSelectedJob] = useState("");
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customJob, setCustomJob] = useState("");

  // --- FORM STATE ---
  const [tag, setTag] = useState("BEFORE");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileType, setFileType] = useState("image"); 
  const [showReportModal, setShowReportModal] = useState(false);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const vibrate = (pattern = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: savedPhotos } = await supabase.from("site_photos").select("*").order("created_at", { ascending: false });
    
    if (savedPhotos) {
      setPhotos(savedPhotos);
      const meta = {};
      savedPhotos.forEach(p => {
        const time = new Date(p.created_at).getTime();
        if (!meta[p.job_name] || time > meta[p.job_name]) {
          meta[p.job_name] = time;
        }
      });
      setJobMetadata(meta);
      const sorted = Object.keys(meta).sort((a, b) => meta[b] - meta[a]);
      setAllJobs(sorted);
      if (sorted.length > 0) setSelectedJob(sorted[0]);
    }
    setLoading(false);
  };

  const handleJobSelect = (jobName) => {
    vibrate();
    if (jobName === "NEW_JOB") {
      setIsCustomizing(true);
    } else {
      setSelectedJob(jobName);
      setIsCustomizing(false);
      setCustomJob("");
    }
    setIsDropdownOpen(false);
    setSelectedIndices([]);
  };

  const handleCustomBlur = () => {
    if (!customJob.trim()) setIsCustomizing(false);
  };

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
    const finalJobName = isCustomizing ? customJob.trim().toUpperCase() : selectedJob;
    if (!finalJobName) return alert("Enter a Job Name");
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
      const now = new Date().getTime();
      setJobMetadata(prev => ({ ...prev, [finalJobName]: now }));
      setSelectedJob(finalJobName);
      setIsCustomizing(false);
      setCustomJob("");
      setAllJobs(prev => [finalJobName, ...prev.filter(j => j !== finalJobName)]);
      showToast("Saved to Gallery", "success");
    }
    setUploading(false);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedIndices.length} items?`)) return;
    const idsToDelete = filteredPhotos.filter((_, idx) => selectedIndices.includes(idx)).map(p => p.id);
    const { error } = await supabase.from("site_photos").delete().in("id", idsToDelete);
    if (!error) {
      setPhotos(prev => prev.filter(p => !idsToDelete.includes(p.id)));
      setSelectedIndices([]);
      showToast("Items Deleted", "success");
    }
  };

  const toggleSelection = (index) => {
    vibrate(15);
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleShareReport = async () => {
    const activePhotos = photos.filter(p => p.job_name === selectedJob);
    let text = `📸 FIELD REPORT: ${selectedJob}\n\n`;
    activePhotos.forEach(p => text += `[${p.tag}] ${p.notes || "No notes"}\nView: ${p.image_url}\n\n`);
    if (navigator.share) await navigator.share({ title: `Report: ${selectedJob}`, text });
    else { navigator.clipboard.writeText(text); showToast("Copied to Clipboard", "success"); }
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  const filteredPhotos = photos.filter(p => p.job_name === selectedJob);
  const recentJobs = allJobs.slice(0, 7);

  return (
    <div className={`min-h-screen bg-background text-foreground font-inter pb-32 ${showReportModal || fullScreenImage ? "overflow-hidden h-screen" : ""}`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:text-[#FF6700] transition-colors"><ArrowLeft size={28} /></Link>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] font-oswald">SiteSnap</h1>
            <p className="text-xs font-bold tracking-widest opacity-60">JOB VISUALS</p>
          </div>
        </div>
        <button onClick={() => { vibrate(); setShowArchive(!showArchive); }} className="industrial-card p-3 rounded-xl text-[#FF6700] border border-zinc-200 dark:border-white/5 shadow-md">
          <Menu size={24} />
        </button>
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-2">
        
        {/* DROPDOWN */}
        <div className="relative mb-6" ref={dropdownRef}>
          {isCustomizing ? (
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-[#FF6700] p-4 rounded-xl shadow-lg transition-all">
              <Pencil className="text-[#FF6700] shrink-0" size={20} />
              <input autoFocus placeholder="TYPE NEW JOB NAME..." value={customJob} onChange={e => setCustomJob(e.target.value.toUpperCase())} onBlur={handleCustomBlur} className="bg-transparent text-foreground font-bold uppercase outline-none w-full" />
              <button onClick={() => setIsCustomizing(false)}><X size={22}/></button>
            </div>
          ) : (
            <>
              <button onClick={() => { vibrate(5); setIsDropdownOpen(!isDropdownOpen); }} className="w-full flex items-center justify-between bg-card border border-zinc-200 dark:border-white/5 p-4 rounded-xl hover:border-[#FF6700] shadow-md dark:shadow-2xl transition-all">
                <div className="flex items-center gap-3">
                  <FolderOpen className="text-[#FF6700]" size={22} />
                  <span className="font-bold uppercase tracking-wide truncate">{selectedJob || "SELECT A JOB"}</span>
                </div>
                <ChevronDown size={20} className={`text-zinc-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-background border border-zinc-200 dark:border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                  <div className="p-2 space-y-1">
                    {recentJobs.map(job => (
                      <button key={job} onClick={() => handleJobSelect(job)} className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm flex items-center justify-between ${selectedJob === job ? "bg-[#FF6700] text-black" : "text-foreground hover:bg-zinc-100 dark:hover:bg-white/5"}`}>
                        {job}{selectedJob === job && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                    <div className="h-px bg-zinc-200 dark:bg-white/5 my-2" />
                    <button onClick={() => handleJobSelect("NEW_JOB")} className="w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm text-[#FF6700] hover:bg-[#FF6700]/10 flex items-center gap-2"><ListPlus size={18} /> + NEW JOB NAME</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CONTROLS */}
        <div className="bg-card rounded-2xl p-5 mb-8 border border-zinc-200 dark:border-white/5 shadow-xl">
            <div className="grid grid-cols-3 gap-2 mb-4">
                {["BEFORE", "AFTER", "DOCS"].map(t => (
                    <button key={t} onClick={() => { vibrate(); setTag(t); }} className={`py-3 rounded-lg font-bold text-xs border transition-all ${tag === t ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-zinc-100 dark:bg-black/20 border-zinc-200 dark:border-white/5"}`}>
                        {t}
                    </button>
                ))}
            </div>
            {!preview ? (
                <div className="grid grid-cols-2 gap-3 h-28 mb-4">
                    <button onClick={() => cameraInputRef.current.click()} className="border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-[#FF6700] hover:bg-[#FF6700]/5 transition"><Camera size={28} className="mb-1" /><span className="font-oswald text-[10px] uppercase font-bold tracking-widest">SNAP</span></button>
                    <button onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-[#FF6700] hover:bg-[#FF6700]/5 transition"><Upload size={28} className="mb-1" /><span className="font-oswald text-[10px] uppercase font-bold tracking-widest">FILE</span></button>
                    <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,application/pdf" className="hidden" />
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#FF6700] mb-4 bg-zinc-200 dark:bg-black/40 h-48">
                    {fileType === "pdf" ? <div className="h-full flex flex-col items-center justify-center text-red-500"><FileDigit size={48} /><span className="font-bold text-xs mt-2">PDF READY</span></div> : <img src={preview} className="w-full h-full object-cover" />}
                    <button onClick={() => { setPreview(null); setFileToUpload(null); }} className="absolute top-2 right-2 bg-black/80 p-2 rounded-full text-white"><X size={18}/></button>
                </div>
            )}
            <input placeholder="Add Notes (Optional)..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-white/5 rounded-xl p-4 w-full mb-4 outline-none focus:border-[#FF6700]" />
            <button onClick={savePhoto} disabled={uploading} className="w-full bg-[#FF6700] text-black font-bold font-oswald text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">{uploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}{uploading ? "SAVING..." : "SAVE PHOTO"}</button>
        </div>

        {/* GRID HEADER */}
        <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-oswald font-bold uppercase tracking-tight truncate max-w-[60%]">{selectedJob} ({filteredPhotos.length})</h2>
            <div className="flex gap-2">
                <button onClick={() => { vibrate(); setIsEditMode(!isEditMode); setSelectedIndices([]); }} className={`p-2 rounded-lg border transition ${isEditMode ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-card border-zinc-200 dark:border-white/5"}`}><CheckCircle2 size={18} /></button>
                <button onClick={() => { vibrate(); setShowReportModal(true); }} className="bg-blue-600 text-white p-2 rounded-lg font-bold flex items-center gap-2 text-xs shadow-md"><Share size={14} /> REPORT</button>
            </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-3 gap-3 pb-32">
            {filteredPhotos.length === 0 ? <div className="col-span-3 text-center py-10 opacity-40 italic">No photos found.</div> : filteredPhotos.map((p, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                    <div key={p.id} onClick={() => isEditMode ? toggleSelection(idx) : setFullScreenImage(p)} className={`relative h-36 rounded-xl overflow-hidden shadow-lg border transition-all ${isSelected ? "ring-4 ring-[#FF6700] scale-90 border-transparent" : "border-zinc-200 dark:border-white/5"}`}>
                        <img src={p.image_url} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1"><span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold border ${p.tag === "BEFORE" ? "bg-red-500 text-white" : p.tag === "AFTER" ? "bg-green-500 text-white" : "bg-yellow-500 text-black shadow-sm"}`}>{p.tag}</span></div>
                    </div>
                );
            })}
        </div>
      </main>

      {/* MODALS: Archive, Inspect, Report */}
      {showArchive && (
          <div className="fixed inset-0 z-[60] animate-in fade-in">
              <div className="absolute inset-0 bg-black/50 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowArchive(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l border-zinc-200 dark:border-white/5 p-6 animate-in slide-in-from-right">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-zinc-200 dark:border-white/5"><h2 className="text-xl font-oswald font-bold text-[#FF6700]">JOB ARCHIVE</h2><button onClick={() => setShowArchive(false)} className="text-zinc-400"><X /></button></div>
                  <div className="space-y-4 overflow-y-auto max-h-[85vh]">
                      {allJobs.map(job => (
                          <button key={job} onClick={() => { handleJobSelect(job); setShowArchive(false); }} className={`w-full text-left p-4 rounded-xl border flex flex-col gap-1.5 transition-all ${selectedJob === job ? "bg-[#FF6700]/10 border-[#FF6700]" : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10"}`}>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase"><Clock size={12} />{new Date(jobMetadata[job]).toLocaleDateString()}</div>
                              <span className="font-bold uppercase text-sm truncate">{job}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {fullScreenImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in zoom-in">
              <div className="flex justify-between items-center p-6 border-b border-white/10"><div className="text-white"><h3 className="font-bold uppercase text-xl font-oswald">{fullScreenImage.job_name}</h3><p className="text-xs opacity-60 tracking-widest uppercase">{fullScreenImage.tag} • {new Date(fullScreenImage.created_at).toLocaleDateString()}</p></div><button onClick={() => setFullScreenImage(null)} className="p-3 bg-white/10 rounded-full text-white"><X size={28}/></button></div>
              <div className="flex-1 flex items-center justify-center p-4"><img src={fullScreenImage.image_url} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" /></div>
          </div>
      )}

      {showReportModal && (
          <div className="fixed inset-0 z-[70] bg-white text-black p-8 overflow-auto animate-in fade-in">
              <div className="max-w-3xl mx-auto pb-20">
                  <div className="flex justify-between items-end border-b-4 border-[#FF6700] pb-6 mb-8"><div><h1 className="text-4xl font-oswald font-bold">SITE REPORT</h1><p className="text-zinc-500 uppercase font-bold tracking-widest text-sm">PROJECT: {selectedJob}</p></div><button onClick={() => setShowReportModal(false)} className="bg-black text-white p-3 rounded-xl"><X /></button></div>
                  <div className="grid grid-cols-2 gap-6">{filteredPhotos.map(p => (<div key={p.id} className="border border-zinc-200 p-2 rounded-lg break-inside-avoid"><img src={p.image_url} className="w-full h-48 object-cover rounded mb-2" /><div className="flex justify-between text-[10px] font-bold"><span className="text-[#FF6700]">{p.tag}</span><span>{new Date(p.created_at).toLocaleDateString()}</span></div><p className="text-xs italic text-zinc-700 mt-1">"{p.notes || "No notes."}"</p></div>))}</div>
                  <div className="fixed bottom-8 left-0 w-full no-print px-8"><button onClick={handleShareReport} className="w-full bg-[#FF6700] text-black font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 text-xl"><Share size={24} /> SEND REPORT</button></div>
              </div>
          </div>
      )}

      {/* ACTION BAR (BLUEPRINT) */}
      {isEditMode && selectedIndices.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full z-50 bg-[#121212] border-t border-gray-800 p-4 animate-in slide-in-from-bottom">
              <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                  <div className="text-white font-bold text-sm">{selectedIndices.length} Selected</div>
                  <button onClick={handleDeleteSelected} className="bg-red-900/30 text-red-500 border border-red-500/30 px-6 py-2 rounded-lg font-bold flex items-center gap-2"><Trash2 size={18}/> Delete</button>
              </div>
          </div>
      )}

      {toast && <div className={`fixed bottom-24 right-6 px-6 py-3 rounded shadow-xl font-bold text-white z-[80] animate-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-green-600 shadow-green-900/40" : "bg-blue-600"}`}>{toast.msg}</div>}
    </div>
  );
}
