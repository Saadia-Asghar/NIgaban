import {
  Activity,
  FileText,
  Keyboard,
  Layers,
  MapPin,
  Mic,
  Phone,
  Shield,
  Smartphone,
  Sparkles,
  Waves,
} from "lucide-react";
import { BRAND_TAGLINE_EN } from "../lib/brand.js";

const FEATURES = [
  {
    icon: Keyboard,
    title: "Silent mode SOS",
    benefit:
      "Volume-down ×3 on device (concept). In the browser demo: press S three times — no screen tap — same emergency countdown as shake.",
  },
  {
    icon: Layers,
    title: "Incident heatmap",
    benefit:
      "Approved community reports with GPS cluster on Google Maps as a HeatmapLayer. Toggle heat vs pins so judges see real density (Supabase-backed when configured).",
  },
  {
    icon: FileText,
    title: "Safety report export",
    benefit:
      "After you log an incident, generate a dated .txt or print-to-PDF pack with time, GPS, AI summary, and relevant law pointers for your records.",
  },
  { icon: Phone, title: "Fake Call", benefit: "Realistic incoming call screen + ringtone. Slip away from awkward moments without confrontation." },
  { icon: Waves, title: "Shake-to-SOS", benefit: "Three firm shakes starts a short countdown — cancel or let it trigger your existing SOS flow." },
  { icon: MapPin, title: "Safe Routes", benefit: "Walking directions from your GPS on the live map, with honest notes about lit, busy streets." },
  { icon: Shield, title: "Trusted Circle", benefit: "Two or three contacts stored with the app — one tap opens SMS with your live map link." },
  { icon: Mic, title: "Evidence Logger", benefit: "Voice Note uses your mic; you download the file. Nothing is uploaded unless you choose." },
  { icon: Activity, title: "Live Map", benefit: "See community reports as pins, tap for AI summaries where available." },
];

const IMPACT = [
  {
    stat: "1 in 3",
    label: "Pakistani women face harassment in public spaces (HRCP-style estimates — demo figure).",
    source: "Human Rights Commission of Pakistan — public reporting",
  },
  {
    stat: "93%",
    label: "of harassment cases go unreported — NIgaban lowers the friction to document and reach help.",
    source: "Demo narrative aligned with regional advocacy literature",
  },
  {
    stat: "18 min vs 1 tap",
    label: "Average police response varies by city — your SOS and circle alert fire in one tap.",
    source: "Comparative demo stat for judges; not a live SLA",
  },
];

export default function MarketingLanding({ onTryBrowser, onBypass, installPromptEvent, onInstall }) {
  return (
    <div className="w-full bg-[#07080f] text-slate-100">
      <section className="relative overflow-hidden px-5 pt-14 pb-16 max-w-xl mx-auto">
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] hero-grid" />
        <div className="relative z-10 text-center space-y-5">
          <p className="text-2xl font-bold text-white leading-tight" dir="rtl">
            نگہبان
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">NIgaban</h1>
          <p className="text-sm text-violet-100/95 font-semibold leading-relaxed max-w-md mx-auto px-1">{BRAND_TAGLINE_EN}</p>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Fake call, silent S-SOS demo, heatmaps, Hifazat legal guide, trusted SMS — built for hackathon demos and real stress.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {installPromptEvent ? (
              <button
                type="button"
                onClick={onInstall}
                className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/40 active:scale-[0.99] transition-transform"
              >
                Install now
              </button>
            ) : (
              <p className="text-xs text-slate-500 rounded-2xl border border-white/10 px-4 py-3 bg-white/5">
                On Android: use browser menu → Install app. On iOS: Share → Add to Home Screen.
              </p>
            )}
            <button
              type="button"
              onClick={onTryBrowser}
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Try in browser
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 border-t border-white/5 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-white text-center mb-2">Impact (demo figures)</h2>
        <p className="text-[10px] text-slate-500 text-center mb-8 max-w-md mx-auto">
          Hardcoded for pitch clarity — swap with your verified citations for production.
        </p>
        <div className="space-y-4">
          {IMPACT.map((row) => (
            <div key={row.stat} className="rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-950/40 to-purple-950/30 px-4 py-4 text-left">
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-violet-300">{row.stat}</p>
              <p className="text-sm text-slate-200 mt-2 leading-snug">{row.label}</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Source note: {row.source}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-14 border-t border-white/5 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-white text-center mb-8">How it works</h2>
        <div className="space-y-6">
          {[
            { step: "1", title: "Report or signal", desc: "Community report, SOS, silent shortcut, or quick SMS to your circle.", icon: Sparkles },
            { step: "2", title: "AI analyzes", desc: "Groq-powered tips on incidents; maps, heatmaps, and legal tools when you need depth.", icon: Activity },
            { step: "3", title: "Stay safe", desc: "Evidence exports, routes, and helplines — you stay in control of what you share.", icon: Shield },
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

      <section className="px-5 py-14 border-t border-white/5 bg-white/[0.02]">
        <h2 className="text-lg font-bold text-white text-center mb-8">Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-[#0c0d14] p-4 space-y-2">
              <f.icon className="w-6 h-6 text-pink-400" />
              <p className="text-sm font-bold text-white">{f.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{f.benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-14 border-t border-white/5 max-w-xl mx-auto">
        <h2 className="text-lg font-bold text-white text-center mb-8">Why NIgaban</h2>
        <div className="grid gap-4">
          {[
            { t: "Works offline", d: "PWA caches the shell — open the app even with spotty data." },
            { t: "No signup to try", d: "Guest bypass for demos; sign in when you want synced contacts." },
            { t: "Leave no trace option", d: "Voice notes stay on-device; you choose when GPS leaves your phone." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-sm font-bold text-emerald-200">{x.t}</p>
              <p className="text-xs text-slate-400 mt-1">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 border-t border-white/5 max-w-xl mx-auto text-center space-y-4 pb-8">
        <Smartphone className="w-10 h-10 text-purple-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Add to home screen</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Android:</span> Chrome menu → Install app or Add to Home screen.
          <br />
          <span className="font-semibold text-slate-300">iOS Safari:</span> Share → Add to Home Screen → Add.
        </p>
        {installPromptEvent ? (
          <button
            type="button"
            onClick={onInstall}
            className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 text-sm font-black text-white shadow-xl"
          >
            Add NIgaban (Android / Chrome)
          </button>
        ) : null}
        <button type="button" onClick={onBypass} className="block w-full text-xs text-slate-500 underline underline-offset-2 pt-4">
          Continue as guest (demo)
        </button>
      </section>
    </div>
  );
}
