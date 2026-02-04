'use client';

import { useRouter } from 'next/navigation';

export default function UpgradePrompt({ resourceType, currentCount, limit, tier }) {
  const router = useRouter();

  const handleUpgrade = async () => {
    console.log('handleUpgrade called');
    try {
      console.log('Fetching checkout URL...');
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Response received:', response);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.error) {
        console.error('Checkout error:', data.error);
        alert('Unable to start checkout. Please try again.');
        return;
      }

      if (data.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.log('No URL in response');
      }
    } catch (error) {
      console.error('Catch block error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

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
            <li>? Unlimited jobs, customers & photos</li>
            <li>? Unlimited estimates & contracts</li>
            <li>? Share SignOff documents</li>
            <li>? All apps included</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Go Back
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
