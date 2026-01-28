'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { useJobSelector } from '../../hooks/useJobSelector';

import JobSelector from '../../components/JobSelector';
import {
  Camera, Upload, X, ArrowLeft, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, Image as ImageIcon,
  LinkIcon, Trash2, Edit2
} from 'lucide-react';
import Link from 'next/link';

export default function SiteSnap() {
  const supabase = createClient();
  const { activeJob } = useJobSelector();
  

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
    if (activeJob?.id) {
      loadPhotos();
      loadEstimates();
    }
  }, [activeJob?.id]);

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
            const { data, error } = await supabase.storage
              .from('fielddeskops-photos')
              .createSignedUrl(photo.storage_path, 3600);
            
            return {
              ...photo,
              image_url: data?.signedUrl || null
            };
          } catch (err) {
            console.error('Error generating signed URL:', err);
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
      const fileName = `${user.id}/${activeJob.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('fielddeskops-photos')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: newPhoto, error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id,
          job_id: activeJob.id,
          storage_path: fileName,
          caption: photoCaption,
          notes: photoNotes,
          photo_type: photoTag,
          annotations: []
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const { data: signedUrl } = await supabase.storage
        .from('fielddeskops-photos')
        .createSignedUrl(fileName, 3600);

      setUploadedPhotos([{ ...newPhoto, image_url: signedUrl?.signedUrl }, ...uploadedPhotos]);
      setPreview(null);
      setFileToUpload(null);
      setPhotoCaption('');
      setPhotoNotes('');
      setPhotoTag('STANDARD');
      setShowUploadPanel(false);

      showToast('Photo saved!', 'success');
    } catch (error) {
      console.error('Error saving photo:', error);
      showToast('Error saving photo', 'error');
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

      setUploadedPhotos(uploadedPhotos.map(p =>
        p.id === fullscreenPhoto.id ? { ...p, estimate_id: estimateId } : p
      ));
      setFullscreenPhoto({ ...fullscreenPhoto, estimate_id: estimateId });
      setShowEstimateLink(false);
      showToast('Linked to estimate', 'success');
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
    }
  };

  const handleNextPhoto = () => {
    if (currentPhotoIndex < uploadedPhotos.length - 1) {
      const newIndex = currentPhotoIndex + 1;
      setCurrentPhotoIndex(newIndex);
      setFullscreenPhoto(uploadedPhotos[newIndex]);
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
      setAnnotationText('');
      setIsAnnotating(false);
      showToast('Annotation saved', 'success');
    } catch (error) {
      console.error('Error saving annotation:', error);
      showToast('Error saving annotation', 'error');
    }
  };

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
    <div className="min-h-screen bg-[var(--bg-main)] pb-24">
      <div className="sticky top-0 z-40 bg-[var(--bg-main)] border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:text-[#FF6700] transition-colors text-[var(--text-main)]">
              <ArrowLeft size={28} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-[#FF6700]">SiteSnap</h1>
              <p className="text-xs font-bold tracking-widest text-[var(--text-sub)]">PHOTO DOCUMENTATION</p>
            </div>
          </div>
          <button
            onClick={() => {
              vibrate();
              setShowUploadPanel(!showUploadPanel);
            }}
            className="industrial-card p-3 rounded-xl text-[#FF6700] hover:border-[#FF6700] transition-colors"
          >
            <Upload size={24} />
          </button>
        </div>
        <JobSelector />
      </div>

      <main className="max-w-6xl mx-auto px-6">
        {showUploadPanel && (
          <div className="industrial-card rounded-2xl p-6 mb-8 border-2 border-[#FF6700]">
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
                      ? 'bg-[#FF6700] text-black border-[#FF6700]'
                      : 'industrial-card border-[var(--border-color)] text-[var(--text-main)]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {!preview ? (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => cameraInputRef.current.click()}
                  className="border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center py-8 text-[var(--text-sub)] hover:border-[#FF6700] transition-colors"
                >
                  <Camera size={32} className="mb-2 text-[#FF6700]" />
                  <span className="font-bold text-xs uppercase">Snap</span>
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center py-8 text-[var(--text-sub)] hover:border-[#FF6700] transition-colors"
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
              placeholder="Notes (what's visible, issues found, etc)..."
              value={photoNotes}
              onChange={e => setPhotoNotes(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-3 mb-4 text-[var(--text-main)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none resize-none h-24"
              style={{ fontSize: '16px' }}
            />

            <button
              onClick={savePhoto}
              disabled={uploading || !fileToUpload}
              className="w-full bg-[#FF6700] text-black font-bold uppercase py-4 rounded-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Saving...' : 'Save Photo'}
            </button>
          </div>
        )}

        {uploadedPhotos.length === 0 ? (
          <div className="py-12 text-center">
            <ImageIcon size={48} className="mx-auto mb-4 text-[var(--text-sub)] opacity-50" />
            <p className="text-[var(--text-sub)] font-bold mb-4">No photos yet for this job</p>
            <button
              onClick={() => setShowUploadPanel(true)}
              className="inline-block bg-[#FF6700] text-black font-bold uppercase px-6 py-3 rounded-lg active:scale-95 transition-all"
            >
              + Upload First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {uploadedPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => {
                  vibrate();
                  setFullscreenPhoto(photo);
                  setCurrentPhotoIndex(idx);
                  setAnnotations(photo.annotations || []);
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
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                    photo.photo_type === 'BEFORE' ? 'bg-red-500 text-white' :
                    photo.photo_type === 'AFTER' ? 'bg-green-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {photo.photo_type}
                  </span>
                </div>
                {photo.estimate_id && (
                  <div className="absolute bottom-1 right-1 bg-[#FF6700] p-1 rounded text-black">
                    <LinkIcon size={14} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {fullscreenPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFullscreenPhoto(null)}
                className="text-white hover:text-[#FF6700] transition-colors"
              >
                <X size={28} />
              </button>
              <div>
                <p className="text-xs text-white/60 uppercase font-bold">Photo {currentPhotoIndex + 1} of {uploadedPhotos.length}</p>
                <p className="text-white font-bold text-sm">{fullscreenPhoto.photo_type}</p>
              </div>
            </div>
            <button
              onClick={() => deletePhoto(fullscreenPhoto.id)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={24} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-auto">
            {fullscreenPhoto.image_url ? (
              <img src={fullscreenPhoto.image_url} className="max-w-full max-h-full object-contain" alt="Full view" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <AlertTriangle size={48} className="text-white/50" />
                <p className="text-white/50 text-sm">Unable to load image</p>
              </div>
            )}
          </div>

          <div className="bg-black/80 border-t border-white/10 p-4 space-y-3">
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
                  onKeyDown={e => e.key === 'Enter' && saveAnnotation(annotationText)}
                  className="flex-1 bg-white/10 text-white rounded px-3 py-2 placeholder:text-white/40 outline-none focus:bg-white/20 text-sm"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={() => saveAnnotation(annotationText)}
                  className="bg-[#FF6700] text-black px-3 py-2 rounded font-bold text-sm active:scale-95"
                >
                  Save
                </button>
              </div>
            )}

            <div className="flex gap-2">
              {!isAnnotating ? (
                <>
                  <button
                    onClick={() => setIsAnnotating(true)}
                    className="flex-1 bg-[#FF6700] text-black font-bold uppercase py-3 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 size={18} /> Add Note
                  </button>
                  <button
                    onClick={() => setShowEstimateLink(true)}
                    className="flex-1 bg-white/10 text-white font-bold uppercase py-3 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-white/20"
                  >
                    <LinkIcon size={18} /> Link
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsAnnotating(false)}
                  className="flex-1 bg-white/10 text-white font-bold uppercase py-3 rounded-lg active:scale-95"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex gap-2">
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
              <p className="text-[var(--text-sub)] text-center py-6">No estimates yet for this job</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {estimates.map(est => (
                  <button
                    key={est.id}
                    onClick={() => linkToEstimate(est.id)}
                    className="w-full text-left p-3 rounded-lg bg-[var(--bg-main)] hover:border-[#FF6700] border border-[var(--border-color)] transition-colors"
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
        <div className={`fixed bottom-24 right-6 px-4 py-3 rounded-lg font-bold text-sm animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
