'use client';

import { Lock, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

export default function PaywallModal({ isOpen, onClose, feature }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in p-4">
      <div className="relative w-full max-w-md bg-[#121212] border border-[#FF6700] rounded-2xl shadow-[0_0_50px_rgba(255,103,0,0.2)] overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X size={20} />
        </button>

        {/* Header */}
        <div className="bg-[#FF6700] p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-black rounded-full flex items-center justify-center mb-3">
            <Lock className="text-[#FF6700]" size={24} />
          </div>
          <h2 className="text-2xl font-oswald font-bold text-black uppercase tracking-wide">
            UPGRADE TO PRO
          </h2>
          <p className="text-black/80 font-bold text-sm uppercase tracking-widest mt-1">
            Unlock {feature}
          </p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          <p className="text-center text-gray-300">
            You have reached the free limit. Upgrade now to unlock unlimited access to <span className="text-[#FF6700] font-bold">FieldDeskOps</span>.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> <span>Unlimited Contracts & Bids</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> <span>Unlimited Asset Tracking</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <CheckCircle2 size={16} className="text-[#FF6700]" /> <span>Team Management</span>
            </div>
          </div>

          <Link href="/dashboard/subscription" className="block w-full">
            <button className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-105 transition shadow-lg text-lg uppercase font-oswald">
                Start 7-Day Free Trial
            </button>
          </Link>

          <button onClick={onClose} className="w-full text-center text-xs text-gray-500 hover:text-white uppercase tracking-widest font-bold">
            Maybe Later
          </button>
        </div>

      </div>
    </div>
  );
}
