import { useEffect, useMemo, useRef, useState } from "react";
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
  const displayTitle = stealthMode ? "Personal Notes" : title || "Nigehbaan";
  const displaySubtitle = stealthMode ? "Drafts · your notes" : "نگہبان · your guardian";
  return (
    <header className="sticky top-0 z-20 glass-dark px-4 py-3 flex items-center justify-between">
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
          {!title ? <p className="text-[10px] text-slate-400">{displaySubtitle}</p> : null}
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
    </header>
  );
}

function BottomNav({ active, onNavigate, onSOS }) {
  const tabBtn = (id, Icon, label) => {
    const activeTab = active === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all duration-200 ${
          activeTab ? "text-purple-300 bg-white/10 shadow-lg shadow-purple-500/10" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-[10px] font-semibold truncate max-w-full px-0.5">{label}</span>
      </button>
    );
  };
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-dark border-t border-white/10 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="max-w-5xl mx-auto flex items-end justify-between gap-0 px-1">
        {tabBtn("home", Home, "Home")}
        {tabBtn("map", MapPin, "Map")}
        <div className="flex flex-col items-center shrink-0 px-1">
          <button
            type="button"
            onClick={onSOS}
            className="-mt-8 mb-0.5 w-16 h-16 rounded-full bg-gradient-to-br from-rose-600 to-red-700 border-[3px] border-[#141523] shadow-xl shadow-rose-900/45 flex flex-col items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Emergency SOS"
          >
            <AlertTriangle className="w-6 h-6" />
            <span className="text-[9px] font-black leading-none">SOS</span>
          </button>
        </div>
        {tabBtn("more", UserCircle, "Profile")}
      </div>
    </nav>
  );
}

