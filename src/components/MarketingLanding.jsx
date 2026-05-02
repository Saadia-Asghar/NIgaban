import {
  Activity,
  MapPin,
  Mic,
  Phone,
  Shield,
  Smartphone,
  Sparkles,
  Waves,
} from "lucide-react";

const FEATURES = [
  { icon: Phone, title: "Fake Call", benefit: "Realistic incoming call screen + ringtone. Slip away from awkward moments without confrontation." },
  { icon: Waves, title: "Shake-to-SOS", benefit: "Three firm shakes starts a short countdown — cancel or let it trigger your existing SOS flow." },
  { icon: MapPin, title: "Safe Routes", benefit: "Walking directions from your GPS on the live map, with honest notes about lit, busy streets." },
  { icon: Shield, title: "Trusted Circle", benefit: "Two or three contacts stored with the app — one tap opens SMS with your live map link." },
  { icon: Mic, title: "Evidence Logger", benefit: "Voice Note uses your mic; you download the file. Nothing is uploaded unless you choose." },
  { icon: Activity, title: "Live Map", benefit: "See community reports as pins, tap for AI summaries where available." },
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
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.1]">
            Your guardian in your pocket
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            NIgaban helps you leave, log, and reach help — fake call, shake SOS, maps, trusted SMS, and discreet voice notes.
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
        <h2 className="text-lg font-bold text-white text-center mb-8">How it works</h2>
        <div className="space-y-6">
          {[
            { step: "1", title: "Report or signal", desc: "Community report, SOS, or quick SMS to your circle.", icon: Sparkles },
            { step: "2", title: "AI analyzes", desc: "Groq-powered tips on incidents; maps and legal tools when you need depth.", icon: Activity },
            { step: "3", title: "Stay safe", desc: "Evidence, routes, and helplines — you stay in control of what you share.", icon: Shield },
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
            { t: "Your data stays private", d: "Voice notes stay on-device; SOS GPS goes only where you send it." },
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
