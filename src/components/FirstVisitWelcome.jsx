import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Keyboard, Layers, MapPin, Shield, Sparkles, X } from "lucide-react";
import { BRAND_TAGLINE_EN } from "../lib/brand.js";

const PAGES = [
  { id: "mission", label: "Mission", short: "Why we exist" },
  { id: "features", label: "Capabilities", short: "What you get" },
  { id: "impact", label: "Impact", short: "Why it matters" },
  { id: "start", label: "Get started", short: "Sign in" },
];

function scrollAuthIntoViewSoon() {
  window.setTimeout(() => {
    window.dispatchEvent(new Event("nigaban-scroll-auth"));
  }, 280);
}

export default function FirstVisitWelcome({ onComplete }) {
  const [active, setActive] = useState("mission");

  const finish = useCallback(() => {
    try {
      localStorage.setItem("nigaban_welcomed", "true");
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("nigaban-welcomed"));
    onComplete?.();
    scrollAuthIntoViewSoon();
  }, [onComplete]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  const navBtn = (id) => {
    const p = PAGES.find((x) => x.id === id);
    const isActive = active === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActive(id)}
        className={`w-full text-left rounded-xl px-4 py-3 transition-colors border ${
          isActive
            ? "bg-gradient-to-r from-pink-500/25 to-purple-600/25 border-white/20 text-white shadow-lg shadow-purple-900/20"
            : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }`}
      >
        <span className="block text-sm font-bold">{p.label}</span>
        <span className="block text-[11px] text-slate-500 mt-0.5">{p.short}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-gradient-to-br from-[#0a0614] via-[#120a1c] to-[#07080f] text-white animate-in fade-in duration-200">
      {/* Top bar — website width */}
      <header className="shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
              <Shield className="h-6 w-6 text-pink-400" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-black tracking-tight truncate">NIgaban</p>
              <p className="text-xs text-violet-300/90 truncate" dir="rtl">
                نگہبان
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={finish}
              className="text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              Skip intro
            </button>
            <button
              type="button"
              onClick={finish}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close intro"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile tab strip */}
      <div className="md:hidden shrink-0 border-b border-white/10 bg-[#0c0a14]/90 overflow-x-auto">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                active === p.id ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "bg-white/5 text-slate-400 border border-white/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 max-w-7xl mx-auto w-full">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 lg:w-72 shrink-0 flex-col border-r border-white/10 p-4 lg:p-5 gap-1 bg-black/15">
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400/90 px-2 mb-2">Tour</p>
          {PAGES.map((p) => navBtn(p.id))}
        </aside>

        {/* Main content — scrollable, generous padding */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-5 sm:px-8 lg:px-14 py-8 lg:py-12 max-w-3xl">
            {active === "mission" ? (
              <article className="space-y-6">
                <div className="inline-flex items-center gap-2 text-purple-300 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" /> Mission
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">Pakistan&apos;s first AI-powered legal safety companion</h1>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">{BRAND_TAGLINE_EN}</p>
                <ul className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Know your rights fast with Hifazat and the legal desk — plain language, Pakistan-focused.</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Trigger help with SOS, silent shortcuts, and trusted-circle SMS when seconds matter.</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Document and export incidents so nothing important is lost in the stress of the moment.</span>
                  </li>
                </ul>
              </article>
            ) : null}

            {active === "features" ? (
              <article className="space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 text-purple-300 text-sm font-semibold mb-2">
                    <MapPin className="w-4 h-4" /> Capabilities
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Built for real pressure</h2>
                </div>

                <div className="grid gap-5 sm:gap-6">
                  <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3 text-white font-bold text-lg">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30">
                        <Keyboard className="w-5 h-5 text-violet-200" />
                      </span>
                      Silent mode SOS
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                      In this browser demo, press the <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono text-xs">S</kbd> key three times (not while typing in a field). That starts the same cancel countdown as shake-to-SOS. On phones, the product vision is volume-down three times from pocket — no unlock required.
                    </p>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3 text-white font-bold text-lg">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                        <Layers className="w-5 h-5 text-emerald-200" />
                      </span>
                      Incident heatmap
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                      Approved community reports with GPS appear on Google Maps. Switch between pin view and a heatmap layer so density is obvious in demos and in the field (data comes from the same backend as Supabase when configured).
                    </p>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3 text-white font-bold text-lg">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 border border-pink-500/30">
                        <Shield className="w-5 h-5 text-pink-200" />
                      </span>
                      Safety report export
                    </div>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                      After you submit a community incident, generate a dated text file or use print-to-PDF. Each export includes time, optional GPS, AI summary, and general legal orientation — for your records (not a substitute for a lawyer or FIR).
                    </p>
                  </section>
                </div>
              </article>
            ) : null}

            {active === "impact" ? (
              <article className="space-y-6">
                <div className="inline-flex items-center gap-2 text-purple-300 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" /> Impact (demo figures)
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Why the problem is urgent</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Figures below are hardcoded for hackathon storytelling — replace with verified citations for production.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { k: "1 in 3", d: "Pakistani women face harassment in public spaces (HRCP-style estimates)." },
                    { k: "93%", d: "of harassment cases go unreported — NIgaban lowers friction to document and reach help." },
                    { k: "18 min vs 1 tap", d: "Police response varies by city; your SOS and circle alerts fire in one tap." },
                  ].map((box) => (
                    <div key={box.k} className="rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/50 to-purple-950/30 p-5 min-h-[140px] flex flex-col">
                      <p className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-300">{box.k}</p>
                      <p className="text-sm text-slate-200 mt-3 leading-snug flex-1">{box.d}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {active === "start" ? (
              <article className="space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">You&apos;re one step from the full app</h2>
                  <p className="text-base text-slate-300 mt-3 leading-relaxed max-w-2xl">
                    Sign in (or create an account with your provider) to sync trusted contacts, community reports, and settings. Guest mode stays available for demos.
                  </p>
                </div>
                <ul className="space-y-2 text-slate-300 text-sm sm:text-base">
                  <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> Mission, silent SOS, heatmaps, and exports — all in one shell.</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> Scrolls to <strong className="text-white">Sign in</strong> below the marketing page after you continue.</li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={finish}
                    className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-purple-900/30 hover:opacity-95 active:scale-[0.99] transition-transform"
                  >
                    Continue to sign in
                  </button>
                  <button
                    type="button"
                    onClick={finish}
                    className="rounded-2xl border border-white/20 px-8 py-4 text-base font-semibold text-slate-200 hover:bg-white/5"
                  >
                    Skip intro
                  </button>
                </div>
              </article>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
