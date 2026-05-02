import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { BRAND_TAGLINE_EN } from "../lib/brand.js";

const CARDS = [
  {
    title: "Pakistan’s first AI legal safety companion",
    body: BRAND_TAGLINE_EN,
  },
  {
    title: "Silent SOS (demo)",
    body: "Press the S key three times in the browser — no mouse — same emergency countdown as shake. On phones we target volume-down ×3 without unlocking the screen.",
  },
  {
    title: "Heatmaps & evidence",
    body: "See incident density on the map, then export a dated safety report after you log an incident — for your records and next steps.",
  },
];

export default function FirstVisitWelcome({ onComplete }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const go = useCallback(
    (dir) => {
      setIndex((i) => {
        const n = i + dir;
        if (n < 0) return 0;
        if (n >= CARDS.length) return CARDS.length - 1;
        return n;
      });
    },
    [],
  );

  const finish = () => {
    try {
      localStorage.setItem("nigaban_welcomed", "true");
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("nigaban-welcomed"));
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-gradient-to-b from-[#0a0614] via-[#141023] to-[#07080f] text-white px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-in fade-in duration-300">
      <div className="flex flex-col items-center text-center space-y-2 shrink-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-lg shadow-purple-900/30">
          <Shield className="h-8 w-8 text-pink-400" />
        </div>
        <p className="text-2xl font-black tracking-tight">NIgaban</p>
        <p className="text-sm text-violet-200/90 font-medium" dir="rtl">
          نگہبان
        </p>
        <p className="text-[11px] text-slate-300 max-w-sm leading-relaxed px-1">{BRAND_TAGLINE_EN}</p>
      </div>

      <div
        className="flex-1 flex flex-col justify-center min-h-0 py-6"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          const end = e.changedTouches[0]?.clientX;
          if (start == null || end == null) return;
          const dx = end - start;
          if (dx < -48) go(1);
          else if (dx > 48) go(-1);
        }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] max-w-md mx-auto w-full shadow-xl">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{
              width: `${CARDS.length * 100}%`,
              transform: `translateX(-${(index * 100) / CARDS.length}%)`,
            }}
          >
            {CARDS.map((c, i) => (
              <div
                key={i}
                className="shrink-0 px-5 py-8 space-y-3 text-center"
                style={{ width: `${100 / CARDS.length}%` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300/90">Card {i + 1} / {CARDS.length}</p>
                <h2 className="text-lg font-bold text-white leading-snug">{c.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed text-left">{c.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="rounded-full p-2 border border-white/15 bg-white/5 disabled:opacity-30"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-1.5">
            {CARDS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to card ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-gradient-to-r from-pink-500 to-purple-600" : "w-2 bg-white/20"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === CARDS.length - 1}
            className="rounded-full p-2 border border-white/15 bg-white/5 disabled:opacity-30"
            aria-label="Next card"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-500 mt-3">Swipe left or right on the card</p>
      </div>

      <button
        type="button"
        onClick={finish}
        className="w-full max-w-md mx-auto rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-sm font-black text-white shadow-lg shadow-purple-900/40 active:scale-[0.99] transition-transform"
      >
        Get started
      </button>
    </div>
  );
}
