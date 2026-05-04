import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Ear,
  FileText,
  Image as ImageIcon,
  Keyboard,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Scale,
  Shield,
  Smartphone,
  Sparkles,
  Volume2,
  Waves,
} from "lucide-react";
import { NigabanLogo, NigabanWordmark } from "./Brand.jsx";

const HERO_LINES = [
  "Safety that thinks ahead.",
  "AI on your side, in your hand.",
  "Your rights, your route, your record.",
];

const PILLARS = [
  {
    icon: Shield,
    tone: "from-rose-500/15 to-rose-500/5 border-rose-500/25",
    iconBg: "bg-rose-500/15 text-rose-300",
    title: "Reach help in one tap",
    benefit:
      "Silent SOS via shake, triple-press, or button. Live GPS, AI tip, and police dial — all in motion within 3 seconds.",
  },
  {
    icon: Scale,
    tone: "from-violet-500/15 to-violet-500/5 border-violet-500/25",
    iconBg: "bg-violet-500/15 text-violet-300",
    title: "Know your rights, in plain words",
    benefit:
      "Hifazat Guide answers Pakistan-specific safety law in English & Urdu — Anti-Harassment Act 2010, PECA 2016, PPC §354/§509. Offline-ready.",
  },
  {
    icon: Lock,
    tone: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/25",
    iconBg: "bg-emerald-500/15 text-emerald-300",
    title: "Your evidence stays yours",
    benefit:
      "Voice notes, screenshots and timeline entries are encrypted on-device. Nothing uploads unless you choose to share it.",
  },
];

const FEATURES = [
  { icon: Keyboard,      tone: "rose",    title: "Silent SOS",          desc: "Press S three times. Three firm shakes. Volume-down ×3. Your circle gets your live GPS in seconds." },
  { icon: Layers,        tone: "blue",    title: "Incident heatmap",    desc: "Live community reports cluster on a map of your city. See safe vs high-risk areas before you travel." },
  { icon: FileText,      tone: "amber",   title: "Evidence export",     desc: "Generate a dated incident report — GPS, AI summary, and Pakistan law citations — ready for police use." },
  { icon: Phone,         tone: "emerald", title: "Fake call",           desc: "Realistic incoming call screen. Slip away from threatening situations without confrontation." },
  { icon: Waves,         tone: "rose",    title: "Shake-to-SOS",        desc: "A short countdown gives you a chance to cancel. If you don't, full SOS fires automatically." },
  { icon: MapPin,        tone: "emerald", title: "Safe transit",        desc: "Share live trip with trusted contacts. Auto-alerts on route deviation or missed check-ins." },
  { icon: ImageIcon,     tone: "violet",  title: "Deepfake detector",   desc: "Verify suspicious images with Gemini Vision. Find tampering before believing the threat." },
  { icon: Volume2,       tone: "blue",    title: "Voice clone scan",    desc: "Analyze suspicious audio for synthetic patterns and impersonation cues." },
  { icon: Ear,           tone: "rose",    title: "Distress listener",   desc: "Auto-SOS when scream patterns or trigger words are detected nearby. Off by default." },
  { icon: MessageCircle, tone: "violet",  title: "DM harassment scan",  desc: "Paste a screenshot. Get a calm, structured read with PECA 2016 citations." },
  { icon: Mic,           tone: "amber",   title: "Voice journal",       desc: "Discreet recording for your own paper trail. Stays on this device until you download." },
  { icon: Activity,      tone: "blue",    title: "Community pulse",     desc: "Anonymous reports from women near you. Tap any pin for an AI-written safety summary." },
];

const STATS = [
  { stat: "1 in 3",   label: "Pakistani women report harassment in public spaces",    source: "HRCP Public Reporting" },
  { stat: "93%",      label: "of incidents go unreported — NIgaban lowers the barrier", source: "Regional advocacy research" },
  { stat: "1 tap",    label: "to send live GPS to your trusted circle",                source: "vs. ~18 min average urban response" },
];

