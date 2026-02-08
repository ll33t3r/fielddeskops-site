"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

const LAST_UPDATED = "February 5, 2026";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <div className="p-6 border-b border-industrial-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 bg-industrial-card rounded-full hover:bg-industrial-border transition text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-oswald font-bold text-xl tracking-wide uppercase">Terms of Service</h1>
        </div>
        <Shield className="text-[#FF6700]" size={24} />
      </div>

      <main className="max-w-3xl mx-auto p-6 pb-32">
        <div className="glass-panel p-8 rounded-xl shadow-xl space-y-8 text-sm md:text-base leading-relaxed">
          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">1. ACCEPTANCE OF TERMS</h2>
            <p className="text-industrial-muted mb-4">
              These Terms of Service ("Terms") govern your access to and use of the FieldDeskOps website, applications, and related services (collectively, the "Service") operated by FieldDeskOps ("we," "us," or "our"). By creating an account, accessing, or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p className="text-industrial-muted">
              We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms. We will indicate the "Last Updated" date at the bottom of this page when we make material changes.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">2. DESCRIPTION OF SERVICE</h2>
            <p className="text-industrial-muted mb-4">
              FieldDeskOps provides digital tools for contractors and field operations, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>ProfitLock:</strong> Estimating, quoting, and profit-margin tools for jobs and invoices.</li>
              <li><strong>LoadOut:</strong> Inventory, stock, and tool/asset tracking (e.g., rigs, tools, team members).</li>
              <li><strong>SiteSnap:</strong> Photo documentation, captions, and organization tied to jobs.</li>
              <li><strong>SignOff:</strong> Digital contracts, templates, and customer signature collection.</li>
            </ul>
            <p className="text-industrial-muted mt-4">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We do not guarantee availability or that the Service will be error-free.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">3. ELIGIBILITY AND ACCOUNT REGISTRATION</h2>
            <p className="text-industrial-muted mb-4">
              You must be at least 18 years old and able to form a binding contract to use the Service. By using the Service, you represent that you meet these requirements and that the information you provide during registration is accurate and complete.
            </p>
            <p className="text-industrial-muted">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree to notify us promptly of any unauthorized use. We are not liable for losses arising from unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">4. SUBSCRIPTIONS, BILLING, AND PAYMENT</h2>
            <p className="text-industrial-muted mb-4">
              Some parts of the Service are offered on a subscription basis (e.g., Free, Pro, and other tiers). Subscription terms, pricing, and feature limits are described on our pricing page and may change with notice. Payment is processed by Stripe; by subscribing, you agree to Stripe's terms and our billing practices below.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Billing:</strong> Subscriptions are billed in advance (e.g., monthly or as stated at checkout). You authorize us to charge the payment method you provide for all fees incurred.</li>
              <li><strong>Free trials:</strong> If we offer a free trial, you may be charged when the trial ends unless you cancel before the trial period ends, in accordance with the offer terms.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your account or Stripe. Cancellation will take effect at the end of the current billing period; you will retain access until then.</li>
              <li><strong>Refunds:</strong> We do not generally provide refunds for partial periods or unused time. Refund requests may be considered on a case-by-case basis at our discretion.</li>
              <li><strong>Price changes:</strong> We may change subscription fees with reasonable notice. Continued use after a price change constitutes acceptance. If you do not agree, you may cancel before the change takes effect.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">5. ACCEPTABLE USE</h2>
            <p className="text-industrial-muted mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You will not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li>Violate any applicable law, regulation, or third-party rights.</li>
              <li>Use the Service to transmit malware, spam, or harmful or illegal content.</li>
              <li>Attempt to gain unauthorized access to the Service, other accounts, or our or our providers' systems or networks.</li>
              <li>Reverse engineer, decompile, or extract the source code of the Service (except as permitted by law).</li>
              <li>Resell, sublicense, or commercially exploit the Service beyond your own internal business use without our written consent.</li>
              <li>Use the Service in a way that could damage, overburden, or impair the Service or interfere with others' use.</li>
            </ul>
            <p className="text-industrial-muted mt-4">
              We may suspend or terminate your access if we reasonably believe you have violated these Terms or acceptable use.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">6. USER CONTENT AND DATA</h2>
            <p className="text-industrial-muted mb-4">
              You retain ownership of content and data you upload or create in the Service ("User Content"). By using the Service, you grant us a limited license to use, store, process, and display User Content as necessary to provide, operate, and improve the Service and to comply with law.
            </p>
            <p className="text-industrial-muted mb-4">
              You are solely responsible for User Content. You represent that you have all rights needed to provide it and that it does not infringe any third-party rights or violate any law. We may remove or refuse to display content that we believe violates these Terms or is harmful, without obligation to you.
            </p>
            <p className="text-industrial-muted">
              Our handling of personal data is described in our <Link href="/legal/privacy" className="text-[#FF6700] hover:underline">Privacy Policy</Link>. You agree to that policy as part of these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">7. INTELLECTUAL PROPERTY</h2>
            <p className="text-industrial-muted">
              The Service (including software, design, text, graphics, and branding, but excluding User Content) is owned or licensed by us and protected by copyright, trademark, and other laws. You may not copy, modify, distribute, or create derivative works from the Service except as expressly permitted by these Terms or with our prior written consent. "FieldDeskOps" and related marks are our trademarks.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">8. DISCLAIMERS</h2>
            <p className="text-industrial-muted mb-4">
              The Service is provided "as is" and "as available." We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>
            <p className="text-industrial-muted mb-4">
              You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Estimates and financial tools:</strong> ProfitLock and similar tools are for estimation and organization only. Calculations are based on your inputs. We are not responsible for pricing errors, underbidding, lost profits, or any business or financial decisions you make using the Service.</li>
              <li><strong>Safety and compliance:</strong> Any checklists, prompts, or guidance in the Service are aids only. They are not a substitute for professional safety training, certifications, or OSHA or other regulatory compliance. You are solely responsible for job-site safety and legal compliance.</li>
              <li><strong>Contracts and signatures:</strong> SignOff and digital signature features facilitate documentation and consent. You are responsible for the legality and enforceability of your contracts and for obtaining proper legal advice where needed.</li>
              <li><strong>Data accuracy:</strong> You are responsible for the accuracy of data you enter (inventory, jobs, photos, customer info, etc.). We are not liable for decisions or outcomes based on incorrect or incomplete data.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">9. LIMITATION OF LIABILITY</h2>
            <p className="text-industrial-muted font-semibold mb-2">IMPORTANT</p>
            <p className="text-industrial-muted mb-4">
              To the maximum extent permitted by law, FieldDeskOps and its affiliates, officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of profits, data, goodwill, or business opportunity) arising out of or related to your use of or inability to use the Service, even if we have been advised of the possibility of such damages.
            </p>
            <p className="text-industrial-muted">
              Our total liability for any claims arising out of or related to these Terms or the Service shall not exceed the greater of (a) the amount you paid us in the twelve (12) months preceding the claim, or (b) one hundred United States dollars ($100). Some jurisdictions do not allow certain limitations; in such cases, our liability will be limited to the maximum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">10. INDEMNIFICATION</h2>
            <p className="text-industrial-muted">
              You agree to indemnify, defend, and hold harmless FieldDeskOps and its affiliates, officers, directors, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to (a) your use of the Service, (b) your User Content, (c) your violation of these Terms or any law, or (d) your violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">11. TERMINATION</h2>
            <p className="text-industrial-muted mb-4">
              You may stop using the Service and close your account at any time. We may suspend or terminate your access to the Service, or your account, at any time for any reason, including breach of these Terms, with or without notice.
            </p>
            <p className="text-industrial-muted">
              Upon termination, your right to use the Service ceases. Sections that by their nature should survive (including Sections 6–10 and this sentence) will survive termination. We may retain or delete your data in accordance with our Privacy Policy and applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">12. CHANGES TO TERMS AND SERVICE</h2>
            <p className="text-industrial-muted">
              We may modify these Terms at any time. We will post the updated Terms on this page and update the "Last Updated" date. For material changes, we may also notify you by email or through the Service. Your continued use of the Service after the effective date of changes constitutes acceptance. If you do not agree, you must stop using the Service and may cancel your subscription. We may also change, suspend, or discontinue features or the Service; your sole remedy is to stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">13. GENERAL</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground">
              <li><strong>Governing law:</strong> These Terms are governed by the laws of the United States and the State of Georgia, without regard to conflict of law principles. Any dispute shall be resolved in the state or federal courts located in Georgia, and you consent to personal jurisdiction there. (If your principal place of business is outside the United States, we may agree to another jurisdiction.)</li>
              <li><strong>Entire agreement:</strong> These Terms and the Privacy Policy constitute the entire agreement between you and FieldDeskOps regarding the Service and supersede any prior agreements.</li>
              <li><strong>Severability:</strong> If any provision of these Terms is held invalid or unenforceable, the remaining provisions will remain in effect.</li>
              <li><strong>Waiver:</strong> Our failure to enforce any right or provision is not a waiver of that right or provision.</li>
              <li><strong>Contact:</strong> For questions about these Terms, contact us at <a href="mailto:fielddeskops@gmail.com" className="text-[#FF6700] hover:underline">fielddeskops@gmail.com</a> or through the contact or feedback options in the Service.</li>
            </ul>
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
