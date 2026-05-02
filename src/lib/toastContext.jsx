import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message: String(message || ""), variant }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss],
  );

  const successFn = useCallback((m) => push(m, "success"), [push]);
  const errorFn = useCallback((m) => push(m, "error"), [push]);
  const infoFn = useCallback((m) => push(m, "info"), [push]);

  const value = useMemo(
    () => ({
      toast: push,
      success: successFn,
      error: errorFn,
      info: infoFn,
    }),
    [push, successFn, errorFn, infoFn],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-3 left-3 right-3 z-[200] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md animate-in slide-up duration-200 ${
              t.variant === "success"
                ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-50"
                : t.variant === "error"
                  ? "border-rose-500/40 bg-rose-950/90 text-rose-50"
                  : "border-white/15 bg-[#1a1b2e]/95 text-slate-100"
            }`}
            role="status"
          >
            {t.variant === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : t.variant === "error" ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-purple-400 mt-0.5" />
            )}
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded-lg p-1 text-current opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
