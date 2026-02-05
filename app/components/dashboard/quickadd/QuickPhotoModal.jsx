"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import UpgradePrompt from "../../../components/UpgradePrompt";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export default function QuickPhotoModal({ isOpen, onClose, activeJob, onSaved }) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("camera");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'photos', currentCount: 0, limit: 0, tier: 'free' });

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("camera");
    setFile(null);
    setPreviewUrl("");
    setCaption("");
    setMessage("");
    setError("");
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_BYTES) {
      setError("Photo too large. Max size is 10MB.");
      return;
    }
    setError("");
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleSave = async () => {
    if (!activeJob?.id) {
      setError("Select an active job first.");
      return;
    }
    if (!file) {
      setError("Please add a photo.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated.");
        return;
      }
      const { canCreateResource, incrementResourceUsage } = await import('@/lib/subscription/subscriptionHelpers');
      const limitCheck = await canCreateResource('photos');
      if (!limitCheck.allowed) {
        setUpgradePromptData({ resourceType: 'photos', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${activeJob.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase
        .storage
        .from("photos")
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase
        .storage
        .from("photos")
        .getPublicUrl(filePath);

      const photoUrl = publicData?.publicUrl;

      const { error: insertError } = await supabase
        .from("photos")
        .insert({
          user_id: user.id,
          job_id: activeJob.id,
          photo_url: photoUrl,
          caption: caption.trim() || null,
        });

      if (insertError) throw insertError;
      await incrementResourceUsage('photos');

      setMessage("Photo added! Open SiteSnap to view all photos");
      window.dispatchEvent(new Event("photos-updated"));
      onSaved?.();
      setTimeout(() => {
        onClose?.();
      }, 800);
    } catch (err) {
      setError(err?.message || "Error uploading photo");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {showUpgradePrompt && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          resourceType={upgradePromptData.resourceType}
          currentCount={upgradePromptData.currentCount}
          limit={upgradePromptData.limit}
          tier={upgradePromptData.tier}
        />
      )}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-center">
          <h2 className="font-oswald text-lg text-[#FF6700]">QUICK PHOTO</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-[var(--text-sub)] uppercase tracking-widest font-bold">
            Job: <span className="text-[var(--text-main)]">{activeJob?.title || "No Active Job"}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("camera")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                activeTab === "camera"
                  ? "bg-[#FF6700] text-black border-[#FF6700]"
                  : "bg-[var(--bg-surface)] text-[var(--text-sub)] border-[var(--border-color)]"
              }`}
            >
              Camera
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                activeTab === "upload"
                  ? "bg-[#FF6700] text-black border-[#FF6700]"
                  : "bg-[var(--bg-surface)] text-[var(--text-sub)] border-[var(--border-color)]"
              }`}
            >
              Upload
            </button>
          </div>

          <div className="space-y-3">
            {activeTab === "camera" ? (
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="w-full text-sm text-[var(--text-sub)]"
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-[var(--text-sub)]"
              />
            )}

            {previewUrl && (
              <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-black/20">
                <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
              </div>
            )}

            <input
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}
          {message && <div className="text-sm text-green-400">{message}</div>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#FF6700] text-black py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(255,103,0,0.35)] hover:shadow-[0_0_25px_rgba(255,103,0,0.5)] transition disabled:opacity-60"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </span>
            ) : (
              "Save Photo"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
