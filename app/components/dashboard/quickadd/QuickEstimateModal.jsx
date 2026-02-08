"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, DollarSign } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";
import { roundCurrency } from "../../../utils/validation";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function QuickEstimateModal({ isOpen, onClose, activeJob, onSaved }) {
  const supabase = createClient();
  const [serviceName, setServiceName] = useState("");
  const [hours, setHours] = useState("");
  const [materialsCost, setMaterialsCost] = useState("");
  const [settings, setSettings] = useState({
    hourly_rate: 0,
    markup_percentage: 0,
    tax_rate: 0,
    tax_enabled: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState({ resourceType: 'estimates', currentCount: 0, limit: 0, tier: 'free' });

  useEffect(() => {
    if (!isOpen) return;
    setMessage("");
    setError("");
    setServiceName("");
    setHours("");
    setMaterialsCost("");

    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setSettings({
            hourly_rate: 0,
            markup_percentage: 0,
            tax_rate: 0,
            tax_enabled: false,
          });
          return;
        }

        const { data, error: settingsError } = await supabase
          .from("user_settings")
          .select("hourly_rate, markup_percentage, tax_rate, tax_enabled")
          .eq("user_id", user.id)
          .single();

        if (settingsError) {
          setSettings({
            hourly_rate: 0,
            markup_percentage: 0,
            tax_rate: 0,
            tax_enabled: false,
          });
          return;
        }

        setSettings({
          hourly_rate: Number(data?.hourly_rate) || 0,
          markup_percentage: Number(data?.markup_percentage) || 0,
          tax_rate: Number(data?.tax_rate) || 0,
          tax_enabled: Boolean(data?.tax_enabled),
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [isOpen, supabase]);

  const { laborCost, materialsWithMarkup, subtotal, tax, total } = useMemo(() => {
    const safeHours = Number(hours) || 0;
    const safeMaterials = Number(materialsCost) || 0;
    const labor = safeHours * (Number(settings.hourly_rate) || 0);
    const materials = safeMaterials * (1 + (Number(settings.markup_percentage) || 0) / 100);
    const sub = roundCurrency(labor + materials);
    const taxAmount = settings.tax_enabled ? roundCurrency(sub * (Number(settings.tax_rate) || 0) / 100) : 0;
    return {
      laborCost: roundCurrency(labor),
      materialsWithMarkup: roundCurrency(materials),
      subtotal: sub,
      tax: taxAmount,
      total: roundCurrency(sub + taxAmount),
    };
  }, [hours, materialsCost, settings]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const handleSave = async () => {
    if (!activeJob?.id) {
      setError("Select an active job first.");
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
      const limitCheck = await canCreateResource('estimates');
      if (!limitCheck.allowed) {
        if (limitCheck.readOnly) {
          setError(limitCheck.reason || 'Account locked. Renew to edit.');
          return;
        }
        setUpgradePromptData({ resourceType: 'estimates', currentCount: limitCheck.currentCount, limit: limitCheck.limit, tier: limitCheck.tier });
        setShowUpgradePrompt(true);
        return;
      }
      const notes = serviceName.trim()
        ? `Service: ${serviceName.trim()}`
        : null;

      const { error: insertError } = await supabase
        .from("estimates")
        .insert({
          user_id: user.id,
          job_id: activeJob.id,
          subtotal: roundCurrency(subtotal),
          tax: roundCurrency(tax),
          total_price: roundCurrency(total),
          status: "DRAFT",
          notes,
        });

      if (insertError) throw insertError;
      await incrementResourceUsage('estimates');

      setMessage("Estimate created! Open ProfitLock to edit details");
      window.dispatchEvent(new Event("estimates-updated"));
      onSaved?.();
      setTimeout(() => {
        onClose?.();
      }, 800);
    } catch (err) {
      setError(err?.message || "Error creating estimate");
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
          <h2 className="font-oswald text-lg text-[#FF6700]">QUICK ESTIMATE</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-[var(--text-sub)] uppercase tracking-widest font-bold">
            Job: <span className="text-[var(--text-main)]">{activeJob?.title || "No Active Job"}</span>
          </div>

          <div className="space-y-3">
            <input
              placeholder="Service Name"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <input
              type="number"
              placeholder="Hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
            />
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
              <input
                type="number"
                placeholder="Materials Cost"
                value={materialsCost}
                onChange={(e) => setMaterialsCost(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-8 pr-3 py-2 text-base text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] focus:border-[#FF6700] outline-none"
              />
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2 text-sm">
            {loadingSettings ? (
              <div className="text-[var(--text-sub)] flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#FF6700]" />
                Loading settings...
              </div>
            ) : (
              <>
                <div className="flex justify-between text-[var(--text-sub)]">
                  <span>Labor</span>
                  <span>{formatCurrency(laborCost)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-sub)]">
                  <span>Materials + Markup</span>
                  <span>{formatCurrency(materialsWithMarkup)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-main)] font-bold">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {settings.tax_enabled && (
                  <div className="flex justify-between text-[var(--text-sub)]">
                    <span>Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#FF6700] font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </>
            )}
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}
          {message && <div className="text-sm text-green-400">{message}</div>}

          <button
            onClick={handleSave}
            disabled={saving || loadingSettings}
            className="w-full bg-[#FF6700] text-black py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(255,103,0,0.35)] hover:shadow-[0_0_25px_rgba(255,103,0,0.5)] transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Estimate"}
          </button>
        </div>
      </div>
    </>
  );
}
