import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser, UserButton, useClerk, useAuth } from "@clerk/react";
import { supabase, supabaseEnabled } from "./lib/authClients";
import { api, configureApiAuth } from "./lib/api.js";
import AuthHub from "./components/AuthHub.jsx";
import SafeZonesMap from "./components/SafeZonesMap.jsx";
import SafetyMapScreen from "./components/SafetyMapScreen.jsx";
import MarketingLanding from "./components/MarketingLanding.jsx";
import FakeCallOverlay from "./components/FakeCallOverlay.jsx";
import VoiceNoteRecorder from "./components/VoiceNoteRecorder.jsx";
import FirstVisitWelcome from "./components/FirstVisitWelcome.jsx";
import HifazatGuide from "./components/HifazatGuide.jsx";
import { BRAND_TAGLINE_EN, BRAND_TAGLINE_UR, BRAND_TAGLINE_SHORT } from "./lib/brand.js";
import { buildIncidentReportText, downloadIncidentReport, printIncidentReportAsPdf } from "./lib/incidentReport.js";
import { useToast } from "./lib/toastContext.jsx";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Ear,
  EyeOff,
  FileText,
  Heart,
  Home,
  Image as ImageIcon,
  Languages,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Scale,
  Send,
  Shield,
  Volume2,
  X,
  Smartphone,
  UserCircle,
} from "lucide-react";

const LEGAL_SYSTEM_PROMPT = `You are the Legal Aid Assistant for Nigehbaan...`;
const DM_SCAN_SYSTEM_PROMPT = `Return only JSON with classification, severity, peca_section, peca_explanation, evidence_value, recommended_action, summary.`;

