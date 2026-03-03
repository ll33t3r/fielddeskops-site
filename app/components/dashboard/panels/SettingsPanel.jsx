"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Moon, Sun, ShieldCheck } from "lucide-react";
import { track } from "@vercel/analytics";
import PanelContainer from "./PanelContainer";

export default function SettingsPanel({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  privacyMode,
  onTogglePrivacyMode,
  onLogout,
}) {
  const [companyInfo, setCompanyInfo] = useState({
    name: "FieldDeskOps Demo Co.",
    email: "hello@fielddeskops.com",
    phone: "(555) 000-0000",
    address: "123 Command Center Way",
  });
  const [profitLockDefaults, setProfitLockDefaults] = useState({
    hourlyRate: "125",
    markup: "15",
    taxRate: "8.25",
  });
  const [subscription, setSubscription] = useState({
    loading: true,
    tier: "free",
    isReadOnly: false,
    stripeCustomerId: null,
  });
  const [billingLoading, setBillingLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadSubscription = async () => {
      try {
        const { getUserSubscription } = await import("@/lib/subscription/subscriptionHelpers");
        const data = await getUserSubscription();
        if (!mounted) return;
        setSubscription({
          loading: false,
          tier: data?.tier || "free",
          isReadOnly: Boolean(data?.isReadOnly),
          stripeCustomerId: data?.stripeCustomerId || null,
        });
      } catch (err) {
        if (!mounted) return;
        setSubscription((prev) => ({ ...prev, loading: false }));
      }
    };
    loadSubscription();
    return () => {
      mounted = false;
    };
  }, []);

  const isActiveSubscription =
    !subscription.isReadOnly && (subscription.tier === "paid" || subscription.tier === "trial");
  const hasPastSubscription = Boolean(subscription.stripeCustomerId);

  const handleUpgrade = async () => {
    setSubscriptionError("");
    setBillingLoading(true);
    try {
      track("upgrade_clicked");
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok || data?.error) {
        setSubscriptionError(data?.error || `Server error (${response.status})`);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setSubscriptionError("Checkout link missing. Please try again.");
    } catch (err) {
      setSubscriptionError("Unable to start checkout. Please try again.");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setSubscriptionError("");
    setBillingLoading(true);
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok || data?.error) {
        setSubscriptionError(data?.error || `Server error (${response.status})`);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setSubscriptionError("Billing link missing. Please try again.");
    } catch (err) {
      setSubscriptionError("Unable to open billing portal. Please try again.");
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <PanelContainer isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">User Profile</h3>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-4">
            <p className="text-sm font-bold text-[var(--text-main)]">Commander</p>
            <p className="text-xs text-[var(--text-sub)]">commander@fielddeskops.com</p>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">Company Info</h3>
          <div className="space-y-2">
            <input
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)]"
              placeholder="Company Name"
            />
            <input
              value={companyInfo.email}
              onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)]"
              placeholder="Company Email"
              type="email"
            />
            <input
              value={companyInfo.phone}
              onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)]"
              placeholder="Company Phone"
            />
            <input
              value={companyInfo.address}
              onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-base text-[var(--input-text)]"
              placeholder="Company Address"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">ProfitLock Defaults</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-sub)]">Hourly Rate</label>
              <input
                value={profitLockDefaults.hourlyRate}
                onChange={(e) => setProfitLockDefaults({ ...profitLockDefaults, hourlyRate: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-2 text-sm text-[var(--input-text)]"
                placeholder="125"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-sub)]">Markup %</label>
              <input
                value={profitLockDefaults.markup}
                onChange={(e) => setProfitLockDefaults({ ...profitLockDefaults, markup: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-2 text-sm text-[var(--input-text)]"
                placeholder="15"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-sub)]">Tax %</label>
              <input
                value={profitLockDefaults.taxRate}
                onChange={(e) => setProfitLockDefaults({ ...profitLockDefaults, taxRate: e.target.value })}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-2 text-sm text-[var(--input-text)]"
                placeholder="8.25"
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">Appearance</h3>
          <button
            onClick={onToggleTheme}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex items-center justify-between hover:bg-[var(--bg-card)] transition"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon size={18} className="text-[#FF6700]" /> : <Sun size={18} className="text-[var(--text-sub)]" />}
              <span className="text-sm font-bold text-[var(--text-main)]">{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${theme === "dark" ? "bg-[#FF6700]" : "bg-[var(--switch-off-bg)]"}`}>
              <div className={`w-4 h-4 rounded-full bg-[var(--switch-knob)] m-0.5 transition-transform ${theme === "dark" ? "translate-x-5" : ""}`} />
            </div>
          </button>
          <button
            onClick={onTogglePrivacyMode}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-lg flex items-center justify-between hover:bg-[var(--bg-card)] transition"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-[#FF6700]" />
              <span className="text-sm font-bold text-[var(--text-main)]">Privacy Mode</span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors ${privacyMode ? "bg-[#FF6700]" : "bg-[var(--switch-off-bg)]"}`}>
              <div className={`w-4 h-4 rounded-full bg-[var(--switch-knob)] m-0.5 transition-transform ${privacyMode ? "translate-x-5" : ""}`} />
            </div>
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-sub)]">Subscription</h3>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg p-4 space-y-3">
            {subscription.loading ? (
              <p className="text-xs text-[var(--text-sub)]">Loading subscription status...</p>
            ) : isActiveSubscription ? (
              <p className="text-sm font-extrabold text-green-400">Pro Active</p>
            ) : (
              <p className="text-sm font-bold text-[#FF6700]">Not Active</p>
            )}

            <div className="flex flex-wrap gap-2">
              <Link
                href="/account"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold text-[var(--text-main)] hover:border-[#FF6700]/50 transition"
                onClick={onClose}
              >
                Account Page
              </Link>

              {!subscription.loading && isActiveSubscription && hasPastSubscription && (
                <button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-3 py-2 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {billingLoading ? "Opening..." : "Manage Billing"}
                </button>
              )}

              {!subscription.loading && !isActiveSubscription && (
                <button
                  onClick={handleUpgrade}
                  disabled={billingLoading}
                  className="inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-3 py-2 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {billingLoading
                    ? "Opening..."
                    : hasPastSubscription
                      ? "Renew / Resubscribe"
                      : "Upgrade"}
                </button>
              )}
            </div>

            <p className="text-xs text-[var(--text-sub)]">
              Open Account Page for full billing controls and usage tracking.
            </p>
            {subscriptionError && (
              <p className="text-xs text-red-400">{subscriptionError}</p>
            )}
          </div>
        </section>

        <button
          onClick={onLogout}
          className="w-full bg-red-900/20 border border-red-500/30 text-red-500 p-3 rounded-lg flex items-center gap-3 hover:bg-red-900/40 transition font-bold"
        >
          <LogOut size={18} />
          <span className="text-sm">Sign Out</span>
        </button>

        <p className="text-center text-xs text-[var(--text-sub)] pt-4">
          Contact us at{" "}
          <a href="mailto:fielddeskops@gmail.com" className="text-[#FF6700] hover:underline">
            fielddeskops@gmail.com
          </a>
        </p>
      </div>
    </PanelContainer>
  );
}