function WelcomeAuthScreen({ onBypass, installPromptEvent, onInstall }) {
  const authCardRef = useRef(null);
  const slides = [
    {
      title: "Built for women’s safety",
      description:
        "One place for SOS, trusted contacts, harassment screening, and safer travel—so you can move through your day with more control.",
      icon: Shield,
      color: "bg-rose-500/20 text-rose-200 border border-rose-500/20",
    },
    {
      title: "Legal + Evidence in One Place",
      description:
        "Use Legal Aid Chat and DM Scanner to understand rights and keep ready-to-use evidence.",
      icon: Scale,
      color: "bg-indigo-500/20 text-indigo-200 border border-indigo-500/20",
    },
    {
      title: "Emergency Ready",
      description:
        "Configure trusted contacts and SOS PIN. One tap can alert family and emergency support.",
      icon: AlertTriangle,
      color: "bg-red-500/20 text-red-200 border border-red-500/20",
    },
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((v) => (v + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-[#0a0b12] w-full animate-in fade-in overflow-y-auto">
      <MarketingLanding
        onTryBrowser={() => authCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        onBypass={onBypass}
        installPromptEvent={installPromptEvent}
        onInstall={onInstall}
      />

      <div ref={authCardRef} className="scroll-mt-4 border-t border-white/10 bg-gradient-to-b from-[#141523] to-[#0a0b12] px-5 py-12 max-w-lg mx-auto w-full space-y-8">
        <div className="surface-card surface-card-interactive p-6" key={step}>
          <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${slide.color} shadow-inner`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white mb-2">{slide.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{slide.description}</p>
          <div className="mt-5 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-gradient-to-r from-pink-500 to-purple-600" : "w-4 bg-white/15 hover:bg-white/25"}`}
              />
            ))}
          </div>
        </div>

        <ul className="text-left space-y-3 text-sm text-slate-300">
          <li className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              <span className="font-semibold text-white">SOS + GPS log</span> — one countdown, trusted contacts notified, location stored for evidence.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              <span className="font-semibold text-white">Live map &amp; feed</span> — see hotspots, tap pins for AI summaries from recent reports.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              <span className="font-semibold text-white">Groq-powered insights</span> — instant risk tips on reports and emergencies (with helpline pointers).
            </span>
          </li>
        </ul>

        <div className="surface-card p-6 scroll-mt-8">
          <p className="text-center text-sm font-bold text-white mb-4">Sign in</p>
          <AuthHub />
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-col items-center gap-2">
            <p className="text-[11px] text-slate-400">Having trouble signing in?</p>
            <button
              type="button"
              onClick={onBypass}
              className="rounded-lg glass px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Continue as Guest (Dev Bypass)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({
  onNavigate,
  onSOS,
  lang,
  contactsCount,
  canInstall,
  onInstall,
  timelineEntries,
  timelineText,
  setTimelineText,
  onAddTimeline,
  timelineSaving,
  communityFeed,
}) {
  const quickChecklist = [
    { id: "contacts", label: "Add 3 trusted contacts", done: contactsCount >= 3, action: "more" },
    { id: "timeline", label: "Create a safety note", done: timelineEntries.length > 0, action: "home" },
    { id: "community", label: "Check city alerts", done: communityFeed.length > 0, action: "community" },
  ];

  const tagline =
    lang === "ur"
      ? "نگہبان — خواتین کے لیے SOS، قانونی مدد، AI حفاظت، اور محفوظ سفر ایک ایپ میں۔"
      : "Nigehbaan (نگہبان — “guardian”) is a women’s safety app: SOS, legal help, Gemini-powered screening, trusted contacts, and safer travel—designed to stay clear when stress is high.";

  const capabilityPillars = [
    { title: "Emergency SOS", detail: "One tap, trusted contacts, optional police dial." },
    { title: "Groq + legal & scan", detail: "Fast AI for rights guidance; DM and media checks (Gemini vision where used)." },
    { title: "Safe transit", detail: "Check-ins and journey notes you control." },
    { title: "City pulse", detail: "Community reports so you can avoid hot spots." },
  ];

  return (
    <div className="pb-28 animate-in fade-in overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0b12] via-[#1a1530] to-[#141523] px-6 pt-12 pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
          <div className="space-y-3 animate-in slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300/90">
              <Shield className="w-3.5 h-3.5 shrink-0" /> Nigehbaan · women’s safety
            </div>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">{tagline}</p>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tight animate-in slide-up duration-500">
            Secure. <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">Transparent.</span> <br/>
            Unstoppable.
          </h1>
          
          <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto animate-in slide-up duration-700">
            Practical tools—not hype—so you can document, decide, and reach help on your terms.
          </p>
          
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4 animate-in slide-up duration-1000">
            <button type="button" onClick={onSOS} className="group w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-base shadow-[0_0_40px_rgba(225,29,72,0.25)] hover:shadow-[0_0_48px_rgba(225,29,72,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" /> Emergency SOS
            </button>
            <button type="button" onClick={() => onNavigate("shield")} className="w-full sm:w-auto px-10 py-4 rounded-2xl surface-card text-white font-bold text-base active:scale-[0.98] transition-all">
              AI Threat Shield
            </button>
            {canInstall ? (
              <button type="button" onClick={onInstall} className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold text-slate-200 hover:bg-white/10 active:scale-[0.98] transition-all">
                Install app
              </button>
            ) : null}
          </div>
          
          <div className="pt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto animate-in slide-up duration-1000 delay-150 text-left">
            {capabilityPillars.map((c) => (
              <div key={c.title} className="surface-card surface-card-interactive px-5 py-4">
                <p className="text-sm font-semibold text-white">{c.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-snug">{c.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Score & Live Feed Overlay */}
      <div className="px-6 -mt-16 relative z-20 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="surface-card p-8 md:rounded-[2rem]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Safety Readiness</p>
              <h3 className="text-2xl font-bold text-white mt-1">Profile Strength</h3>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-purple-400">{Math.min(100, 40 + contactsCount * 15 + (timelineEntries.length > 0 ? 20 : 0))}%</p>
            </div>
          </div>
          <div className="h-4 rounded-full bg-white/5 overflow-hidden p-1 border border-white/5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-600 to-violet-600 transition-all duration-1000 shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
              style={{ width: `${Math.min(100, 40 + contactsCount * 15 + (timelineEntries.length > 0 ? 20 : 0))}%` }} 
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {quickChecklist.map(item => (
              <div key={item.id} className={`px-4 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${item.done ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"}`}>
                {item.done ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 animate-pulse" />}
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-8 md:rounded-[2rem]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Community Pulse</p>
              <h3 className="text-2xl font-bold text-white mt-1">Live Safety Alerts</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black animate-pulse border border-emerald-500/20">
              <Activity className="w-3 h-3" /> LIVE
            </div>
          </div>
          <div className="space-y-4">
            {communityFeed.slice(0, 2).map((item) => (
              <div key={item.id} className="group flex items-center gap-4 p-4 rounded-3xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10" onClick={() => onNavigate("community")}>
                <div className={`w-3 h-3 rounded-full shrink-0 shadow-[0_0_10px] ${item.level === "high" ? "bg-red-500 shadow-red-500/50" : "bg-amber-500 shadow-amber-500/50"}`} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-200 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            ))}
            {communityFeed.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 italic">Scanning for local activity...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div className="px-6 mt-24 max-w-6xl mx-auto w-full text-center space-y-8 animate-in slide-up">
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">What Nigehbaan does</h2>
        <p className="text-slate-400 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
          The app keeps your safety workflow in one place: emergency SOS, trusted contacts, a private timeline for notes, legal-style guidance (not a substitute for a lawyer), AI-assisted scans of messages and media, safe transit check-ins, and a local alert feed—so you can respond with context instead of panic.
        </p>
      </div>

      {/* Feature Grid - Cards Section */}
      <div className="px-6 mt-24 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">One app, one calm flow</h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
            Core modules use Groq (Llama 3.3) for chat and incident insights; vision scans may use Gemini—plain UI for everything else.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: "shield", title: "AI Threat Shield", desc: "Scan messages or audio for red flags before you reply or meet.", icon: Shield, color: "text-purple-400" },
            { id: "transit", title: "Safe Transit", desc: "Share trip context and check in with people you trust.", icon: MapPin, color: "text-emerald-400" },
            { id: "legal", title: "Legal AI desk", desc: "Orient on rights and paperwork—then speak with a qualified lawyer for decisions.", icon: Scale, color: "text-blue-400" },
          ].map((f) => (
            <button 
              key={f.id} 
              type="button"
              onClick={() => onNavigate(f.id)}
              className="group surface-card surface-card-interactive p-8 md:p-10 text-center flex flex-col items-center space-y-5"
            >
              <div className="w-16 h-16 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center group-hover:scale-[1.04] transition-transform">
                <f.icon className={`w-8 h-8 ${f.color}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* How to Use Section - Cards */}
      <div className="px-6 mt-32 max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">How to use it</h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">Three steps—set up once, then each outing takes seconds.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Set up your circle", desc: "Add trusted contacts and a 4-digit SOS cancel PIN in More.", icon: Heart, bg: "bg-rose-500/10", border: "border-rose-500/25", color: "text-rose-400" },
            { step: "02", title: "Turn on what you need", desc: "Safe Transit when commuting; Distress Listener only when you want audio watch.", icon: Smartphone, bg: "bg-blue-500/10", border: "border-blue-500/25", color: "text-blue-400" },
            { step: "03", title: "Act fast if it spikes", desc: "SOS notifies your circle; optional auto-dial is configurable.", icon: AlertCircle, bg: "bg-emerald-500/10", border: "border-emerald-500/25", color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.step} className={`group relative overflow-hidden surface-card surface-card-interactive p-8 border ${s.border}`}>
              <div className={`w-16 h-16 rounded-2xl ${s.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <s.icon className={`w-8 h-8 ${s.color}`} />
              </div>
              <h4 className="text-2xl font-black text-white mb-2">{s.title}</h4>
              <p className="text-slate-400 leading-relaxed mb-6">{s.desc}</p>
              <div className="text-7xl font-black text-white/5 group-hover:text-white/10 transition-colors absolute -bottom-4 -right-2 pointer-events-none">{s.step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Timeline Section */}
      <div className="px-6 mt-32 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-3xl font-black text-white">Safety Timeline</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create a "Digital Paper Trail" of your journey. Useful for evidence or just peace of mind. Every entry is hashed and encrypted.
            </p>
            <div className="p-4 rounded-2xl glass border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">End-to-End Encrypted</p>
            </div>
          </div>
          
          <div className="lg:col-span-2 surface-card p-8 space-y-6 md:rounded-[2rem]">
            <div className="flex gap-3">
              <input
                value={timelineText}
                onChange={(e) => setTimelineText(e.target.value)}
                placeholder="e.g. Boarding bus #42 at Gulberg..."
                className="flex-1 rounded-2xl glass-dark px-6 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500/50 outline-none border-white/5"
              />
              <button
                onClick={onAddTimeline}
                disabled={timelineSaving || !timelineText.trim()}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-xl shadow-purple-900/40 active:scale-95 transition-all disabled:opacity-50"
              >
                {timelineSaving ? "Saving..." : "Log Note"}
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {timelineEntries.map((entry) => (
                <div key={entry.id} className="group rounded-2xl glass-dark p-4 border border-white/5 hover:border-white/10 transition-all animate-in slide-up">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-slate-200">{entry.text}</p>
                    <span className="text-[9px] font-mono text-slate-600 group-hover:text-purple-500 transition-colors">#{entry.id.slice(-4)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> {new Date(entry.createdAt).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Secured</p>
                  </div>
                </div>
              ))}
              {timelineEntries.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center">
                    <Plus className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 italic">Your secure journey log starts here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Local Help & Emergency - Pakistan Specific */}
      <div className="px-6 mt-32 max-w-6xl mx-auto w-full pb-12">
        <div className="surface-card p-8 md:p-10 md:rounded-[2rem]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
            <div>
              <h3 className="text-3xl font-black text-white">Emergency Hotline</h3>
              <p className="text-slate-400 mt-2">Instant access to Pakistan's verified emergency services.</p>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Nationwide</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Police", phone: "15", desc: "Local Police Rescue", color: "from-blue-600/20 to-blue-900/20 text-blue-400 border-blue-500/20" },
              { label: "Cybercrime", phone: "1991", desc: "FIA Cyber Wing", color: "from-purple-600/20 to-purple-900/20 text-purple-400 border-purple-500/20" },
              { label: "Rescue", phone: "1122", desc: "Medical & Fire", color: "from-rose-600/20 to-rose-900/20 text-rose-400 border-rose-500/20" },
              { label: "Women Help", phone: "1099", desc: "Govt. Helpline", color: "from-pink-600/20 to-pink-900/20 text-pink-400 border-pink-500/20" },
            ].map((item) => (
              <a key={item.label} href={`tel:${item.phone}`} className={`group rounded-3xl bg-gradient-to-br p-6 border transition-all hover:-translate-y-1 hover:shadow-xl ${item.color}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{item.label}</p>
                <p className="text-3xl font-black mb-1">{item.phone}</p>
                <p className="text-[11px] font-medium opacity-80">{item.desc}</p>
              </a>
            ))}
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
      await loadFeed(city);
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
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Community Awareness</h2>
            <p className="text-xs text-slate-400 mt-1">Current activities, alerts, and verified safety updates.</p>
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="text-xs rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2 py-1 text-slate-300"
          >
            {["Lahore", "Karachi", "Islamabad", "Peshawar"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => loadFeed(city)}
        className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white py-2.5 text-sm font-semibold"
      >
        Refresh activity feed
      </button>
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${liveUpdates ? "bg-emerald-500" : "bg-stone-400"}`} />
          <p className="text-xs text-slate-300">
            {liveUpdates ? "Real-time updates ON" : "Real-time updates OFF"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastLiveSync ? (
            <p className="text-[10px] text-slate-400">Last sync: {new Date(lastLiveSync).toLocaleTimeString()}</p>
          ) : null}
          <button
            onClick={() => setLiveUpdates((v) => !v)}
            className="text-xs font-semibold text-purple-400"
          >
            {liveUpdates ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2">
        <button
          type="button"
          onClick={() => setActivePanel("feed")}
          className={`rounded-xl py-2 text-[11px] font-semibold leading-tight ${activePanel === "feed" ? "bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white" : "bg-white/10 text-slate-300"}`}
        >
          Feed
        </button>
        <button
          type="button"
          onClick={() => setActivePanel("map")}
          className={`rounded-xl py-2 text-[11px] font-semibold leading-tight ${activePanel === "map" ? "bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white" : "bg-white/10 text-slate-300"}`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setActivePanel("chat")}
          className={`rounded-xl py-2 text-[11px] font-semibold leading-tight ${activePanel === "chat" ? "bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white" : "bg-white/10 text-slate-300"}`}
        >
          Chat
        </button>
      </div>

      {activePanel === "map" ? (
        <div className="animate-in fade-in space-y-2">
          <SafeZonesMap city={city} pins={mapPins} />
        </div>
      ) : null}

      <div className="rounded-2xl glass p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Nearby NGOs ({city})</p>
          <button onClick={() => loadNgos(city)} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">Refresh NGOs</button>
        </div>
        {ngoLoading ? <p className="text-xs text-slate-400">Loading nearby NGOs...</p> : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ngos.map((ngo) => (
            <div key={`${ngo.name}-${ngo.phone}`} className="rounded-xl glass p-3 hover:bg-white/10 transition-colors group">
              <p className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors">{ngo.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{ngo.focus}</p>
              <p className="text-[11px] text-slate-400 mt-1">{ngo.address}</p>
              <a href={`tel:${ngo.phone}`} className="text-xs font-semibold text-purple-400 mt-1 inline-block hover:text-purple-300 transition-colors">{ngo.phone}</a>
            </div>
          ))}
        </div>
        {!ngoLoading && ngos.length === 0 ? <p className="text-xs text-slate-400">No NGOs found for this city.</p> : null}
      </div>

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
      </form> : null}

      {activePanel === "feed" && loading ? (
        <div className="rounded-2xl glass p-4 text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading community activity...
        </div>
      ) : null}

      {activePanel === "feed" ? <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl glass p-4 animate-in slide-up">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-semibold ${levelStyle(item.level)}`}>
                {item.level}
              </span>
              <span className="text-[11px] text-slate-400">
                {new Date(item.time).toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-2">{item.title}</p>
            <p className="text-xs text-slate-400 mt-1">{item.description}</p>
            {item.aiSummary ? (
              <div className="mt-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-purple-300">AI safety insight</p>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">{item.aiSummary}</p>
              </div>
            ) : null}
            {item.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full glass text-purple-400">
                    {tag.replace("-", " ")}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="text-[11px] text-pink-400 mt-2 font-medium">Source: {item.source}</p>
            {item.verified ? (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Verified report
              </div>
            ) : null}
          </div>
        ))}
        {!loading && items.length === 0 ? (
          <div className="rounded-2xl glass p-4 text-sm text-slate-400 text-center italic">
            No activity found. Try a different city or refresh.
          </div>
        ) : null}
      </div> : null}

      <div className="rounded-2xl glass p-4 space-y-3 border border-amber-500/20">
        <p className="text-xs font-semibold text-amber-200">Moderator access (hackathon)</p>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Paste the server <span className="text-slate-300">MODERATOR_BOOTSTRAP_KEY</span> so review calls authenticate. Key is stored only in this browser (localStorage).
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            value={modKeyInput}
            onChange={(e) => setModKeyInput(e.target.value)}
            placeholder="Bootstrap key"
            className="flex-1 rounded-lg glass-dark px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem("nigehbaan_moderator_bootstrap", modKeyInput.trim());
                  success("Moderator key saved for this browser.");
                } catch {
                  toastError("Could not save key in this browser.");
                }
              }}
              className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem("nigehbaan_moderator_bootstrap");
                  setModKeyInput("");
                  success("Moderator key cleared.");
                } catch {
                  // ignore
                }
              }}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl glass p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Moderator queue</p>
          <button type="button" onClick={loadPendingReports} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">Refresh queue</button>
        </div>
        {moderationLoading ? (
          <p className="text-xs text-slate-400">Loading pending reports...</p>
        ) : null}
        {!moderationLoading && pendingReports.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2 italic">No pending reports.</p>
        ) : null}
        <div className="space-y-2">
          {pendingReports.map((report) => (
            <div key={report.id} className="rounded-xl glass-dark p-3 group animate-in slide-up">
              <p className="text-xs text-slate-400">{report.city} • {report.category}</p>
              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">{report.title}</p>
              <p className="text-xs text-slate-400 mt-1">{report.description}</p>
              {report.aiSummary ? (
                <p className="text-[11px] text-purple-200/90 mt-2 leading-snug border-t border-white/10 pt-2">
                  <span className="font-semibold text-purple-300">AI summary: </span>
                  {report.aiSummary}
                </p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => moderateReport(report.id, "approve")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 transition-colors">Approve</button>
                <button type="button" onClick={() => moderateReport(report.id, "reject")} className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500 transition-colors">Reject</button>
              </div>
            </div>
          ))}
        </div>
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
      <div className="glass-dark border-b-0 px-4 py-3 flex items-center justify-between">
        <p className="font-semibold text-white">Legal Aid Chat</p>
        <button onClick={handleGenerateDraft} className="text-xs rounded-full glass px-3 py-1.5 text-purple-300 font-semibold hover:bg-white/10 transition-colors">Draft FIR</button>
      </div>
      <div className="px-4 py-3 glass border-b-0 space-y-2">
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
      <div className="px-4 py-3 glass border-b-0">
        <form onSubmit={requestConsult} className="rounded-xl glass-dark p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">Request Legal Consult</p>
            <label className="text-[10px] text-slate-400 flex items-center gap-1.5 cursor-pointer hover:text-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={consultForm.urgent}
                onChange={(e) => setConsultForm((prev) => ({ ...prev, urgent: e.target.checked }))}
                className="accent-pink-500"
              />
              Urgent
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={consultForm.name}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
              className="rounded-lg glass px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <input
              value={consultForm.phone}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone"
              className="rounded-lg glass px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={consultForm.city}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
              className="rounded-lg glass px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <select
              value={consultForm.issueType}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, issueType: e.target.value }))}
              className="rounded-lg glass px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {["Harassment", "Cyber Abuse", "Blackmail", "Domestic Violence", "FIR Filing", "Other"].map((issue) => (
                <option key={issue} value={issue} className="bg-[#1e1b4b] text-white">{issue}</option>
              ))}
            </select>
            <input
              value={consultForm.preferredTime}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, preferredTime: e.target.value }))}
              placeholder="Preferred time"
              className="rounded-lg glass px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <textarea
            value={consultForm.description}
            onChange={(e) => setConsultForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
            placeholder="Briefly explain your issue..."
            className="w-full rounded-lg glass px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {consultStatus ? <p className="text-[11px] text-purple-400">{consultStatus}</p> : null}
          <button
            type="submit"
            disabled={consultLoading}
            className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg shadow-purple-500/25 text-white py-2 text-xs font-semibold disabled:opacity-60 transition-transform active:scale-95"
          >
            {consultLoading ? "Submitting..." : "Request consult"}
          </button>
        </form>
      </div>
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
      <div className="bg-white/5 backdrop-blur-md border-t border-white/10 px-4 py-3 flex gap-2 items-end">
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          rows={1} 
          className="flex-1 rounded-2xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-500/50 text-white placeholder-slate-400 resize-none max-h-32" 
          placeholder="Describe incident..." 
        />
        <button 
          onClick={send} 
          disabled={loading || !input.trim()} 
          className="w-10 h-10 mb-0.5 shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:shadow-none flex items-center justify-center transition-transform active:scale-95"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
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
    <div className="px-4 pt-4 pb-24 space-y-4 animate-in fade-in">
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
    <div className="px-4 pt-4 pb-24 space-y-4 animate-in fade-in">
      <h2 className="text-xl font-semibold text-white">Deepfake Detector</h2>
      <div className="rounded-2xl glass p-6 text-center space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-xs h-48 rounded-2xl glass-dark border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group hover:bg-white/5 hover:border-purple-500/50 transition-all cursor-pointer">
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
              <span className="text-[10px] text-slate-400">Confidence: {result.confidence_score}%</span>
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
    <div className="px-4 pt-4 pb-24 space-y-4 animate-in fade-in">
      <h2 className="text-xl font-semibold text-white">Voice Clone Detector</h2>
      <div className="rounded-2xl glass p-6 text-center space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-xs h-32 rounded-2xl glass-dark border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group hover:bg-white/5 hover:border-purple-500/50 transition-all cursor-pointer">
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
              <span className="text-[10px] text-slate-400">Confidence: {result.confidence_score}%</span>
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
    <div className="px-4 pt-4 pb-24 space-y-4 animate-in fade-in">
      <h2 className="text-xl font-semibold">Distress Listener</h2>
      <div className="rounded-2xl glass p-8 text-center space-y-4">
        <div className={`w-20 h-20 mx-auto rounded-full glass flex items-center justify-center ${listening ? "sos-pulse text-emerald-400" : "text-slate-400"}`}>
          <Ear className="w-10 h-10" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{detected ? "Distress Detected!" : listening ? "Monitoring Audio..." : "Ready to Listen"}</p>
          <p className="text-xs text-slate-400 mt-1">App listens for screams or trigger keywords like "Help" or "Bachao".</p>
        </div>
        {!listening ? (
          <button onClick={startListening} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-sm font-semibold transition-colors">Start Monitoring</button>
        ) : (
          <button onClick={stopListening} className="w-full rounded-xl glass text-slate-300 py-3 text-sm font-semibold hover:bg-white/10 transition-colors">Stop Monitoring</button>
        )}
        {listening && !detected ? (
          <button onClick={() => setDetected(true)} className="w-full rounded-xl glass-dark text-purple-300 py-3 text-sm font-semibold hover:bg-white/5 transition-colors">Simulate Detection</button>
        ) : null}
        {detected ? (
          <button onClick={onTriggerSOS} className="w-full rounded-xl bg-red-600 text-white py-3 text-sm font-semibold animate-pulse">Trigger SOS Now</button>
        ) : null}
      </div>
    </div>
  );
}

