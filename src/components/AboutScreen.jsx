import { useState } from "react";
import { ChevronDown, ExternalLink, Heart, Lock, Shield, Sparkles } from "lucide-react";
import { NigabanLogo } from "./Brand.jsx";

const VERSION = "1.0.0";
const BUILD_DATE = "May 2026";

const FAQS = [
  {
    q: "What data leaves my device?",
    a: "Only what you explicitly send. Trusted-circle SMS messages go through your phone's native SMS app — NIgaban never sees them. Community reports you submit go to our backend. Voice notes, photo captures, and timeline entries stay on your device unless you choose to upload or share.",
  },
  {
    q: "Does the app work offline?",
    a: "Yes. The app shell is cached as a Progressive Web App. Quick Capture, Safety Scripts, Ride Safety, Know Your Rights, Verified Help, the Distress Listener, the fake-call overlay, the siren, and SOS-via-SMS all work fully offline. AI features (Hifazat, Legal Desk) need internet but have static fallbacks for common topics.",
  },
  {
    q: "Is the AI authoritative?",
    a: "No. AI features (Hifazat Legal Guide, Legal AI Desk) are clearly labelled as 'orientation, not legal advice.' For decisions affecting your case, consult a qualified lawyer or one of the verified NGOs in the Verified Help directory.",
  },
  {
    q: "How do I trigger SOS?",
    a: "Three ways: (1) tap the red SOS button on the bottom navigation, (2) shake your phone three times, (3) press the S key three times when the app is focused. All three start a 3-second cancel countdown before the SOS fires.",
  },
  {
    q: "What happens during SOS?",
    a: "Your live GPS is logged with the backend, your trusted circle gets an SMS with a Google Maps link to your location, the police number (15 in Pakistan) is displayed, the siren can be activated, and an AI safety tip is shown. You stop SOS by entering your 4-digit cancel PIN (default 1234 — change it in Profile → Settings).",
  },
  {
    q: "Can I be tracked?",
    a: "Only when you opt in. Live location is shared during an active Safe Transit trip or after an SOS. There is no continuous tracking. Browser permission is required for any GPS use.",
  },
  {
    q: "What if I'm not in Pakistan?",
    a: "Most safety tools (Quick Capture, Safety Scripts, Ride Safety, Distress Listener, fake call, siren, SOS-via-SMS) work anywhere. Legal content and government helplines are Pakistan-specific. The 24/7 emergency hotlines (15 / 1099 / 1991 / 1122) are Pakistan numbers — replace them with your local equivalents.",
  },
];

const CREDITS = [
  { name: "Lucide", role: "Icon set", url: "https://lucide.dev" },
  { name: "Tailwind CSS", role: "Utility CSS", url: "https://tailwindcss.com" },
  { name: "Vite", role: "Build tooling", url: "https://vitejs.dev" },
  { name: "Inter", role: "Typography", url: "https://rsms.me/inter/" },
  { name: "Clerk", role: "Auth (optional)", url: "https://clerk.com" },
  { name: "Supabase", role: "Auth fallback", url: "https://supabase.com" },
];

function Faq({ q, a, open, onToggle }) {
  return (
    <div className="surface-strong overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-start gap-3 text-left"
      >
        <Sparkles className="w-3.5 h-3.5 text-violet-300 shrink-0 mt-1" />
        <p className="flex-1 text-sm font-bold text-white leading-tight">{q}</p>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="px-4 pb-4 pl-10 -mt-1 animate-in slide-up duration-200">
          <p className="text-[12.5px] text-slate-300 leading-relaxed">{a}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function AboutScreen({ onBack }) {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-5 animate-in fade-in">
      {/* Hero */}
      <div className="surface-elev relative overflow-hidden p-6 text-center">
        <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full aurora-bg-soft blur-3xl opacity-80" />
        <div className="relative">
          <NigabanLogo size={56} className="logo-glow mx-auto mb-3" />
          <p className="section-eyebrow">About</p>
          <h2 className="text-2xl font-black text-white tracking-tight mt-1">
            NI<span className="aurora-text">gaban</span>
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            AI safety in your hand. Live trip share, encrypted SOS, and Pakistan-aware legal guidance — built for women.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
            <span className="font-mono">v{VERSION}</span>
            <span>·</span>
            <span>{BUILD_DATE}</span>
          </div>
        </div>
      </div>

      {/* Privacy summary */}
      <div className="surface-strong p-4 space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Lock className="w-4 h-4 text-emerald-300" />
          </div>
          <p className="text-sm font-bold text-white">Your data, your device</p>
        </div>
        <ul className="space-y-1.5 text-[12px] text-slate-300 leading-relaxed pl-1">
          <li>· Voice notes & captures stay in your browser memory until you download.</li>
          <li>· Trusted-circle SMS uses your phone's native messages app — we never see it.</li>
          <li>· Live GPS is shared only during active Safe Transit or SOS — never continuously.</li>
          <li>· Community reports are anonymous unless you opt in by name.</li>
        </ul>
      </div>

      {/* FAQ */}
      <div>
        <p className="section-eyebrow mb-2.5">Frequently asked</p>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <Faq key={f.q} q={f.q} a={f.a} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
          ))}
        </div>
      </div>

      {/* Credits */}
      <div>
        <p className="section-eyebrow mb-2.5">Built with</p>
        <div className="surface-strong p-4">
          <ul className="grid grid-cols-2 gap-2">
            {CREDITS.map((c) => (
              <li key={c.name}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{c.role}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-violet-300 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="surface-strong p-4 space-y-2">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-amber-300" />
          <p className="text-sm font-bold text-white">Important</p>
        </div>
        <p className="text-[12px] text-slate-300 leading-relaxed">
          NIgaban is a safety companion, not a substitute for emergency services or legal counsel. In immediate danger, dial <strong className="text-slate-100">15</strong> (Police) or <strong className="text-slate-100">1099</strong> (Madadgaar). For legal decisions, consult a qualified lawyer or one of the organisations in <strong className="text-slate-100">Verified Help</strong>.
        </p>
      </div>

      {/* Made with care */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-slate-500 inline-flex items-center gap-1.5">
          Made with <Heart className="w-3 h-3 text-rose-400" fill="currentColor" /> for women in Pakistan.
        </p>
      </div>

      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="btn-ghost w-full"
        >
          Back to profile
        </button>
      ) : null}
    </div>
  );
}