const TRUST = [
  { t: "Works offline",        d: "PWA caches the app shell — opens even on spotty data." },
  { t: "No signup to explore", d: "Try the full demo as a guest. Sign in only when you want sync." },
  { t: "Leave no trace",       d: "Voice notes never auto-upload. You decide what leaves the device." },
  { t: "Encrypted by default", d: "Every timeline entry hashed & sealed before storage." },
];

const TONE = {
  rose:    "bg-rose-500/12    text-rose-300    border-rose-500/25",
  amber:   "bg-amber-500/12   text-amber-300   border-amber-500/25",
  emerald: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  blue:    "bg-blue-500/12    text-blue-300    border-blue-500/25",
  violet:  "bg-violet-500/14  text-violet-300  border-violet-500/25",
};

export default function MarketingLanding({ onTryBrowser, onBypass, installPromptEvent, onInstall }) {
  return (
    <div className="w-full bg-[#07091a] text-slate-100 overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative px-5 pt-16 pb-20 max-w-3xl mx-auto">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] hero-grid opacity-30" />
        <div className="pointer-events-none absolute -top-10 -right-10 w-72 h-72 rounded-full aurora-bg-soft blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-pink-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <NigabanLogo size={64} className="logo-glow" />

          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] backdrop-blur-md px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-violet-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            Pakistan · AI safety companion · Built for women
          </div>

          <h1 className="text-[42px] sm:text-6xl font-black text-white leading-[0.95] tracking-tight">
            Safety that <br />
            <span className="aurora-text aurora-drift bg-clip-text">thinks ahead.</span>
          </h1>

          <p className="text-base text-slate-300 leading-relaxed max-w-xl">
            NI<span className="aurora-text font-bold">gaban</span> turns your phone into a guardian. Live trip share,
            encrypted SOS, AI-aware legal guidance — and a fake call ready when you need to leave the room.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
            <button
              type="button"
              onClick={installPromptEvent ? onInstall : onTryBrowser}
              className="flex-1 rounded-2xl aurora-bg aurora-drift bg-clip-padding px-5 py-3.5 text-sm font-bold text-white shadow-[0_18px_36px_-14px_rgba(168,85,247,0.7),0_1px_0_rgba(255,255,255,0.18)_inset] active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2"
            >
              {installPromptEvent ? <Smartphone className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              {installPromptEvent ? "Install on this device" : "Open the app"}
            </button>
            <button
              type="button"
              onClick={onTryBrowser}
              className="flex-1 rounded-2xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-sm px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
            >
              Try in browser
            </button>
          </div>

          <ul className="grid grid-cols-3 gap-3 text-[11px] text-slate-500 max-w-md w-full pt-2">
            {[
              { Icon: Lock,    label: "Encrypted by default" },
              { Icon: Shield,  label: "Works offline" },
              { Icon: CheckCircle2, label: "Free · no signup" },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-violet-300" />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ── Pillars ──────────────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <p className="section-eyebrow">Three pillars</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Calm response, encrypted by default.</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Built around three things every woman should be able to count on, instantly.
          </p>
        </div>

        <div className="grid gap-4">
          {PILLARS.map(({ icon: Icon, title, benefit, tone, iconBg }) => (
            <div
              key={title}
              className={`rounded-2xl border bg-gradient-to-br ${tone} p-5 flex gap-4 items-start backdrop-blur-md`}
            >
              <div className={`w-12 h-12 rounded-2xl ${iconBg} border border-white/10 flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-bold text-white">{title}</p>
                <p className="text-[13px] text-slate-300/90 mt-1.5 leading-relaxed">{benefit}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <p className="section-eyebrow">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Three steps. Set up once, ready always.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Set up your circle", desc: "Add 2–3 trusted contacts. Set a 4-digit PIN to cancel a misfired SOS.",       icon: Shield  },
            { step: "02", title: "Know your tools",    desc: "Open Hifazat for legal questions. Run AI Shield on suspicious media or DMs.", icon: Sparkles },
            { step: "03", title: "Act fast if needed", desc: "Tap SOS or shake your phone. Your circle gets live GPS in seconds.",           icon: Activity },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="surface-card surface-card-interactive p-5 relative overflow-hidden group">
              <div className="absolute -top-4 -right-2 text-[80px] font-black text-white/[0.04] group-hover:text-white/[0.07] pointer-events-none transition-colors">
                {step}
              </div>
              <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-violet-300" />
              </div>
              <p className="text-[10px] font-black text-violet-300 uppercase tracking-[0.2em]">Step {step}</p>
              <p className="text-base font-bold text-white mt-1">{title}</p>
              <p className="text-[12px] text-slate-400 mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <p className="section-eyebrow">Why it matters</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">The numbers behind the need.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.stat} className="surface-elev p-5 text-center">
              <p className="text-4xl font-black aurora-text leading-none">{s.stat}</p>
              <p className="text-[13px] text-slate-200 mt-3 leading-snug">{s.label}</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.15em]">{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ── Feature grid ─────────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <p className="section-eyebrow">Everything in one app</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Twelve tools. One calm flow.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, tone, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:bg-white/[0.05] hover:border-white/[0.14] transition-all"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${TONE[tone]} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[14px] font-bold text-white">{title}</p>
              <p className="text-[12px] text-slate-400 mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ── Legal highlight ──────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <div className="surface-card relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 rounded-full aurora-bg-soft blur-3xl opacity-80" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl aurora-bg flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(168,85,247,0.55)]">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="section-eyebrow">Legal-aware</p>
                <p className="text-base font-bold text-white">Built around Pakistan law</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-300 leading-relaxed">
              Hifazat Guide and the Legal AI Desk reference the <strong className="text-white">Anti-Harassment Act 2010</strong>,
              <strong className="text-white"> PECA 2016</strong>, and <strong className="text-white">PPC §354 / §509</strong>.
              You get next-step orientation in plain language — not a substitute for a lawyer, but enough to act with confidence.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-5">
              {["Anti-Harassment 2010", "PECA 2016", "PPC §354 / §509"].map((law) => (
                <div key={law} className="rounded-xl border border-violet-500/20 bg-violet-500/[0.07] px-2.5 py-2 text-center">
                  <p className="text-[10px] font-bold text-violet-200 leading-snug">{law}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider max-w-4xl mx-auto" />

      {/* ── Trust ────────────────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <p className="section-eyebrow">Privacy-first</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Designed to leave no trace.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TRUST.map((t) => (
            <div key={t.t} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-100">{t.t}</p>
                <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">{t.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Install CTA ──────────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <div className="surface-elev relative overflow-hidden text-center px-6 py-10">
          <div className="pointer-events-none absolute inset-0 hero-grid opacity-25" />
          <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full aurora-bg-soft blur-3xl opacity-70" />
          <div className="relative">
            <NigabanLogo size={56} className="logo-glow mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white tracking-tight">Add NI<span className="aurora-text">gaban</span> to your home screen</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto mt-2">
              Works offline after the first load. No app store. Free forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto mt-5">
              {installPromptEvent ? (
                <button
                  type="button"
                  onClick={onInstall}
                  className="flex-1 rounded-2xl aurora-bg px-5 py-3.5 text-sm font-bold text-white shadow-[0_18px_36px_-14px_rgba(168,85,247,0.7)] active:scale-[0.99] transition-transform"
                >
                  Install now
                </button>
              ) : null}
              <button
                type="button"
                onClick={onTryBrowser}
                className="flex-1 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
              >
                Open the app
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 max-w-md mx-auto text-left">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Android</p>
                <p className="text-[11px] text-slate-300 mt-1">Chrome menu → <em>Install app</em></p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">iOS</p>
                <p className="text-[11px] text-slate-300 mt-1">Share → <em>Add to Home Screen</em></p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBypass}
              className="block mx-auto mt-6 text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-4 transition-colors"
            >
              Continue as guest — no account needed
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="px-5 py-10 border-t border-white/[0.05] max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <NigabanWordmark size={28} />
          <p className="text-[10px] text-slate-600 leading-relaxed max-w-md">
            NIgaban is a safety companion — not a substitute for emergency services.<br />
            In immediate danger, always dial <span className="text-slate-400 font-semibold">15</span> (Police) or <span className="text-slate-400 font-semibold">1099</span> (Madadgaar).
          </p>
        </div>
      </footer>
    </div>
  );
}
