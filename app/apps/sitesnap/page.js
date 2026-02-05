'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useActiveJob } from '../../../hooks/useActiveJob';
import {
  Camera, Upload, X, ArrowLeft, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, Image as ImageIcon,
  Trash2, Edit2, SplitSquareVertical, Grid3x3,
  Share2, DollarSign, Lock, CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import JobSelector from '../../components/shared/JobSelector';
import Toast from '../../components/shared/Toast';
import FormField from '../../components/shared/FormField';
import { buildFieldErrors, inRange, isFileSizeAllowed, isFileTypeAllowed, isRequired } from '../../utils/validation';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { logError } from '../../../utils/logger';
import {
  ReactCompareSlider,
  ReactCompareSliderImage
} from 'react-compare-slider';

export default function SiteSnap() {
  const supabase = createClient();
  const { activeJob, setActiveJob, syncActiveJob } = useActiveJob();
  const isOnline = useOnlineStatus();

  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});
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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [linkedEstimate, setLinkedEstimate] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const vibrate = (pattern = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const compressImage = async (file) => {
    const img = new Image();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read image file.'));
      reader.readAsDataURL(file);
    });

    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = () => resolve();
    });

    const maxWidth = 1600;
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });

    return blob || file;
  };

  useEffect(() => {
    syncActiveJob();
  }, [syncActiveJob]);

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

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        showToast('Unable to verify your session. Please log in again.', 'error');
        logError('SiteSnap auth failed', authError);
        return;
      }
      if (!user || !activeJob?.id) return;

      const { data: photos, error } = await supabase
        .from('photos')
        .select('id, user_id, job_id, storage_path, caption, notes, photo_type, annotations, estimate_id, created_at')
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
      logError('SiteSnap photo load failed', error);
      showToast('Unable to load photos. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEstimates = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        showToast('Unable to verify your session. Please log in again.', 'error');
        logError('SiteSnap auth failed', authError);
        return;
      }
      if (!user || !activeJob?.id) return;

      const { data: estimates, error } = await supabase
        .from('estimates')
        .select('id, total_price, created_at')
        .eq('user_id', user.id)
        .eq('job_id', activeJob.id)
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Unable to load estimates. Please try again.', 'error');
        logError('SiteSnap estimates load failed', error);
        return;
      }

      setEstimates(estimates || []);
    } catch (error) {
      logError('SiteSnap estimates load failed', error);
      showToast('Unable to load estimates. Please try again.', 'error');
    }
  };

  const refreshPhotoUrl = async (photo) => {
    try {
      const { data, error } = await supabase.storage
        .from('fielddeskops-photos')
        .createSignedUrl(photo.storage_path, 3600);
      if (error) {
        showToast('Unable to refresh photo. Please try again.', 'error');
        logError('SiteSnap photo refresh failed', error, { photoId: photo.id });
        return;
      }
      setUploadedPhotos((prev) =>
        prev.map((p) => (p.id === photo.id ? { ...p, image_url: data?.signedUrl || null } : p))
      );
    } catch (error) {
      showToast('Unable to refresh photo. Please try again.', 'error');
      logError('SiteSnap photo refresh failed', error, { photoId: photo.id });
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxBytes = 10 * 1024 * 1024;
      if (!isFileTypeAllowed(file, allowedTypes)) {
        showToast('Unsupported image type. Use JPG, PNG, or WebP.', 'error');
        setFormErrors((prev) => ({ ...prev, file: 'Unsupported image type.' }));
        return;
      }
      if (!isFileSizeAllowed(file, maxBytes)) {
        showToast('Photo too large. Max size is 10MB.', 'error');
        setFormErrors((prev) => ({ ...prev, file: 'Photo too large (10MB max).' }));
        return;
      }
      setFileToUpload(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
      setFormErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const savePhoto = async () => {
    const errors = buildFieldErrors({
      file: [{ isValid: !!fileToUpload, message: 'Please select a photo to upload.' }],
      caption: [{ isValid: photoCaption.length <= 120, message: 'Caption must be under 120 characters.' }],
      notes: [{ isValid: photoNotes.length <= 500, message: 'Notes must be under 500 characters.' }],
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
      showToast('Fix the highlighted fields before saving.', 'error');
      return;
    }

    if (!activeJob?.id) {
      showToast('Select a job before uploading photos.', 'error');
      return;
    }

    if (!isOnline) {
      showToast('You are offline. Reconnect to upload photos.', 'error');
      return;
    }

    try {
      setUploading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showToast('Please log in to upload photos.', 'error');
        if (authError) logError('SiteSnap auth failed', authError);
        return;
      }

      const optimizedBlob = await compressImage(fileToUpload);
      const timestamp = Date.now();
      const fileName = `${user.id}/${activeJob.id}/${timestamp}.jpg`;

      let uploadError = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await supabase.storage
          .from('fielddeskops-photos')
          .upload(fileName, optimizedBlob, { upsert: false, contentType: 'image/jpeg' });
        if (!error) {
          uploadError = null;
          break;
        }
        uploadError = error;
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }

      if (uploadError) {
        showToast('Unable to upload photo. Check your connection and try again.', 'error');
        logError('SiteSnap photo upload failed', uploadError);
        return;
      }

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
        .select('id, user_id, job_id, storage_path, caption, notes, photo_type, annotations, estimate_id, created_at')
        .single();

      if (dbError) {
        showToast('Failed to save photo details. Please try again.', 'error');
        logError('SiteSnap photo save failed', dbError);
        return;
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('fielddeskops-photos')
        .createSignedUrl(fileName, 3600);

      if (signedError) {
        logError('SiteSnap signed URL failed', signedError);
      }

      if (newPhoto) {
        setUploadedPhotos([{ ...newPhoto, image_url: signedData?.signedUrl || null }, ...uploadedPhotos]);
        setPreview(null);
        setFileToUpload(null);
        setPhotoCaption('');
        setPhotoNotes('');
        setPhotoTag('STANDARD');
        setShowUploadPanel(false);
        setFormErrors((prev) => ({ ...prev, file: '', caption: '', notes: '' }));
        showToast('Photo uploaded!', 'success');
      }
    } catch (error) {
      logError('SiteSnap photo save failed', error);
      showToast('Unable to save photo. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteSelectedPhotos = async () => {
    try {
      if (!isOnline) {
        showToast('You are offline. Reconnect to delete photos.', 'error');
        return;
      }
      await Promise.all(
        selectedPhotos.map(photoId => 
          supabase.from('photos').delete().eq('id', photoId)
        )
      );
      
      setUploadedPhotos(uploadedPhotos.filter(p => !selectedPhotos.includes(p.id)));
      setSelectedPhotos([]);
      setSelectMode(false);
      setShowDeleteConfirm(false);
      showToast(`${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''} deleted`, 'success');
    } catch (error) {
      logError('SiteSnap photo delete failed', error);
      showToast('Unable to delete photos. Please try again.', 'error');
    }
  };

  const linkToEstimate = async (estimateId) => {
    if (!fullscreenPhoto?.id) return;
    if (!isOnline) {
      showToast('You are offline. Reconnect to link estimates.', 'error');
      return;
    }
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
      logError('SiteSnap estimate link failed', error);
      showToast('Unable to link estimate. Please try again.', 'error');
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
    if (!fullscreenPhoto?.id) return;
    if (!text.trim()) {
      setFormErrors((prev) => ({ ...prev, annotation: 'Please enter an annotation.' }));
      showToast('Please enter an annotation.', 'error');
      return;
    }
    if (text.length > 200) {
      setFormErrors((prev) => ({ ...prev, annotation: 'Annotations must be under 200 characters.' }));
      showToast('Annotation is too long.', 'error');
      return;
    }
    if (!isOnline) {
      showToast('You are offline. Reconnect to save annotations.', 'error');
      return;
    }
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
      setFormErrors((prev) => ({ ...prev, annotation: '' }));
      setIsAnnotating(false);
      showToast('Annotation saved', 'success');
    } catch (error) {
      logError('SiteSnap annotation save failed', error);
      showToast('Unable to save annotation. Please try again.', 'error');
    }
  };

  const togglePhotoSelection = (photoId) => {
    vibrate();
    setSelectedPhotos(prev => 
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  const sharePhotos = async () => {
    const photosToShare = selectedPhotos.length > 0 
      ? uploadedPhotos.filter(p => selectedPhotos.includes(p.id))
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
        setSelectMode(false);
        setSelectedPhotos([]);
      } catch (error) {
        if (error.name !== 'AbortError') {
          logError('SiteSnap share failed', error);
          showToast('Unable to share photos. Please try again.', 'error');
        }
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

  return (
    <div className="min-h-screen bg-[var(--bg-main)] pb-32 relative">
      {/* HEADER - STICKY */}
      <div className="sticky top-0 z-40 bg-[var(--bg-main)] border-b border-[var(--border-color)] px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:text-[#FF6700] transition-colors text-[var(--text-main)]" aria-label="Back to dashboard">
              <ArrowLeft size={28} />
            </Link>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#FF6700] mb-0.5">FIELDDESKOPS</p>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700] drop-shadow-[0_0_12px_rgba(255,103,0,0.5)]">SiteSnap</h1>
              <p className="text-xs font-bold tracking-widest text-[var(--text-sub)]">PHOTO DOCUMENTATION</p>
            </div>
          </div>
          <button
            onClick={() => {
              vibrate();
              setShowUploadPanel(!showUploadPanel);
            }}
            disabled={!activeJob}
            className={`bg-[#FF6700] text-black p-3 rounded-xl transition-all shadow-[0_0_30px_rgba(255,103,0,0.6)] active:scale-95 ${activeJob ? "hover:scale-105" : "opacity-50 cursor-not-allowed"}`}
            aria-label={showUploadPanel ? "Close upload panel" : "Open upload panel"}
          >
            <Camera size={24} />
          </button>
        </div>
        
        <div className="mt-3">
          <JobSelector />
        </div>
      </div>

      {!isOnline ? (
        <div className="max-w-6xl mx-auto px-6 mt-3">
          <div className="bg-red-900/30 border border-red-500/40 text-red-200 text-xs rounded-lg px-3 py-2">
            You are offline. Uploads and edits are disabled.
          </div>
        </div>
      ) : null}

      <main className="max-w-6xl mx-auto px-6">
        {!activeJob ? (
          <div className="py-12 text-center mt-6">
            <AlertTriangle size={48} className="mx-auto mb-4 text-[#FF6700]" />
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-2">No Active Job</h2>
            <p className="text-[var(--text-sub)] mb-6">Select an existing job or create a new one above to get started.</p>
            <Link href="/dashboard" className="bg-[#FF6700] text-black font-bold uppercase px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(255,103,0,0.4)]">
              Go to Command Center
            </Link>
          </div>
        ) : (
          <>
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
                <img src={preview} className="w-full h-full object-cover" alt={photoCaption || "Site photo preview"} />
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
            {formErrors?.file ? (
              <p className="text-xs text-red-500 mb-3">{formErrors.file}</p>
            ) : null}

            <FormField label="Caption" error={formErrors?.caption} helperText="Optional, 120 characters max.">
              <input
                placeholder="Photo caption (optional)"
                value={photoCaption}
                onChange={e => {
                  setPhotoCaption(e.target.value);
                  if (formErrors?.caption) {
                    setFormErrors((prev) => ({ ...prev, caption: '' }));
                  }
                }}
                onBlur={() => {
                  if (photoCaption.length > 120) {
                    setFormErrors((prev) => ({ ...prev, caption: 'Caption must be under 120 characters.' }));
                  }
                }}
                maxLength={120}
                autoComplete="off"
                className={`w-full bg-[var(--bg-main)] border rounded-lg p-3 mb-3 text-[var(--text-main)] placeholder:text-[var(--input-placeholder)] outline-none ${
                  formErrors?.caption ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                }`}
                style={{ fontSize: '16px' }}
              />
            </FormField>
            <FormField label="Notes" error={formErrors?.notes} helperText="Optional, 500 characters max.">
              <textarea
                placeholder="Notes (what is visible, issues found, etc)"
                value={photoNotes}
                onChange={e => {
                  setPhotoNotes(e.target.value);
                  if (formErrors?.notes) {
                    setFormErrors((prev) => ({ ...prev, notes: '' }));
                  }
                }}
                onBlur={() => {
                  if (photoNotes.length > 500) {
                    setFormErrors((prev) => ({ ...prev, notes: 'Notes must be under 500 characters.' }));
                  }
                }}
                maxLength={500}
                className={`w-full bg-[var(--bg-main)] border rounded-lg p-3 mb-4 text-[var(--text-main)] placeholder:text-[var(--input-placeholder)] outline-none resize-none h-24 ${
                  formErrors?.notes ? "border-red-500 focus:border-red-500" : "border-[var(--border-color)] focus:border-[#FF6700]"
                }`}
                style={{ fontSize: '16px' }}
              />
            </FormField>

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
                        if (selectMode) {
                          togglePhotoSelection(photo.id);
                        } else {
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
                        }
                      }}
                      className="relative h-32 rounded-lg overflow-hidden cursor-pointer group industrial-card"
                    >
                      {photo.image_url ? (
                        <img
                          src={photo.image_url}
                          className="w-full h-full object-cover"
                          alt={photo.caption || "Before photo"}
                          loading="lazy"
                          onError={() => {
                            setUploadedPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, image_url: null } : p));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-sub)] text-xs">
                          <ImageIcon size={20} className="mb-2" />
                          <button onClick={() => refreshPhotoUrl(photo)} className="text-[10px] uppercase font-bold text-[#FF6700]">
                            Retry
                          </button>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-1 left-1">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-500 text-white">
                          BEFORE
                        </span>
                      </div>
                      {selectMode && (
                        <div className="absolute top-1 right-1">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedPhotos.includes(photo.id)
                              ? 'bg-[#FF6700] border-[#FF6700]'
                              : 'bg-white/20 border-white/50'
                          }`}>
                            {selectedPhotos.includes(photo.id) && <CheckSquare size={16} className="text-black" />}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {afterPhotos.slice(0, 2).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => {
                        if (selectMode) {
                          togglePhotoSelection(photo.id);
                        } else {
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
                        }
                      }}
                      className="relative h-32 rounded-lg overflow-hidden cursor-pointer group industrial-card"
                    >
                      {photo.image_url ? (
                        <img
                          src={photo.image_url}
                          className="w-full h-full object-cover"
                          alt={photo.caption || "After photo"}
                          loading="lazy"
                          onError={() => {
                            setUploadedPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, image_url: null } : p));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-sub)] text-xs">
                          <ImageIcon size={20} className="mb-2" />
                          <button onClick={() => refreshPhotoUrl(photo)} className="text-[10px] uppercase font-bold text-[#FF6700]">
                            Retry
                          </button>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-1 left-1">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-500 text-white">
                          AFTER
                        </span>
                      </div>
                      {selectMode && (
                        <div className="absolute top-1 right-1">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedPhotos.includes(photo.id)
                              ? 'bg-[#FF6700] border-[#FF6700]'
                              : 'bg-white/20 border-white/50'
                          }`}>
                            {selectedPhotos.includes(photo.id) && <CheckSquare size={16} className="text-black" />}
                          </div>
                        </div>
                      )}
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
                    vibrate();
                    setSelectMode(!selectMode);
                    if (selectMode) {
                      setSelectedPhotos([]);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all active:scale-95 ${
                    selectMode
                      ? 'bg-[var(--text-sub)] text-white'
                      : 'bg-[#FF6700] text-black shadow-[0_0_25px_rgba(255,103,0,0.5)]'
                  }`}
                >
                  {selectMode ? 'DONE' : 'SELECT'}
                </button>
              </div>
              {selectMode && (
                <p className="text-xs text-[var(--text-sub)] mb-2">
                  {selectedPhotos.length > 0 ? `${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''} selected` : 'Tap photos to select'}
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {uploadedPhotos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="relative"
                  >
                    <div
                      onClick={() => {
                        if (selectMode) {
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
                        <img
                          src={photo.image_url}
                          className="w-full h-full object-cover"
                          alt={photo.caption || "Site photo"}
                          loading="lazy"
                          onError={() => {
                            setUploadedPhotos((prev) => prev.map((p) => p.id === photo.id ? { ...p, image_url: null } : p));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-sub)] text-xs">
                          <ImageIcon size={20} className="mb-2" />
                          <button onClick={() => refreshPhotoUrl(photo)} className="text-[10px] uppercase font-bold text-[#FF6700]">
                            Retry
                          </button>
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
                      {selectMode && (
                        <div className="absolute top-1 right-1">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedPhotos.includes(photo.id)
                              ? 'bg-[#FF6700] border-[#FF6700]'
                              : 'bg-white/20 border-white/50'
                          }`}>
                            {selectedPhotos.includes(photo.id) && <CheckSquare size={16} className="text-black" />}
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
          </>
        )}
      </main>

      {/* SELECT MODE ACTION BAR */}
      {selectMode && selectedPhotos.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          <button
            onClick={sharePhotos}
            className="bg-[#FF6700] text-black px-6 py-3 rounded-lg font-bold uppercase shadow-[0_0_30px_rgba(255,103,0,0.6)] active:scale-95 transition-all flex items-center gap-2"
          >
            <Share2 size={20} />
            Share ({selectedPhotos.length})
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold uppercase shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-95 transition-all flex items-center gap-2"
          >
            <Trash2 size={20} />
            Delete ({selectedPhotos.length})
          </button>
          <button
            onClick={() => {
              setSelectMode(false);
              setSelectedPhotos([]);
            }}
            className="bg-[var(--bg-card)] text-[var(--text-main)] px-6 py-3 rounded-lg font-bold uppercase border border-[var(--border-color)] active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      )}

      {/* FLOATING BRANDING - BEHIND EVERYTHING */}
      {!fullscreenPhoto && !showEstimateLink && !selectMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <p className="text-[8px] font-bold uppercase tracking-widest">
            <span className="text-[var(--text-sub)] opacity-40">POWEREDBY</span>
            <span className="text-[#FF6700] drop-shadow-[0_0_8px_rgba(255,103,0,0.4)]">FIELDDESKOPS</span>
          </p>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[52] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm w-full border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-500/10 p-4 rounded-full">
                <Trash2 size={32} className="text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-main)] text-center mb-2">Delete {selectedPhotos.length} Photo{selectedPhotos.length > 1 ? 's' : ''}?</h2>
            <p className="text-[var(--text-sub)] text-center mb-6 text-sm">This action cannot be undone. Photos will be permanently deleted.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-[var(--bg-main)] text-[var(--text-main)] font-bold py-4 rounded-lg active:scale-95 border-2 border-[var(--border-color)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteSelectedPhotos}
                className="flex-1 bg-red-500 text-white font-bold py-4 rounded-lg active:scale-95 transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)]"
              >
                Delete
              </button>
            </div>
          </div>
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
                aria-label="Close photo viewer"
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
                onClick={() => {
                  setFullscreenPhoto(null);
                  setShowDeleteConfirm(true);
                  setSelectedPhotos([fullscreenPhoto.id]);
                }}
                className="text-red-400 hover:text-red-300 transition-colors p-2"
                aria-label="Delete photo"
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
                  <span className="text-xs font-bold uppercase text-red-400">&lt;- BEFORE</span>
                  <span className="text-xs font-bold uppercase text-green-400">AFTER -&gt;</span>
                </div>
              </div>
            ) : fullscreenPhoto.image_url ? (
              <img
                src={fullscreenPhoto.image_url}
                className="max-w-full max-h-full object-contain"
                alt={fullscreenPhoto.caption || "Full photo view"}
                onError={() => {
                  setUploadedPhotos((prev) => prev.map((p) => p.id === fullscreenPhoto.id ? { ...p, image_url: null } : p));
                  setFullscreenPhoto((prev) => ({ ...prev, image_url: null }));
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ImageIcon size={32} className="mb-2 text-[var(--text-sub)]" />
                <p className="text-white/50 text-sm">Unable to load image</p>
                <button onClick={() => refreshPhotoUrl(fullscreenPhoto)} className="text-xs uppercase font-bold text-[#FF6700]">
                  Retry Loading
                </button>
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
                <p className="text-white/80 text-sm">${linkedEstimate.total_price?.toFixed(2)} - {new Date(linkedEstimate.created_at).toLocaleDateString()}</p>
              </div>
            )}

            {annotations.length > 0 && (
              <div className="pb-3 border-b border-white/10">
                <p className="text-[#FF6700] font-bold text-sm mb-2">Annotations:</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {annotations.map((ann, idx) => (
                    <p key={idx} className="text-white/70 text-xs">- {ann.text}</p>
                  ))}
                </div>
              </div>
            )}

            {isAnnotating && (
              <>
                <div className="flex gap-2 pb-3 border-b border-white/10">
                  <input
                    autoFocus
                    placeholder="Add note or label..."
                    value={annotationText}
                    onChange={e => {
                      setAnnotationText(e.target.value);
                      if (formErrors?.annotation) {
                        setFormErrors((prev) => ({ ...prev, annotation: '' }));
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveAnnotation(annotationText);
                      }
                    }}
                    maxLength={200}
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
                {formErrors?.annotation ? (
                  <p className="text-xs text-red-400 pb-3">{formErrors.annotation}</p>
                ) : null}
              </>
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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}