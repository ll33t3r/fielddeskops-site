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

  // Close dropdown on click-off
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

      if (sorted.length > 0) {
        setSelectedJob(sorted[0]);
      }
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
    if (!customJob.trim()) {
      setIsCustomizing(false);
      vibrate(5);
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
      
      setAllJobs(prev => {
        const filtered = prev.filter(j => j !== finalJobName);
        return [finalJobName, ...filtered];
      });

      showToast("Saved to Gallery", "success");
    }
    setUploading(false);
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };

  const filteredPhotos = photos.filter(p => p.job_name === selectedJob);
  const recentJobs = allJobs.slice(0, 7);

  return (
    <div className={`min-h-screen bg-background text-foreground font-inter pb-32 ${showReportModal || fullScreenImage ? "overflow-hidden h-screen" : ""}`}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:text-[#FF6700] transition-colors">
            <ArrowLeft size={28} />
          </Link>
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
        
        {/* CUSTOM DROPDOWN SELECTOR */}
        <div className="relative mb-6" ref={dropdownRef}>
          {isCustomizing ? (
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-[#FF6700] p-4 rounded-xl shadow-lg transition-all">
              <Pencil className="text-[#FF6700] shrink-0" size={20} />
              <input 
                autoFocus 
                placeholder="TYPE NEW JOB NAME..." 
                value={customJob} 
                onChange={e => setCustomJob(e.target.value.toUpperCase())}
                onBlur={handleCustomBlur}
                className="bg-transparent text-foreground font-bold uppercase outline-none w-full" 
              />
              <button onClick={() => setIsCustomizing(false)} className="text-zinc-500 hover:text-red-500"><X size={22}/></button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => { vibrate(5); setIsDropdownOpen(!isDropdownOpen); }}
                className="w-full flex items-center justify-between bg-card border border-zinc-200 dark:border-white/5 p-4 rounded-xl hover:border-[#FF6700] transition-all shadow-md dark:shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="text-[#FF6700]" size={22} />
                  <span className="font-bold uppercase tracking-wide truncate">
                    {selectedJob || "SELECT A JOB"}
                  </span>
                </div>
                <ChevronDown size={20} className={`text-zinc-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-background border border-zinc-200 dark:border-white/5 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    {recentJobs.map(job => (
                      <button 
                        key={job}
                        onClick={() => handleJobSelect(job)}
                        className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm transition-colors flex items-center justify-between ${selectedJob === job ? "bg-[#FF6700] text-black" : "text-foreground hover:bg-zinc-100 dark:hover:bg-white/5"}`}
                      >
                        {job}
                        {selectedJob === job && <CheckCircle2 size={16} />}
                      </button>
                    ))}
                    <div className="h-px bg-zinc-200 dark:bg-white/5 my-2" />
                    <button 
                      onClick={() => handleJobSelect("NEW_JOB")}
                      className="w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm text-[#FF6700] hover:bg-[#FF6700]/10 flex items-center gap-2"
                    >
                      <ListPlus size={18} /> + NEW JOB NAME
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* UPLOAD PANEL */}
        <div className="bg-card rounded-2xl p-5 mb-8 border border-zinc-200 dark:border-white/5 shadow-xl">
            <div className="grid grid-cols-3 gap-2 mb-4">
                {["BEFORE", "AFTER", "DOCS"].map(t => (
                    <button key={t} onClick={() => { vibrate(); setTag(t); }} className={`py-3 rounded-lg font-bold text-xs border transition-all ${tag === t ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-zinc-100 dark:bg-black/20 border-zinc-200 dark:border-white/5 text-muted-foreground"}`}>
                        {t}
                    </button>
                ))}
            </div>

            {!preview ? (
                <div className="grid grid-cols-2 gap-3 h-28 mb-4">
                    <button onClick={() => cameraInputRef.current.click()} className="border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-[#FF6700] hover:bg-[#FF6700]/5 transition">
                        <Camera size={28} className="mb-1" />
                        <span className="font-oswald text-[10px] uppercase font-bold tracking-widest">SNAP</span>
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-[#FF6700] hover:bg-[#FF6700]/5 transition">
                        <Upload size={28} className="mb-1" />
                        <span className="font-oswald text-[10px] uppercase font-bold tracking-widest">FILE</span>
                    </button>
                    <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,application/pdf" className="hidden" />
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#FF6700] mb-4 bg-zinc-200 dark:bg-black/40 h-48">
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

            <input 
                placeholder="Add Notes (Optional)..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-white/5 rounded-xl p-4 w-full mb-4 text-foreground outline-none focus:border-[#FF6700] shadow-inner" 
            />

            <button onClick={savePhoto} disabled={uploading} className="w-full bg-[#FF6700] text-black font-bold font-oswald text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                {uploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {uploading ? "SAVING..." : "SAVE PHOTO"}
            </button>
        </div>

        {/* GALLERY HEADER */}
        <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-oswald font-bold uppercase tracking-tight text-foreground truncate max-w-[60%]">
                {selectedJob} ({filteredPhotos.length})
            </h2>
            <div className="flex gap-2">
                <button onClick={() => { vibrate(); setIsEditMode(!isEditMode); setSelectedIndices([]); }} className={`p-2 rounded-lg border transition ${isEditMode ? "bg-[#FF6700] text-black border-[#FF6700]" : "bg-card border-zinc-200 dark:border-white/5 text-muted-foreground"}`}>
                    <CheckCircle2 size={18} />
                </button>
                <button onClick={() => { vibrate(); setShowReportModal(true); }} className="bg-blue-600 text-white p-2 rounded-lg font-bold flex items-center gap-2 text-xs shadow-md">
                    <Share size={14} /> REPORT
                </button>
            </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-3 gap-3 pb-32">
            {filteredPhotos.length === 0 ? (
                <div className="col-span-3 text-center py-10 text-muted-foreground opacity-40 italic">No photos found for this job.</div>
            ) : filteredPhotos.map((p, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                    <div 
                        key={p.id} 
                        onClick={() => isEditMode ? toggleSelection(idx) : setFullScreenImage(p)}
                        className={`relative h-36 rounded-xl overflow-hidden shadow-lg border transition-all ${isSelected ? "ring-4 ring-[#FF6700] scale-90 border-transparent" : "border-zinc-200 dark:border-white/5"}`}
                    >
                        <img src={p.image_url} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1">
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold border ${p.tag === "BEFORE" ? "bg-red-500 text-white" : p.tag === "AFTER" ? "bg-green-500 text-white" : "bg-yellow-500 text-black shadow-sm"}`}>{p.tag}</span>
                        </div>
                    </div>
                );
            })}
        </div>
      </main>

      {/* ARCHIVE DRAWER - REFRESHED FOR LIGHT/DARK MODE */}
      {showArchive && (
          <div className="fixed inset-0 z-[60] animate-in fade-in">
              <div className="absolute inset-0 bg-black/50 dark:bg-black/90 backdrop-blur-md" onClick={() => setShowArchive(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l border-zinc-200 dark:border-white/5 p-6 animate-in slide-in-from-right shadow-2xl">
                  <div className="flex justify-between items-center mb-8 border-b border-zinc-200 dark:border-white/5 pb-4">
                      <h2 className="text-xl font-oswald font-bold text-[#FF6700] tracking-widest">JOB ARCHIVE</h2>
                      <button onClick={() => setShowArchive(false)} className="text-zinc-400 hover:text-foreground"><X /></button>
                  </div>
                  <div className="space-y-4 overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar">
                      {allJobs.map(job => (
                          <button 
                            key={job} 
                            onClick={() => { handleJobSelect(job); setShowArchive(false); }}
                            className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1.5 ${selectedJob === job ? "bg-[#FF6700]/10 border-[#FF6700] shadow-sm" : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10"}`}
                          >
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-tight">
                                <Clock size={12} />
                                {new Date(jobMetadata[job]).toLocaleDateString()}
                              </div>
                              <span className="font-bold uppercase text-sm truncate text-foreground">{job}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* INSPECT OVERLAY (ADAPTIVE) */}
      {fullScreenImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-in zoom-in">
              <div className="flex justify-between items-center p-6 border-b border-white/10">
                  <div className="text-white">
                      <h3 className="font-bold uppercase text-xl font-oswald">{fullScreenImage.job_name}</h3>
                      <p className="text-xs opacity-60 tracking-widest uppercase">{fullScreenImage.tag} • {new Date(fullScreenImage.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => setFullScreenImage(null)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><X size={28}/></button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                  <img src={fullScreenImage.image_url} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
              </div>
              {fullScreenImage.notes && (
                  <div className="p-8 bg-black/50 border-t border-white/10">
                      <p className="text-white italic text-lg text-center opacity-80">"{fullScreenImage.notes}"</p>
                  </div>
              )}
          </div>
      )}

      {toast && <div className={`fixed bottom-24 right-6 px-6 py-3 rounded shadow-xl font-bold text-white z-[80] animate-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-green-600 shadow-green-900/40" : "bg-blue-600 shadow-blue-900/40"}`}>{toast.msg}</div>}
    </div>
  );
}
