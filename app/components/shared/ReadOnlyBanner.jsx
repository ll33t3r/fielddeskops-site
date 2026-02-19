"use client";

import { useEffect, useState } from "react";
import { getPaymentLink } from "@/lib/stripePaymentLink";

export default function ReadOnlyBanner() {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [reason, setReason] = useState("Account locked. Renew to edit.");
  const [isLoadingUpgrade, setIsLoadingUpgrade] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadStatus = async () => {
      const { getWriteAccessStatus } = await import("@/lib/subscription/subscriptionHelpers");
      const access = await getWriteAccessStatus();
      if (!mounted) return;
      if (access.readOnly) {
        setIsReadOnly(true);
        if (access.reason) setReason(access.reason);
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
      const paymentLink = getPaymentLink() || undefined;
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentLink }),
      });
      const data = await response.json();
      if (!response.ok || data?.error) {
        setError(data?.error || `Server error (${response.status})`);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Checkout link missing. Please try again.");
    } catch (err) {
      setError("Unable to start checkout. Check your connection and try again.");
    } finally {
      setIsLoadingUpgrade(false);
    }
  };

  if (!isReadOnly) return null;

  return (
    <div className="mx-4 mt-4 mb-2 rounded-xl border border-[#FF6700]/40 bg-[#FF6700]/10 p-4 text-sm text-[var(--text-main)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-[#FF6700]">{reason}</p>
        <button
          onClick={handleUpgrade}
          disabled={isLoadingUpgrade}
          className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-4 py-2 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoadingUpgrade ? "Opening..." : "Upgrade Account"}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--text-sub)]">
        You can still view all saved data, but creating or editing is disabled until renewal.
      </p>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
