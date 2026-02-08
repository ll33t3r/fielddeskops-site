"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logError } from "../../../utils/logger";

export default function SubscriptionBanner() {
  const [status, setStatus] = useState({
    loading: true,
    tier: null,
    isReadOnly: false,
    stripeCustomerId: null,
  });
  const [error, setError] = useState("");
  const [isLoadingUpgrade, setIsLoadingUpgrade] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadStatus = async () => {
      try {
        const { getUserSubscription } = await import("@/lib/subscription/subscriptionHelpers");
        const data = await getUserSubscription();
        if (!mounted) return;
        setStatus({
          loading: false,
          tier: data?.tier || "free",
          isReadOnly: Boolean(data?.isReadOnly),
          stripeCustomerId: data?.stripeCustomerId || null,
        });
      } catch (err) {
        if (!mounted) return;
        logError("Subscription banner status failed", err);
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    };
    loadStatus();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUpgrade = async () => {
    setError("");
    setIsLoadingUpgrade(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok || data?.error) {
        const msg = data?.error || `Server error (${response.status})`;
        setError(msg);
        logError("Subscription banner checkout failed", msg);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Checkout link missing. Please try again.");
    } catch (err) {
      setError("Unable to start checkout. Check your connection and try again.");
      logError("Subscription banner checkout failed", err);
    } finally {
      setIsLoadingUpgrade(false);
    }
  };

  if (status.loading) return null;

  if (status.isReadOnly) {
    return (
      <div className="mx-4 mt-4 mb-2 rounded-xl border border-[#FF6700]/40 bg-[#FF6700]/10 p-4 text-sm text-[var(--text-main)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-[#FF6700]">Account locked. Renew to edit.</p>
          <Link
            href="/account"
            className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-4 py-2 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition"
          >
            Manage Billing
          </Link>
        </div>
        <p className="mt-2 text-xs text-[var(--text-sub)]">
          You can still view all saved data, but creating or editing is disabled until renewal.
        </p>
      </div>
    );
  }

  if (status.tier === "free" && !status.stripeCustomerId) {
    return (
      <div className="mx-4 mt-4 mb-2 rounded-xl border border-[#FF6700]/30 bg-[#FF6700]/5 p-4 text-sm text-[var(--text-main)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#FF6700]">Free demo account</p>
            <p className="text-xs text-[var(--text-sub)]">
              You are on the free plan. Upgrade to unlock unlimited jobs, photos, contracts, and inventory.
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={isLoadingUpgrade}
            className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-4 py-2 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoadingUpgrade ? "Opening..." : "Upgrade to Pro"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return null;
}
