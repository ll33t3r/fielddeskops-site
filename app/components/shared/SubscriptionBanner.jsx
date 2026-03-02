"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
      <div className="w-full max-w-full min-w-0 px-4 sm:px-6 mt-2 mb-2">
        <div className="rounded-lg border border-[#FF6700]/40 bg-[#FF6700]/10 px-3 py-2 text-sm text-[var(--text-main)]">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <p className="font-semibold text-[#FF6700] text-xs sm:text-sm min-w-0 shrink">Account locked. Renew to edit.</p>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/account" className="text-xs font-semibold text-[#FF6700] hover:underline">Account</Link>
            <button
              onClick={handleUpgrade}
              disabled={isLoadingUpgrade}
              className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-3 py-1.5 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoadingUpgrade ? "..." : "Renew"}
            </button>
            </div>
          </div>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    );
  }

  if (status.tier === "free" && !status.stripeCustomerId) {
    return (
      <div className="w-full max-w-full min-w-0 px-4 sm:px-6 mt-2 mb-2">
        <div className="rounded-lg border border-[#FF6700]/30 bg-[#FF6700]/5 px-3 py-2 text-sm text-[var(--text-main)]">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <p className="font-semibold text-[#FF6700] text-xs sm:text-sm min-w-0 shrink">Free demo</p>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/account" className="text-xs font-semibold text-[#FF6700] hover:underline hidden sm:inline">Account</Link>
            <button
              onClick={handleUpgrade}
              disabled={isLoadingUpgrade}
              className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-3 py-1.5 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoadingUpgrade ? "..." : "Upgrade to Pro"}
            </button>
            </div>
          </div>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    );
  }

  return null;
}
