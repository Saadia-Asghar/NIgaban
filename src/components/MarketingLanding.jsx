import {
  Activity,
  FileText,
  Keyboard,
  Layers,
  MapPin,
  Mic,
  Phone,
  Scale,
  Shield,
  Smartphone,
  Sparkles,
  Waves,
} from "lucide-react";
import { BRAND_TAGLINE_EN } from "../lib/brand.js";

const FEATURES = [
  {
    icon: Keyboard,
    title: "Silent SOS",
    benefit: "Press S three times in the browser (or volume-down ×3 on device) — a 3-second countdown triggers your emergency contacts. No screen tap needed.",
  },
  {
    icon: Layers,
    title: "Incident Heatmap",
    benefit: "Community reports cluster on Google Maps as a live heatmap. See safe vs. high-risk areas in your city before you travel.",
  },
  {
    icon: FileText,
    title: "Safety Report Export",
    benefit: "Generate a dated incident report with GPS, AI summary, and relevant Pakistan law citations — ready for police or legal use.",
  },
  {
    icon: Phone,
    title: "Fake Call",
    benefit: "Realistic incoming call screen. Slip away from threatening situations without confrontation.",
  },
  {
    icon: Waves,
    title: "Shake-to-SOS",
    benefit: "Three firm shakes starts a short countdown. Cancel if accidental, or let it trigger your full SOS flow.",
  },
  {
    icon: MapPin,
    title: "Safe Routes",
    benefit: "Walking directions from your GPS, with notes on well-lit, busy streets. Route overlay on the live city map.",
  },
  {
    icon: Shield,
    title: "Trusted Circle",
    benefit: "Store up to three emergency contacts. One tap sends an SMS with your live Google Maps location link.",
  },
  {
    icon: Mic,
    title: "Evidence Logger",
    benefit: "Record voice notes on-device. Nothing uploads unless you choose — your evidence stays private.",
  },
  {
    icon: Activity,
    title: "Community Feed",
    benefit: "See live reports from women in your city. Tap pins for AI-generated safety summaries.",
  },
];

const STATS = [
  {
    stat: "1 in 3",
    label: "Pakistani women face harassment in public spaces.",
    source: "HRCP Public Reporting",
  },
  {
    stat: "93%",
    label: "of harassment incidents go unreported. NIgaban lowers the barrier to document and seek help.",
    source: "Regional advocacy research",
  },
  {
    stat: "1 tap",
    label: "to send your live location to trusted contacts — faster than waiting 18+ minutes for police response.",
    source: "Average urban response time",
  },
];

export default function MarketingLanding({ onTryBrowser, onBypass, installPromptEvent, onInstall }) {
  return (
    <div className="w-full bg-[#07080f] text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-14 pb-16 max-w-xl mx-auto">
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] hero-grid" />
        <div className="relative z-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300">
            <Shield className="w-3.5 h-3.5" />
            Pakistan's safety companion for women
          </div>
          <p className="text-3xl font-black text-white leading-tight" dir="rtl">نگہبان</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug -mt-2">NIgaban</h1>
          <p className="text-sm text-violet-100/90 font-medium leading-relaxed max-w-md mx-auto px-1">{BRAND_TAGLINE_EN}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {installPromptEvent ? (
              <button
                type="button"
                onClick={onInstall}
                className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/40 active:scale-[0.99] transition-transform"
              >
                Install on Android
              </button>
            ) : null}
            <button
              type="button"
              onClick={onTryBrowser}
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Get started — free
            </button>
          </div>
          <p className="text-xs text-slate-500">
            No app store required · Works offline · Private by design
          </p>
        </div>
      </section>

      {/* Impact stats */}
      <section className="px-5 py-14 border-t border-white/5 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-white text-center mb-8">Why NIgaban matters</h2>
        <div className="space-y-4">
          {STATS.map((row) => (
            <div key={row.stat} className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/40 to-purple-950/30 px-5 py-4 text-left">
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-300">{row.stat}</p>
              <p className="text-sm text-slate-200 mt-2 leading-snug">{row.label}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{row.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-14 border-t border-white/5 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-white text-center mb-8">How it works</h2>
        <div className="space-y-6">
          {[
            { step: "1", title: "Report or signal", desc: "Community report, SOS, silent keyboard shortcut, or quick SMS to your circle.", icon: Sparkles },
            { step: "2", title: "AI analyzes", desc: "Groq-powered legal tips and risk summaries. DM and media checks detect harassment patterns.", icon: Activity },
            { step: "3", title: "Stay safe", desc: "Evidence exports, safe routes, and direct helpline access — you control what gets shared.", icon: Shield },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/10">
                <s.icon className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Step {s.step}</p>
                <p className="text-base font-semibold text-white mt-0.5">{s.title}</p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-5 py-14 border-t border-white/5 bg-white/[0.015]">
        <h2 className="text-lg font-bold text-white text-center mb-8">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-[#0c0d14] p-4 space-y-2 hover:border-purple-500/30 transition-colors">
              <f.icon className="w-6 h-6 text-pink-400" />
              <p className="text-sm font-bold text-white">{f.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{f.benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Legal tools highlight */}
      <section className="px-5 py-14 border-t border-white/5 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-white text-center mb-6">Built-in legal support</h2>
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-purple-950/30 p-5 space-y-3">
          <Scale className="w-7 h-7 text-indigo-300" />
          <p className="text-sm font-semibold text-white">Pakistan-specific legal guidance</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hifazat AI knows the Anti-Harassment Act 2010, PECA 2016, and PPC §354/§509.
            Get instant guidance on what you can do <em>right now</em> — in English or Urdu.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {["Anti-Harassment Act 2010", "PECA 2016", "PPC §354 / §509"].map((law) => (
              <div key={law} className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-2 py-2 text-center">
                <p className="text-[10px] font-semibold text-indigo-300 leading-snug">{law}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NIgaban */}
      <section className="px-5 py-14 border-t border-white/5 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-white text-center mb-8">Privacy-first design</h2>
        <div className="grid gap-4">
          {[
            { t: "Works offline", d: "PWA caches the app shell — open it even with spotty data or no internet." },
            { t: "No signup to explore", d: "Try the full demo as a guest. Sign in only when you want synced contacts and evidence storage." },
            { t: "Leave no trace", d: "Voice notes stay on your device. You choose when GPS or any data leaves your phone." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-sm font-bold text-emerald-200">{x.t}</p>
              <p className="text-xs text-slate-400 mt-1">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install CTA */}
      <section className="px-5 py-16 border-t border-white/5 max-w-xl mx-auto text-center space-y-4 pb-8">
        <Smartphone className="w-10 h-10 text-purple-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Add to home screen</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Android:</span> Chrome menu → Install app or Add to Home Screen.
          <br />
          <span className="font-semibold text-slate-300">iOS Safari:</span> Share → Add to Home Screen → Add.
        </p>
        {installPromptEvent ? (
          <button
            type="button"
            onClick={onInstall}
            className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-sm font-black text-white shadow-xl"
          >
            Install NIgaban (Android / Chrome)
          </button>
        ) : null}
        <button type="button" onClick={onBypass} className="block w-full text-xs text-slate-500 underline underline-offset-2 pt-4">
          Continue as guest
        </button>
      </section>
    </div>
  );
}
