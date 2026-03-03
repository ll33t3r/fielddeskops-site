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
  const [isDismissed, setIsDismissed] = useState(false);

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

  useEffect(() => {
    const handleLimitReached = () => {
      setIsDismissed(false);
    };
    window.addEventListener("fdops:limit-reached", handleLimitReached);
    return () => {
      window.removeEventListener("fdops:limit-reached", handleLimitReached);
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

  const showReadOnlyToast = status.isReadOnly;
  const showFreeToast = status.tier === "free" && !status.stripeCustomerId;
  const shouldShowToast = (showReadOnlyToast || showFreeToast) && !isDismissed;

  if (!shouldShowToast) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-1rem)] max-w-lg pointer-events-none">
      <div
        className={[
          "pointer-events-auto rounded-xl border shadow-2xl backdrop-blur-xl",
          "px-3 py-3 sm:px-4",
          showReadOnlyToast
            ? "bg-[#1d1206]/95 border-[#FF6700]/50"
            : "bg-[#0a0a0a]/92 border-[#FF6700]/30",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {showReadOnlyToast ? (
              <>
                <p className="text-sm font-semibold text-[#FF6700]">Subscription paused</p>
                <p className="text-xs text-[var(--text-main)] mt-0.5">
                  Your workspace is in read-only mode. Renew to keep creating and editing.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#FF6700]">Welcome to the free demo</p>
                <p className="text-xs text-[var(--text-main)] mt-0.5">
                  Build as you go, then unlock unlimited jobs, customers, and all apps when you are ready.
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-[var(--text-sub)] hover:text-[var(--text-main)] text-xs px-2 py-1"
            aria-label="Dismiss free demo notice"
          >
            Dismiss
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Link href="/account" className="text-xs font-semibold text-[#FF6700] hover:underline">
            Account
          </Link>
          <button
            onClick={handleUpgrade}
            disabled={isLoadingUpgrade}
            className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-3 py-1.5 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoadingUpgrade ? "..." : showReadOnlyToast ? "Renew now" : "Upgrade now"}
          </button>
        </div>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
