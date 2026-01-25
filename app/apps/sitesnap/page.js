"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import { 
  Camera, Trash2, CheckCircle2, FileText, 
  Loader2, Upload, Share, FileDigit, ArrowLeft, X, Menu, 
  FolderOpen, ListPlus, Pencil, ChevronDown, Clock
} from "lucide-react";
import Link from "next/link";

export default function SiteSnap() {
  const supabase = createClient();
  
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [allJobs, setAllJobs] = useState([]); 
  const [jobMetadata, setJobMetadata] = useState({}); 
  const [selectedJob, setSelectedJob] = useState("");
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customJob, setCustomJob] = useState("");

  const [tag, setTag] = useState("BEFORE");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileType, setFileType] = useState("image"); 
  const [showReportModal, setShowReportModal] = useState(false);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const vibrate = (pattern = 10) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
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
        if (!meta[p.job_name] || time > meta[p.job_name]) meta[p.job_name] = time;
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
    if (jobName === "NEW_JOB") setIsCustomizing(true);
    else { setSelectedJob(jobName); setIsCustomizing(false); setCustomJob(""); }
    setIsDropdownOpen(false);
    setSelectedIndices([]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToUpload(file);
      if (file.type.includes("pdf")) { setFileType("pdf"); setPreview("PDF_ICON"); }
      else {
        setFileType("image");
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  const savePhoto = async () => {
    const finalJobName = isCustomizing ? customJob.trim().toUpperCase() : selectedJob;
    if (!finalJobName) return alert("Enter Job Name");
    if (!fileToUpload) return alert("Select File");
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const ext = fileType === "pdf" ? "pdf" : "jpg";
    const fileName = `${user.id}/${finalJobName.replace(/\s/g, "_")}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("sitesnap").upload(fileName, fileToUpload);
    if (uploadError) { alert(uploadError.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("sitesnap").getPublicUrl(fileName);
    const { data: newEntry } = await supabase.from("site_photos").insert({
      user_id: user.id, job_name: finalJobName, tag: tag, notes: notes, image_url: publicUrl
    }).select().single();
    if (newEntry) {
      setPhotos([newEntry, ...photos]);
      setPreview(null);
      setFileToUpload(null);
      setNotes("");
      setSelectedJob(finalJobName);
      setIsCustomizing(false);
      setAllJobs(prev => [finalJobName, ...prev.filter(j => j !== finalJobName)]);
      setJobMetadata(prev => ({...prev, [finalJobName]: new Date().getTime()}));
      showToast("Saved", "success");
    }
    setUploading(false);
  };

  const showToast = (msg, type) => { setToast({msg, type}); setTimeout(()=>setToast(null), 3000); };
  const filteredPhotos = photos.filter(p => p.job_name === selectedJob);
  const recentJobs = allJobs.slice(0, 7);

  return (
    <div className="min-h-screen pb-32">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 pt-4 mb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors"><ArrowLeft size={28} /></Link>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700]">SiteSnap</h1>
            <p className="text-xs font-bold tracking-widest opacity-60">JOB VISUALS</p>
          </div>
        </div>
        {/* HAMBURGER - Now using industrial-card for variables */}
        <button onClick={() => { vibrate(); setShowArchive(!showArchive); }} className="industrial-card p-3 rounded-xl text-[#FF6700]">
          <Menu size={24} />
        </button>
      </div>

      <main className="max-w-6xl mx-auto px-6">
        {/* DROPDOWN */}
        <div className="relative mb-6" ref={dropdownRef}>
          {isCustomizing ? (
            <div className="flex items-center gap-2 industrial-card p-4 rounded-xl border-[#FF6700]">
              <Pencil className="text-[#FF6700]" size={20} />
              <input autoFocus placeholder="TYPE JOB NAME..." value={customJob} onChange={e => setCustomJob(e.target.value.toUpperCase())} onBlur={() => !customJob && setIsCustomizing(false)} className="bg-transparent text-[var(--text-main)] font-bold uppercase outline-none w-full" />
              <button onClick={() => setIsCustomizing(false)}><X size={22}/></button>
            </div>
          ) : (
            <>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between industrial-card p-4 rounded-xl hover:border-[#FF6700]">
                <div className="flex items-center gap-3"><FolderOpen className="text-[#FF6700]" size={22} /><span className="font-bold uppercase truncate">{selectedJob || "SELECT JOB"}</span></div>
                <ChevronDown size={20} className={isDropdownOpen ? "rotate-180" : ""} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[var(--bg-main)] border border-[var(--border-color)] industrial-card rounded-xl z-50 overflow-hidden">
                  <div className="p-2 space-y-1">
                    {recentJobs.map(job => (
                      <button key={job} onClick={() => handleJobSelect(job)} className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm ${selectedJob === job ? "bg-[#FF6700] text-black" : "hover:bg-[#FF6700]/10"}`}>{job}</button>
                    ))}
                    <button onClick={() => handleJobSelect("NEW_JOB")} className="w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-sm text-[#FF6700] hover:bg-[#FF6700]/10">+ NEW JOB</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* UPLOAD PANEL */}
        <div className="industrial-card rounded-2xl p-5 mb-8">
            <div className="grid grid-cols-3 gap-2 mb-4">
                {["BEFORE", "AFTER", "DOCS"].map(t => (
                    <button key={t} onClick={() => setTag(t)} className={`py-3 rounded-lg font-bold text-xs border transition-all ${tag === t ? "bg-[#FF6700] text-black border-[#FF6700]" : "industrial-card border-[var(--border-color)]"}`}>{t}</button>
                ))}
            </div>
            {!preview ? (
                <div className="grid grid-cols-2 gap-3 h-28 mb-4">
                    {/* BUTTONS: Explicit border-2 and variable border color */}
                    <button onClick={() => cameraInputRef.current.click()} className="border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center text-[var(--text-sub)] hover:border-[#FF6700] transition">
                        <Camera size={28} className="mb-1" />
                        <span className="font-oswald text-[10px] uppercase font-bold">SNAP</span>
                    </button>
                    <button onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center text-[var(--text-sub)] hover:border-[#FF6700] transition">
                        <Upload size={28} className="mb-1" />
                        <span className="font-oswald text-[10px] uppercase font-bold">FILE</span>
                    </button>
                    <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,application/pdf" className="hidden" />
                </div>
            ) : (
                <div className="relative rounded-xl overflow-hidden border border-[#FF6700] mb-4 h-48">
                    {fileType === "pdf" ? <div className="h-full flex flex-col items-center justify-center"><FileDigit size={48} /></div> : <img src={preview} className="w-full h-full object-cover" />}
                    <button onClick={() => setPreview(null)} className="absolute top-2 right-2 bg-black/80 p-2 rounded-full text-white"><X size={18}/></button>
                </div>
            )}
            {/* NOTES INPUT: Uses var(--bg-main) to stay themed */}
            <input placeholder="Add Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 w-full mb-4 outline-none focus:border-[#FF6700]" />
            <button onClick={savePhoto} disabled={uploading} className="w-full bg-[#FF6700] text-black font-bold font-oswald text-lg py-4 rounded-xl active:scale-95 transition-transform">{uploading ? "SAVING..." : "SAVE PHOTO"}</button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-3 gap-3">
            {filteredPhotos.map(p => (
                <div key={p.id} onClick={() => setFullScreenImage(p)} className="relative h-36 rounded-xl overflow-hidden industrial-card shadow-lg">
                    <img src={p.image_url} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1"><span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold border ${p.tag === "BEFORE" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>{p.tag}</span></div>
                </div>
            ))}
        </div>
      </main>

      {/* ARCHIVE DRAWER - FIXED FOR LIGHT MODE */}
      {showArchive && (
          <div className="fixed inset-0 z-[60] animate-in fade-in">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowArchive(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-[var(--bg-main)] border-l border-[var(--border-color)] p-6 animate-in slide-in-from-right">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--border-color)]">
                    <h2 className="text-xl font-oswald font-bold text-[#FF6700]">JOB ARCHIVE</h2>
                    <button onClick={() => setShowArchive(false)} className="text-[var(--text-sub)]"><X /></button>
                  </div>
                  <div className="space-y-4 overflow-y-auto max-h-[85vh]">
                      {allJobs.map(job => (
                          <button key={job} onClick={() => { handleJobSelect(job); setShowArchive(false); }} className={`w-full text-left p-4 rounded-xl border flex flex-col gap-1.5 transition-all ${selectedJob === job ? "bg-[#FF6700]/10 border-[#FF6700]" : "industrial-card"}`}>
                              <div className="flex items-center gap-2 text-[10px] text-[var(--text-sub)] font-bold uppercase"><Clock size={12} />{new Date(jobMetadata[job]).toLocaleDateString()}</div>
                              <span className="font-bold uppercase text-sm truncate">{job}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {toast && <div className="fixed bottom-24 right-6 px-6 py-3 rounded shadow-xl font-bold text-white bg-green-600 animate-in slide-in-from-bottom-5">{toast.msg}</div>}
    </div>
  );
}
