import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff } from "lucide-react";

const CALLER = { name: "Amna Khan", subtitle: "Mobile · incoming call" };

/** Classic ring pattern: two tones ~440/480 Hz, Web Audio API — no assets. */
function useRingtone(playing) {
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (ctxRef.current) {
        try {
          ctxRef.current.close();
        } catch {
          // ignore
        }
        ctxRef.current = null;
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    const ringOnce = () => {
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      [440, 480].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02 + i * 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55 + i * 0.04);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      });
    };
    ringOnce();
    intervalRef.current = window.setInterval(ringOnce, 2600);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      try {
        ctx.close();
      } catch {
        // ignore
      }
      ctxRef.current = null;
    };
  }, [playing]);
}

export default function FakeCallOverlay({ open, onClose }) {
  const [phase, setPhase] = useState("ringing"); // ringing | answered
  useRingtone(open && phase === "ringing");

  useEffect(() => {
    if (!open) setPhase("ringing");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white animate-in fade-in duration-200">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <p className="text-sm text-slate-400 mb-2">{CALLER.subtitle}</p>
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-3xl font-bold shadow-2xl shadow-purple-900/50 ring-4 ring-white/10 mb-6 animate-pulse">
          AK
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">{CALLER.name}</h2>
        {phase === "ringing" ? (
          <p className="mt-4 text-lg text-emerald-400 font-medium">Incoming call…</p>
        ) : (
          <p className="mt-4 text-lg text-slate-300">00:02</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 px-10 pb-10 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-900/50 active:scale-95 transition-transform"
            aria-label="Decline fake call"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
          <span className="text-xs text-slate-400">Decline</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setPhase("answered")}
            className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 active:scale-95 transition-transform"
            aria-label="Answer fake call"
          >
            <Phone className="w-7 h-7 text-white" />
          </button>
          <span className="text-xs text-slate-400">Answer</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mx-auto mb-8 text-sm text-slate-500 underline underline-offset-2 hover:text-slate-300"
      >
        End & close
      </button>
    </div>
  );
}
