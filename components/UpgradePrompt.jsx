'use client';

import { useState } from 'react';
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Upgrade to Continue
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You've reached your {tier} tier limit of <strong>{limit}</strong> {resourceType}.
        </p>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Current usage: <strong>{currentCount} / {limit}</strong>
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Unlock Unlimited Access - $19.99/month
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Unlimited jobs, customers & photos</li>
            <li>• Unlimited estimates & contracts</li>
            <li>• Share SignOff documents</li>
            <li>• All apps included</li>
          </ul>
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        ) : null}

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {onClose ? 'Close' : 'Go Back'}
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Opening Checkout...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