function Header({ lang, setLang, title, showBack, onBack, userProfile, onSignOut, isClerk, stealthMode }) {
  const displayTitle = stealthMode ? "Personal Notes" : title || "NIgaban";
  const displaySubtitle = stealthMode ? "Drafts · your notes" : lang === "ur" ? BRAND_TAGLINE_UR : BRAND_TAGLINE_EN;
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button onClick={onBack} className="rounded-full p-1.5 hover:bg-white/10 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        ) : (
          <div className={`w-9 h-9 rounded-full ${stealthMode ? "bg-slate-700" : "bg-violet-800"} text-white flex items-center justify-center font-bold logo-glow`}>
            {stealthMode ? <FileText className="w-5 h-5" /> : "ن"}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-white">{displayTitle}</h1>
          {!title ? (
            <p className="text-[8px] sm:text-[9px] text-slate-400 leading-snug max-w-[14rem] sm:max-w-2xl">{displaySubtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setLang((v) => (v === "en" ? "ur" : "en"))} className="text-xs font-semibold px-2.5 py-1 rounded-full glass text-purple-300 flex items-center gap-1 hover:bg-white/10 transition-colors">
          <Languages className="w-3.5 h-3.5" />{lang === "en" ? "EN" : "اردو"}
        </button>
        {isClerk ? (
          <UserButton afterSignOutUrl="/" />
        ) : userProfile ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-300 hidden sm:inline">{userProfile}</span>
            <button onClick={onSignOut} className="rounded-full p-1.5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Primary app sections — scrollable on small screens, complements bottom nav. */
function ShieldSubNav({ active, onSelect }) {
  const tools = [
    { id: null, label: "Overview" },
    { id: "dm", label: "DM Scan" },
    { id: "deepfake", label: "Deepfake" },
    { id: "voice", label: "Voice" },
    { id: "distress", label: "Distress" },
  ];
  return (
    <div className="border-t border-white/5 bg-black/20">
      <nav className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-thin" aria-label="AI Shield tools">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => onSelect(t.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors ${
              active === t.id
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function BottomNav({ active, onNavigate, onSOS }) {
  const btn = (id, Icon, label) => {
    const on = active === id || (id === "shield" && active === "shield");
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 group"
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${on ? "bg-white/12 shadow-md shadow-purple-900/30" : "group-hover:bg-white/5"}`}>
          <Icon className={`w-[22px] h-[22px] transition-colors ${on ? "text-pink-400" : "text-slate-500 group-hover:text-slate-300"}`} />
        </div>
        <span className={`text-[9px] font-bold tracking-wide transition-colors ${on ? "text-pink-300" : "text-slate-600 group-hover:text-slate-400"}`}>{label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0b0c18]/96 backdrop-blur-2xl border-t border-white/[0.07] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md mx-auto flex items-end justify-around pt-2">
        {btn("home", Home, "Home")}
        {btn("community", Activity, "Community")}

        {/* SOS — elevated centre pill */}
        <div className="flex flex-col items-center -mt-6">
          <button
            type="button"
            onClick={onSOS}
            aria-label="Emergency SOS"
            className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-red-600 border-[3px] border-[#0b0c18] shadow-[0_0_28px_rgba(239,68,68,0.45)] flex flex-col items-center justify-center text-white active:scale-95 transition-transform sos-pulse"
          >
            <AlertTriangle className="w-6 h-6" />
          </button>
          <span className="text-[9px] font-black text-rose-400 mt-1 tracking-widest uppercase">SOS</span>
        </div>

        {btn("shield", Shield, "Shield")}
        {btn("more", UserCircle, "Profile")}
      </div>
    </nav>
  );
}

function WelcomeAuthScreen({ onBypass, installPromptEvent, onInstall }) {
  const [showMarketing, setShowMarketing] = useState(false);
  const [step, setStep] = useState(0);

  const slides = [
    { title: "Your safety, your control", description: "Silent SOS, trusted circle alerts, and legal guidance — all in one app built for Pakistan.", icon: Shield, accent: "from-rose-500/20 to-purple-600/20 border-rose-500/20 text-rose-200" },
    { title: "Know your rights instantly", description: "Hifazat AI gives you Pakistan-specific legal guidance under PECA 2016 and Anti-Harassment Act 2010.", icon: Scale, accent: "from-indigo-500/20 to-blue-600/20 border-indigo-500/20 text-indigo-200" },
    { title: "Community-powered alerts", description: "See real incident hotspots in Lahore, Karachi, Islamabad, and Peshawar reported by women like you.", icon: Activity, accent: "from-emerald-500/20 to-teal-600/20 border-emerald-500/20 text-emerald-200" },
  ];

  useEffect(() => {
    const t = setInterval(() => setStep(v => (v + 1) % slides.length), 4200);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    const onScroll = () => {};
    window.addEventListener("nigaban-scroll-auth", onScroll);
    return () => window.removeEventListener("nigaban-scroll-auth", onScroll);
  }, []);

  const slide = slides[step];
  const SlideIcon = slide.icon;

  if (showMarketing) {
    return (
      <div className="min-h-screen bg-[#07080f] w-full animate-in fade-in overflow-y-auto">
        <MarketingLanding
          onTryBrowser={() => setShowMarketing(false)}
          onBypass={onBypass}
          installPromptEvent={installPromptEvent}
          onInstall={onInstall}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#07080f] flex flex-col lg:flex-row animate-in fade-in">
      {/* LEFT PANEL — branding + features (desktop only / top on mobile) */}
      <div className="lg:flex-1 lg:min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0d0b1a] via-[#150f2a] to-[#0a0b12] flex flex-col justify-between px-6 pt-10 pb-8 lg:px-12 lg:pt-16">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 mb-8 lg:mb-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/50 text-white font-black text-lg">ن</div>
          <div>
            <p className="text-white font-black text-lg leading-none">NIgaban</p>
            <p className="text-purple-400/80 text-xs font-medium" dir="rtl">نگہبان</p>
          </div>
        </div>

        {/* Center feature carousel */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-6 lg:py-0">
          <div className={`surface-card p-6 lg:p-8 border transition-all duration-500 ${slide.accent}`} key={step}>
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border mb-4 ${slide.accent}`}>
              <SlideIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight mb-2">{slide.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{slide.description}</p>
            <div className="mt-5 flex items-center gap-2">
              {slides.map((_, i) => (
                <button key={i} type="button" aria-label={`Slide ${i + 1}`} onClick={() => setStep(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-7 bg-gradient-to-r from-pink-500 to-purple-600" : "w-3 bg-white/15"}`} />
              ))}
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {[
              { label: "SOS + GPS log", detail: "One tap, trusted circle alerted instantly" },
              { label: "Evidence vault", detail: "SHA-256 hashed, tamper-proof for legal use" },
              { label: "Offline-capable", detail: "PWA works even on spotty internet" },
            ].map(item => (
              <li key={item.label} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300"><span className="font-semibold text-white">{item.label}</span> — {item.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom links */}
        <div className="relative z-10 hidden lg:flex items-center gap-4 pt-4">
          <button type="button" onClick={() => setShowMarketing(true)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
            Learn more
          </button>
          {installPromptEvent ? (
            <button type="button" onClick={onInstall} className="text-xs text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-2">
              Install app
            </button>
          ) : null}
        </div>
      </div>

      {/* RIGHT PANEL — auth form */}
      <div className="lg:w-[480px] lg:min-h-screen flex flex-col justify-center px-6 py-8 lg:px-12 lg:py-16 bg-[#0a0b12] border-t border-white/5 lg:border-t-0 lg:border-l">
        <div className="w-full max-w-sm mx-auto space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Sign in to NIgaban</h1>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">Your safety companion for Pakistan. Free, private, and always with you.</p>
          </div>

          <AuthHub />

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/8" /></div>
            <div className="relative flex justify-center">
              <span className="bg-[#0a0b12] px-3 text-[10px] text-slate-600 uppercase tracking-widest">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBypass}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 text-sm font-semibold text-slate-300 hover:bg-white/8 hover:text-white active:scale-[0.98] transition-all"
          >
            Continue as guest — explore the demo
          </button>

          <p className="text-center text-[10px] text-slate-600 leading-relaxed">
            By signing in, you agree that this app is a safety tool, not a substitute for emergency services. In danger, always call <span className="text-slate-400 font-semibold">15</span>.
          </p>

          {/* Mobile marketing link */}
          <div className="flex items-center justify-center gap-4 pt-2 lg:hidden">
            <button type="button" onClick={() => setShowMarketing(true)} className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">About NIgaban</button>
            {installPromptEvent ? (
              <button type="button" onClick={onInstall} className="text-xs text-purple-400 hover:text-purple-300 underline underline-offset-2">Install app</button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({
  onNavigate,
  contacts,
  timelineEntries,
  timelineText,
  setTimelineText,
  onAddTimeline,
  timelineSaving,
  communityFeed,
}) {
  const { error: hsError } = useToast();
  const siren = useSiren();
  const [fakeCallOpen, setFakeCallOpen] = useState(false);

  const highCount = communityFeed.filter((i) => i.level === "high").length;
  const watchCount = communityFeed.filter((i) => i.level === "watch").length;
  const statusLevel = highCount > 0 ? "high" : watchCount > 0 ? "watch" : "clear";

  const buildAlertBody = (lat, lng) =>
    `🆘 NIgaban ALERT — I may need help. Location: https://www.google.com/maps?q=${lat},${lng} — Call me or contact police (15) if I don't respond.`;

  const sendAlertSms = () => {
    if (!contacts.length) { hsError("Add trusted contacts in Profile first."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nums = contacts.slice(0, 3).map((c) => String(c.phone || "").replace(/[^\d+]/g, "").trim()).filter(Boolean);
        if (!nums.length) { hsError("Add phone numbers with country code (+92…) in Profile."); return; }
        window.location.href = `sms:${nums.join(",")}?body=${encodeURIComponent(buildAlertBody(pos.coords.latitude, pos.coords.longitude))}`;
      },
      () => hsError("Allow location so your SMS includes live GPS."),
      { enableHighAccuracy: true, timeout: 14000, maximumAge: 30000 },
    );
  };

  const sendWhatsAppSos = () => {
    if (!contacts.length) { hsError("Add trusted contacts in Profile first."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const num = String(contacts[0].phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "").trim();
        if (!num) { hsError("Add a phone number with country code (+92…) in Profile."); return; }
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(buildAlertBody(pos.coords.latitude, pos.coords.longitude))}`, "_blank", "noopener");
      },
      () => hsError("Allow location so your WhatsApp message includes live GPS."),
      { enableHighAccuracy: true, timeout: 14000, maximumAge: 30000 },
    );
  };

  return (
    <div className="pb-24 animate-in fade-in overflow-x-hidden">
      <FakeCallOverlay open={fakeCallOpen} onClose={() => setFakeCallOpen(false)} />
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">

        {/* ── 1. Status strip ── */}
        <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${
          statusLevel === "high" ? "border-rose-500/25 bg-rose-500/[0.07]" :
          statusLevel === "watch" ? "border-amber-500/20 bg-amber-500/[0.06]" :
          "border-emerald-500/20 bg-emerald-500/[0.07]"
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${
            statusLevel === "high" ? "bg-rose-500" : statusLevel === "watch" ? "bg-amber-500" : "bg-emerald-500"
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold ${
              statusLevel === "high" ? "text-rose-300" : statusLevel === "watch" ? "text-amber-300" : "text-emerald-300"
            }`}>
              {statusLevel === "high"
                ? `${highCount} high-alert report${highCount !== 1 ? "s" : ""} nearby`
                : statusLevel === "watch"
                ? `${watchCount} watch-level report${watchCount !== 1 ? "s" : ""} nearby`
                : "No active alerts in your area"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Community feed · Lahore · Live</p>
          </div>
          <button type="button" onClick={() => onNavigate("community")} className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors shrink-0">
            Map →
          </button>
        </div>

        {/* ── 2. Quick action grid ── */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2.5">Quick tools</p>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: "Fake\nCall",   Icon: Phone,         bg: "bg-emerald-500/12", ic: "text-emerald-400", glow: "shadow-emerald-900/20", active: fakeCallOpen,  action: () => setFakeCallOpen(true) },
              { label: siren.active ? "Stop\nSiren" : "Siren", Icon: Volume2, bg: "bg-rose-500/12",    ic: "text-rose-400",    glow: "shadow-rose-900/20",    active: siren.active, action: () => siren.active ? siren.stop() : siren.start() },
              { label: "Hifazat\nGuide",  Icon: MessageCircle, bg: "bg-violet-500/12", ic: "text-violet-400", glow: "shadow-violet-900/20", active: false,         action: () => onNavigate("hifazat") },
              { label: "Safe\nTransit",   Icon: MapPin,        bg: "bg-blue-500/12",   ic: "text-blue-400",   glow: "shadow-blue-900/20",   active: false,         action: () => onNavigate("transit") },
            ].map(({ label, Icon, bg, ic, active: isActive, action }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className={`flex flex-col items-center gap-2.5 py-4 rounded-2xl border transition-all active:scale-[0.93] ${
                  isActive ? `${bg} border-white/15` : "bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.08]"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon className={`w-5 h-5 ${ic}`} />
                </div>
                <span className="text-[10px] font-bold text-white leading-tight text-center whitespace-pre-line px-1">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. Safety circle ── */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <p className="text-sm font-bold text-white">Safety circle</p>
              <span className="text-[9px] font-bold text-slate-600">({contacts.length})</span>
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={sendAlertSms} className="rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1.5 flex items-center gap-1 transition-colors active:scale-95">
                <Phone className="w-3 h-3" /> SMS
              </button>
              <button type="button" onClick={sendWhatsAppSos} className="rounded-xl text-white text-[10px] font-bold px-2.5 py-1.5 active:scale-95 transition-transform" style={{ background: "#25D366" }}>
                WA SOS
              </button>
            </div>
          </div>
          {contacts.length === 0 ? (
            <button type="button" onClick={() => onNavigate("more")} className="w-full px-4 py-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-400">Add trusted contacts</p>
                <p className="text-[10px] text-slate-600 mt-0.5">They'll receive your live GPS on SOS</p>
              </div>
            </button>
          ) : (
            <div className="px-4 py-3 flex items-center gap-2.5 flex-wrap">
              {contacts.slice(0, 6).map((c, i) => (
                <div key={c.id} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white"
                    style={{ background: ["linear-gradient(135deg,#ec4899,#8b5cf6)","linear-gradient(135deg,#8b5cf6,#06b6d4)","linear-gradient(135deg,#f59e0b,#ec4899)","linear-gradient(135deg,#10b981,#3b82f6)","linear-gradient(135deg,#f97316,#ec4899)","linear-gradient(135deg,#a78bfa,#34d399)"][i % 6] }}>
                    {(c.name || "?")[0].toUpperCase()}
                  </div>
                  <p className="text-[9px] text-slate-500 truncate max-w-[2.5rem]">{c.name.split(" ")[0]}</p>
                </div>
              ))}
              <button type="button" onClick={() => onNavigate("more")} className="w-10 h-10 rounded-xl bg-white/5 border border-dashed border-white/15 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          )}
        </div>

        {/* ── 4. City pulse ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">City pulse · Lahore</p>
            <button type="button" onClick={() => onNavigate("community")} className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition-colors">All →</button>
          </div>
          <div className="space-y-2">
            {communityFeed.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-6 text-center">
                <Activity className="w-5 h-5 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 italic">Scanning for local reports…</p>
              </div>
            ) : (
              communityFeed.slice(0, 3).map((item) => (
                <button key={item.id} type="button" onClick={() => onNavigate("community")}
                  className={`w-full text-left rounded-2xl px-3.5 py-3 border flex items-start gap-3 hover:opacity-90 active:scale-[0.99] transition-all ${
                    item.level === "high" ? "border-rose-500/20 bg-rose-500/[0.06]" :
                    item.level === "watch" ? "border-amber-500/15 bg-amber-500/[0.05]" :
                    "border-white/[0.07] bg-white/[0.02]"
                  }`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.level === "high" ? "bg-rose-500" : item.level === "watch" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                  <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    item.level === "high" ? "bg-rose-500/20 text-rose-400" :
                    item.level === "watch" ? "bg-amber-500/20 text-amber-400" :
                    "bg-emerald-500/20 text-emerald-400"
                  }`}>{item.level}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── 5. Safety timeline ── */}
        <div className="pb-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2.5">Safety log</p>
          <div className="flex gap-2 mb-2">
            <input
              value={timelineText}
              onChange={(e) => setTimelineText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onAddTimeline()}
              placeholder="e.g. Boarding bus #42 at Gulberg…"
              className="flex-1 rounded-xl glass-dark px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-1 focus:ring-purple-500/50 outline-none"
            />
            <button type="button" onClick={onAddTimeline} disabled={timelineSaving || !timelineText.trim()}
              className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 active:scale-95 transition-transform flex items-center">
              {timelineSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log"}
            </button>
          </div>
          <div className="space-y-1.5">
            {timelineEntries.slice(0, 2).map((entry) => (
              <div key={entry.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                <p className="text-xs text-slate-200 leading-relaxed">{entry.text}</p>
                <p className="text-[9px] text-slate-600 mt-1 font-mono">{new Date(entry.createdAt).toLocaleTimeString()} · #{entry.id.slice(-4)}</p>
              </div>
            ))}
            {timelineEntries.length === 0 && (
              <p className="text-[10px] text-slate-600 py-1 italic">Your secure journey log starts here.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function CommunityScreen() {
  const { success, error: toastError } = useToast();
  const [city, setCity] = useState("Lahore");
  const [activePanel, setActivePanel] = useState("feed");
  const [showModPanel, setShowModPanel] = useState(false);
  const [items, setItems] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [ngoLoading, setNgoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [form, setForm] = useState({
    category: "Harassment",
    area: "",
    description: "",
    anonymous: true,
  });
  const [chatForm, setChatForm] = useState({
    mode: "chat",
    text: "",
    alias: "",
    anonymous: true,
    area: "",
    category: "Harassment",
  });
  const [submitMessage, setSubmitMessage] = useState("");
  const [chatMessageStatus, setChatMessageStatus] = useState("");
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [lastLiveSync, setLastLiveSync] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [attachReportLocation, setAttachReportLocation] = useState(false);
  const [modKeyInput, setModKeyInput] = useState("");
  const [mapLayerMode, setMapLayerMode] = useState("pins");
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [lastSubmittedReport, setLastSubmittedReport] = useState(null);
  const [lastReportAi, setLastReportAi] = useState("");

  const loadFeed = useMemo(() => async (targetCity) => {
    setLoading(true);
    try {
      const data = await api(`/community/feed?city=${encodeURIComponent(targetCity)}`);
      setItems(data.feed || []);
      setLastLiveSync(new Date().toISOString());
    } catch (e) {
      toastError(e?.message || "Could not load community feed.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const loadHeatGeo = useMemo(() => async (targetCity) => {
    try {
      const data = await api(`/community/incidents-geo?city=${encodeURIComponent(targetCity)}`);
      setHeatmapPoints(data.points || []);
    } catch {
      setHeatmapPoints([]);
    }
  }, []);

  const submitReport = async (e) => {
    e.preventDefault();
    setSubmitMessage("");
    if (!form.area.trim() || !form.description.trim()) {
      setSubmitMessage("Please fill area and description.");
      return;
    }
    setSubmitting(true);
    let lat;
    let lon;
    if (attachReportLocation && typeof navigator !== "undefined" && navigator.geolocation) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
        );
      });
    }
    try {
      const res = await api("/community/report", {
        method: "POST",
        body: JSON.stringify({
          city,
          category: form.category,
          area: form.area.trim(),
          description: form.description.trim(),
          anonymous: form.anonymous,
          ...(typeof lat === "number" && typeof lon === "number" ? { lat, lon } : {}),
        }),
      });
      setForm({ category: "Harassment", area: "", description: "", anonymous: true });
      const tip = res?.aiInsight || res?.report?.aiSummary;
      setSubmitMessage(tip ? `Report saved. AI insight: ${tip.slice(0, 220)}${tip.length > 220 ? "…" : ""}` : "Report submitted. Thank you for helping the community stay informed.");
      success("Safety report saved.");
      if (res?.report) {
        setLastSubmittedReport(res.report);
        setLastReportAi(String(res.aiInsight || res.report.aiSummary || ""));
      }
      await loadFeed(city);
      await loadHeatGeo(city);
    } catch (err) {
      const msg = err?.message || "Unable to submit report right now.";
      setSubmitMessage(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadFeed(city);
    loadHeatGeo(city);
  }, [city]);

  const loadChat = useMemo(() => async (targetCity) => {
    setChatLoading(true);
    try {
      const data = await api(`/community/chat?city=${encodeURIComponent(targetCity)}`);
      setChatMessages(data.messages || []);
      setLastLiveSync(new Date().toISOString());
    } catch {
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  }, []);

  const loadNgos = useMemo(() => async (targetCity) => {
    setNgoLoading(true);
    try {
      const data = await api(`/help/ngos?city=${encodeURIComponent(targetCity)}`);
      setNgos(data.ngos || []);
    } catch {
      setNgos([]);
    } finally {
      setNgoLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChat(city);
    loadNgos(city);
  }, [city, loadChat, loadNgos]);

  const loadPendingReports = useMemo(() => async () => {
    setModerationLoading(true);
    try {
      const data = await api("/moderation/reports?status=pending");
      setPendingReports(data.reports || []);
    } catch {
      setPendingReports([]);
    } finally {
      setModerationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!liveUpdates) return undefined;
    const intervalId = setInterval(() => {
      if (activePanel === "chat") {
        loadChat(city);
      } else {
        loadFeed(city);
      }
      loadPendingReports();
    }, 30_000);
    return () => clearInterval(intervalId);
  }, [city, activePanel, liveUpdates, loadChat, loadFeed, loadPendingReports]);

  useEffect(() => {
    loadPendingReports();
  }, [loadPendingReports]);

  const moderateReport = async (id, action) => {
    try {
      await api(`/moderation/reports/${id}/review`, {
        method: "POST",
        body: JSON.stringify({
          action,
          reason: action === "approve" ? "Approved by moderator panel" : "Rejected by moderator panel",
        }),
      });
      success(action === "approve" ? "Report approved." : "Report updated.");
      await Promise.all([loadPendingReports(), loadFeed(city)]);
    } catch (e) {
      toastError(e?.message || "Moderation failed. Save MODERATOR_BOOTSTRAP_KEY in the box below or sign in as a moderator.");
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    setChatMessageStatus("");
    if (!chatForm.text.trim()) {
      setChatMessageStatus("Please type a message.");
      return;
    }
    if (chatForm.mode === "incident" && !chatForm.area.trim()) {
      setChatMessageStatus("Please add area/landmark for incident reporting.");
      return;
    }
    setSendingChat(true);
    let lat;
    let lon;
    if (chatForm.mode === "incident" && typeof navigator !== "undefined" && navigator.geolocation) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
        );
      });
    }
    try {
      await api("/community/chat/message", {
        method: "POST",
        body: JSON.stringify({
          city,
          mode: chatForm.mode,
          text: chatForm.text.trim(),
          alias: chatForm.alias.trim(),
          anonymous: chatForm.anonymous,
          area: chatForm.area.trim(),
          category: chatForm.category,
          ...(typeof lat === "number" && typeof lon === "number" ? { lat, lon } : {}),
        }),
      });
      setChatForm((prev) => ({
        ...prev,
        text: "",
        area: prev.mode === "incident" ? "" : prev.area,
      }));
      setChatMessageStatus(
        chatForm.mode === "incident"
          ? "Incident posted to community channel and reporting queue."
          : "Message sent to city channel.",
      );
      await Promise.all([loadChat(city), loadFeed(city), loadPendingReports()]);
    } catch (e) {
      const msg = e?.message || "Unable to send message right now.";
      setChatMessageStatus(msg);
      toastError(msg);
    } finally {
      setSendingChat(false);
    }
  };

  const mapPins = useMemo(
    () =>
      (items || []).map((it) => ({
        lat: typeof it.lat === "number" ? it.lat : null,
        lng: typeof it.lng === "number" ? it.lng : null,
        title: it.title,
        description: it.description,
        level: it.level,
        aiSummary: it.aiSummary || "",
        timeLabel: it.time ? new Date(it.time).toLocaleString() : "",
      })),
    [items],
  );

  const levelStyle = (level) => {
    if (level === "high") return "bg-rose-100 text-rose-800 border-rose-200";
    if (level === "watch") return "bg-amber-100 text-amber-800 border-amber-200";
    if (level === "resolved") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (level === "advisory") return "bg-white/10 text-purple-400 border-white/10";
    return "bg-white/10 text-slate-300 border-white/10";
  };

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="text-sm font-semibold rounded-xl border border-white/15 bg-white/5 backdrop-blur-md px-3 py-2 text-white focus:ring-2 focus:ring-purple-500/40 outline-none"
          >
            {["Lahore", "Karachi", "Islamabad", "Peshawar"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${liveUpdates ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
            <p className="text-[11px] text-slate-400">{liveUpdates ? "Live" : "Paused"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastLiveSync ? (
            <p className="text-[10px] text-slate-500">Synced {new Date(lastLiveSync).toLocaleTimeString()}</p>
          ) : null}
          <button onClick={() => loadFeed(city)} className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">Refresh</button>
          <button onClick={() => setLiveUpdates((v) => !v)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
            {liveUpdates ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2">
        {[
          { id: "feed", label: "Feed" },
          { id: "map", label: "Map" },
          { id: "chat", label: "Chat" },
          { id: "ngos", label: "NGOs" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePanel(tab.id)}
            className={`rounded-xl py-2 text-[11px] font-semibold leading-tight transition-all ${activePanel === tab.id ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activePanel === "map" ? (
        <div className="animate-in fade-in space-y-2">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
            <button
              type="button"
              onClick={() => setMapLayerMode("pins")}
              className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${mapLayerMode === "pins" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "text-slate-400"}`}
            >
              Pin view
            </button>
            <button
              type="button"
              onClick={() => setMapLayerMode("heatmap")}
              className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${mapLayerMode === "heatmap" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "text-slate-400"}`}
            >
              Heatmap
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            {heatmapPoints.length} GPS-backed approved reports in {city}. Toggle to compare density vs pins.
          </p>
          <SafeZonesMap city={city} pins={mapPins} mapLayerMode={mapLayerMode} heatmapPoints={heatmapPoints} />
        </div>
      ) : null}

      {activePanel === "ngos" ? (
        <div className="rounded-2xl glass p-4 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">Support organisations — {city}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Women's rights NGOs, legal aid, and shelters near you.</p>
            </div>
            <button onClick={() => loadNgos(city)} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors shrink-0">Refresh</button>
          </div>
          {ngoLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading organisations…
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ngos.map((ngo) => (
              <div key={`${ngo.name}-${ngo.phone}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/8 hover:border-purple-500/20 transition-all group">
                <p className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors">{ngo.name}</p>
                <p className="text-[11px] text-purple-400 mt-0.5 font-medium">{ngo.focus}</p>
                <p className="text-[11px] text-slate-400 mt-1">{ngo.address}</p>
                <a href={`tel:${ngo.phone}`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-full px-3 py-1 transition-colors">
                  <Phone className="w-3 h-3" />{ngo.phone}
                </a>
              </div>
            ))}
          </div>
          {!ngoLoading && ngos.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-500">No organisations found for {city}. Try another city.</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {activePanel === "chat" ? (
        <div className="space-y-3 animate-in fade-in">
          <form onSubmit={sendChatMessage} className="rounded-2xl glass p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={chatForm.mode}
                onChange={(e) => setChatForm((prev) => ({ ...prev, mode: e.target.value }))}
                className="rounded-lg glass-dark px-2.5 py-2 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="chat" className="bg-[#1e1b4b]">General chat</option>
                <option value="incident" className="bg-[#1e1b4b]">Report incident</option>
              </select>
              <select
                value={chatForm.category}
                onChange={(e) => setChatForm((prev) => ({ ...prev, category: e.target.value }))}
                className="rounded-lg glass-dark px-2.5 py-2 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {["Harassment", "Unsafe Transit", "Suspicious Activity", "Cyber Abuse", "Other"].map((cat) => (
                  <option key={cat} value={cat} className="bg-[#1e1b4b]">{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={chatForm.alias}
                onChange={(e) => setChatForm((prev) => ({ ...prev, alias: e.target.value }))}
                placeholder="Display name"
                className="rounded-lg glass-dark px-2.5 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <input
                value={chatForm.area}
                onChange={(e) => setChatForm((prev) => ({ ...prev, area: e.target.value }))}
                placeholder="Area / landmark (required for incident)"
                className="rounded-lg glass-dark px-2.5 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <label className="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer hover:text-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={chatForm.anonymous}
                onChange={(e) => setChatForm((prev) => ({ ...prev, anonymous: e.target.checked }))}
                className="accent-pink-500"
              />
              Post anonymously
            </label>
            <textarea
              value={chatForm.text}
              onChange={(e) => setChatForm((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Share safety updates, ask for support, or report harassment..."
              className="w-full rounded-lg glass-dark px-2.5 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
            {chatMessageStatus ? <p className="text-xs text-purple-400 font-semibold animate-pulse">{chatMessageStatus}</p> : null}
            <button
              type="submit"
              disabled={sendingChat}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white py-2.5 text-sm font-bold disabled:opacity-60 transition-transform active:scale-95"
            >
              {sendingChat ? "Sending..." : chatForm.mode === "incident" ? "Post incident report" : "Send to chat"}
            </button>
          </form>

          <div className="rounded-2xl glass p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">#{city.toLowerCase()}-safety channel</p>
              <button onClick={() => loadChat(city)} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">Refresh chat</button>
            </div>
            {chatLoading ? (
              <p className="text-xs text-slate-400">Loading chat messages...</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`rounded-xl border p-3 animate-in slide-up ${msg.mode === "incident" ? "border-rose-500/30 bg-rose-500/10" : "glass-dark"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-200">{msg.alias || "Anonymous"}</p>
                      <p className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                    {msg.mode === "incident" ? (
                      <p className="text-[10px] mt-1 inline-block rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 font-semibold text-rose-300 uppercase tracking-wide">
                        Incident Report
                      </p>
                    ) : null}
                    <p className="text-sm text-slate-300 mt-1">{msg.text}</p>
                    {msg.area ? <p className="text-[11px] text-slate-400 mt-1">Area: {msg.area}</p> : null}
                    {msg.tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.tags.map((tag) => (
                          <span key={`${msg.id}-${tag}`} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full glass text-purple-400">
                            {tag.replace("-", " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!chatLoading && chatMessages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic">No messages yet. Start the first community check-in.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activePanel === "feed" ? <form onSubmit={submitReport} className="rounded-2xl glass p-4 space-y-3 animate-in fade-in">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Post anonymous report</p>
          <label className="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer hover:text-slate-300 transition-colors">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(e) => setForm((prev) => ({ ...prev, anonymous: e.target.checked }))}
              className="accent-pink-500"
            />
            Anonymous
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="rounded-lg glass-dark px-2.5 py-2 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            {["Harassment", "Unsafe Transit", "Suspicious Activity", "Cyber Abuse", "Other"].map((cat) => (
              <option key={cat} value={cat} className="bg-[#1e1b4b]">{cat}</option>
            ))}
          </select>
          <input
            value={form.area}
            onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
            placeholder="Area / landmark"
            className="rounded-lg glass-dark px-2.5 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          placeholder="Describe what happened so others can stay aware..."
          className="w-full rounded-lg glass-dark px-2.5 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
        />
        <label className="text-[11px] text-slate-400 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={attachReportLocation}
            onChange={(e) => setAttachReportLocation(e.target.checked)}
            className="accent-pink-500"
          />
          Attach my GPS to this report (helps the live map)
        </label>
        {submitMessage ? <p className="text-xs text-purple-400 font-semibold animate-pulse">{submitMessage}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white py-2.5 text-sm font-bold disabled:opacity-60 transition-transform active:scale-95"
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
        {lastSubmittedReport ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200">Safety report pack</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Download a dated .txt or print to PDF for your records (general information + AI summary — not a FIR).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20"
                onClick={() => {
                  const text = buildIncidentReportText({
                    report: lastSubmittedReport,
                    aiInsight: lastReportAi,
                    submittedAt: lastSubmittedReport.time,
                    gpsLabel:
                      typeof lastSubmittedReport.lat === "number" && typeof lastSubmittedReport.lon === "number"
                        ? `${lastSubmittedReport.lat}, ${lastSubmittedReport.lon} (maps.google.com/?q=${lastSubmittedReport.lat},${lastSubmittedReport.lon})`
                        : "Not attached",
                  });
                  downloadIncidentReport(text, `nigaban-report-${lastSubmittedReport.id?.slice(0, 8) || "incident"}`);
                  success("Report downloaded.");
                }}
              >
                Download .txt
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                onClick={() => {
                  const text = buildIncidentReportText({
                    report: lastSubmittedReport,
                    aiInsight: lastReportAi,
                    submittedAt: lastSubmittedReport.time,
                    gpsLabel:
                      typeof lastSubmittedReport.lat === "number" && typeof lastSubmittedReport.lon === "number"
                        ? `${lastSubmittedReport.lat}, ${lastSubmittedReport.lon}`
                        : "Not attached",
                  });
                  printIncidentReportAsPdf(text);
                }}
              >
                Print / Save as PDF
              </button>
            </div>
          </div>
        ) : null}
      </form> : null}

      {activePanel === "feed" && loading ? (
        <div className="rounded-2xl glass p-4 text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading community activity...
        </div>
      ) : null}

      {activePanel === "feed" ? <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className={`rounded-2xl border p-4 animate-in slide-up transition-all ${
            item.level === "high" ? "border-rose-500/25 bg-rose-500/5" :
            item.level === "watch" ? "border-amber-500/20 bg-amber-500/5" :
            item.level === "resolved" ? "border-emerald-500/20 bg-emerald-500/5" :
            "border-white/10 bg-white/[0.03]"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-bold ${levelStyle(item.level)}`}>
                  {item.level}
                </span>
                {item.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                {new Date(item.time).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-2.5 leading-snug">{item.title}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
            {item.aiSummary ? (
              <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/8 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">AI insight</p>
                <p className="text-xs text-slate-200 leading-relaxed">{item.aiSummary}</p>
              </div>
            ) : null}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {item.tags?.map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-purple-400">
                  {tag.replace(/-/g, " ")}
                </span>
              ))}
              {item.source ? <span className="text-[10px] text-slate-600 ml-auto">via {item.source}</span> : null}
            </div>
          </div>
        ))}
        {!loading && items.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-8 text-center space-y-3">
            <Activity className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-500">No reports yet for {city}.</p>
            <p className="text-xs text-slate-600">Be the first to report an incident below.</p>
          </div>
        ) : null}
      </div> : null}

      <div className="rounded-2xl border border-white/10 bg-white/5">
        <button
          type="button"
          onClick={() => setShowModPanel(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Moderator panel</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showModPanel ? "rotate-90" : ""}`} />
        </button>
        {showModPanel ? (
          <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3 animate-in slide-up duration-200">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Paste your <span className="text-slate-300">MODERATOR_BOOTSTRAP_KEY</span> to authenticate moderation actions. Stored in this browser only.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={modKeyInput}
                onChange={(e) => setModKeyInput(e.target.value)}
                placeholder="Bootstrap key"
                className="flex-1 rounded-lg glass-dark px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <button
                type="button"
                onClick={() => { try { localStorage.setItem("nigehbaan_moderator_bootstrap", modKeyInput.trim()); success("Key saved."); } catch { toastError("Could not save."); } }}
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500"
              >Save</button>
              <button
                type="button"
                onClick={() => { try { localStorage.removeItem("nigehbaan_moderator_bootstrap"); setModKeyInput(""); success("Key cleared."); } catch { /* ignore */ } }}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >Clear</button>
            </div>
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white">Review queue</p>
                <button type="button" onClick={loadPendingReports} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">Refresh</button>
              </div>
              {moderationLoading ? <p className="text-xs text-slate-400">Loading…</p> : null}
              {!moderationLoading && pendingReports.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3 italic">No pending reports.</p>
              ) : null}
              {pendingReports.map((report) => (
                <div key={report.id} className="rounded-xl glass-dark p-3 space-y-1 animate-in slide-up">
                  <p className="text-[10px] text-slate-500">{report.city} · {report.category}</p>
                  <p className="text-sm font-semibold text-white">{report.title}</p>
                  <p className="text-xs text-slate-400">{report.description}</p>
                  {report.aiSummary ? <p className="text-[11px] text-purple-200/80 pt-1 border-t border-white/8">{report.aiSummary}</p> : null}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => moderateReport(report.id, "approve")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500">Approve</button>
                    <button type="button" onClick={() => moderateReport(report.id, "reject")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LegalChat() {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Tell me what happened and I will guide legal next steps." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [nearbyCity, setNearbyCity] = useState("Lahore");
  const [nearbyContacts, setNearbyContacts] = useState([]);
  const [nearbyNgos, setNearbyNgos] = useState([]);
  const [helpLoading, setHelpLoading] = useState(false);
  const [detectingCity, setDetectingCity] = useState(false);
  const [detectMessage, setDetectMessage] = useState("");
  const [consultForm, setConsultForm] = useState({
    name: "",
    phone: "",
    city: "",
    issueType: "Harassment",
    preferredTime: "Evening",
    description: "",
    urgent: false,
  });
  const [consultStatus, setConsultStatus] = useState("");
  const [consultLoading, setConsultLoading] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showConsultForm, setShowConsultForm] = useState(false);
  const scrollRef = useRef(null);
  
  const [firDraft, setFirDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draftSent, setDraftSent] = useState(false);
  const [sendingDraft, setSendingDraft] = useState(false);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    let mounted = true;
    setHelpLoading(true);
    api(`/help/nearby?city=${encodeURIComponent(nearbyCity)}`)
      .then((data) => {
        if (mounted) setNearbyContacts(data.contacts || []);
      })
      .catch(() => {
        if (mounted) setNearbyContacts([]);
      })
      .finally(() => {
        if (mounted) setHelpLoading(false);
      });
    api(`/help/ngos?city=${encodeURIComponent(nearbyCity)}`)
      .then((data) => {
        if (mounted) setNearbyNgos(data.ngos || []);
      })
      .catch(() => {
        if (mounted) setNearbyNgos([]);
      });
    return () => {
      mounted = false;
    };
  }, [nearbyCity]);

  const detectCityFromLocation = async () => {
    if (!navigator.geolocation) {
      setDetectMessage("Geolocation is not supported on this device/browser.");
      return;
    }
    setDetectingCity(true);
    setDetectMessage("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await api("/help/detect-city", {
            method: "POST",
            body: JSON.stringify({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            }),
          });
          setNearbyCity(data.city || "Lahore");
          setDetectMessage(`Detected city: ${data.city} (${data.method === "reverse_geocode" ? "GPS match" : "nearest supported city"})`);
        } catch {
          setDetectMessage("Could not detect city automatically. Please select manually.");
        } finally {
          setDetectingCity(false);
        }
      },
      () => {
        setDetectingCity(false);
        setDetectMessage("Location permission denied. Please enable and try again.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    const next = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const history = next.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const data = await api("/legal/chat", { method: "POST", body: JSON.stringify({ message: userText, history, systemPrompt: LEGAL_SYSTEM_PROMPT }) });
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Service unavailable. Use emergency numbers 15 or 1099 if needed." }]);
    } finally {
      setLoading(false);
    }
  };

  const requestConsult = async (e) => {
    e.preventDefault();
    setConsultStatus("");
    if (!consultForm.phone.trim() || !consultForm.city.trim() || !consultForm.issueType.trim() || !consultForm.description.trim()) {
      setConsultStatus("Please complete phone, city, issue type, and description.");
      return;
    }
    setConsultLoading(true);
    try {
      await api("/legal/consult", {
        method: "POST",
        body: JSON.stringify({
          ...consultForm,
          phone: consultForm.phone.trim(),
          city: consultForm.city.trim(),
          issueType: consultForm.issueType.trim(),
          description: consultForm.description.trim(),
          preferredTime: consultForm.preferredTime.trim(),
        }),
      });
      setConsultForm((prev) => ({ ...prev, description: "" }));
      setConsultStatus("Consult request sent. A legal volunteer/lawyer can follow up on your phone.");
    } catch {
      setConsultStatus("Could not submit consult request right now.");
    } finally {
      setConsultLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    setShowDraft(true);
    setDrafting(true);
    setDraftSent(false);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api("/legal/draft-fir", { method: "POST", body: JSON.stringify({ history }) });
      setFirDraft(res.draft || "");
    } catch {
      setFirDraft("Error: Could not generate draft. Please try again.");
    } finally {
      setDrafting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!firDraft) return;
    const blob = new Blob([firDraft], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FIR_Draft.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendDraft = async () => {
    if (!firDraft || sendingDraft) return;
    setSendingDraft(true);
    try {
      await api("/legal/queue", { method: "POST", body: JSON.stringify({ draft: firDraft }) });
      setDraftSent(true);
    } catch {
      alert("Could not send draft right now.");
    } finally {
      setSendingDraft(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#141523] text-white animate-in fade-in">
      <div className="glass-dark border-b border-white/8 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-purple-400" />
          <p className="font-semibold text-white text-sm">Legal Aid</p>
          <span className="text-[9px] text-slate-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">AI — not legal advice</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHelpPanel(v => !v)}
            className={`text-xs rounded-full px-3 py-1.5 font-semibold transition-colors ${showHelpPanel ? "bg-purple-600/30 text-purple-200 border border-purple-500/30" : "glass text-purple-300 hover:bg-white/10"}`}
          >
            Nearby help
          </button>
          <button onClick={handleGenerateDraft} className="text-xs rounded-full glass px-3 py-1.5 text-purple-300 font-semibold hover:bg-white/10 transition-colors">Draft FIR</button>
        </div>
      </div>

      {showHelpPanel ? (
      <div className="px-4 py-3 border-b border-white/8 bg-white/[0.02] space-y-2 shrink-0 animate-in slide-up duration-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Nearby Police & Help</p>
          <div className="flex items-center gap-2">
            <button
              onClick={detectCityFromLocation}
              disabled={detectingCity}
              className="text-xs rounded-lg glass px-2 py-1 text-purple-400 font-semibold disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              {detectingCity ? "Detecting..." : "Use my location"}
            </button>
            <select
              value={nearbyCity}
              onChange={(e) => setNearbyCity(e.target.value)}
              className="text-xs rounded-lg glass px-2 py-1 text-slate-300 focus:ring-2 focus:ring-purple-500/50 outline-none"
            >
              {["Lahore", "Karachi", "Islamabad", "Peshawar"].map((city) => (
                <option key={city} value={city} className="bg-[#1e1b4b] text-white">{city}</option>
              ))}
            </select>
          </div>
        </div>
        {detectMessage ? <p className="text-[11px] text-purple-400">{detectMessage}</p> : null}
        {helpLoading ? (
          <p className="text-xs text-slate-400">Loading nearby support...</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nearbyContacts.map((contact, idx) => (
                <div key={`${contact.name}-${idx}`} className="rounded-xl glass px-3 py-2 hover:bg-white/10 transition-colors">
                  <p className="text-[11px] text-pink-400 font-semibold">{contact.type}</p>
                  <p className="text-sm font-semibold text-white">{contact.name}</p>
                  <p className="text-[11px] text-slate-400">{contact.address}</p>
                  <a href={`tel:${contact.phone}`} className="text-xs font-semibold text-purple-400 mt-1 inline-block hover:text-purple-300 transition-colors">{contact.phone}</a>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-pink-500/10 border border-pink-500/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-300">Nearby NGOs</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nearbyNgos.map((ngo, idx) => (
                  <div key={`${ngo.name}-${idx}`} className="rounded-lg glass p-2.5 hover:bg-white/10 transition-colors">
                    <p className="text-sm font-semibold text-white">{ngo.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ngo.focus}</p>
                    <p className="text-[11px] text-slate-400">{ngo.address}</p>
                    <a href={`tel:${ngo.phone}`} className="text-xs font-semibold text-pink-400 mt-1 inline-block hover:text-pink-300 transition-colors">{ngo.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      ) : null}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-purple-500/25 text-white rounded-br-none" : "bg-white/10 backdrop-blur-md border border-white/10 text-slate-200 rounded-bl-none"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 text-xs bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl rounded-bl-none px-4 py-2.5 text-slate-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
              Thinking...
            </div>
          </div>
        ) : null}
      </div>
      <div className="bg-white/5 backdrop-blur-md border-t border-white/8 px-4 py-3 space-y-2 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            className="flex-1 rounded-2xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-slate-400 resize-none max-h-32"
            placeholder="Describe what happened…"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-10 h-10 mb-0.5 shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:shadow-none flex items-center justify-center transition-transform active:scale-95"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowConsultForm(v => !v)}
          className="w-full text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors py-1 flex items-center justify-center gap-1.5"
        >
          <Scale className="w-3 h-3" />
          {showConsultForm ? "Hide consultation form" : "Request a real lawyer consultation"}
        </button>
      </div>
      {showConsultForm ? (
        <div className="px-4 pb-4 border-t border-white/8 bg-white/[0.02] space-y-3 animate-in slide-up duration-200 shrink-0 overflow-y-auto max-h-80">
          <form onSubmit={requestConsult} className="pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-semibold text-purple-300">Request Legal Consult</p>
              <label className="text-[10px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={consultForm.urgent} onChange={(e) => setConsultForm((prev) => ({ ...prev, urgent: e.target.checked }))} className="accent-pink-500" />
                Urgent
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={consultForm.name} onChange={(e) => setConsultForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Your name" className="rounded-lg glass-dark px-2.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-purple-500/50" />
              <input value={consultForm.phone} onChange={(e) => setConsultForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone (+92…)" className="rounded-lg glass-dark px-2.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-purple-500/50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={consultForm.city} onChange={(e) => setConsultForm((prev) => ({ ...prev, city: e.target.value }))} placeholder="City" className="rounded-lg glass-dark px-2.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-purple-500/50" />
              <select value={consultForm.issueType} onChange={(e) => setConsultForm((prev) => ({ ...prev, issueType: e.target.value }))} className="rounded-lg glass-dark px-2.5 py-2 text-xs text-slate-300 outline-none focus:ring-1 focus:ring-purple-500/50">
                {["Harassment", "Cyber Abuse", "Blackmail", "Domestic Violence", "FIR Filing", "Other"].map((issue) => (
                  <option key={issue} value={issue} className="bg-[#1e1b4b]">{issue}</option>
                ))}
              </select>
            </div>
            <textarea value={consultForm.description} onChange={(e) => setConsultForm((prev) => ({ ...prev, description: e.target.value }))} rows={2} placeholder="Briefly explain your situation…" className="w-full rounded-lg glass-dark px-2.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-purple-500/50 resize-none" />
            {consultStatus ? <p className="text-[11px] text-purple-400">{consultStatus}</p> : null}
            <button type="submit" disabled={consultLoading} className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 text-xs font-semibold disabled:opacity-60 active:scale-95 transition-transform">
              {consultLoading ? "Submitting…" : "Request consultation"}
            </button>
          </form>
        </div>
      ) : null}
      {showDraft ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4">
          <div className="w-full max-w-md bg-[#1a1b2e] border border-white/10 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
              <p className="font-semibold text-white">FIR Draft</p>
              <button onClick={() => setShowDraft(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 text-sm text-slate-300 space-y-4">
              <p>Auto-generated FIR template prepared for FIA Cybercrime Wing.</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-1 text-xs font-mono text-slate-400 h-48 flex items-center justify-center relative">
                {drafting ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                    <span>Generating Draft...</span>
                  </div>
                ) : (
                  <textarea 
                    value={firDraft} 
                    onChange={(e) => setFirDraft(e.target.value)} 
                    className="w-full h-full bg-transparent resize-none outline-none p-2 text-white"
                  />
                )}
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={handleDownloadPdf} disabled={drafting || !firDraft} className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={handleSendDraft} disabled={drafting || !firDraft || sendingDraft || draftSent} className={`flex-1 rounded-xl shadow-lg transition-opacity py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 ${draftSent ? 'bg-emerald-600 shadow-emerald-500/25' : 'bg-gradient-to-r from-pink-500 to-purple-600 shadow-purple-500/25 hover:opacity-90'}`}>
                {sendingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : draftSent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {draftSent ? "Sent" : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DMScanner() {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target.result.split(",")[1]);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const scan = async () => {
    if ((!text.trim() && !imageBase64) || loading) return;
    setLoading(true);
    try {
      const data = await api("/dm/scan", { 
        method: "POST", 
        body: JSON.stringify({ 
          text, 
          imageBase64, 
          imageMimeType,
          systemPrompt: DM_SCAN_SYSTEM_PROMPT 
        }) 
      });
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-28 space-y-5 animate-in fade-in">
      <h2 className="text-xl font-semibold">DM Harassment Scanner</h2>
      <div className="space-y-3">
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          rows={4} 
          className="w-full rounded-2xl glass-dark p-3 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none" 
          placeholder="Paste message text or upload a screenshot below..." 
        />
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-semibold">Upload Screenshot (Optional)</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            className="text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
          />
        </div>
      </div>
      <button 
        onClick={scan} 
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white py-3 text-sm font-semibold active:scale-95 transition-transform"
      >
        {loading ? "Analyzing with Gemini AI..." : "Scan for Harassment"}
      </button>
      {result && (
        <div className="rounded-2xl glass p-4 text-sm space-y-3 animate-in slide-up">
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${result.severity > 6 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
              {result.classification}
            </span>
            <span className="text-[10px] text-slate-400">Severity: {result.severity}/10</span>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-purple-300">{result.summary}</p>
            <div className="rounded-lg glass-dark p-2.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Legal Reference (PECA)</p>
              <p className="text-xs text-slate-300 mt-1"><strong>{result.peca_section}:</strong> {result.peca_explanation}</p>
            </div>
            <div className="rounded-lg glass-dark p-2.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Recommended Action</p>
              <p className="text-xs text-emerald-400 mt-1">{result.recommended_action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeepfakeDetector() {
  const { error: toastError } = useToast();
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target.result.split(",")[1]);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageBase64 || loading) return;
    setLoading(true);
    try {
      const data = await api("/ai/analyze-image", {
        method: "POST",
        body: JSON.stringify({
          imageBase64,
          imageMimeType,
          toolType: "deepfake",
        }),
      });
      setResult(data.result);
    } catch (e) {
      toastError(e?.message || "Image analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-28 space-y-5 animate-in fade-in">
      <h2 className="text-xl font-semibold text-white">Deepfake Detector</h2>
      <div className="rounded-2xl glass p-6 sm:p-8 text-center space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-full sm:max-w-md md:max-w-lg h-56 sm:h-64 rounded-2xl glass-dark border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group hover:bg-white/5 hover:border-purple-500/50 transition-all cursor-pointer">
            {imageBase64 ? (
              <img src={`data:${imageMimeType};base64,${imageBase64}`} alt="Target" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-purple-400 transition-colors">
                <ImageIcon className="w-10 h-10 opacity-50 group-hover:scale-110 transition-transform" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Click to Upload Image</p>
                  <p className="text-[10px] uppercase tracking-widest font-semibold">JPG, PNG, WEBP</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
          </div>
          <p className="text-xs text-slate-400">Analysis for AI-generation, lighting inconsistencies, and artifacts.</p>
        </div>
        
        <button 
          onClick={analyze} 
          disabled={!imageBase64 || loading}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 text-sm font-bold shadow-lg shadow-indigo-900/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? "Analyzing Image with Gemini..." : "Run AI Integrity Check"}
        </button>

        {result && (
          <div className="rounded-2xl glass-dark p-4 text-left space-y-3 animate-in slide-up">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${result.classification === "AI-Generated" ? "bg-red-500/20 text-red-400" : result.classification === "Suspicious" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                {result.classification}
              </span>
              <span className="text-[10px] text-slate-400">
                Confidence:{" "}
                {typeof result.confidence_score === "number"
                  ? result.confidence_score <= 1
                    ? Math.round(result.confidence_score * 100)
                    : Math.round(result.confidence_score)
                  : "—"}
                %
              </span>
            </div>
            <p className="text-sm text-slate-200">{result.explanation}</p>
            {result.anomalies?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Detected Anomalies</p>
                <ul className="text-xs text-slate-400 list-disc list-inside">
                  {result.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceDetector() {
  const { error: toastError } = useToast();
  const [fileBase64, setFileBase64] = useState(null);
  const [mimeType, setMimeType] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileBase64(event.target.result.split(",")[1]);
      setMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!fileBase64 || loading) return;
    setLoading(true);
    try {
      const data = await api("/ai/analyze-image", {
        method: "POST",
        body: JSON.stringify({
          imageBase64: fileBase64,
          imageMimeType: mimeType,
          toolType: "voice",
        }),
      });
      setResult(data.result);
    } catch (e) {
      toastError(e?.message || "Voice analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-28 space-y-5 animate-in fade-in">
      <h2 className="text-xl font-semibold text-white">Voice Clone Detector</h2>
      <div className="rounded-2xl glass p-6 sm:p-8 text-center space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-full sm:max-w-md h-36 sm:h-40 rounded-2xl glass-dark border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group hover:bg-white/5 hover:border-purple-500/50 transition-all cursor-pointer">
            {fileBase64 ? (
              <div className="flex flex-col items-center gap-2 text-purple-400">
                <Volume2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-semibold">Audio Ready (Click to change)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-purple-400 transition-colors">
                <Volume2 className="w-10 h-10 opacity-50 group-hover:scale-110 transition-transform" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Click to Upload Audio</p>
                  <p className="text-[10px] uppercase tracking-widest font-semibold">MP3, WAV, M4A</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
          </div>
          <p className="text-xs text-slate-400">Upload a recording to check for AI cloning or synthetic robotic patterns.</p>
        </div>
        
        <button 
          onClick={analyze} 
          disabled={!fileBase64 || loading}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 text-sm font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? "Analyzing Audio with Gemini..." : "Run AI Voice Integrity Check"}
        </button>

        {result && (
          <div className="rounded-2xl glass-dark p-4 text-left space-y-3 animate-in slide-up">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${result.classification === "Synthetic" ? "bg-red-500/20 text-red-400" : result.classification === "Suspicious" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                {result.classification}
              </span>
              <span className="text-[10px] text-slate-400">
                Confidence:{" "}
                {typeof result.confidence_score === "number"
                  ? result.confidence_score <= 1
                    ? Math.round(result.confidence_score * 100)
                    : Math.round(result.confidence_score)
                  : "—"}
                %
              </span>
            </div>
            <p className="text-sm text-slate-200">{result.explanation}</p>
            {result.anomalies?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Detected Artifacts</p>
                <ul className="text-xs text-slate-400 list-disc list-inside">
                  {result.anomalies.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



function DistressListener({ onTriggerSOS }) {
  const [listening, setListening] = useState(false);
  const [detected, setDetected] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Also supports "ur-PK" for Urdu

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      if (listening) recognition.start(); // Auto-restart if we intended to keep listening
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript.toLowerCase())
        .join("");
      
      const keywords = ["help", "bachao", "save me", "emergency", "police", "danger"];
      if (keywords.some(k => transcript.includes(k))) {
        setDetected(true);
        onTriggerSOS();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    setListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-28 space-y-5 animate-in fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white">Distress Listener</h2>
        <p className="text-xs text-slate-500">Listens for distress keywords — "Help", "Bachao", "Emergency" — and triggers SOS automatically.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center space-y-6">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-500 ${
          detected ? "bg-red-500/20 border-2 border-red-500/40 sos-pulse" :
          listening ? "bg-emerald-500/15 border-2 border-emerald-500/30 sos-pulse" :
          "bg-white/5 border border-white/10"
        }`}>
          <Ear className={`w-10 h-10 transition-colors ${detected ? "text-red-400" : listening ? "text-emerald-400" : "text-slate-500"}`} />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-bold text-white">
            {detected ? "Distress Detected!" : listening ? "Monitoring audio…" : "Ready to monitor"}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {detected
              ? "A distress keyword was detected. Tap below to trigger SOS immediately."
              : listening
              ? "Listening for: Help · Bachao · Emergency · Save me · Danger"
              : "Start monitoring to detect distress words and auto-trigger SOS."}
          </p>
        </div>
        <div className="space-y-3 max-w-xs mx-auto">
          {!listening ? (
            <button onClick={startListening} className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 text-sm font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
              <Ear className="w-4 h-4" /> Start Monitoring
            </button>
          ) : (
            <button onClick={stopListening} className="w-full rounded-2xl border border-white/15 bg-white/5 text-slate-200 py-3.5 text-sm font-semibold hover:bg-white/10 active:scale-95 transition-all">
              Stop Monitoring
            </button>
          )}
          {detected ? (
            <button onClick={onTriggerSOS} className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 text-white py-3.5 text-sm font-bold animate-pulse shadow-xl shadow-rose-900/30">
              Trigger SOS Now
            </button>
          ) : null}
        </div>
      </div>
      <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 space-y-1">
        <p className="text-xs font-semibold text-amber-300">Privacy note</p>
        <p className="text-[11px] text-amber-200/70 leading-relaxed">Audio is processed on-device using the Web Speech API. Nothing is sent to our servers. Browser permission is required.</p>
      </div>
    </div>
  );
}

function SafeTransit({ contacts, autoDialPolice }) {
  const hasContacts = (contacts?.length || 0) > 0;
  const [trip, setTrip] = useState(null);
  const [destination, setDestination] = useState("");
  const [tripMode, setTripMode] = useState("online");
  const [statusMessage, setStatusMessage] = useState("");
  const [checkInText, setCheckInText] = useState("");
  const [checkInTimerMinutes, setCheckInTimerMinutes] = useState(5);
  const [nextCheckInAt, setNextCheckInAt] = useState(null);

  useEffect(() => {
    if (!nextCheckInAt || !trip) return undefined;
    const timerId = setInterval(() => {
      const remainingMs = new Date(nextCheckInAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        setStatusMessage("Check-in overdue. Notify your trusted contacts or trigger SOS if needed.");
      }
    }, 1000);
    return () => clearInterval(timerId);
  }, [nextCheckInAt, trip]);

  useEffect(() => {
    if (!trip || trip.status !== "active") return undefined;
    const intervalId = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            api("/transit/location", {
              method: "POST",
              body: JSON.stringify({
                tripId: trip.id,
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                at: new Date().toISOString(),
              }),
            })
              .then((data) => {
                if (data.trip) setTrip(data.trip);
              })
              .catch(() => {});
          },
          null,
          { enableHighAccuracy: true }
        );
      }
    }, 15000);
    return () => clearInterval(intervalId);
  }, [trip?.id, trip?.status]);

  const startTrip = async () => {
    setStatusMessage("");
    const dest = destination.trim() || "Destination";
    try {
      const data = await api("/transit/start", { method: "POST", body: JSON.stringify({ destination: dest }) });
      setTrip(data.trip);
      setTripMode("online");
      setStatusMessage("Trip started with backend tracking.");
      setNextCheckInAt(new Date(Date.now() + checkInTimerMinutes * 60 * 1000).toISOString());
    } catch {
      const localTrip = {
        id: `local-${Date.now()}`,
        destination: dest,
        startedAt: new Date().toISOString(),
        status: "active",
        events: [
          "Local trip started — manual check-ins active.",
        ],
      };
      setTrip(localTrip);
      setTripMode("local");
      setStatusMessage("Transit works in local mode (no paid/free keys needed).");
      setNextCheckInAt(new Date(Date.now() + checkInTimerMinutes * 60 * 1000).toISOString());
    }
  };
  const simulateDeviation = async () => {
    if (!trip) return;
    if (tripMode === "local") {
      setTrip((prev) => ({
        ...prev,
        status: "deviated",
        events: [...(prev?.events || []), "Possible route deviation detected (local mode)"],
      }));
      return;
    }
    try {
      const data = await api("/transit/deviation", { method: "POST", body: JSON.stringify({ tripId: trip.id }) });
      setTrip(data.trip);
    } catch {
      setStatusMessage("Could not reach backend deviation endpoint. You can still use SOS.");
    }
  };

  const submitCheckIn = () => {
    if (!trip || !checkInText.trim()) return;
    setTrip((prev) => ({
      ...prev,
      events: [...(prev?.events || []), `Check-in: ${checkInText.trim()}`],
    }));
    setCheckInText("");
    setStatusMessage("Check-in recorded.");
    setNextCheckInAt(new Date(Date.now() + checkInTimerMinutes * 60 * 1000).toISOString());
  };

  const markSafeArrival = () => {
    if (!trip) return;
    setTrip((prev) => ({
      ...prev,
      status: "completed",
      events: [...(prev?.events || []), "Arrived safely"],
    }));
    setStatusMessage("Trip marked as completed.");
    setNextCheckInAt(null);
  };
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 pt-4 pb-28 space-y-5 animate-in fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white">Safe Transit</h2>
        <p className="text-xs text-slate-500">Share your journey with trusted contacts. Miss a check-in and they're notified automatically.</p>
      </div>

      {!hasContacts ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80 leading-relaxed">No trusted contacts added yet. <button type="button" className="underline text-amber-300 font-semibold">Add them in Profile</button> so alerts can reach someone you trust.</p>
        </div>
      ) : null}

      {!trip ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${tripMode === "online" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
            <p className="text-sm font-semibold text-white">{tripMode === "online" ? "Backend-tracked mode" : "Manual check-in mode"}</p>
          </div>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination (e.g. Gulberg Metro, Liberty Roundabout)"
            className="w-full rounded-2xl glass-dark px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/40 outline-none"
          />
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 shrink-0">Check-in every</label>
            <input
              type="number" min={1} max={30} value={checkInTimerMinutes}
              onChange={(e) => setCheckInTimerMinutes(Math.max(1, Math.min(30, Number(e.target.value) || 5)))}
              className="w-14 rounded-lg glass-dark px-2 py-1.5 text-sm text-center text-white focus:ring-1 focus:ring-emerald-500/50 outline-none"
            />
            <label className="text-xs text-slate-400">minutes</label>
          </div>
          <button onClick={startTrip} className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 text-sm font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" /> Start Safe Trip
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-5 space-y-1 ${trip.status === "deviated" ? "border-red-500/30 bg-red-500/8" : trip.status === "completed" ? "border-emerald-500/25 bg-emerald-500/8" : "border-emerald-500/20 bg-emerald-500/5"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${trip.status === "deviated" ? "bg-red-500 animate-pulse" : trip.status === "completed" ? "bg-emerald-500" : "bg-emerald-400 animate-pulse"}`} />
                <p className={`text-sm font-bold ${trip.status === "deviated" ? "text-red-400" : "text-emerald-300"}`}>
                  {trip.status === "deviated" ? "Deviation detected" : trip.status === "completed" ? "Arrived safely" : "Trip active"}
                </p>
              </div>
              {nextCheckInAt && trip.status === "active" ? (
                <p className="text-xs text-slate-400 font-mono">Next check-in: {new Date(nextCheckInAt).toLocaleTimeString()}</p>
              ) : null}
            </div>
            {trip.destination && <p className="text-xs text-slate-400 pl-5.5">→ {trip.destination}</p>}
          </div>

          {statusMessage ? (
            <p className="text-xs text-amber-300 font-semibold px-1">{statusMessage}</p>
          ) : null}

          {trip.status !== "completed" ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Check-in</p>
              <div className="flex gap-2">
                <input
                  value={checkInText}
                  onChange={(e) => setCheckInText(e.target.value)}
                  placeholder="e.g. Passing Liberty roundabout…"
                  className="flex-1 rounded-xl glass-dark px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-purple-500/50 outline-none"
                />
                <button onClick={submitCheckIn} className="shrink-0 rounded-xl bg-purple-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-purple-500 transition-colors">Log</button>
              </div>
              <button onClick={markSafeArrival} className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 text-sm font-bold active:scale-95 transition-transform">
                I've Arrived Safely
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Trip timeline</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {trip.events?.map((event, i) => (
                <p key={`${event}-${i}`} className="text-[11px] text-slate-300 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5 shrink-0">•</span> {event}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function useSiren() {
  const ctxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const rafRef = useRef(null);
  const [active, setActive] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (oscRef.current) { try { oscRef.current.stop(); } catch { /* ignore */ } oscRef.current = null; }
    if (gainRef.current) { gainRef.current = null; }
    if (ctxRef.current) { try { ctxRef.current.close(); } catch { /* ignore */ } ctxRef.current = null; }
    setActive(false);
  }, []);

  const start = useCallback(() => {
    stop();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.value = 0.9;
      gain.connect(ctx.destination);
      gainRef.current = gain;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 880;
      osc.connect(gain);
      osc.start();
      oscRef.current = osc;
      const startT = ctx.currentTime;
      const sweep = () => {
        if (!ctxRef.current) return;
        const t = (ctx.currentTime - startT) % 1.2;
        const freq = t < 0.6 ? 660 + (t / 0.6) * 440 : 1100 - ((t - 0.6) / 0.6) * 440;
        osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.04);
        rafRef.current = requestAnimationFrame(sweep);
      };
      sweep();
      setActive(true);
    } catch {
      setActive(false);
    }
  }, [stop]);

  useEffect(() => () => stop(), [stop]);
  return { active, start, stop };
}

function SOSScreen({ onClose, contacts, autoDialPolice, cancelPin }) {
  const { success, error: toastError } = useToast();
  const [phase, setPhase] = useState("countdown");
  const [countdown, setCountdown] = useState(5);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [sosMeta, setSosMeta] = useState({ location: null, aiTip: "" });
  const siren = useSiren();

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("active");
      siren.start();
      const send = (body) => {
        api("/sos/start", { method: "POST", body: JSON.stringify(body) })
          .then((res) => {
            setSosMeta({ location: res?.location || null, aiTip: res?.aiTip || "" });
            success(res?.location ? "SOS sent with GPS logged." : "SOS sent to your contacts.");
          })
          .catch((e) => {
            toastError(e?.message || "SOS could not reach the server.");
          });
      };
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            send({
              source: "manual",
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          () => send({ source: "manual" }),
          { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
        );
      } else {
        send({ source: "manual" });
      }
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, success, toastError]);

  const stopSOS = async () => {
    if (phase === "countdown") { siren.stop(); return onClose(); }
    if (pin !== cancelPin) {
      setError("Incorrect PIN");
      return;
    }
    try {
      await api("/sos/stop", { method: "POST", body: JSON.stringify({ pin }) });
      siren.stop();
      onClose();
    } catch {
      setError("Could not verify PIN with server");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#7f1d1d] text-white flex flex-col animate-in fade-in">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {phase === "countdown" ? (
          <>
            <p className="text-sm uppercase tracking-[0.4em] text-red-200 font-bold">SOS TRIGER IN</p>
            <p className="text-[10rem] font-black leading-none mt-2 text-white animate-pulse">{countdown}</p>
            <p className="text-xs text-red-200 mt-4 max-w-[200px]">Hold cancel to stop. Emergency contacts will be notified automatically.</p>
          </>
        ) : (
          <>
            <div className="w-40 h-40 rounded-full glass flex items-center justify-center mb-8 sos-pulse">
              <AlertTriangle className="w-20 h-20 text-white" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">SOS Active</h2>
            <div className="mt-6 space-y-1">
              <p className="text-sm text-red-100">Alerted: <span className="font-bold">{contacts.map((c) => c.name).join(", ") || "No contacts set"}</span></p>
              <p className="text-xs text-red-200">Police (15) {autoDialPolice ? "Auto-dialed" : "Notified"}</p>
              {sosMeta.location?.lat != null && sosMeta.location?.lon != null ? (
                <p className="text-[11px] text-red-100/90 font-mono mt-2 break-all">
                  GPS: {Number(sosMeta.location.lat).toFixed(5)}, {Number(sosMeta.location.lon).toFixed(5)}
                </p>
              ) : (
                <p className="text-[11px] text-red-200/80 mt-2">GPS unavailable — SOS still logged without coordinates.</p>
              )}
              {sosMeta.aiTip ? (
                <div className="mt-3 max-w-sm mx-auto rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-left">
                  <p className="text-[10px] uppercase tracking-wide text-red-200 font-bold">AI tip</p>
                  <p className="text-xs text-red-50 mt-1 leading-relaxed">{sosMeta.aiTip}</p>
                </div>
              ) : null}
            </div>
            
            <button
              type="button"
              onClick={() => siren.active ? siren.stop() : siren.start()}
              className="mt-6 flex items-center gap-2 rounded-full border-2 border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-all"
            >
              {siren.active ? (
                <>
                  <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  Mute siren
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  Sound alarm
                </>
              )}
            </button>

            <div className="mt-6 w-full max-w-[240px] space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-red-200">Enter PIN to cancel</p>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                maxLength={4}
                type="password"
                placeholder="• • • •"
                className="w-full rounded-2xl glass text-center text-2xl font-bold py-4 outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder:text-red-400/50"
              />
              {error ? <p className="text-xs text-white font-bold bg-red-900/50 py-1 rounded-full">{error}</p> : null}
            </div>
          </>
        )}
      </div>
      <div className="px-6 pb-10">
        <button
          onClick={stopSOS}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 ${phase === "countdown" ? "glass hover:bg-white/10" : "bg-white text-red-900 shadow-xl active:scale-95"}`}
        >
          {phase === "countdown" ? "CANCEL SOS" : "I AM SAFE"}
        </button>
      </div>
    </div>
  );
}

function MoreScreen({ settings, setSettings, contacts, setContacts, onNavigate }) {
  const { success, error: toastError } = useToast();
  const siren = useSiren();
  const [fakeCallOpen, setFakeCallOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [session, setSession] = useState(null);
  const [evidenceForm, setEvidenceForm] = useState({
    incidentId: "",
    title: "",
    type: "text",
    content: "",
  });
  const [evidenceMsg, setEvidenceMsg] = useState("");
  const [consultRequests, setConsultRequests] = useState([]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [showEvidenceVault, setShowEvidenceVault] = useState(false);
  const [showLegalReqs, setShowLegalReqs] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const addContact = async () => {
    if (!name.trim()) return;
    try {
      const data = await api("/contacts", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), phone: (contactPhone.trim() || phone.trim() || "+920000000000").slice(0, 32) }),
      });
      setContacts(data.contacts || []);
      setName("");
      setContactPhone("");
      success("Contact saved.");
    } catch (e) {
      toastError(e?.message || "Could not add contact.");
    }
  };
  const removeContact = async (id) => {
    try {
      const data = await api(`/contacts/${id}`, { method: "DELETE" });
      setContacts(data.contacts || []);
      success("Contact removed.");
    } catch (e) {
      toastError(e?.message || "Could not remove contact.");
    }
  };
  const updateSetting = async (next) => {
    try {
      const data = await api("/settings", { method: "PUT", body: JSON.stringify(next) });
      setSettings(data.settings);
      success("Settings updated.");
    } catch (e) {
      toastError(e?.message || "Could not save settings.");
    }
  };

  const requestOtp = async () => {
    setAuthMsg("");
    try {
      const data = await api("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone, deviceId }),
      });
      setAuthMsg(`OTP requested. Demo code: ${data.demoCode}`);
    } catch {
      setAuthMsg("Failed to request OTP.");
    }
  };

  const verifyOtp = async () => {
    setAuthMsg("");
    try {
      const data = await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, code: otpCode, deviceId }),
      });
      try {
        localStorage.setItem("nigehbaan_token", data.token);
      } catch {
        // ignore
      }
      setSession(data.session);
      setAuthMsg("Logged in successfully.");
    } catch {
      setAuthMsg("OTP verification failed.");
    }
  };

  const checkSession = async () => {
    setAuthMsg("");
    try {
      const data = await api("/auth/me");
      setSession(data.session);
      setAuthMsg("Session is valid.");
    } catch {
      setSession(null);
      setAuthMsg("No valid session.");
    }
  };

  const uploadEvidence = async () => {
    setEvidenceMsg("");
    try {
      const data = await api("/evidence/upload", {
        method: "POST",
        body: JSON.stringify(evidenceForm),
      });
      setEvidenceMsg(`Evidence uploaded. Checksum: ${data.item.checksum.slice(0, 12)}...`);
    } catch {
      setEvidenceMsg("Evidence upload failed.");
    }
  };

  const exportEvidencePacket = async () => {
    setEvidenceMsg("");
    try {
      const data = await api(`/evidence/export/${encodeURIComponent(evidenceForm.incidentId)}`, { method: "POST" });
      setEvidenceMsg(`Export generated. Signature: ${data.signature.slice(0, 14)}...`);
    } catch {
      setEvidenceMsg("Evidence export failed.");
    }
  };

  const loadConsultRequests = async () => {
    setConsultLoading(true);
    try {
      const data = await api("/legal/consult?status=all");
      setConsultRequests(data.items || []);
    } catch {
      setConsultRequests([]);
    } finally {
      setConsultLoading(false);
    }
  };

  useEffect(() => {
    loadConsultRequests();
  }, []);

  const buildAlertBody = (lat, lng) =>
    `🆘 NIgaban ALERT — I may need help. My location: https://www.google.com/maps?q=${lat},${lng} — Please call me or contact police (15) if I don't respond.`;

  const sendQuickAlertSms = () => {
    if (!contacts.length) {
      toastError("Add trusted contacts in My safety circle first.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const sanitized = contacts
          .slice(0, 3)
          .map((c) => String(c.phone || "").replace(/[^\d+]/g, "").trim())
          .filter(Boolean);
        if (!sanitized.length) {
          toastError("Add phone numbers with country code (e.g. +92300…).");
          return;
        }
        window.location.href = `sms:${sanitized.join(",")}?body=${encodeURIComponent(buildAlertBody(lat, lng))}`;
      },
      () => toastError("Allow location so your SMS includes live GPS."),
      { enableHighAccuracy: true, timeout: 14_000, maximumAge: 30_000 },
    );
  };

  const sendWhatsAppAlert = () => {
    if (!contacts.length) {
      toastError("Add trusted contacts first.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const firstContact = contacts[0];
        const phone = String(firstContact.phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "").trim();
        if (!phone) {
          toastError("Add a phone number with country code (e.g. +92300…).");
          return;
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildAlertBody(lat, lng))}`, "_blank", "noopener");
      },
      () => toastError("Allow location so your WhatsApp message includes live GPS."),
      { enableHighAccuracy: true, timeout: 14_000, maximumAge: 30_000 },
    );
  };

  const enableShakeMotion = async () => {
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        const r = await DeviceMotionEvent.requestPermission();
        if (r !== "granted") {
          toastError("Motion permission denied.");
          return;
        }
      }
      try {
        localStorage.setItem("nigehbaan_motion", "1");
      } catch {
        // ignore
      }
      window.dispatchEvent(new Event("nigehbaan-motion-enabled"));
      success("Shake-to-SOS armed. Three firm shakes start a 3s countdown (cancel on screen).");
    } catch {
      toastError("Could not enable motion on this device.");
    }
  };

  /* ── derived state ── */
  const hasContacts = contacts.length > 0;
  const hasSession = Boolean(session);
  const hasCustomPin = settings.cancelPin && settings.cancelPin !== "1234";
  const safetyScore = (hasContacts ? 40 : 0) + (hasSession ? 35 : 0) + (hasCustomPin ? 15 : 0) + 10;
  const avatarInitial = (session?.user?.email?.[0] || "N").toUpperCase();

  const SirenIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
  );

  const WAIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-28 pt-2 space-y-4 animate-in fade-in">
      <FakeCallOverlay open={fakeCallOpen} onClose={() => setFakeCallOpen(false)} />

      {/* ── 1. Profile Hero ── */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-900/25 via-[#141523]/90 to-pink-950/20 p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-purple-900/50">
              {avatarInitial}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#141523] flex items-center justify-center ${hasSession ? "bg-emerald-500" : "bg-slate-600"}`}>
              {hasSession
                ? <CheckCircle2 className="w-3 h-3 text-white" />
                : <X className="w-2.5 h-2.5 text-slate-300" />}
            </span>
          </div>
          {/* Identity */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-white leading-tight truncate">
              {session?.user?.email?.split("@")[0] || "NIgaban User"}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {hasSession ? session.user.email : "Guest — sign in to sync your data"}
            </p>
            {/* Safety score bar */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${safetyScore}%`,
                    background: safetyScore >= 80 ? "linear-gradient(90deg,#10b981,#34d399)" :
                                safetyScore >= 50 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" :
                                "linear-gradient(90deg,#ec4899,#8b5cf6)",
                  }}
                />
              </div>
              <span className="text-[10px] font-bold shrink-0" style={{ color: safetyScore >= 80 ? "#34d399" : safetyScore >= 50 ? "#fbbf24" : "#c084fc" }}>
                {safetyScore}% ready
              </span>
            </div>
          </div>
        </div>

        {/* Setup checklist */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Contacts", done: hasContacts, hint: "Add 1+" },
            { label: "Account", done: hasSession, hint: "Sign in" },
            { label: "PIN set", done: hasCustomPin, hint: "Change 1234" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl px-3 py-2.5 border text-center transition-colors ${item.done ? "border-emerald-500/25 bg-emerald-500/8" : "border-white/8 bg-white/[0.03]"}`}>
              <div className={`text-lg mb-0.5 ${item.done ? "text-emerald-400" : "text-slate-600"}`}>
                {item.done ? "✓" : "○"}
              </div>
              <p className={`text-[10px] font-bold leading-tight ${item.done ? "text-emerald-300" : "text-slate-500"}`}>{item.label}</p>
              {!item.done && <p className="text-[9px] text-slate-600 mt-0.5">{item.hint}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Safety Circle ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3 border-b border-white/6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Safety Circle</p>
              <p className="text-[10px] text-slate-500">{contacts.length} trusted contact{contacts.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {/* Alert buttons */}
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={sendQuickAlertSms}
              className="rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-bold px-3 py-2 flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <Phone className="w-3 h-3" /> SMS
            </button>
            <button
              type="button"
              onClick={sendWhatsAppAlert}
              className="rounded-xl text-white text-[10px] font-bold px-3 py-2 flex items-center gap-1.5 transition-colors active:scale-95"
              style={{ background: "#25D366" }}
            >
              <WAIcon /> WhatsApp
            </button>
          </div>
        </div>

        {/* Contact list */}
        <div className="px-4 py-3 space-y-2">
          {contacts.length === 0 ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-400">No contacts yet</p>
              <p className="text-[11px] text-slate-600 mt-1">Add someone you trust — they'll get your SOS with live GPS</p>
            </div>
          ) : (
            contacts.map((contact, idx) => (
              <div key={contact.id} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/[0.04] border border-white/6 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white"
                  style={{ background: ["linear-gradient(135deg,#ec4899,#8b5cf6)","linear-gradient(135deg,#8b5cf6,#06b6d4)","linear-gradient(135deg,#f59e0b,#ec4899)"][idx % 3] }}>
                  {(contact.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{contact.phone || "No number"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeContact(contact.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 transition-all"
                  aria-label="Remove contact"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}

          {/* Add contact form */}
          {showAddContact ? (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-2 animate-in slide-up duration-200">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl glass-dark px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none"
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone with country code (+92 300…)"
                type="tel"
                className="w-full rounded-xl glass-dark px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { addContact(); setShowAddContact(false); }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2.5 text-xs font-bold active:scale-95 transition-transform"
                >
                  Save contact
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="rounded-xl glass px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddContact(true)}
              className="w-full rounded-2xl border border-dashed border-white/15 py-3 text-xs font-semibold text-slate-400 hover:border-purple-500/40 hover:text-purple-300 hover:bg-purple-500/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add trusted contact
            </button>
          )}
        </div>

        {/* Footnote */}
        <p className="px-4 pb-3 text-[10px] text-slate-600 leading-relaxed">
          SMS opens your native messages app. WhatsApp SOS sends directly to your first contact with live GPS — no server needed.
        </p>
      </div>

      {/* ── 3. Emergency Quick Actions ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Discreet tools</p>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Fake Call */}
          <button
            type="button"
            onClick={() => setFakeCallOpen(true)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-3.5 flex items-center gap-3 text-left transition-colors active:scale-[0.97]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Fake Call</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Exit situations</p>
            </div>
          </button>

          {/* Siren */}
          <button
            type="button"
            onClick={() => siren.active ? siren.stop() : siren.start()}
            className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 text-left transition-colors active:scale-[0.97] ${siren.active ? "border-rose-500/40 bg-rose-900/20" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${siren.active ? "bg-rose-500/20 animate-pulse" : "bg-rose-500/10"}`}>
              <span className={siren.active ? "text-rose-300" : "text-rose-500"}>
                <SirenIcon />
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{siren.active ? "Stop Siren" : "Siren"}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{siren.active ? "Tap to mute" : "Loud alarm"}</p>
            </div>
          </button>

          {/* Voice Note */}
          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Voice Note — stored on device</p>
            <VoiceNoteRecorder />
          </div>
        </div>

        {/* Shake / Keyboard SOS */}
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs font-bold text-amber-300">Shake / Keypress SOS</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Press <kbd>S</kbd> three times (within 2.5s, not in a text field) to trigger a 3s cancel countdown, then SOS. On iPhone, tap below to grant motion access.
            </p>
            <button
              type="button"
              onClick={enableShakeMotion}
              className="mt-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 px-3 py-1.5 text-[10px] font-bold text-amber-300 transition-colors"
            >
              Enable shake detection
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Emergency Hotlines ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Emergency hotlines · Pakistan</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Police", no: "15", color: "from-rose-600 to-red-700", icon: Phone },
            { name: "Madadgaar", no: "1099", color: "from-pink-600 to-rose-600", icon: Heart },
            { name: "FIA Cyber", no: "1991", color: "from-violet-600 to-purple-700", icon: Shield },
            { name: "Punjab Women", no: "1043", color: "from-purple-600 to-indigo-700", icon: Building2 },
          ].map((h) => {
            const Icon = h.icon;
            return (
              <a
                key={h.name}
                href={`tel:${h.no}`}
                className="rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] p-3.5 flex items-center gap-3 no-underline group transition-colors active:scale-[0.97]"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${h.color} flex items-center justify-center shrink-0 shadow-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 truncate">{h.name}</p>
                  <p className="text-lg font-black text-white leading-tight tracking-tight">{h.no}</p>
                </div>
                <Phone className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors shrink-0" />
              </a>
            );
          })}
        </div>
      </div>

      {/* ── 5. Account ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
            <UserCircle className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-sm font-bold text-white">Your account</p>
        </div>
        <AuthHub />
        {session ? (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Session active
            </span>
            <button onClick={checkSession} className="text-[10px] font-semibold text-slate-500 hover:text-purple-400 transition-colors">Refresh</button>
          </div>
        ) : (
          <div className="border-t border-white/5 pt-3 space-y-2">
            <p className="text-[11px] text-slate-500">Phone verification (optional)</p>
            <div className="flex gap-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 …"
                type="tel"
                className="flex-1 rounded-xl glass-dark px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none"
              />
              <button onClick={requestOtp} className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-2 text-xs font-bold">Send OTP</button>
            </div>
            <div className="flex gap-2">
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="6-digit code"
                inputMode="numeric"
                className="flex-1 rounded-xl glass-dark px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-pink-500 outline-none"
              />
              <button onClick={verifyOtp} className="shrink-0 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 text-xs font-bold transition-colors">Verify</button>
            </div>
            {authMsg ? <p className="text-xs text-slate-400">{authMsg}</p> : null}
          </div>
        )}
      </div>

      {/* ── 6. App Settings ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">App settings</p>
        <div className="space-y-1">
          {/* Stealth */}
          <div className="flex items-center gap-3 px-1 py-3 rounded-2xl hover:bg-white/[0.03] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
              <EyeOff className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Stealth mode</p>
              <p className="text-[10px] text-slate-500 mt-0.5">App disguises as "Personal Notes"</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.stealthMode} onChange={(e) => updateSetting({ stealthMode: e.target.checked })} />
              <span className="toggle-track" />
            </label>
          </div>
          <div className="h-px bg-white/[0.04] mx-3" />
          {/* Auto-dial */}
          <div className="flex items-center gap-3 px-1 py-3 rounded-2xl hover:bg-white/[0.03] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Auto-dial police</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Open emergency dial on SOS trigger</p>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={settings.autoDialPolice} onChange={(e) => updateSetting({ autoDialPolice: e.target.checked })} />
              <span className="toggle-track" />
            </label>
          </div>
          <div className="h-px bg-white/[0.04] mx-3" />
          {/* PIN */}
          <div className="flex items-center gap-3 px-1 py-3 rounded-2xl hover:bg-white/[0.03] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">SOS cancel PIN</p>
              <p className="text-[10px] text-slate-500 mt-0.5">4 digits to cancel false alarms</p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={settings.cancelPin}
              onChange={(e) => updateSetting({ cancelPin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              className="w-16 rounded-xl bg-white/10 border border-white/15 px-2 py-2 text-sm text-center text-white font-mono tracking-widest focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── 7. Evidence Vault (collapsible) ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEvidenceVault((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[0.03] transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-pink-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Secure Evidence Vault</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Hash-chained tamper-proof records</p>
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showEvidenceVault ? "rotate-90" : ""}`} />
        </button>
        {showEvidenceVault ? (
          <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-4 animate-in slide-up duration-200">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Each entry is SHA-256 hashed and chained to prevent modification — admissible evidence trail.
            </p>
            <input
              value={evidenceForm.incidentId}
              onChange={(e) => setEvidenceForm((prev) => ({ ...prev, incidentId: e.target.value }))}
              placeholder="Incident ID / Case name"
              className="w-full rounded-xl glass-dark px-3 py-2.5 text-sm focus:ring-1 focus:ring-pink-500 outline-none"
            />
            <input
              value={evidenceForm.title}
              onChange={(e) => setEvidenceForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Evidence title"
              className="w-full rounded-xl glass-dark px-3 py-2.5 text-sm focus:ring-1 focus:ring-pink-500 outline-none"
            />
            <textarea
              value={evidenceForm.content}
              onChange={(e) => setEvidenceForm((prev) => ({ ...prev, content: e.target.value }))}
              rows={3}
              placeholder="Describe the incident or paste links / details…"
              className="w-full rounded-xl glass-dark px-3 py-2.5 text-sm min-h-[80px] focus:ring-1 focus:ring-pink-500 outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={uploadEvidence}
                className="flex-1 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white py-2.5 text-xs font-bold active:scale-95 transition-transform"
              >
                Sign & Lock Evidence
              </button>
              <button
                onClick={exportEvidencePacket}
                className="rounded-xl glass px-4 py-2.5 text-slate-300 hover:text-white transition-colors"
                title="Export packet"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            {evidenceMsg ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start gap-2 animate-in slide-up">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-emerald-300 font-mono break-all">{evidenceMsg}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ── 8. Legal Requests (collapsible) ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <button
          type="button"
          onClick={() => { setShowLegalReqs((v) => !v); if (!showLegalReqs) loadConsultRequests(); }}
          className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/[0.03] transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Legal Consultation Requests</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Track your submitted cases</p>
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showLegalReqs ? "rotate-90" : ""}`} />
        </button>
        {showLegalReqs ? (
          <div className="px-4 pb-4 border-t border-white/6 pt-4 animate-in slide-up duration-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Your requests</p>
              <button onClick={loadConsultRequests} className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition-colors">Refresh</button>
            </div>
            {consultLoading ? (
              <div className="flex items-center gap-2 py-4 justify-center text-slate-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing…
              </div>
            ) : consultRequests.length === 0 ? (
              <div className="py-8 text-center">
                <Scale className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No active legal consultation requests.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {consultRequests.map((item) => (
                  <div key={item.id} className="rounded-2xl glass-dark p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white">{item.issueType}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${item.urgent ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-purple-500/20 text-purple-400 border border-purple-500/20"}`}>
                        {item.urgent ? "Urgent" : "Queued"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">{item.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[9px] text-slate-500">{item.city}</p>
                      <p className="text-[9px] text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ShieldHub({ onSelectTool, onNavigate }) {
  const aiTools = [
    { id: "dm",       title: "DM Harassment Scanner", icon: MessageSquare, desc: "Scan screenshots for threats · PECA 2016 citations", accent: "text-pink-400",   bg: "bg-pink-500/10" },
    { id: "deepfake", title: "Deepfake Detector",      icon: ImageIcon,     desc: "Verify image authenticity with Gemini vision",         accent: "text-violet-400", bg: "bg-violet-500/10" },
    { id: "voice",    title: "Voice Clone Detector",   icon: Volume2,       desc: "Analyze suspicious audio for manipulation",            accent: "text-blue-400",   bg: "bg-blue-500/10" },
    { id: "distress", title: "Distress Listener",      icon: Ear,           desc: "Auto-SOS when a scream or keyword is detected",        accent: "text-rose-400",   bg: "bg-rose-500/10" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-6 animate-in fade-in">

      {/* AI Protection */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">AI protection tools</p>
        <p className="text-[11px] text-slate-600 mb-3">Groq Llama 3.3 · Gemini Vision — use alongside your own judgment</p>
        <div className="space-y-2">
          {aiTools.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" onClick={() => onSelectTool(t.id)}
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] p-4 text-left flex items-center gap-4 group transition-all active:scale-[0.99]">
                <div className={`w-11 h-11 rounded-xl ${t.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 ${t.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{t.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{t.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Legal Protection */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Legal protection · Pakistan</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: "hifazat", title: "Hifazat Legal Guide", icon: MessageCircle, desc: "Safety legal Q&A in English & Urdu. Works offline for common topics.", accent: "text-teal-400", bg: "bg-teal-500/10" },
            { id: "legal",   title: "Legal AI Desk",        icon: Scale,         desc: "Draft FIR, rights guidance, PECA 2016 · request lawyer consult.",   accent: "text-indigo-400", bg: "bg-indigo-500/10" },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" onClick={() => onNavigate(t.id)}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] p-4 text-left group transition-all active:scale-[0.99]">
                <div className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 ${t.accent}`} />
                </div>
                <p className="text-sm font-bold text-white">{t.title}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emergency quick-dial strip */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Emergency hotlines</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: "Police", no: "15", color: "from-rose-600 to-red-700" },
            { name: "Madadgaar", no: "1099", color: "from-pink-600 to-rose-600" },
            { name: "FIA Cyber", no: "1991", color: "from-violet-600 to-purple-700" },
            { name: "Rescue", no: "1122", color: "from-blue-600 to-indigo-700" },
          ].map((h) => (
            <a key={h.name} href={`tel:${h.no}`}
              className="rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] px-3 py-2.5 flex items-center gap-2.5 no-underline group transition-colors active:scale-[0.97]">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${h.color} flex items-center justify-center shrink-0`}>
                <Phone className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">{h.name}</p>
                <p className="text-base font-black text-white leading-tight">{h.no}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingChatbot() {
  const { error: chatToastError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi! I'm Nigehbaan AI. How can I help you stay safe today?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  const send = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userText = input.trim();
    const next = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const data = await api("/legal/chat", { method: "POST", body: JSON.stringify({ message: userText, history: next.slice(0, -1) }) });
      setMessages([...next, { role: "assistant", content: data.reply || "No reply returned." }]);
    } catch (e) {
      chatToastError(e?.message || "Legal chat unreachable.");
      setMessages([...next, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] h-[500px] rounded-3xl glass shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10 flex flex-col overflow-hidden animate-in slide-up zoom-in duration-300">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">Nigehbaan AI</p>
                <p className="text-[10px] text-white/75 font-medium">Groq (Llama 3.3) · Gemini fallback</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#141523]/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-white/10 text-slate-200 border border-white/10 rounded-bl-none"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-none px-4 py-2.5 text-slate-400 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" /> Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button disabled={!input.trim() || loading} className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white active:scale-95 transition-transform disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300"
      >
        {isOpen ? <ChevronLeft className="w-8 h-8 rotate-180" /> : <MessageSquare className="w-8 h-8" />}
      </button>
    </div>
  );
}

export default function App() {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    configureApiAuth({ getToken });
    return () => configureApiAuth({ getToken: null });
  }, [getToken]);
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [supabaseAuthReady, setSupabaseAuthReady] = useState(!supabaseEnabled);
  const [devBypass, setDevBypass] = useState(false);
  
  const [screen, setScreen] = useState("home");
  const [shieldTool, setShieldTool] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [lang, setLang] = useState("en");
  const [contacts, setContacts] = useState([]);
  const [settings, setSettings] = useState({ stealthMode: false, autoDialPolice: true, cancelPin: "1234" });
  const [backendOk, setBackendOk] = useState(true);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [shakeSosSecs, setShakeSosSecs] = useState(null);
  const shakeTimerRef = useRef(null);
  const impulseTimesRef = useRef([]);
  const shakeCountdownActiveRef = useRef(false);

  const [motionConsent, setMotionConsent] = useState(() => {
    if (typeof navigator === "undefined") return true;
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS) return true;
    try {
      return localStorage.getItem("nigehbaan_motion") === "1";
    } catch {
      return false;
    }
  });
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [timelineText, setTimelineText] = useState("");
  const [timelineSaving, setTimelineSaving] = useState(false);
  const [clerkProfileSyncHint, setClerkProfileSyncHint] = useState(null);
  const [communityFeed, setCommunityFeed] = useState([]);
  const [showFirstVisitWelcome, setShowFirstVisitWelcome] = useState(false);

  const { success: appToastSuccess, error: appToastError } = useToast();

  useEffect(() => {
    try {
      setShowFirstVisitWelcome(localStorage.getItem("nigaban_welcomed") !== "true");
    } catch {
      setShowFirstVisitWelcome(true);
    }
  }, []);

  const loadCommunityFeed = async () => {
    try {
      const data = await api("/community/feed?city=Lahore");
      setCommunityFeed(data.feed || []);
    } catch (e) {
      appToastError(e?.message || "Could not refresh home feed.");
    }
  };

  useEffect(() => {
    loadCommunityFeed();
    const interval = setInterval(loadCommunityFeed, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) {
      setSupabaseAuthReady(true);
      return undefined;
    }
    let cancelled = false;
    const bootTimeout = window.setTimeout(() => {
      if (!cancelled) setSupabaseAuthReady(true);
    }, 6_000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) setSupabaseSession(session);
      })
      .catch(() => {
        if (!cancelled) setSupabaseSession(null);
      })
      .finally(() => {
        if (!cancelled) {
          window.clearTimeout(bootTimeout);
          setSupabaseAuthReady(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(bootTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!clerkLoaded || !clerkSignedIn) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await fetch("/api/auth/clerk-sync", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const raw = await res.text().catch(() => "");
        let body = {};
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          body = {};
        }
        if (!res.ok) {
          const msg =
            typeof body.error === "string"
              ? body.error
              : raw?.trim() || `Profile sync failed (${res.status})`;
          setClerkProfileSyncHint(msg);
          if (import.meta.env.DEV) console.warn("[clerk-sync]", res.status, raw);
        } else {
          setClerkProfileSyncHint(null);
        }
      } catch (e) {
        setClerkProfileSyncHint("Could not reach server for profile sync. Use npm run dev:full.");
        if (import.meta.env.DEV) console.warn("[clerk-sync]", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, clerkSignedIn, clerkUser?.id, getToken]);

  const isAuthenticated = clerkSignedIn || !!supabaseSession;

  useEffect(() => {
    const onMotionEnabled = () => setMotionConsent(true);
    window.addEventListener("nigehbaan-motion-enabled", onMotionEnabled);
    return () => window.removeEventListener("nigehbaan-motion-enabled", onMotionEnabled);
  }, []);

  const cancelShakeSos = () => {
    if (shakeTimerRef.current) {
      clearInterval(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
    shakeCountdownActiveRef.current = false;
    setShakeSosSecs(null);
  };

  const armSosCountdown = useCallback(() => {
    if (sosActive) return;
    if (shakeTimerRef.current) return;
    shakeCountdownActiveRef.current = true;
    let left = 3;
    setShakeSosSecs(left);
    shakeTimerRef.current = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        if (shakeTimerRef.current) clearInterval(shakeTimerRef.current);
        shakeTimerRef.current = null;
        shakeCountdownActiveRef.current = false;
        setShakeSosSecs(null);
        setSosActive(true);
        return;
      }
      setShakeSosSecs(left);
    }, 1000);
  }, [sosActive]);

  useEffect(() => {
    if (!(isAuthenticated || devBypass) || sosActive || !motionConsent) return undefined;
    let lastMag = 0;
    let primed = false;
    const onMotion = (e) => {
      if (shakeCountdownActiveRef.current) return;
      const raw = e.acceleration;
      const g = raw && (raw.x != null || raw.y != null) ? raw : e.accelerationIncludingGravity;
      if (!g || g.x == null) return;
      const mag = Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z);
      if (!primed) {
        primed = true;
        lastMag = mag;
        return;
      }
      const delta = Math.abs(mag - lastMag);
      lastMag = lastMag * 0.65 + mag * 0.35;
      if (delta < 13) return;
      const now = performance.now();
      impulseTimesRef.current = impulseTimesRef.current.filter((t) => now - t < 1600);
      impulseTimesRef.current.push(now);
      if (impulseTimesRef.current.length < 3) return;
      impulseTimesRef.current = [];
      armSosCountdown();
    };
    window.addEventListener("devicemotion", onMotion, true);
    return () => {
      window.removeEventListener("devicemotion", onMotion, true);
    };
  }, [isAuthenticated, devBypass, sosActive, motionConsent, armSosCountdown]);

  useEffect(() => {
    if (!(isAuthenticated || devBypass) || sosActive) return undefined;
    const recent = [];
    const onKey = (e) => {
      if (e.repeat) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key !== "s" && e.key !== "S") return;
      const now = Date.now();
      recent.push(now);
      while (recent.length && now - recent[0] > 2500) recent.shift();
      if (recent.length >= 3) {
        recent.length = 0;
        armSosCountdown();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isAuthenticated, devBypass, sosActive, armSosCountdown]);

  const userProfile = clerkSignedIn ? (clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.fullName || "User") : supabaseSession ? supabaseSession.user.email : devBypass ? "Guest" : null;

  const handleSignOut = async () => {
    setClerkProfileSyncHint(null);
    if (clerkSignedIn) {
      await clerkSignOut();
    } else if (supabaseSession && supabase) {
      await supabase.auth.signOut();
    }
    setDevBypass(false);
  };

  useEffect(() => {
    Promise.all([api("/health"), api("/state")])
      .then(([health, state]) => {
        if (!health || health.ok === false || health.status === "error") {
          setBackendOk(false);
          return;
        }
        setBackendOk(true);
        setContacts(state.contacts || []);
        setSettings((prev) => state.settings || prev);
      })
      .catch(() => setBackendOk(false));
  }, []);

  const loadTimeline = useMemo(() => async () => {
    try {
      const data = await api("/safety/timeline");
      setTimelineEntries(data.entries || []);
    } catch {
      setTimelineEntries([]);
    }
  }, []);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  useEffect(() => {
    const timerId = setInterval(() => {
      loadTimeline();
    }, 9000);
    return () => clearInterval(timerId);
  }, [loadTimeline]);

  const addTimelineEntry = async () => {
    if (!timelineText.trim() || timelineSaving) return;
    setTimelineSaving(true);
    try {
      await api("/safety/timeline", {
        method: "POST",
        body: JSON.stringify({
          text: timelineText.trim(),
          context: "home-screen-quick-entry",
        }),
      });
      setTimelineText("");
      await loadTimeline();
      appToastSuccess("Safety note saved.");
    } catch (e) {
      appToastError(e?.message || "Could not save safety note.");
    } finally {
      setTimelineSaving(false);
    }
  };

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };
    const onInstalled = () => {
      setInstallPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    try {
      await installPromptEvent.userChoice;
    } catch {
      // ignore dismissal
    }
    setInstallPromptEvent(null);
  };

  const handleNavigate = (target) => {
    setScreen(target);
    setShieldTool(null);
  };

  const rendered = useMemo(() => {
    if (screen === "home") return <HomeScreen onNavigate={handleNavigate} contacts={contacts} timelineEntries={timelineEntries} timelineText={timelineText} setTimelineText={setTimelineText} onAddTimeline={addTimelineEntry} timelineSaving={timelineSaving} communityFeed={communityFeed} />;
    if (screen === "map") return <SafetyMapScreen />;
    if (screen === "hifazat") return <HifazatGuide variant="page" />;
    if (screen === "legal") return <LegalChat />;
    if (screen === "transit") return <SafeTransit contacts={contacts} autoDialPolice={settings.autoDialPolice} />;
    if (screen === "community") return <CommunityScreen />;
    if (screen === "more") return <MoreScreen settings={settings} setSettings={setSettings} contacts={contacts} setContacts={setContacts} onNavigate={handleNavigate} />;
    if (screen === "shield") {
      if (shieldTool === "dm") return <DMScanner />;
      if (shieldTool === "deepfake") return <DeepfakeDetector />;
      if (shieldTool === "voice") return <VoiceDetector />;
      if (shieldTool === "distress") return <DistressListener onTriggerSOS={() => setSosActive(true)} />;
      return <ShieldHub onSelectTool={setShieldTool} onNavigate={handleNavigate} />;
    }
    return null;
  }, [screen, shieldTool, contacts, settings, timelineEntries, timelineText, timelineSaving, communityFeed]);

  const title =
    screen === "map"
      ? "Safety Map"
      : screen === "transit"
      ? "Safe Transit"
      : screen === "community"
      ? "Community"
      : screen === "more"
      ? "Profile"
      : screen === "legal"
      ? "Legal AI Desk"
      : screen === "hifazat"
      ? "Hifazat Guide"
      : screen === "shield" && shieldTool === "dm"
      ? "DM Harassment Scanner"
      : screen === "shield" && shieldTool === "deepfake"
      ? "Deepfake Detector"
      : screen === "shield" && shieldTool === "voice"
      ? "Voice Clone Detector"
      : screen === "shield" && shieldTool === "distress"
      ? "Distress Listener"
      : screen === "shield" && !shieldTool
      ? "AI Shield"
      : null;

  const authShellLoading = !clerkLoaded || !supabaseAuthReady;
  const firstVisitOverlay = showFirstVisitWelcome ? (
    <FirstVisitWelcome onComplete={() => setShowFirstVisitWelcome(false)} />
  ) : null;

  if (authShellLoading && !devBypass) {
    return (
      <>
        {firstVisitOverlay}
        <div className="min-h-screen bg-[#141523] flex flex-col items-center justify-center px-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <p className="mt-4 text-xs text-slate-500 max-w-sm">
            Loading sign-in… If this never finishes, check <span className="text-slate-400">VITE_CLERK_PUBLISHABLE_KEY</span>, Supabase URL/keys, and network. Run{" "}
            <span className="font-mono text-slate-400">npm run dev:full</span> so the API is up.
          </p>
        </div>
      </>
    );
  }

  if (!isAuthenticated && !devBypass) {
    return (
      <>
        {firstVisitOverlay}
        <WelcomeAuthScreen onBypass={() => setDevBypass(true)} installPromptEvent={installPromptEvent} onInstall={handleInstallApp} />
      </>
    );
  }

  return (
    <>
      {firstVisitOverlay}
    <div className="min-h-[100dvh] bg-[#141523] text-white w-full">
      <div className="w-full min-h-[100dvh] bg-[#141523] overflow-hidden flex flex-col relative z-0">
        {!sosActive ? (
          <div className="sticky top-0 z-20 shrink-0 glass-dark border-b border-white/10 backdrop-blur-md">
            <Header
              lang={lang}
              setLang={setLang}
              title={title}
              showBack={
                (screen === "shield" && shieldTool !== null) ||
                screen === "hifazat" ||
                screen === "legal" ||
                screen === "transit" ||
                screen === "map"
              }
              onBack={() => {
                if (screen === "hifazat") handleNavigate("home");
                else if (screen === "legal") handleNavigate("shield");
                else if (screen === "transit") handleNavigate("home");
                else if (screen === "map") handleNavigate("home");
                else setShieldTool(null);
              }}
              userProfile={userProfile}
              onSignOut={handleSignOut}
              isClerk={clerkSignedIn}
              stealthMode={settings.stealthMode}
            />
            {screen === "shield" ? (
              <ShieldSubNav
                active={shieldTool}
                onSelect={(tool) => {
                  setScreen("shield");
                  setShieldTool(tool);
                }}
              />
            ) : null}
          </div>
        ) : null}
        <main
          className={`flex-1 min-h-0 ${screen === "legal" || screen === "hifazat" ? "flex flex-col overflow-hidden" : "overflow-y-auto"} ${!sosActive ? "pb-28" : ""}`}
        >
          {rendered}
        </main>
        {!sosActive ? (
          <>
            {installPromptEvent ? (
              <div className="fixed bottom-[4.25rem] left-0 right-0 z-[45] px-3 pointer-events-none max-w-7xl mx-auto">
                <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#1e1040]/95 backdrop-blur-md px-3 py-2 shadow-lg">
                  <p className="text-[11px] text-slate-200 leading-snug">
                    <span className="font-bold text-white">Install NIgaban</span> — works offline after first load.
                  </p>
                  <button
                    type="button"
                    onClick={handleInstallApp}
                    className="shrink-0 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-1.5 text-[10px] font-bold text-white"
                  >
                    Install
                  </button>
                </div>
              </div>
            ) : null}
            <BottomNav active={screen} onNavigate={handleNavigate} onSOS={() => setSosActive(true)} />
          </>
        ) : null}
        {shakeSosSecs !== null ? (
          <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-sm rounded-2xl border border-rose-500/35 bg-[#141523] p-6 text-center space-y-4 shadow-2xl">
              <p className="text-sm font-bold text-white uppercase tracking-wide">Shake SOS</p>
              <p className="text-5xl font-black text-rose-400 tabular-nums">{shakeSosSecs}</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emergency SOS starts when this reaches zero (shake or triple-<kbd className="px-1 rounded bg-white/10">S</kbd> demo). Cancel if this was accidental.
              </p>
              <button type="button" onClick={cancelShakeSos} className="w-full py-3.5 rounded-xl bg-white text-rose-900 font-bold text-sm active:scale-[0.99] transition-transform">
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {sosActive ? <SOSScreen onClose={() => setSosActive(false)} contacts={contacts} autoDialPolice={settings.autoDialPolice} cancelPin={settings.cancelPin} /> : null}
      </div>
      {!backendOk ? (
        <div className="fixed bottom-[5.5rem] right-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-900 flex items-center gap-1.5 z-50 max-w-[min(92vw,20rem)]">
          <AlertCircle className="w-3.5 h-3.5" /> Backend offline. Start with `npm run dev:full`.
        </div>
      ) : null}
      {clerkSignedIn && clerkProfileSyncHint ? (
        <div className="fixed bottom-[5.5rem] left-3 max-w-sm rounded-xl border border-amber-400/40 bg-amber-950/90 px-3 py-2 text-[11px] text-amber-100 flex items-start gap-2 z-50 shadow-lg">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
          <span>
            <span className="font-semibold text-amber-200">Account sync: </span>
            {clerkProfileSyncHint}
          </span>
        </div>
      ) : null}
    </div>
    </>
  );
}
