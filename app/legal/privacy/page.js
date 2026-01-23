"use client";

import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <div className="p-6 border-b border-industrial-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-industrial-card rounded-full hover:bg-industrial-border transition text-foreground">
                <ArrowLeft size={20}/>
            </Link>
            <h1 className="font-oswald font-bold text-xl tracking-wide uppercase">Privacy Policy</h1>
        </div>
        <Lock className="text-[#FF6700]" size={24}/>
      </div>

      <main className="max-w-3xl mx-auto p-6 pb-32">
        <div className="glass-panel p-8 rounded-xl shadow-xl space-y-8 text-sm md:text-base leading-relaxed">
            <section>
                <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">1. INFORMATION COLLECTION</h2>
                <p className="text-industrial-muted mb-4">
                    We collect information that you provide directly to us when you use FieldDeskOps:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                    <li><strong>Account Data:</strong> Email address and authentication details.</li>
                    <li><strong>Operational Data:</strong> Job names, inventory lists, photos, time logs, and subcontractor details.</li>
                </ul>
            </section>
            <section>
                <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">2. HOW WE USE DATA</h2>
                <p className="text-industrial-muted">We use your data strictly to provide and improve the Service. We do not sell your personal or operational data to third parties.</p>
            </section>
            <section>
                <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">3. DATA STORAGE & SECURITY</h2>
                <p className="text-industrial-muted">
                    We use industry-standard encryption and security measures (provided by Supabase) to protect your data.
                </p>
            </section>
            <div className="border-t border-industrial-border pt-8 mt-8">
                <p className="text-xs text-industrial-muted">Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
        </div>
        <div className="mt-12 text-center opacity-40">
            <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-muted">POWERED BY FIELDDESKOPS</p>
        </div>
      </main>
    </div>
  );
}
