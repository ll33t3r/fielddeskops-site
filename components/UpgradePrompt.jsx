'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logError } from '../utils/logger';

export default function UpgradePrompt({
  isOpen = true,
  onClose,
  resourceType = 'resources',
  currentCount = 0,
  limit = 0,
  tier = 'free',
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    window.dispatchEvent(
      new CustomEvent('fdops:limit-reached', {
        detail: { resourceType, currentCount, limit, tier },
      })
    );
  }, [isOpen, resourceType, currentCount, limit, tier]);

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const handleUpgrade = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || `Server error (${response.status})`;
        setError(msg);
        logError('Upgrade checkout failed', data.error || response.status);
        return;
      }

      if (data.error) {
        setError(data.error);
        logError('Upgrade checkout failed', data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError('Checkout link missing. Please try again.');
      logError('Upgrade checkout missing url');
    } catch (err) {
      setError('Unable to start checkout. Check your connection and try again.');
      logError('Upgrade checkout failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-main)]">
          Upgrade to Continue
        </h2>
        
        <p className="text-[var(--text-sub)] mb-4">
          You've reached your {tier} tier limit of <strong>{limit}</strong> {resourceType}.
        </p>
        
        <p className="text-[var(--text-sub)] mb-6">
          Current usage: <strong>{currentCount} / {limit}</strong>
        </p>

        <div className="bg-[#FF6700]/10 border border-[#FF6700]/35 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-[#FF6700] mb-2">
            Unlock Unlimited Access - $19.99/month
          </h3>
          <ul className="text-sm text-[var(--text-main)] space-y-1">
            <li>• Unlimited jobs, customers & photos</li>
            <li>• Unlimited estimates & contracts</li>
            <li>• Share SignOff documents</li>
            <li>• All apps included</li>
          </ul>
        </div>

        {error ? (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        ) : null}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-card)] transition"
          >
            {onClose ? 'Close' : 'Go Back'}
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#FF6700] text-black font-semibold rounded-lg hover:shadow-[0_0_12px_rgba(255,103,0,0.35)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Opening Checkout...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
