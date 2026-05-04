import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Keyboard, Layers, Lock, MapPin, Shield, Sparkles, X } from "lucide-react";
import { NigabanLogo } from "./Brand.jsx";

const PAGES = [
  { id: "mission",  label: "Mission",       short: "Why we exist" },
  { id: "features", label: "Capabilities",  short: "What you get" },
  { id: "impact",   label: "Impact",        short: "Why it matters" },
  { id: "start",    label: "Get started",   short: "Sign in" },
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
    } catch { /* ignore */ }
    window.dispatchEvent(new Event("nigaban-welcomed"));
    onComplete?.();
    scrollAuthIntoViewSoon();
  }, [onComplete]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") finish(); };
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
        className={`w-full text-left rounded-xl px-3.5 py-2.5 transition-all border ${
          isActive
            ? "aurora-bg-soft border-violet-500/30 text-white"
            : "border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        <span className="block text-sm font-bold tracking-tight">{p.label}</span>
        <span className="block text-[10px] text-slate-500 mt-0.5">{p.short}</span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col text-white animate-in fade-in duration-200"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 12% 0%, rgba(99,102,241,0.16) 0%, transparent 55%)," +
          "radial-gradient(ellipse 70% 60% at 88% 8%, rgba(168,85,247,0.12) 0%, transparent 55%)," +
          "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(236,72,153,0.08) 0%, transparent 55%)," +
          "#07091a",
      }}
    >
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/[0.06] bg-[#07091a]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <NigabanLogo size={36} className="logo-glow shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-black tracking-tight truncate">
                NI<span className="aurora-text">gaban</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">AI Safety</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={finish}
              className="text-[11px] font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              Skip intro
            </button>
            <button
              type="button"
              onClick={finish}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
              aria-label="Close intro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile tab strip ────────────────────────────────── */}
      <div className="md:hidden shrink-0 border-b border-white/[0.05] bg-[#0d1027]/70 overflow-x-auto">
        <div className="flex gap-1.5 px-3 py-2 min-w-max">
          {PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all ${
                active === p.id
                  ? "aurora-bg text-white shadow-[0_6px_16px_-6px_rgba(168,85,247,0.5)]"
                  : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 max-w-7xl mx-auto w-full">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 lg:w-72 shrink-0 flex-col border-r border-white/[0.06] p-4 lg:p-5 gap-1 bg-[#07091a]/40">
          <p className="section-eyebrow px-2 mb-2.5">Tour</p>
          {PAGES.map((p) => navBtn(p.id))}
          <div className="mt-auto pt-6 px-2">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              In immediate danger, dial <span className="text-slate-400 font-semibold">15</span> · <span className="text-slate-400 font-semibold">1099</span>.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-5 sm:px-8 lg:px-14 py-8 lg:py-12 max-w-3xl">

            {active === "mission" ? (
              <article className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.07] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-violet-200">
                  <Sparkles className="w-3.5 h-3.5" /> Mission
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[0.98] tracking-tight">
                  Safety that <br />
                  <span className="aurora-text aurora-drift">thinks ahead.</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                  NI<span className="aurora-text font-bold">gaban</span> turns your phone into a guardian — live trip share,
                  encrypted SOS, AI-aware legal guidance, and a fake call ready when you need to leave the room.
                </p>
                <ul className="space-y-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                  {[
                    "Know your rights with Hifazat — Pakistan-specific, plain language, in English & Urdu.",
                    "Trigger help via SOS, silent shortcuts, and trusted-circle SMS when seconds matter.",
                    "Document & export incidents so nothing important is lost in the stress of the moment.",
                  ].map((line) => (
                    <li key={line} className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {active === "features" ? (
              <article className="space-y-7">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.07] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-violet-200 mb-3">
                    <MapPin className="w-3.5 h-3.5" /> Capabilities
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Built for real pressure.</h2>
                </div>

                <div className="grid gap-4">
                  {[
                    {
                      icon: Keyboard,
                      tone: "violet",
                      title: "Silent SOS",
                      body: <>In this browser demo, press <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white font-mono text-xs">S</kbd> three times (not while typing). On phones, the vision is volume-down ×3 from pocket — no unlock required.</>,
                    },
                    {
                      icon: Layers,
                      tone: "emerald",
                      title: "Incident heatmap",
                      body: "Approved community reports with GPS cluster on a live map. Toggle between pins and heatmap density.",
                    },
                    {
                      icon: Shield,
                      tone: "rose",
                      title: "Evidence export",
                      body: "Generate a dated incident report — GPS, AI summary, and Pakistan law citations. Use it as your record (not a substitute for a lawyer).",
                    },
                  ].map(({ icon: Icon, tone, title, body }) => {
                    const ring = {
                      violet:  "bg-violet-500/15 border-violet-500/25 text-violet-200",
                      emerald: "bg-emerald-500/15 border-emerald-500/25 text-emerald-200",
                      rose:    "bg-rose-500/15 border-rose-500/25 text-rose-200",
                    }[tone];
                    return (
                      <section key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${ring}`}>
                            <Icon className="w-5 h-5" />
                          </span>
                          <p className="text-base sm:text-lg font-bold text-white">{title}</p>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{body}</p>
                      </section>
                    );
                  })}
                </div>
              </article>
            ) : null}

            {active === "impact" ? (
              <article className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/[0.07] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-violet-200">
                  <Sparkles className="w-3.5 h-3.5" /> Impact
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">The numbers behind the need.</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Figures below are advocacy estimates — replace with verified citations for production.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { k: "1 in 3",   d: "Pakistani women face harassment in public spaces" },
                    { k: "93%",      d: "of harassment cases go unreported — NIgaban lowers friction to document & reach help" },
                    { k: "1 tap",    d: "to send live GPS to your circle vs ~18 min average urban response" },
                  ].map((box) => (
                    <div key={box.k} className="surface-elev p-5 min-h-[140px] flex flex-col">
                      <p className="text-3xl sm:text-4xl font-black aurora-text leading-none">{box.k}</p>
                      <p className="text-sm text-slate-300 mt-3 leading-snug flex-1">{box.d}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {active === "start" ? (
              <article className="space-y-7">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                    You're one step from the full app.
                  </h2>
                  <p className="text-base text-slate-300 mt-3 leading-relaxed max-w-xl">
                    Sign in to sync trusted contacts, community reports, and your safety log across devices. Guest mode is always available for demos.
                  </p>
                </div>
                <ul className="space-y-2.5 text-slate-300 text-sm">
                  <li className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Email, Google, or phone OTP — pick what's fastest for you.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <Lock className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Voice notes and timeline entries are encrypted on-device.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <Sparkles className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    <span>You can always continue as a guest if you'd rather not sign in.</span>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    type="button"
                    onClick={finish}
                    className="rounded-2xl aurora-bg px-7 py-3.5 text-sm font-bold text-white shadow-[0_18px_36px_-14px_rgba(168,85,247,0.7)] active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2"
                  >
                    Continue to sign in <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={finish}
                    className="rounded-2xl border border-white/[0.12] bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] transition-colors"
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
