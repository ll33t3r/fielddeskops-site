import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const typeMap = {
  success: {
    icon: CheckCircle2,
    className: "bg-green-900/20 border-green-500/40 text-green-100",
  },
  error: {
    icon: AlertTriangle,
    className: "bg-red-900/20 border-red-500/40 text-red-100",
  },
  info: {
    icon: Info,
    className: "bg-slate-900/30 border-slate-500/40 text-slate-100",
  },
};

export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const { message, type = "info" } = toast;
  const config = typeMap[type] || typeMap.info;
  const Icon = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-[999]">
      <div className={`flex items-start gap-2 border rounded-lg px-4 py-3 shadow-lg ${config.className}`}>
        <Icon className="h-4 w-4 mt-0.5" />
        <div className="text-sm">
          <p>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-xs opacity-70 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
