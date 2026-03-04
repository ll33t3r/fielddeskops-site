import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const typeMap = {
  success: {
    icon: CheckCircle2,
    className: "bg-green-100 border-green-300 text-green-900 dark:bg-green-900/20 dark:border-green-500/40 dark:text-green-100",
  },
  error: {
    icon: AlertTriangle,
    className: "bg-red-100 border-red-300 text-red-900 dark:bg-red-900/20 dark:border-red-500/40 dark:text-red-100",
  },
  info: {
    icon: Info,
    className: "bg-slate-100 border-slate-300 text-slate-900 dark:bg-slate-900/30 dark:border-slate-500/40 dark:text-slate-100",
  },
};

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const {
    message,
    type = "info",
    actionLabel,
    onAction,
    showProgress = false,
    durationMs = 3000,
    startAt = Date.now(),
  } = toast;
  const config = typeMap[type] || typeMap.info;
  const Icon = config.icon;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!showProgress) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(timer);
  }, [showProgress, startAt, durationMs]);

  const progressPercent = useMemo(() => {
    if (!showProgress || durationMs <= 0) return 0;
    const elapsed = Math.max(0, now - startAt);
    const remaining = Math.max(0, durationMs - elapsed);
    return (remaining / durationMs) * 100;
  }, [durationMs, now, showProgress, startAt]);

  return (
    <div className="fixed bottom-6 right-6 z-[999] w-[min(92vw,26rem)]">
      <div className={`relative overflow-hidden flex items-start gap-2 border rounded-lg px-4 py-3 shadow-lg ${config.className}`}>
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="text-sm min-w-0 flex-1">
          <p>{message}</p>
          {actionLabel && typeof onAction === "function" ? (
            <button
              onClick={onAction}
              className="mt-2 inline-flex items-center rounded-md border border-current/40 px-2.5 py-1 text-xs font-semibold hover:bg-white/10 transition"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-xs opacity-70 hover:opacity-100 shrink-0"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
        {showProgress ? (
          <div className="absolute bottom-0 left-0 h-0.5 bg-current/40 transition-[width] duration-75 ease-linear" style={{ width: `${progressPercent}%` }} />
        ) : null}
      </div>
    </div>
  );
}