function SafeTransit({ contacts, autoDialPolice }) {
  const hasContacts = (contacts?.length || 0) > 0;
  const [trip, setTrip] = useState(null);
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
    try {
      const data = await api("/transit/start", { method: "POST", body: JSON.stringify({ destination: "University Gate" }) });
      setTrip(data.trip);
      setTripMode("online");
      setStatusMessage("Trip started with backend tracking.");
      setNextCheckInAt(new Date(Date.now() + checkInTimerMinutes * 60 * 1000).toISOString());
    } catch {
      const localTrip = {
        id: `local-${Date.now()}`,
        destination: "University Gate",
        startedAt: new Date().toISOString(),
        status: "active",
        events: [
          "Local trip mode started",
          "Backend tracking unavailable, using manual check-ins",
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
    <div className="px-4 pt-4 pb-24 space-y-4 animate-in fade-in">
      <h2 className="text-xl font-semibold">Safe Transit</h2>
      <div className="rounded-2xl glass p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Transit mode</p>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${tripMode === "online" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <p className="text-sm font-semibold text-white">{tripMode === "online" ? "Backend Tracked" : "Manual Fallback"}</p>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
          Nigehbaan tracks your route. If you deviate or miss a check-in, your contacts are alerted automatically.
        </p>
        {!hasContacts ? (
          <p className="text-[11px] text-amber-200/90 mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
            No trusted contacts yet — add them in Resources so trip alerts can reach someone you trust.
          </p>
        ) : null}
        <p className="text-[10px] text-slate-500 mt-2">SOS police auto-dial is {autoDialPolice ? "on" : "off"} (Resources → settings).</p>
      </div>
      {!trip ? (
        <button onClick={startTrip} className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 text-sm font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform">Start Tracked Trip</button>
      ) : (
        <button onClick={simulateDeviation} className="w-full rounded-xl glass-dark text-amber-400 py-3 text-xs font-semibold hover:bg-white/5 transition-colors">Simulate Deviation Alert</button>
      )}
      {trip ? (
        <div className="rounded-2xl glass p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Status</p>
              <p className={`text-sm font-bold ${trip.status === "deviated" ? "text-red-400" : "text-emerald-400"}`}>
                {trip.status.toUpperCase()}
              </p>
            </div>
            {nextCheckInAt && (
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Next Check-in</p>
                <p className="text-sm font-bold text-pink-400">{new Date(nextCheckInAt).toLocaleTimeString()}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Manual Check-in</p>
            <div className="flex gap-2">
              <input
                value={checkInText}
                onChange={(e) => setCheckInText(e.target.value)}
                placeholder="e.g. Just passed the bridge..."
                className="flex-1 rounded-lg glass-dark px-3 py-2 text-xs focus:ring-1 focus:ring-purple-500/50 outline-none"
              />
              <button onClick={submitCheckIn} className="rounded-lg bg-purple-600 text-white px-4 py-2 text-xs font-semibold hover:bg-purple-500 transition-colors">Add</button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">Interval:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={checkInTimerMinutes}
                onChange={(e) => setCheckInTimerMinutes(Math.max(1, Math.min(30, Number(e.target.value) || 5)))}
                className="w-12 rounded glass-dark px-1.5 py-0.5 text-xs text-center"
              />
              <span className="text-[10px] text-slate-400">min</span>
            </div>
            <button onClick={markSafeArrival} className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-xs font-semibold hover:bg-emerald-500 transition-colors">
              Arrived Safely
            </button>
          </div>

          {statusMessage ? <p className="text-xs text-pink-400 font-semibold animate-pulse">{statusMessage}</p> : null}
          
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Timeline</p>
            {trip.events?.map((event, i) => <p key={`${event}-${i}`} className="text-[11px] text-slate-300 flex items-start gap-2"><span className="text-purple-500">•</span> {event}</p>)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SOSScreen({ onClose, contacts, autoDialPolice, cancelPin }) {
  const { success, error: toastError } = useToast();
  const [phase, setPhase] = useState("countdown");
  const [countdown, setCountdown] = useState(5);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [sosMeta, setSosMeta] = useState({ location: null, aiTip: "" });
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("active");
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
    if (phase === "countdown") return onClose();
    if (pin !== cancelPin) {
      setError("Incorrect PIN");
      return;
    }
    try {
      await api("/sos/stop", { method: "POST", body: JSON.stringify({ pin }) });
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
            
            <div className="mt-10 w-full max-w-[240px] space-y-2">
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
  const [fakeCallOpen, setFakeCallOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [phone, setPhone] = useState("+923001112233");
  const [deviceId, setDeviceId] = useState("demo-device");
  const [otpCode, setOtpCode] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [session, setSession] = useState(null);
  const [evidenceForm, setEvidenceForm] = useState({
    incidentId: "inc-demo-1",
    title: "Screenshot evidence",
    type: "text",
    content: "Harassment message screenshot details...",
  });
  const [evidenceMsg, setEvidenceMsg] = useState("");
  const [consultRequests, setConsultRequests] = useState([]);
  const [consultLoading, setConsultLoading] = useState(false);
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

  const sendQuickAlertSms = () => {
    if (!contacts.length) {
      toastError("Add trusted contacts in My safety circle first.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const body = encodeURIComponent(
          `NIgaban quick alert — I may need help. My live location: https://www.google.com/maps?q=${lat},${lng}`,
        );
        const sanitized = contacts
          .slice(0, 3)
          .map((c) => String(c.phone || "").replace(/[^\d+]/g, "").trim())
          .filter(Boolean);
        if (!sanitized.length) {
          toastError("Add phone numbers with country code (e.g. +92300…).");
          return;
        }
        window.location.href = `sms:${sanitized.join(",")}?body=${body}`;
      },
      () => toastError("Allow location so your SMS includes live GPS."),
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

  return (
    <div className="px-4 pt-4 pb-28 space-y-5">
      <FakeCallOverlay open={fakeCallOpen} onClose={() => setFakeCallOpen(false)} />
      <h2 className="text-2xl font-semibold">Resources & Settings</h2>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Quick open</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "shield", label: "AI Shield", icon: Shield },
            { id: "legal", label: "Legal desk", icon: Scale },
            { id: "transit", label: "Safe transit", icon: MapPin },
            { id: "community", label: "Community", icon: Activity },
          ].map((x) => {
            const Icon = x.icon;
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => onNavigate(x.id)}
                className="rounded-xl border border-white/10 bg-[#141523]/80 px-3 py-2.5 flex items-center gap-2 text-left hover:bg-white/10 transition-colors"
              >
                <Icon className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-semibold text-white">{x.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-3">
        <p className="text-xs uppercase tracking-wide text-emerald-400 font-semibold">Discreet tools</p>
        <button
          type="button"
          onClick={() => setFakeCallOpen(true)}
          className="w-full rounded-xl border border-white/10 bg-[#141523] px-3 py-2.5 text-sm font-semibold text-white text-left hover:bg-white/10 transition-colors flex items-center gap-2"
        >
          <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
          Fake incoming call
        </button>
        <div className="rounded-xl border border-white/10 bg-[#141523]/60 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Voice Note</p>
          <VoiceNoteRecorder />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Shake-to-SOS (iOS)</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          On iPhone, motion access needs a tap. Android often works without this step. Three quick shakes start a 3-second cancel countdown, then your normal SOS flow runs.
        </p>
        <button type="button" onClick={enableShakeMotion} className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
          Enable shake detection
        </button>
      </div>

      <div className="space-y-2">
        {[{ n: "Police", no: "15", i: Phone }, { n: "Madadgaar", no: "1099", i: Heart }, { n: "FIA Cybercrime", no: "1991", i: Shield }, { n: "Punjab Women Helpline", no: "1043", i: Building2 }].map((h) => {
          const Icon = h.i;
          return <div key={h.n} className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Icon className="w-4.5 h-4.5 text-purple-300" /></div><div className="flex-1"><p className="text-sm font-semibold">{h.n}</p></div><button className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white text-xs font-semibold">{h.no}</button></div>;
        })}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">My safety circle</p>
          <button
            type="button"
            onClick={sendQuickAlertSms}
            className="rounded-lg bg-gradient-to-r from-rose-600 to-red-700 text-white text-[10px] font-bold px-3 py-1.5 shadow-lg shadow-rose-900/30"
          >
            Quick alert SMS
          </button>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Saves up to three numbers. Opens your SMS app with a distress line and a live Google Maps link (no server SMS). Some phones only fill the first recipient — resend if needed.
        </p>
        {contacts.map((contact) => <div key={contact.id} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2"><span className="text-sm">{contact.name}</span><button onClick={() => removeContact(contact.id)} className="text-xs font-semibold text-rose-700">Remove</button></div>)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg border border-white/10 px-3 py-2 text-sm" />
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone (+92…)" className="rounded-lg border border-white/10 px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={addContact} className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white px-3 py-2 text-xs font-semibold">Add contact</button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-pink-400 font-semibold">Account Profile</p>
        <AuthHub />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-pink-400 font-semibold">Auth & Identity (OTP)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (+92...)" className="rounded-lg border border-white/10 px-3 py-2 text-sm" />
          <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Device ID" className="rounded-lg border border-white/10 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={requestOtp} className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white px-3 py-2 text-xs font-semibold">Request OTP</button>
          <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter OTP" className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm" />
          <button onClick={verifyOtp} className="rounded-lg bg-emerald-700 text-white px-3 py-2 text-xs font-semibold">Verify</button>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={checkSession} className="text-xs font-semibold text-purple-400">Check session</button>
          {session ? <span className="text-[11px] text-emerald-700 font-semibold">Logged in</span> : <span className="text-[11px] text-slate-400">Guest</span>}
        </div>
        {authMsg ? <p className="text-xs text-slate-400">{authMsg}</p> : null}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-pink-400 font-bold">Secure Evidence Vault</p>
          <Lock className="w-4 h-4 text-pink-500 opacity-50" />
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Store tamper-proof evidence for legal reporting. Each entry is hashed and chained to prevent modification.
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={evidenceForm.incidentId} onChange={(e) => setEvidenceForm((prev) => ({ ...prev, incidentId: e.target.value }))} placeholder="Incident ID / Name" className="rounded-xl glass-dark px-3 py-2 text-sm focus:ring-1 focus:ring-pink-500 outline-none" />
            <input value={evidenceForm.title} onChange={(e) => setEvidenceForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Evidence title" className="rounded-xl glass-dark px-3 py-2 text-sm focus:ring-1 focus:ring-pink-500 outline-none" />
          </div>
          <textarea 
            value={evidenceForm.content} 
            onChange={(e) => setEvidenceForm((prev) => ({ ...prev, content: e.target.value }))} 
            rows={3}
            placeholder="Describe the evidence or paste links/details here..." 
            className="w-full rounded-xl glass-dark px-3 py-2 text-sm min-h-[80px] focus:ring-1 focus:ring-pink-500 outline-none"
          />
          <div className="flex gap-2">
            <button onClick={uploadEvidence} className="flex-1 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white py-2.5 text-xs font-bold shadow-lg shadow-pink-900/20 active:scale-95 transition-transform">
              Sign & Lock Evidence
            </button>
            <button onClick={exportEvidencePacket} className="rounded-xl glass px-4 py-2.5 text-xs font-bold hover:bg-white/10 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        {evidenceMsg ? (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 flex items-start gap-2 animate-in slide-up">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
            <p className="text-[10px] text-emerald-300 font-mono break-all">{evidenceMsg}</p>
          </div>
        ) : null}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-widest text-purple-400 font-bold">Your Legal Requests</p>
          <button onClick={loadConsultRequests} className="text-[10px] uppercase tracking-widest text-slate-500 font-bold hover:text-purple-400 transition-colors">Refresh</button>
        </div>
        {consultLoading ? <p className="text-xs text-slate-400">Syncing with legal desk...</p> : null}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {consultRequests.map((item) => (
            <div key={item.id} className="rounded-xl glass-dark p-3 group hover:bg-white/5 transition-colors animate-in slide-up">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">{item.issueType}</p>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${item.urgent ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-purple-500/20 text-purple-400 border border-purple-500/20"}`}>
                  {item.urgent ? "Urgent" : "Queued"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">{item.description}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[9px] text-slate-500 font-medium">{item.city}</p>
                <p className="text-[9px] text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {!consultLoading && consultRequests.length === 0 && (
            <div className="py-8 text-center">
              <Scale className="w-8 h-8 text-slate-700 mx-auto opacity-20" />
              <p className="text-xs text-slate-500 mt-2 italic">No active legal consultation requests.</p>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-2xl bg-white/10 border border-white/10 p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Settings</p>
        <div className="flex items-center gap-3"><EyeOff className="w-4 h-4" /><p className="flex-1 text-sm">Stealth mode</p><input type="checkbox" checked={settings.stealthMode} onChange={(e) => updateSetting({ stealthMode: e.target.checked })} /></div>
        <div className="flex items-center gap-3"><Phone className="w-4 h-4" /><p className="flex-1 text-sm">Auto-dial police</p><input type="checkbox" checked={settings.autoDialPolice} onChange={(e) => updateSetting({ autoDialPolice: e.target.checked })} /></div>
        <div className="flex items-center gap-3"><Lock className="w-4 h-4" /><p className="flex-1 text-sm">SOS cancel PIN</p><input value={settings.cancelPin} onChange={(e) => updateSetting({ cancelPin: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="w-16 rounded border border-white/20 px-2 py-1 text-xs" /></div>
      </div>
    </div>
  );
}

function ShieldHub({ onSelectTool }) {
  const tools = [
    { id: "dm", title: "DM Harassment Scanner", icon: MessageSquare, desc: "Scan screenshots for threats" },
    { id: "deepfake", title: "Deepfake Detector", icon: ImageIcon, desc: "Verify image authenticity" },
    { id: "voice", title: "Voice Clone Detector", icon: Volume2, desc: "Analyze suspicious audio" },
    { id: "distress", title: "Distress Listener", icon: Ear, desc: "Auto-SOS on scream/keywords" },
  ];
  return (
    <div className="px-4 pt-5 pb-24 space-y-3 animate-in fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">AI Threat Shield</h2>
        <p className="text-sm text-slate-400 mt-1 leading-snug">Gemini-backed checks where configured—use alongside your own judgment.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTool(t.id)}
              className="w-full surface-card surface-card-interactive p-4 text-left flex items-center gap-4 group rounded-2xl"
            >
              <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Icon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-white">{t.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{t.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </button>
          );
        })}
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
    };
    window.addEventListener("devicemotion", onMotion, true);
    return () => {
      window.removeEventListener("devicemotion", onMotion, true);
    };
  }, [isAuthenticated, devBypass, sosActive, motionConsent]);

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
    if (screen === "home") return <HomeScreen onNavigate={handleNavigate} onSOS={() => setSosActive(true)} lang={lang} contactsCount={contacts.length} stealthMode={settings.stealthMode} canInstall={Boolean(installPromptEvent)} onInstall={handleInstallApp} timelineEntries={timelineEntries} timelineText={timelineText} setTimelineText={setTimelineText} onAddTimeline={addTimelineEntry} timelineSaving={timelineSaving} communityFeed={communityFeed} />;
    if (screen === "map") return <SafetyMapScreen />;
    if (screen === "legal") return <LegalChat />;
    if (screen === "transit") return <SafeTransit contacts={contacts} autoDialPolice={settings.autoDialPolice} />;
    if (screen === "community") return <CommunityScreen />;
    if (screen === "more") return <MoreScreen settings={settings} setSettings={setSettings} contacts={contacts} setContacts={setContacts} onNavigate={handleNavigate} />;
    if (screen === "shield") {
      if (shieldTool === "dm") return <DMScanner />;
      if (shieldTool === "deepfake") return <DeepfakeDetector />;
      if (shieldTool === "voice") return <VoiceDetector />;
      if (shieldTool === "distress") return <DistressListener onTriggerSOS={() => setSosActive(true)} />;
      return <ShieldHub onSelectTool={setShieldTool} />;
    }
    return null;
  }, [screen, shieldTool, lang, contacts, settings, installPromptEvent, timelineEntries, timelineText, timelineSaving, communityFeed]);

  const title =
    screen === "map"
      ? "Safety map"
      : screen === "transit"
      ? "Safe Transit"
      : screen === "community"
      ? "Community"
      : screen === "more"
      ? "Resources"
      : screen === "shield" && !shieldTool
      ? "AI Threat Shield"
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
    <div className="min-h-screen bg-[#141523] text-white">
      <div className="w-full max-w-5xl mx-auto min-h-screen lg:min-h-[92vh] lg:my-4 bg-[#141523] shadow-xl lg:rounded-3xl overflow-hidden flex flex-col relative z-0">
        {!sosActive ? <Header lang={lang} setLang={setLang} title={title} showBack={screen === "shield" && shieldTool !== null} onBack={() => setShieldTool(null)} userProfile={userProfile} onSignOut={handleSignOut} isClerk={clerkSignedIn} stealthMode={settings.stealthMode} /> : null}
        <main className={`flex-1 ${screen === "legal" ? "flex flex-col" : "overflow-y-auto"} ${!sosActive ? "pb-28" : ""}`}>{rendered}</main>
        {!sosActive ? (
          <>
            {installPromptEvent ? (
              <div className="fixed bottom-[4.25rem] left-0 right-0 z-[45] px-3 pointer-events-none max-w-5xl mx-auto">
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
            <FloatingChatbot />
          </>
        ) : null}
        {shakeSosSecs !== null ? (
          <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/75 px-5">
            <div className="w-full max-w-sm rounded-2xl border border-rose-500/35 bg-[#141523] p-6 text-center space-y-4 shadow-2xl">
              <p className="text-sm font-bold text-white uppercase tracking-wide">Shake SOS</p>
              <p className="text-5xl font-black text-rose-400 tabular-nums">{shakeSosSecs}</p>
              <p className="text-xs text-slate-400 leading-relaxed">Emergency SOS starts when this reaches zero. Cancel if this was accidental.</p>
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
