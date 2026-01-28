'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useActiveJob } from '../../../hooks/useActiveJob';
import {
  Camera, Upload, X, ArrowLeft, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, Image as ImageIcon,
  Trash2, Edit2, SplitSquareVertical, Grid3x3,
  Share2, DollarSign, Plus, ChevronDown, Lock
} from 'lucide-react';
import Link from 'next/link';
import {
  ReactCompareSlider,
  ReactCompareSliderImage
} from 'react-compare-slider';

export default function SiteSnap() {
  const supabase = createClient();
  const { activeJob, setActiveJob } = useActiveJob();

  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [photoTag, setPhotoTag] = useState('STANDARD');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoNotes, setPhotoNotes] = useState('');
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [annotationText, setAnnotationText] = useState('');
  const [showEstimateLink, setShowEstimateLink] = useState(false);
  const [estimates, setEstimates] = useState([]);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [selectedBeforeAfter, setSelectedBeforeAfter] = useState({ before: null, after: null });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [selectedForShare, setSelectedForShare] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [newJobName, setNewJobName] = useState('');
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [linkedEstimate, setLinkedEstimate] = useState(null);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const vibrate = (pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadAllJobs();
  }, []);

  useEffect(() => {
    if (activeJob?.id) {
      loadPhotos();
      loadEstimates();
    } else {
      setUploadedPhotos([]);
      setLoading(false);
    }
  }, [activeJob?.id]);

  useEffect(() => {
    if (fullscreenPhoto?.estimate_id && estimates.length > 0) {
      const estimate = estimates.find(e => e.id === fullscreenPhoto.estimate_id);
      setLinkedEstimate(estimate);
    } else {
      setLinkedEstimate(null);
    }
  }, [fullscreenPhoto, estimates]);

  const loadAllJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      setAllJobs(jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const createNewJob = async () => {
    if (!newJobName.trim()) return;
    try {
      setIsCreatingJob(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          user_id: user.id,
          title: newJobName.trim(),
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (!error && newJob) {
        setActiveJob(newJob);
        setAllJobs([newJob, ...allJobs]);
        setNewJobName('');
        setShowJobSelector(false);
        showToast('Job created!', 'success');
      }
    } catch (error) {
      console.error('Error creating job:', error);
      showToast('Error creating job', 'error');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeJob?.id) return;

      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', activeJob.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const photosWithUrls = await Promise.all(
        (photos || []).map(async (photo) => {
          try {
            const { data } = await supabase.storage
              .from('fielddeskops-photos')
              .createSignedUrl(photo.storage_path, 3600);
            return { ...photo, image_url: data?.signedUrl || null };
          } catch (err) {
            return { ...photo, image_url: null };
          }
        })
      );

      setUploadedPhotos(photosWithUrls);
    } catch (error) {
      console.error('Error loading photos:', error);
      showToast('Error loading photos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEstimates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeJob?.id) return;

      const { data: estimates } = await supabase
        .from('estimates')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', activeJob.id)
        .order('created_at', { ascending: false });

      setEstimates(estimates || []);
    } catch (error) {
      console.error('Error loading estimates:', error);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToUpload(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const savePhoto = async () => {
    if (!fileToUpload || !activeJob?.id) {
      showToast('Missing file or job', 'error');
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Not authenticated', 'error');
        return;
      }

      const timestamp = Date.now();
      const fileName = `${user.id}/${activeJob.id}/${timestamp}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('fielddeskops-photos')
        .upload(fileName, fileToUpload, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: newPhoto, error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          job_id: activeJob.id,
          storage_path: fileName,
          caption: photoCaption || null,
          notes: photoNotes || null,
          photo_type: photoTag,
          annotations: [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const { data: signedData } = await supabase.storage
        .from('fielddeskops-photos')
        .createSignedUrl(fileName, 3600);

      if (newPhoto) {
        setUploadedPhotos([{ ...newPhoto, image_url: signedData?.signedUrl || null }, ...uploadedPhotos]);
        setPreview(null);
        setFileToUpload(null);
        setPhotoCaption('');
        setPhotoNotes('');
        setPhotoTag('STANDARD');
        setShowUploadPanel(false);
        showToast('Photo saved!', 'success');
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      showToast('Error: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await supabase.from('photos').delete().eq('id', photoId);
      setUploadedPhotos(uploadedPhotos.filter(p => p.id !== photoId));
      setFullscreenPhoto(null);
      showToast('Photo deleted', 'success');
    } catch (error) {
      console.error('Error deleting photo:', error);
      showToast('Error deleting photo', 'error');
    }
  };

  const linkToEstimate = async (estimateId) => {
    if (!fullscreenPhoto?.id) return;
    try {
      await supabase
        .from('photos')
        .update({ estimate_id: estimateId })
        .eq('id', fullscreenPhoto.id);

      const estimate = estimates.find(e => e.id === estimateId);
      
      setUploadedPhotos(uploadedPhotos.map(p =>
        p.id === fullscreenPhoto.id ? { ...p, estimate_id: estimateId } : p
      ));
      setFullscreenPhoto({ ...fullscreenPhoto, estimate_id: estimateId });
      setLinkedEstimate(estimate);
      setShowEstimateLink(false);
      showToast('Linked to estimate!', 'success');
    } catch (error) {
      console.error('Error linking estimate:', error);
      showToast('Error linking estimate', 'error');
    }
  };

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      const newIndex = currentPhotoIndex - 1;
      setCurrentPhotoIndex(newIndex);
      setFullscreenPhoto(uploadedPhotos[newIndex]);
      setAnnotations(uploadedPhotos[newIndex].annotations || []);
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < uploadedPhotos.length - 1) {
      const newIndex = currentPhotoIndex + 1;
      setCurrentPhotoIndex(newIndex);
      setFullscreenPhoto(uploadedPhotos[newIndex]);
      setAnnotations(uploadedPhotos[newIndex].annotations || []);
    }
  };

  const saveAnnotation = async (text) => {
    if (!fullscreenPhoto?.id || !text.trim()) return;
    try {
      const updatedAnnotations = [...(fullscreenPhoto.annotations || []), { text, timestamp: new Date().toISOString() }];
      await supabase
        .from('photos')
        .update({ annotations: updatedAnnotations })
        .eq('id', fullscreenPhoto.id);

      setAnnotations(updatedAnnotations);
      setFullscreenPhoto({ ...fullscreenPhoto, annotations: updatedAnnotations });
      setUploadedPhotos(uploadedPhotos.map(p =>
        p.id === fullscreenPhoto.id ? { ...p, annotations: updatedAnnotations } : p
      ));
      setAnnotationText('');
      setIsAnnotating(false);
      showToast('Annotation saved', 'success');
    } catch (error) {
      console.error('Error saving annotation:', error);
      showToast('Error saving annotation', 'error');
    }
  };

  const togglePhotoSelection = (photoId) => {
    vibrate();
    setSelectedForShare(prev => 
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  const sharePhotos = async () => {
    const photosToShare = selectedForShare.length > 0 
      ? uploadedPhotos.filter(p => selectedForShare.includes(p.id))
      : uploadedPhotos;

    if (navigator.share) {
      try {
        const files = await Promise.all(
          photosToShare.map(async (photo) => {
            const response = await fetch(photo.image_url);
            const blob = await response.blob();
            return new File([blob], `${activeJob.title}-${photo.id}.jpg`, { type: 'image/jpeg' });
          })
        );
        
        await navigator.share({
          title: `${activeJob.title} Photos`,
          text: `${photosToShare.length} photos from ${activeJob.title}`,
          files
        });
        
        showToast('Photos shared!', 'success');
        setShowShareMenu(false);
        setSelectedForShare([]);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          showToast('Share cancelled', 'error');
        }
        setShowShareMenu(false);
        setSelectedForShare([]);
      }
    } else {
      showToast('Share not supported on this device', 'error');
    }
  };

  const beforePhotos = uploadedPhotos.filter(p => p.photo_type === 'BEFORE');
  const afterPhotos = uploadedPhotos.filter(p => p.photo_type === 'AFTER');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#FF6700]" />
          <p className="text-[var(--text-sub)] font-bold">Loading photos...</p>
        </div>
      </div>
    );
  }

  if (!activeJob) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] px-6">
        <AlertTriangle size={48} className="text-[#FF6700] mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">No Active Job</h2>
        <p className="text-[var(--text-sub)] text-center mb-6">Select a job from Command Center to view photos</p>
        <Link href="/" className="bg-[#FF6700] text-black font-bold uppercase px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(255,103,0,0.4)]">
          Go to Command Center
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] pb-20 relative">
      {/* HEADER - STICKY */}
      <div className="sticky top-0 z-40 bg-[var(--bg-main)] border-b border-[var(--border-color)] px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors text-[var(--text-main)]">
              <ArrowLeft size={28} />
            </Link>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-sub)] opacity-60 mb-0.5">FIELDDESKOPS</p>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] drop-shadow-[0_0_12px_rgba(255,103,0,0.5)]">SiteSnap</h1>
              <p className="text-xs font-bold tracking-widest text-[var(--text-sub)]">PHOTO DOCUMENTATION</p>
            </div>
          </div>
          <button
            onClick={() => {
              vibrate();
              setShowUploadPanel(!showUploadPanel);
            }}
            className="industrial-card p-3 rounded-xl text-[#FF6700] hover:border-[#FF6700] transition-colors shadow-[0_0_20px_rgba(255,103,0,0.4)]"
          >
            <Camera size={24} />
          </button>
        </div>
        
        {/* JOB SELECTOR */}
        <div className="relative">
          <button
            onClick={() => setShowJobSelector(!showJobSelector)}
            className="w-full industrial-card p-3 rounded-lg flex items-center justify-between hover:border-[#FF6700] transition-colors"
          >
            <div>
              <p className="text-[var(--text-main)] font-bold uppercase text-sm">{activeJob.title}</p>
              <p className="text-[var(--text-sub)] text-xs">{uploadedPhotos.length} photo{uploadedPhotos.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {(beforePhotos.length > 0 && afterPhotos.length > 0) && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                  <SplitSquareVertical size={14} />
                  <span>B/A READY</span>
                </div>
              )}
              <ChevronDown size={20} className={`text-[var(--text-sub)] transition-transform ${showJobSelector ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showJobSelector && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowJobSelector(false)} />
              <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl shadow-2xl z-40 max-h-80 overflow-y-auto backdrop-blur-xl">
                <div className="p-3 border-b border-[var(--border-color)]">
                  <div className="flex gap-2">
                    <input
                      placeholder="New job name..."
                      value={newJobName}
                      onChange={e => setNewJobName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createNewJob()}
                      className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
                      style={{ fontSize: '16px' }}
                    />
                    <button
                      onClick={createNewJob}
                      disabled={isCreatingJob || !newJobName.trim()}
                      className="bg-[#FF6700] text-black px-3 rounded font-bold disabled:opacity-50 shadow-[0_0_15px_rgba(255,103,0,0.3)]"
                    >
                      {isCreatingJob ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    </button>
                  </div>
                </div>
                {allJobs.map(job => (
                  <button
                    key={job.id}
                    onClick={() => {
                      setActiveJob(job);
                      setShowJobSelector(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-[var(--bg-surface)] transition-colors ${
                      activeJob.id === job.id ? 'bg-[#FF6700]/10 border-l-4 border-[#FF6700]' : ''
                    }`}
                  >
                    <p className="font-bold text-sm text-[var(--text-main)]">{job.title}</p>
                    <p className="text-xs text-[var(--text-sub)]">{job.status}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6">
        {showUploadPanel && (
          <div className="industrial-card rounded-2xl p-6 mb-8 mt-6 border-2 border-[#FF6700] shadow-[0_0_30px_rgba(255,103,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#FF6700] uppercase">Add Photo</h2>
              <button onClick={() => setShowUploadPanel(false)} className="text-[var(--text-sub)]">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {['STANDARD', 'BEFORE', 'AFTER'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setPhotoTag(tag)}
                  className={`py-3 rounded-lg font-bold text-xs uppercase transition-all border ${
                    photoTag === tag
                      ? 'bg-[#FF6700] text-black border-[#FF6700] shadow-[0_0_15px_rgba(255,103,0,0.3)]'
                      : 'industrial-card border-[var(--border-color)] text-[var(--text-main)] hover:border-[#FF6700]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {!preview ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center py-8 text-[var(--text-sub)] hover:border-[#FF6700] transition-all"
                >
                  <Camera size={32} className="mb-2 text-[#FF6700]" />
                  <span className="font-bold text-xs uppercase">Snap</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center py-8 text-[var(--text-sub)] hover:border-[#FF6700] transition-all"
                >
                  <Upload size={32} className="mb-2 text-[#FF6700]" />
                  <span className="font-bold text-xs uppercase">Gallery</span>
                </button>
                <input type="file" ref={cameraInputRef} onChange={handleFileSelect} accept="image/*" capture="environment" className="hidden" />
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border-2 border-[#FF6700] mb-4 h-48 bg-black/10">
                <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                <button
                  onClick={() => {
                    setPreview(null);
                    setFileToUpload(null);
                  }}
                  className="absolute top-2 right-2 bg-black/80 p-2 rounded-full text-white hover:bg-black"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <input
              placeholder="Photo Caption (optional)..."
              value={photoCaption}
              onChange={e => setPhotoCaption(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-3 mb-3 text-[var(--text-main)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
              style={{ fontSize: '16px' }}
            />
            <textarea
              placeholder="Notes (what is visible, issues found, etc)..."
              value={photoNotes}
              onChange={e => setPhotoNotes(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-3 mb-4 text-[var(--text-main)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none resize-none h-24"
              style={{ fontSize: '16px' }}
            />

            <button
              onClick={savePhoto}
              disabled={uploading || !fileToUpload}
              className="w-full bg-[#FF6700] text-black font-bold uppercase py-4 rounded-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(255,103,0,0.4)]"
            >
              {uploading ? 'Saving...' : 'Save Photo'}
            </button>
          </div>
        )}

        {uploadedPhotos.length === 0 ? (
          <div className="py-12 text-center mt-8">
            <ImageIcon size={48} className="mx-auto mb-4 text-[var(--text-sub)] opacity-50" />
            <p className="text-[var(--text-sub)] font-bold mb-4">No photos yet for this job</p>
            <button
              onClick={() => setShowUploadPanel(true)}
              className="inline-block bg-[#FF6700] text-black font-bold uppercase px-6 py-3 rounded-lg active:scale-95 transition-all shadow-[0_0_25px_rgba(255,103,0,0.4)]"
            >
              + Upload First Photo
            </button>
          </div>
        ) : (
          <>
            {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
              <div className="mb-6 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase text-[#FF6700] flex items-center gap-2">
                    <SplitSquareVertical size={18} />
                    Before / After
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-sub)]">
                    <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold">{beforePhotos.length} BEFORE</span>
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">{afterPhotos.length} AFTER</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {beforePhotos.slice(0, 2).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => {
                        vibrate();
                        const photoIdx = uploadedPhotos.findIndex(p => p.id === photo.id);
                        setFullscreenPhoto(photo);
                        setCurrentPhotoIndex(photoIdx);
                        setAnnotations(photo.annotations || []);
                        const before = photo;
                        const after = afterPhotos[0];
                        if (before && after) {
                          setSelectedBeforeAfter({ before, after });
                          setShowBeforeAfter(true);
                        }
                      }}
                      className="relative h-32 rounded-lg overflow-hidden cursor-pointer group industrial-card"
                    >
                      {photo.image_url && <img src={photo.image_url} className="w-full h-full object-cover" alt="Before" />}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-1 left-1">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-500 text-white">
                          BEFORE
                        </span>
                      </div>
                    </div>
                  ))}
                  {afterPhotos.slice(0, 2).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => {
                        vibrate();
                        const photoIdx = uploadedPhotos.findIndex(p => p.id === photo.id);
                        setFullscreenPhoto(photo);
                        setCurrentPhotoIndex(photoIdx);
                        setAnnotations(photo.annotations || []);
                        const before = beforePhotos[0];
                        const after = photo;
                        if (before && after) {
                          setSelectedBeforeAfter({ before, after });
                          setShowBeforeAfter(true);
                        }
                      }}
                      className="relative h-32 rounded-lg overflow-hidden cursor-pointer group industrial-card"
                    >
                      {photo.image_url && <img src={photo.image_url} className="w-full h-full object-cover" alt="After" />}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-1 left-1">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-500 text-white">
                          AFTER
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase text-[#FF6700] flex items-center gap-2">
                  <Grid3x3 size={18} />
                  All Photos
                </h3>
                <button
                  onClick={() => {
                    if (showShareMenu && selectedForShare.length === 0) {
                      sharePhotos();
                    } else if (showShareMenu && selectedForShare.length > 0) {
                      sharePhotos();
                    } else {
                      setShowShareMenu(true);
                    }
                  }}
                  className="flex items-center gap-2 bg-[#FF6700] text-black px-4 py-2 rounded-lg font-bold text-xs uppercase shadow-[0_0_25px_rgba(255,103,0,0.5)] hover:shadow-[0_0_35px_rgba(255,103,0,0.7)] transition-all active:scale-95"
                >
                  <Share2 size={16} />
                  {showShareMenu ? (selectedForShare.length > 0 ? `SHARE (${selectedForShare.length})` : 'SHARE ALL') : 'SHARE'}
                </button>
              </div>
              {showShareMenu && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[var(--text-sub)]">Tap photos to select, then tap SHARE button</p>
                  <button
                    onClick={() => {
                      setShowShareMenu(false);
                      setSelectedForShare([]);
                    }}
                    className="text-xs text-[var(--text-sub)] underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {uploadedPhotos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="relative"
                  >
                    <div
                      onClick={() => {
                        if (showShareMenu) {
                          togglePhotoSelection(photo.id);
                        } else {
                          vibrate();
                          setFullscreenPhoto(photo);
                          setCurrentPhotoIndex(idx);
                          setAnnotations(photo.annotations || []);
                        }
                      }}
                      className="relative h-32 sm:h-40 rounded-lg overflow-hidden cursor-pointer group industrial-card"
                    >
                      {photo.image_url ? (
                        <img src={photo.image_url} className="w-full h-full object-cover" alt="Photo" />
                      ) : (
                        <div className="w-full h-full bg-[var(--bg-surface)] flex items-center justify-center">
                          <AlertTriangle size={24} className="text-[var(--text-sub)]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-1 left-1">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          photo.photo_type === 'BEFORE' ? 'bg-red-500 text-white' :
                          photo.photo_type === 'AFTER' ? 'bg-green-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {photo.photo_type}
                        </span>
                      </div>
                      {photo.estimate_id && (
                        <div className="absolute bottom-1 right-1 bg-[#FF6700] p-1 rounded text-black shadow-[0_0_10px_rgba(255,103,0,0.5)]">
                          <Lock size={14} />
                        </div>
                      )}
                      {photo.annotations && photo.annotations.length > 0 && (
                        <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-white text-[9px] font-bold">
                          {photo.annotations.length} NOTE{photo.annotations.length > 1 ? 'S' : ''}
                        </div>
                      )}
                      {showShareMenu && (
                        <div className="absolute top-1 right-1">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedForShare.includes(photo.id)
                              ? 'bg-[#FF6700] border-[#FF6700]'
                              : 'bg-white/20 border-white/50'
                          }`}>
                            {selectedForShare.includes(photo.id) && <X size={16} className="text-black" />}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* FLOATING BRANDING - BEHIND MODALS */}
      {!fullscreenPhoto && !showEstimateLink && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <p className="text-[8px] font-bold uppercase tracking-widest">
            <span className="text-[var(--text-sub)] opacity-40">POWEREDBY</span>
            <span className="text-[#FF6700] drop-shadow-[0_0_8px_rgba(255,103,0,0.4)]">FIELDDESKOPS</span>
          </p>
        </div>
      )}

      {fullscreenPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setFullscreenPhoto(null);
                  setShowBeforeAfter(false);
                }}
                className="text-white hover:text-[#FF6700] transition-colors"
              >
                <X size={28} />
              </button>
              <div>
                <p className="text-xs text-white/60 uppercase font-bold">Photo {currentPhotoIndex + 1} of {uploadedPhotos.length}</p>
                <p className="text-white font-bold text-sm">{fullscreenPhoto.photo_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(beforePhotos.length > 0 && afterPhotos.length > 0) && (
                <button
                  onClick={() => {
                    vibrate();
                    if (!showBeforeAfter) {
                      const before = fullscreenPhoto.photo_type === 'BEFORE' ? fullscreenPhoto : beforePhotos[0];
                      const after = fullscreenPhoto.photo_type === 'AFTER' ? fullscreenPhoto : afterPhotos[0];
                      setSelectedBeforeAfter({ before, after });
                    }
                    setShowBeforeAfter(!showBeforeAfter);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    showBeforeAfter ? 'bg-[#FF6700] text-black shadow-[0_0_20px_rgba(255,103,0,0.5)]' : 'text-white hover:text-[#FF6700]'
                  }`}
                >
                  <SplitSquareVertical size={24} />
                </button>
              )}
              <button
                onClick={() => deletePhoto(fullscreenPhoto.id)}
                className="text-red-400 hover:text-red-300 transition-colors p-2"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto p-4 relative">
            {showBeforeAfter && selectedBeforeAfter.before && selectedBeforeAfter.after ? (
              <div className="w-full max-w-2xl">
                <ReactCompareSlider
                  itemOne={
                    <ReactCompareSliderImage
                      src={selectedBeforeAfter.before.image_url}
                      alt="Before"
                      style={{ objectFit: 'contain', maxHeight: '70vh' }}
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={selectedBeforeAfter.after.image_url}
                      alt="After"
                      style={{ objectFit: 'contain', maxHeight: '70vh' }}
                    />
                  }
                  style={{ maxHeight: '70vh' }}
                />
                <div className="flex justify-between mt-3 px-4">
                  <span className="text-xs font-bold uppercase text-red-400">← BEFORE</span>
                  <span className="text-xs font-bold uppercase text-green-400">AFTER →</span>
                </div>
              </div>
            ) : fullscreenPhoto.image_url ? (
              <img src={fullscreenPhoto.image_url} className="max-w-full max-h-full object-contain" alt="Full view" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <AlertTriangle size={48} className="text-white/50" />
                <p className="text-white/50 text-sm">Unable to load image</p>
              </div>
            )}
          </div>

          <div className="bg-black/80 border-t border-white/10 p-4 space-y-3 max-h-[40vh] overflow-y-auto">
            {(fullscreenPhoto.caption || fullscreenPhoto.notes) && (
              <div className="space-y-2 pb-3 border-b border-white/10">
                {fullscreenPhoto.caption && (
                  <p className="text-white/80 text-sm"><span className="font-bold">Caption:</span> {fullscreenPhoto.caption}</p>
                )}
                {fullscreenPhoto.notes && (
                  <p className="text-white/80 text-sm"><span className="font-bold">Notes:</span> {fullscreenPhoto.notes}</p>
                )}
              </div>
            )}

            {linkedEstimate && (
              <div className="pb-3 border-b border-white/10">
                <p className="text-[#FF6700] font-bold text-sm mb-1 flex items-center gap-2">
                  <Lock size={16} /> Linked Estimate
                </p>
                <p className="text-white/80 text-sm">${linkedEstimate.total_price?.toFixed(2)} • {new Date(linkedEstimate.created_at).toLocaleDateString()}</p>
              </div>
            )}

            {annotations.length > 0 && (
              <div className="pb-3 border-b border-white/10">
                <p className="text-[#FF6700] font-bold text-sm mb-2">Annotations:</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {annotations.map((ann, idx) => (
                    <p key={idx} className="text-white/70 text-xs">• {ann.text}</p>
                  ))}
                </div>
              </div>
            )}

            {isAnnotating && (
              <div className="flex gap-2 pb-3 border-b border-white/10">
                <input
                  autoFocus
                  placeholder="Add note or label..."
                  value={annotationText}
                  onChange={e => setAnnotationText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && annotationText.trim() && saveAnnotation(annotationText)}
                  className="flex-1 bg-white/10 text-white rounded px-3 py-2 placeholder:text-white/40 outline-none focus:bg-white/20 text-sm"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={() => saveAnnotation(annotationText)}
                  disabled={!annotationText.trim()}
                  className="bg-[#FF6700] text-black px-3 py-2 rounded font-bold text-sm active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(255,103,0,0.4)]"
                >
                  Save
                </button>
              </div>
            )}

            {showBeforeAfter ? (
              <>
                {(beforePhotos.length > 1 || afterPhotos.length > 1) && (
                  <div className="flex gap-2 pb-3 border-b border-white/10">
                    <button
                      onClick={() => {
                        const currentIdx = beforePhotos.findIndex(p => p.id === selectedBeforeAfter.before.id);
                        const nextIdx = (currentIdx + 1) % beforePhotos.length;
                        setSelectedBeforeAfter({ ...selectedBeforeAfter, before: beforePhotos[nextIdx] });
                      }}
                      className="flex-1 bg-red-500/20 text-red-400 font-bold py-3 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-500/30"
                    >
                      <ChevronLeft size={20} /> Next Before
                    </button>
                    <button
                      onClick={() => {
                        const currentIdx = afterPhotos.findIndex(p => p.id === selectedBeforeAfter.after.id);
                        const nextIdx = (currentIdx + 1) % afterPhotos.length;
                        setSelectedBeforeAfter({ ...selectedBeforeAfter, after: afterPhotos[nextIdx] });
                      }}
                      className="flex-1 bg-green-500/20 text-green-400 font-bold py-3 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-green-500/30"
                    >
                      Next After <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-2 pb-3 border-b border-white/10">
                <button
                  onClick={handlePrevPhoto}
                  disabled={currentPhotoIndex === 0}
                  className="flex-1 bg-white/10 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} /> Prev
                </button>
                <button
                  onClick={handleNextPhoto}
                  disabled={currentPhotoIndex === uploadedPhotos.length - 1}
                  className="flex-1 bg-white/10 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={20} />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {!isAnnotating ? (
                <>
                  <button
                    onClick={() => setIsAnnotating(true)}
                    className="flex-1 bg-[#FF6700] text-black font-bold uppercase py-3 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,103,0,0.4)]"
                  >
                    <Edit2 size={18} /> Add Note
                  </button>
                  <button
                    onClick={() => setShowEstimateLink(true)}
                    className="flex-1 bg-[#FF6700] text-black font-bold uppercase py-3 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,103,0,0.4)]"
                  >
                    <DollarSign size={18} /> Estimate
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsAnnotating(false);
                    setAnnotationText('');
                  }}
                  className="flex-1 bg-white/10 text-white font-bold uppercase py-3 rounded-lg active:scale-95"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showEstimateLink && (
        <div className="fixed inset-0 z-[51] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEstimateLink(false)} />
          <div className="relative bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm w-full border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#FF6700] uppercase">Link to Estimate</h2>
              <button onClick={() => setShowEstimateLink(false)} className="text-[var(--text-sub)]">
                <X size={24} />
              </button>
            </div>

            {estimates.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[var(--text-sub)] mb-4">No estimates yet for this job</p>
                <Link
                  href="/apps/profitlock"
                  className="inline-block bg-[#FF6700] text-black font-bold uppercase px-4 py-2 rounded-lg text-sm shadow-[0_0_20px_rgba(255,103,0,0.4)]"
                >
                  Create Estimate
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {estimates.map(est => (
                  <button
                    key={est.id}
                    onClick={() => linkToEstimate(est.id)}
                    className={`w-full text-left p-3 rounded-lg hover:border-[#FF6700] border transition-colors ${
                      fullscreenPhoto.estimate_id === est.id
                        ? 'border-[#FF6700] bg-[#FF6700]/10 shadow-[0_0_15px_rgba(255,103,0,0.2)]'
                        : 'bg-[var(--bg-main)] border-[var(--border-color)]'
                    }`}
                  >
                    <p className="font-bold text-[var(--text-main)] text-sm">${est.total_price?.toFixed(2)}</p>
                    <p className="text-xs text-[var(--text-sub)]">{new Date(est.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowEstimateLink(false)}
              className="w-full mt-4 bg-[var(--bg-main)] text-[var(--text-main)] font-bold py-3 rounded-lg active:scale-95 border border-[var(--border-color)]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-24 right-6 px-4 py-3 rounded-lg font-bold text-sm animate-in slide-in-from-bottom-5 shadow-xl z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}