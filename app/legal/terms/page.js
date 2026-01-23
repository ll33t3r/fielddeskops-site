"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <div className="p-6 border-b border-industrial-border flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-industrial-card rounded-full hover:bg-industrial-border transition text-foreground">
                <ArrowLeft size={20}/>
            </Link>
            <h1 className="font-oswald font-bold text-xl tracking-wide uppercase">Terms of Service</h1>
        </div>
        <Shield className="text-[#FF6700]" size={24}/>
      </div>

      <main className="max-w-3xl mx-auto p-6 pb-32">
        <div className="glass-panel p-8 rounded-xl shadow-xl space-y-8 text-sm md:text-base leading-relaxed">
            <section>
                <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">1. ACCEPTANCE OF TERMS</h2>
                <p className="text-industrial-muted">
                    By accessing or using the FieldDeskOps platform ("Service"), you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
                </p>
            </section>
            <section>
                <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">2. USE OF SERVICE</h2>
                <p className="text-industrial-muted mb-4">
                    FieldDeskOps provides digital tools for contractors (estimating, inventory, time-tracking). You acknowledge that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                    <li><strong>Estimates are Estimates:</strong> ProfitLock calculations are based on your inputs. We are not responsible for financial losses due to pricing errors.</li>
                    <li><strong>Safety is Your Responsibility:</strong> SafetyBrief checklists are aids, not a replacement for professional safety certifications or OSHA compliance.</li>
                    <li><strong>Data Accuracy:</strong> You are responsible for the accuracy of data entered into LoadOut, CrewClock, and other apps.</li>
                </ul>
            </section>
            <section>
                <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">3. ACCOUNTS</h2>
                <p className="text-industrial-muted">
                    You are responsible for safeguarding the password that you use to access the Service. You agree not to disclose your password to any third party.
                </p>
            </section>
            <section>
                <h2 className="font-oswald font-bold text-2xl mb-4 text-[#FF6700]">4. LIMITATION OF LIABILITY</h2>
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg">
                    <p className="font-bold text-red-500 mb-2">IMPORTANT:</p>
                    <p className="text-foreground">
                        In no event shall FieldDeskOps be liable for any indirect, incidental, special, consequential or punitive damages resulting from your access to or use of the Service.
                    </p>
                </div>
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
