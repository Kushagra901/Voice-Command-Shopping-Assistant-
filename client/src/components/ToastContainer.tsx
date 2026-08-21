import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-2xl p-3.5 shadow-2xl border backdrop-blur-xl flex items-center justify-between gap-3 transition-all duration-200 animate-in slide-in-from-bottom-5 ${
            t.type === "success"
              ? "bg-slate-900/95 border-emerald-500/40 text-emerald-300"
              : t.type === "error"
              ? "bg-slate-900/95 border-rose-500/40 text-rose-300"
              : "bg-slate-900/95 border-indigo-500/40 text-indigo-300"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            {t.type === "info" && <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
            <span className="text-xs sm:text-sm font-medium text-slate-100 leading-snug">{t.message}</span>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
