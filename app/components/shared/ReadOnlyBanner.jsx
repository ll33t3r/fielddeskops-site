\"use client\";

import { useEffect, useState } from \"react\";
import Link from \"next/link\";

export default function ReadOnlyBanner() {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [reason, setReason] = useState(\"Account locked. Renew to edit.\");

  useEffect(() => {
    let mounted = true;
    const loadStatus = async () => {
      const { getWriteAccessStatus } = await import(\"@/lib/subscription/subscriptionHelpers\");
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

  if (!isReadOnly) return null;

  return (
    <div className=\"mx-4 mt-4 mb-2 rounded-xl border border-[#FF6700]/40 bg-[#FF6700]/10 p-4 text-sm text-[var(--text-main)]\">
      <div className=\"flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between\">
        <p className=\"font-semibold text-[#FF6700]\">{reason}</p>
        <Link
          href=\"/account\"
          className=\"inline-flex items-center justify-center rounded-lg bg-[#FF6700] px-4 py-2 text-xs font-bold text-black hover:shadow-[0_0_12px_rgba(255,103,0,0.4)] transition\"
        >
          Manage Billing
        </Link>
      </div>
      <p className=\"mt-2 text-xs text-[var(--text-sub)]\">
        You can still view all saved data, but creating or editing is disabled until renewal.
      </p>
    </div>
  );
}
