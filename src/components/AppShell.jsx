/**
 * AppShell — runtime safety net for the NIgaban app.
 *
 * - <ErrorBoundary />: catches uncaught render errors so the entire app
 *   never disappears with a white screen. Surfaces a calm recovery card
 *   with a Reload button.
 * - <OfflineIndicator />: lightweight pill that shows when the device is
 *   offline. Re-renders on online/offline events.
 *
 * Both are pure presentation; they don't depend on any backend.
 */

import { Component } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, WifiOff } from "lucide-react";
import { NigabanLogo } from "./Brand.jsx";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: String(error?.message || error || "Unexpected error") };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleReload = () => {
    try {
      window.location.reload();
    } catch {
      /* ignore */
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 text-center">
        <div className="surface-elev max-w-md w-full p-7 space-y-4">
          <div className="flex items-center gap-3 justify-center">
            <NigabanLogo size={36} className="logo-glow" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/25 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-300" />
          </div>
          <p className="section-eyebrow">Something interrupted us</p>
          <h2 className="text-xl font-bold text-white tracking-tight">The app hit an unexpected error.</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your data is safe. Reloading usually clears this. If it persists, please tell the team — this should not happen.
          </p>
          {this.state.message ? (
            <pre className="text-[10px] text-rose-300/80 bg-rose-950/40 border border-rose-500/20 rounded-lg p-2 overflow-auto text-left max-h-24">
              {this.state.message}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={this.handleReload}
            className="w-full rounded-xl aurora-bg py-3 text-sm font-bold text-white shadow-[0_10px_28px_-10px_rgba(168,85,247,0.55)] active:scale-[0.98] transition-transform"
          >
            Reload NIgaban
          </button>
          <p className="text-[10px] text-slate-600">
            In immediate danger? Dial <span className="font-semibold text-slate-400">15</span> (Police) or
            <span className="font-semibold text-slate-400"> 1099</span> (Madadgaar).
          </p>
        </div>
      </div>
    );
  }
}

export function OfflineIndicator() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[210] pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/85 backdrop-blur-md px-3.5 py-1.5 shadow-[0_10px_28px_-12px_rgba(0,0,0,0.6)]">
        <WifiOff className="w-3.5 h-3.5 text-amber-300" />
        <p className="text-[11px] font-bold tracking-wide text-amber-100">
          Offline · cached features still work
        </p>
      </div>
    </div>
  );
}
