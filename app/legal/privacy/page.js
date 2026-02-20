"use client";

import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const LAST_UPDATED = "February 20, 2026";

export default function PrivacyPolicy() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    const from = searchParams.get("from");
    if (from && from.startsWith("/")) {
      router.push(from);
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/welcome");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <div className="p-6 border-b border-industrial-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 bg-industrial-card rounded-full hover:bg-industrial-border transition text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-oswald font-bold text-xl tracking-wide uppercase">Privacy Policy</h1>
        </div>
        <Lock className="text-[#FF6700]" size={24} />
      </div>

      <main className="max-w-3xl mx-auto p-6 pb-32">
        <div className="glass-panel p-8 rounded-xl shadow-xl space-y-8 text-sm md:text-base leading-relaxed">

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">1. INFORMATION WE COLLECT</h2>
            <p className="text-industrial-muted mb-4">
              We collect information that you provide directly to us when you create an account and use FieldDeskOps (the "Service"):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Account data:</strong> Email address, password (hashed; we never store plaintext), and authentication tokens.</li>
              <li><strong>Profile data:</strong> Subscription status, plan tier, and Stripe customer identifiers linked to your account.</li>
              <li><strong>Operational data:</strong> Job names, estimates, inventory lists, tool registrations, team-member names, customer records (name, phone, email, address, notes), photos, captions, and digital contract/signature documents you create in the Service.</li>
              <li><strong>Usage data:</strong> Resource counts (e.g., number of jobs, photos, estimates created) used to enforce plan limits.</li>
              <li><strong>Device and log data:</strong> Browser type, operating system, IP address, pages visited, and timestamps collected automatically when you access the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">2. HOW WE USE YOUR DATA</h2>
            <p className="text-industrial-muted mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Provide, operate, and maintain the Service (ProfitLock, SiteSnap, SignOff, LoadOut, and the dashboard).</li>
              <li>Process payments, manage subscriptions, and enforce plan limits.</li>
              <li>Authenticate your identity and protect your account.</li>
              <li>Send transactional emails (e.g., email confirmation, password reset).</li>
              <li>Respond to feedback or support requests you submit through the Service.</li>
              <li>Monitor usage patterns to improve performance, fix bugs, and develop new features.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="text-industrial-muted mt-4">
              We do <strong>not</strong> sell, rent, or trade your personal or operational data to third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">3. THIRD-PARTY SERVICES</h2>
            <p className="text-industrial-muted mb-4">
              We use trusted third-party providers to operate the Service. They process data on our behalf under their own privacy policies:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Supabase</strong> — Database hosting, authentication, and file storage (photos, documents). Data is stored in Supabase-managed infrastructure with row-level security.</li>
              <li><strong>Stripe</strong> — Payment processing and subscription management. We share your email and a user identifier with Stripe to process payments. We do not store your credit card number; Stripe handles all card data under PCI-DSS compliance.</li>
              <li><strong>Vercel</strong> — Application hosting, serverless functions, and content delivery.</li>
              <li><strong>Vercel Analytics & Speed Insights</strong> — Privacy-focused product analytics and performance metrics (for page views and funnel telemetry).</li>
              <li><strong>Sentry</strong> — Error monitoring used to capture crashes and diagnose reliability issues.</li>
              <li><strong>Resend</strong> — Transactional email delivery (e.g., feedback submissions). Your email address may be included in messages routed through Resend.</li>
            </ul>
            <p className="text-industrial-muted mt-4">
              We do not share your data with any other third parties except as required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">4. COOKIES AND LOCAL STORAGE</h2>
            <p className="text-industrial-muted mb-4">
              We use the following browser storage mechanisms:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Authentication cookies:</strong> Set by Supabase to maintain your login session. These are essential for the Service to function and cannot be disabled.</li>
              <li><strong>Local storage:</strong> Used to save your UI preferences (e.g., theme, view mode). This data stays on your device and is not transmitted to our servers.</li>
              <li><strong>Analytics signals:</strong> We collect product usage events (for example: signup started/completed, first app opened, and upgrade clicks) to improve onboarding and reliability.</li>
            </ul>
            <p className="text-industrial-muted mt-4">
              We do not use advertising cookies or cross-site ad tracking pixels.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">5. DATA STORAGE AND SECURITY</h2>
            <p className="text-industrial-muted mb-4">
              Your data is stored in Supabase-managed databases with row-level security (RLS) enabled, meaning each user can only access their own data. Photos and documents are stored in Supabase Storage buckets.
            </p>
            <p className="text-industrial-muted mb-4">
              We use industry-standard security measures including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>HTTPS encryption for all data in transit.</li>
              <li>Hashed passwords (never stored in plaintext).</li>
              <li>Row-level security policies so users can only read and modify their own records.</li>
              <li>Environment-variable-based secrets for API keys (never exposed to the client).</li>
            </ul>
            <p className="text-industrial-muted mt-4">
              No system is 100% secure. While we take reasonable measures to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">6. DATA RETENTION</h2>
            <p className="text-industrial-muted mb-4">
              We retain your data for as long as your account is active or as needed to provide the Service. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Account and operational data:</strong> Retained until you delete your account or request deletion.</li>
              <li><strong>Photos and documents:</strong> Stored in Supabase Storage until you delete them or your account is closed.</li>
              <li><strong>Payment records:</strong> Stripe retains transaction history in accordance with their retention policy and applicable tax/legal requirements.</li>
              <li><strong>Log data:</strong> Automatically generated server logs may be retained for up to 90 days for debugging and security purposes.</li>
            </ul>
            <p className="text-industrial-muted mt-4">
              After account deletion, we will remove your data from our active systems within a reasonable timeframe. Some data may persist in encrypted backups for a limited period before being purged.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">7. YOUR RIGHTS</h2>
            <p className="text-industrial-muted mb-4">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request that we delete your personal data and account. You can also delete individual jobs, photos, tools, and other records directly within the Service.</li>
              <li><strong>Data portability:</strong> Request your data in a commonly used, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to certain processing of your data where applicable.</li>
            </ul>
            <p className="text-industrial-muted mt-4">
              To exercise any of these rights, contact us at <a href="mailto:fielddeskops@gmail.com" className="text-[#FF6700] hover:underline">fielddeskops@gmail.com</a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">8. CHILDREN&apos;S PRIVACY</h2>
            <p className="text-industrial-muted">
              The Service is not intended for anyone under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">9. CHANGES TO THIS POLICY</h2>
            <p className="text-industrial-muted">
              We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last Updated" date below and may notify you through the Service or by email. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">10. CONTACT</h2>
            <p className="text-industrial-muted">
              If you have questions or concerns about this Privacy Policy or how we handle your data, contact us at <a href="mailto:fielddeskops@gmail.com" className="text-[#FF6700] hover:underline">fielddeskops@gmail.com</a>.
            </p>
          </section>

          <div className="border-t border-industrial-border pt-8 mt-8">
            <p className="text-xs text-industrial-muted">Last Updated: {LAST_UPDATED}</p>
          </div>
        </div>
        <div className="mt-12 text-center opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-muted">POWERED BY FIELDDESKOPS</p>
        </div>
      </main>
    </div>
  );
}
