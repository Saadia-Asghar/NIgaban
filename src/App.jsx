import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { supabase } from "./lib/authClients";
import AuthHub from "./components/AuthHub.jsx";
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
  MapPin,
  MessageSquare,
  Mic,
  Phone,
  Plus,
  Radio,
  Scale,
  Send,
  Shield,
  Sparkles,
  User,
  Volume2,
  X,
  Smartphone,
} from "lucide-react";

const LEGAL_SYSTEM_PROMPT = `You are the Legal Aid Assistant for Nigehbaan...`;
const DM_SCAN_SYSTEM_PROMPT = `Return only JSON with classification, severity, peca_section, peca_explanation, evidence_value, recommended_action, summary.`;

async function api(path, options = {}) {
  let token = "";
  try {
    token = localStorage.getItem("nigehbaan_token") || "";
  } catch {
    token = "";
  }
  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}

function Header({ lang, setLang, title, showBack, onBack }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#141523]/80 px-4 py-3 backdrop-blur flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button onClick={onBack} className="rounded-full p-1.5 hover:bg-white/20/60"><ChevronLeft className="w-5 h-5" /></button>
        ) : (
          <div className="w-9 h-9 rounded-full bg-violet-800 text-white flex items-center justify-center font-bold">ن</div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-white">{title || "Nigehbaan"}</h1>
          {!title ? <p className="text-[10px] text-slate-400">نگہبان · your guardian</p> : null}
        </div>
      </div>
      <button onClick={() => setLang((v) => (v === "en" ? "ur" : "en"))} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-purple-300 flex items-center gap-1">
        <Languages className="w-3.5 h-3.5" />{lang === "en" ? "EN" : "اردو"}
      </button>
    </header>
  );
}

function BottomNav({ active, onNavigate }) {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "shield", icon: Shield, label: "Shield" },
    { id: "legal", icon: Scale, label: "Legal" },
    { id: "transit", icon: MapPin, label: "Transit" },
    { id: "more", icon: Plus, label: "More" },
  ];
  return (
    <nav className="sticky bottom-0 border-t border-white/10 bg-white/5 backdrop-blur-md/95 px-2 py-2 flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const activeTab = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onNavigate(tab.id)} className={`px-3 py-1.5 rounded-xl ${activeTab ? "text-purple-300 bg-white/10" : "text-slate-400"}`}>
            <div className="flex flex-col items-center">
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

function WelcomeAuthScreen({ onBypass }) {
  const slides = [
    {
      title: "Stay Safe, Stay in Control",
      description:
        "Nigehbaan helps you act quickly during harassment, unsafe commutes, or emergencies.",
      icon: Shield,
      color: "bg-rose-100 text-rose-900",
    },
    {
      title: "Legal + Evidence in One Place",
      description:
        "Use Legal Aid Chat and DM Scanner to understand rights and keep ready-to-use evidence.",
      icon: Scale,
      color: "bg-indigo-100 text-indigo-900",
    },
    {
      title: "Emergency Ready",
      description:
        "Configure trusted contacts and SOS PIN. One tap can alert family and emergency support.",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-800",
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
    <div className="min-h-screen bg-[#141523] flex flex-col md:flex-row overflow-y-auto w-full">
      {/* Left / Top Side: About the App Slideshow */}
      <div className="w-full md:w-1/2 min-h-[40vh] md:min-h-screen p-8 flex flex-col justify-center items-center relative overflow-hidden bg-white/5 border-b md:border-b-0 md:border-r border-white/10">
        <div className="absolute top-8 left-8 flex items-center gap-2">
          <Shield className="w-6 h-6 text-pink-500" />
          <span className="font-bold text-white tracking-widest uppercase">Nigehbaan</span>
        </div>
        
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500" key={step}>
          <div className={`w-16 h-16 rounded-2xl ${slide.color} flex items-center justify-center shadow-lg shadow-black/20`}>
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white mb-4">{slide.title}</h3>
            <p className="text-lg text-slate-300 leading-relaxed">{slide.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-gradient-to-r from-pink-500 to-purple-600" : "w-4 bg-white/20 hover:bg-white/40"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right / Bottom Side: AuthHub */}
      <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center items-center relative min-h-[60vh] md:min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome</h1>
            <p className="text-slate-400 text-sm">Sign in or create an account to secure your peace of mind.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <AuthHub />
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col items-center gap-2">
              <p className="text-[11px] text-slate-400">Having trouble signing in?</p>
              <button 
                onClick={onBypass} 
                className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Continue as Guest (Dev Bypass)
              </button>
            </div>
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
  stealthMode,
  canInstall,
  onInstall,
  timelineEntries,
  timelineText,
  setTimelineText,
  onAddTimeline,
  timelineSaving,
}) {
  const greeting = lang === "ur" ? "السلام علیکم، عائشہ" : "Asalaam-o-Alaikum, Ayesha";
  const [openGuide, setOpenGuide] = useState("setup");
  const [infoPanel, setInfoPanel] = useState("about");
  const quickChecklist = [
    { id: "contacts", label: "Add at least 3 trusted contacts", done: contactsCount >= 3, action: "more" },
    { id: "timeline", label: "Create your first Safety Timeline note", done: timelineEntries.length > 0, action: "home" },
    { id: "community", label: "Open Community and check city alerts", done: false, action: "community" },
    { id: "transit", label: "Start a Safe Transit trip before travel", done: false, action: "transit" },
  ];
  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{new Date().toDateString()}</p>
        <h2 className="text-2xl font-semibold text-white mt-1">{greeting}</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#2b1b54] to-[#3b185f] p-5 text-white">
        <p className="text-[11px] uppercase tracking-[0.2em] text-purple-200">Welcome to Nigehbaan</p>
        <h3 className="text-xl font-semibold mt-1">Your women safety companion</h3>
        <p className="text-sm text-purple-200 mt-2 leading-relaxed">
          Nigehbaan helps you handle harassment, unsafe travel, and emergencies with SOS, legal guidance, AI threat tools, and community alerts.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-purple-200">Step 1</p>
            <p className="text-xs mt-1">Set trusted contacts in Resources</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-purple-200">Step 2</p>
            <p className="text-xs mt-1">Use Transit + Shield during risky situations</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-purple-200">Step 3</p>
            <p className="text-xs mt-1">Tap SOS immediately if danger escalates</p>
          </div>
        </div>
        {canInstall ? (
          <button
            onClick={onInstall}
            className="mt-3 w-full rounded-xl bg-white/5 backdrop-blur-md text-purple-300 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Install app on mobile home screen
          </button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate("more")}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-left hover:shadow-sm transition"
        >
          <p className="text-[11px] uppercase tracking-wide text-pink-400 font-semibold">Start Here</p>
          <p className="text-sm font-semibold text-white mt-1">Setup Safety Profile</p>
          <p className="text-[11px] text-slate-400 mt-1">Add contacts, PIN, OTP identity.</p>
        </button>
        <button
          onClick={() => onNavigate("transit")}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-left hover:shadow-sm transition"
        >
          <p className="text-[11px] uppercase tracking-wide text-pink-400 font-semibold">Before Travel</p>
          <p className="text-sm font-semibold text-white mt-1">Start Safe Transit</p>
          <p className="text-[11px] text-slate-400 mt-1">Use local check-ins even without APIs.</p>
        </button>
        <button
          onClick={() => onNavigate("legal")}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 text-left hover:shadow-sm transition"
        >
          <p className="text-[11px] uppercase tracking-wide text-pink-400 font-semibold">Need Help</p>
          <p className="text-sm font-semibold text-white mt-1">Open Legal Aid</p>
          <p className="text-[11px] text-slate-400 mt-1">Chat + consult request in one place.</p>
        </button>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">App Information</p>
          <span className="text-[10px] uppercase tracking-wide rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-pink-400 font-semibold">
            Start here
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setInfoPanel("about")}
            className={`rounded-lg py-2 text-xs font-semibold ${infoPanel === "about" ? "bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white" : "bg-white/10 text-slate-300"}`}
          >
            About
          </button>
          <button
            onClick={() => setInfoPanel("directions")}
            className={`rounded-lg py-2 text-xs font-semibold ${infoPanel === "directions" ? "bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white" : "bg-white/10 text-slate-300"}`}
          >
            Directions
          </button>
          <button
            onClick={() => setInfoPanel("features")}
            className={`rounded-lg py-2 text-xs font-semibold ${infoPanel === "features" ? "bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white" : "bg-white/10 text-slate-300"}`}
          >
            Features
          </button>
        </div>
        {infoPanel === "about" ? (
          <div className="rounded-xl border border-white/10 bg-[#141523] p-3">
            <p className="text-xs font-semibold text-white">What Nigehbaan does</p>
            <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">
              Nigehbaan is a women safety web app for prevention, emergency response, and legal support. It helps users stay protected during harassment risks, travel, and cyber abuse situations.
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-2">
                <p className="text-[11px] text-pink-400 font-semibold">Prevent</p>
                <p className="text-[11px] text-slate-400 mt-1">Threat checks + awareness</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-2">
                <p className="text-[11px] text-pink-400 font-semibold">Protect</p>
                <p className="text-[11px] text-slate-400 mt-1">Transit + SOS workflows</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-2">
                <p className="text-[11px] text-pink-400 font-semibold">Pursue justice</p>
                <p className="text-[11px] text-slate-400 mt-1">Legal aid + consult requests</p>
              </div>
            </div>
          </div>
        ) : null}
        {infoPanel === "directions" ? (
          <div className="rounded-xl border border-white/10 bg-[#141523] p-3 space-y-2">
            <p className="text-xs font-semibold text-white">How to use (simple flow)</p>
            {[
              "1. Open Resources and add trusted contacts + SOS PIN.",
              "2. Use Safe Transit before leaving and log check-ins.",
              "3. If threatened, open Shield tools or Legal Aid guidance.",
              "4. Post alerts in Community to warn others nearby.",
              "5. Trigger SOS immediately for urgent danger.",
            ].map((step) => (
              <p key={step} className="text-[12px] text-slate-300">• {step}</p>
            ))}
          </div>
        ) : null}
        {infoPanel === "features" ? (
          <div className="rounded-xl border border-white/10 bg-[#141523] p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "AI Threat Shield (DM/deepfake/voice checks)",
              "Safe Transit with no-key fallback check-ins",
              "Emergency SOS with trusted contact alerts",
              "Legal Aid chat + consultation request",
              "Community safety feed + city chat + incident reports",
              "Evidence timeline notes for safer documentation",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-2">
                <p className="text-[12px] text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Safety Profile Strength</p>
          <p className="text-xs font-semibold text-purple-400">
            {Math.min(100, 40 + contactsCount * 15 + (timelineEntries.length > 0 ? 20 : 0))}%
          </p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600"
            style={{ width: `${Math.min(100, 40 + contactsCount * 15 + (timelineEntries.length > 0 ? 20 : 0))}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Improve score by adding contacts, using timeline notes, and checking live community alerts.
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Quick Start Checklist</p>
          <p className="text-xs text-purple-400 font-semibold">
            {quickChecklist.filter((item) => item.done).length}/{quickChecklist.length} completed
          </p>
        </div>
        <div className="space-y-2">
          {quickChecklist.map((item) => (
            <button
              key={item.id}
              onClick={() => (item.action === "home" ? null : onNavigate(item.action))}
              className="w-full rounded-xl border border-white/10 bg-[#141523] px-3 py-2 text-left flex items-center justify-between gap-2"
            >
              <span className="text-xs text-slate-300">{item.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {item.done ? "Done" : item.action === "home" ? "On this screen" : "Open"}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-2">
        <p className="text-sm font-semibold text-white">How it works</p>
        {[
          {
            id: "setup",
            title: "1) Setup your safety profile",
            body: "Go to Resources and add trusted contacts, set SOS PIN, and verify identity with OTP.",
          },
          {
            id: "protect",
            title: "2) Use tools before and during risk",
            body: "Threat Shield helps detect abuse, Safe Transit tracks your journey, and Legal Aid prepares reporting steps.",
          },
          {
            id: "respond",
            title: "3) Respond fast in emergency",
            body: "Hit SOS to notify contacts, log evidence/timeline, and use Community to broadcast nearby safety incidents.",
          },
        ].map((guide) => (
          <div key={guide.id} className="rounded-xl border border-white/10 bg-[#141523]">
            <button
              onClick={() => setOpenGuide((prev) => (prev === guide.id ? "" : guide.id))}
              className="w-full px-3 py-2 text-left flex items-center justify-between gap-2"
            >
              <span className="text-xs font-semibold text-slate-200">{guide.title}</span>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition ${openGuide === guide.id ? "rotate-90" : ""}`} />
            </button>
            {openGuide === guide.id ? <p className="px-3 pb-3 text-xs text-slate-400">{guide.body}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3">
          <p className="text-xs font-semibold text-white">When to use Threat Shield</p>
          <p className="text-[11px] text-slate-400 mt-1">For suspicious DMs, deepfake checks, and abuse detection before escalation.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3">
          <p className="text-xs font-semibold text-white">When to use Legal Aid</p>
          <p className="text-[11px] text-slate-400 mt-1">For FIR guidance, rights under PECA, and direct legal consult requests.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3">
          <p className="text-xs font-semibold text-white">When to use Community</p>
          <p className="text-[11px] text-slate-400 mt-1">To monitor local alerts, chat with city members, and report incidents.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3">
          <p className="text-xs font-semibold text-white">When to use SOS</p>
          <p className="text-[11px] text-slate-400 mt-1">Immediate danger only. It triggers contact alerts and emergency workflow.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
        <p className="text-sm font-semibold text-white">Emergency Numbers (Pakistan)</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: "Police", phone: "15" },
            { label: "Madadgaar", phone: "1099" },
            { label: "FIA Cybercrime", phone: "1991" },
          ].map((item) => (
            <a key={item.label} href={`tel:${item.phone}`} className="rounded-xl border border-white/10 bg-[#141523] px-3 py-2">
              <p className="text-[11px] text-slate-400">{item.label}</p>
              <p className="text-sm font-semibold text-purple-300">{item.phone}</p>
            </a>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Safety Timeline (real-time)</p>
          <span className="text-[10px] uppercase tracking-wide rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700 font-semibold">Live</span>
        </div>
        <p className="text-xs text-slate-400">
          Add quick notes when meeting someone new, spotting suspicious activity, or starting a risky commute.
        </p>
        <div className="flex gap-2">
          <input
            value={timelineText}
            onChange={(e) => setTimelineText(e.target.value)}
            placeholder="Add safety note..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm"
          />
          <button
            onClick={onAddTimeline}
            disabled={timelineSaving || !timelineText.trim()}
            className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
          >
            {timelineSaving ? "Saving..." : "Add"}
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {timelineEntries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/10 bg-[#141523] p-2.5">
              <p className="text-xs text-slate-300">{entry.text}</p>
              <p className="text-[10px] text-slate-400 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {timelineEntries.length === 0 ? <p className="text-xs text-slate-400">No timeline notes yet.</p> : null}
        </div>
      </div>
      {stealthMode ? <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">Stealth mode enabled.</div> : null}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2.5 flex items-center justify-between">
        <p className="text-xs text-slate-400">Safety profile completion</p>
        <p className="text-xs font-semibold text-rose-900">{contactsCount >= 3 ? "100%" : "70%"}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { id: "legal", title: "Legal Aid", subtitle: "Rights + FIR help", icon: Scale },
          { id: "shield", title: "Threat Shield", subtitle: "Detect abuse", icon: Shield },
          { id: "transit", title: "Safe Transit", subtitle: "Trip watch", icon: MapPin },
          { id: "more", title: "Resources", subtitle: "Contacts + settings", icon: Heart },
          { id: "community", title: "Community", subtitle: "Live safety activity", icon: Activity },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-left hover:shadow-md hover:-translate-y-[1px] transition">
              <Icon className="w-5 h-5 mb-2 text-purple-400" />
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
            </button>
          );
        })}
      </div>
      <button onClick={onSOS} className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white p-4 flex items-center gap-2 shadow-md">
        <AlertTriangle className="w-5 h-5" /><span className="font-semibold">Emergency SOS</span>
      </button>
    </div>
  );
}

function CommunityScreen() {
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
    alias: "Ayesha",
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

  const loadFeed = async (targetCity) => {
    setLoading(true);
    try {
      const data = await api(`/community/feed?city=${encodeURIComponent(targetCity)}`);
      setItems(data.feed || []);
      setLastLiveSync(new Date().toISOString());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    setSubmitMessage("");
    if (!form.area.trim() || !form.description.trim()) {
      setSubmitMessage("Please fill area and description.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/community/report", {
        method: "POST",
        body: JSON.stringify({
          city,
          category: form.category,
          area: form.area.trim(),
          description: form.description.trim(),
          anonymous: form.anonymous,
        }),
      });
      setForm({ category: "Harassment", area: "", description: "", anonymous: true });
      setSubmitMessage("Report submitted. Thank you for helping the community stay informed.");
      await loadFeed(city);
    } catch {
      setSubmitMessage("Unable to submit report right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadFeed(city);
  }, [city]);

  const loadChat = async (targetCity) => {
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
  };

  const loadNgos = async (targetCity) => {
    setNgoLoading(true);
    try {
      const data = await api(`/help/ngos?city=${encodeURIComponent(targetCity)}`);
      setNgos(data.ngos || []);
    } catch {
      setNgos([]);
    } finally {
      setNgoLoading(false);
    }
  };

  useEffect(() => {
    loadChat(city);
    loadNgos(city);
  }, [city]);

  useEffect(() => {
    if (!liveUpdates) return undefined;
    const intervalId = setInterval(() => {
      if (activePanel === "chat") {
        loadChat(city);
      } else {
        loadFeed(city);
      }
      loadPendingReports();
    }, 8000);
    return () => clearInterval(intervalId);
  }, [city, activePanel, liveUpdates]);

  const loadPendingReports = async () => {
    setModerationLoading(true);
    try {
      const data = await api("/moderation/reports?status=pending");
      setPendingReports(data.reports || []);
    } catch {
      setPendingReports([]);
    } finally {
      setModerationLoading(false);
    }
  };

  useEffect(() => {
    loadPendingReports();
  }, []);

  const moderateReport = async (id, action) => {
    try {
      await api(`/moderation/reports/${id}/review`, {
        method: "POST",
        body: JSON.stringify({
          action,
          reason: action === "approve" ? "Approved by moderator panel" : "Rejected by moderator panel",
        }),
      });
      await Promise.all([loadPendingReports(), loadFeed(city)]);
    } catch {
      // ignore transient errors in demo mode
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
    } catch {
      setChatMessageStatus("Unable to send message right now.");
    } finally {
      setSendingChat(false);
    }
  };

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

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2">
        <button
          onClick={() => setActivePanel("feed")}
          className={`rounded-xl py-2 text-xs font-semibold ${activePanel === "feed" ? "bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white" : "bg-white/10 text-slate-300"}`}
        >
          Activity Feed
        </button>
        <button
          onClick={() => setActivePanel("chat")}
          className={`rounded-xl py-2 text-xs font-semibold ${activePanel === "chat" ? "bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white" : "bg-white/10 text-slate-300"}`}
        >
          City Safety Chat
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Nearby NGOs ({city})</p>
          <button onClick={() => loadNgos(city)} className="text-xs font-semibold text-purple-400">Refresh NGOs</button>
        </div>
        {ngoLoading ? <p className="text-xs text-slate-400">Loading nearby NGOs...</p> : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ngos.map((ngo) => (
            <div key={`${ngo.name}-${ngo.phone}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-white">{ngo.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{ngo.focus}</p>
              <p className="text-[11px] text-slate-400 mt-1">{ngo.address}</p>
              <a href={`tel:${ngo.phone}`} className="text-xs font-semibold text-purple-400 mt-1 inline-block">{ngo.phone}</a>
            </div>
          ))}
        </div>
        {!ngoLoading && ngos.length === 0 ? <p className="text-xs text-slate-400">No NGOs found for this city.</p> : null}
      </div>

      {activePanel === "chat" ? (
        <div className="space-y-3">
          <form onSubmit={sendChatMessage} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={chatForm.mode}
                onChange={(e) => setChatForm((prev) => ({ ...prev, mode: e.target.value }))}
                className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm text-slate-300"
              >
                <option value="chat">General chat</option>
                <option value="incident">Report incident</option>
              </select>
              <select
                value={chatForm.category}
                onChange={(e) => setChatForm((prev) => ({ ...prev, category: e.target.value }))}
                className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm text-slate-300"
              >
                {["Harassment", "Unsafe Transit", "Suspicious Activity", "Cyber Abuse", "Other"].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={chatForm.alias}
                onChange={(e) => setChatForm((prev) => ({ ...prev, alias: e.target.value }))}
                placeholder="Display name"
                className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm"
              />
              <input
                value={chatForm.area}
                onChange={(e) => setChatForm((prev) => ({ ...prev, area: e.target.value }))}
                placeholder="Area / landmark (required for incident)"
                className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm"
              />
            </div>
            <label className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={chatForm.anonymous}
                onChange={(e) => setChatForm((prev) => ({ ...prev, anonymous: e.target.checked }))}
              />
              Post anonymously
            </label>
            <textarea
              value={chatForm.text}
              onChange={(e) => setChatForm((prev) => ({ ...prev, text: e.target.value }))}
              rows={3}
              placeholder="Share safety updates, ask for support, or report harassment..."
              className="w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm"
            />
            {chatMessageStatus ? <p className="text-xs text-purple-400">{chatMessageStatus}</p> : null}
            <button
              type="submit"
              disabled={sendingChat}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {sendingChat ? "Sending..." : chatForm.mode === "incident" ? "Post incident report" : "Send to chat"}
            </button>
          </form>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">#{city.toLowerCase()}-safety channel</p>
              <button onClick={() => loadChat(city)} className="text-xs font-semibold text-purple-400">Refresh chat</button>
            </div>
            {chatLoading ? (
              <p className="text-xs text-slate-400">Loading chat messages...</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`rounded-xl border p-3 ${msg.mode === "incident" ? "border-rose-200 bg-rose-50/60" : "border-white/10 bg-[#141523]"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-200">{msg.alias || "Anonymous"}</p>
                      <p className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                    {msg.mode === "incident" ? (
                      <p className="text-[10px] mt-1 inline-block rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 font-semibold text-rose-800 uppercase tracking-wide">
                        Incident Report
                      </p>
                    ) : null}
                    <p className="text-sm text-slate-300 mt-1">{msg.text}</p>
                    {msg.area ? <p className="text-[11px] text-slate-400 mt-1">Area: {msg.area}</p> : null}
                    {msg.tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.tags.map((tag) => (
                          <span key={`${msg.id}-${tag}`} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-purple-400">
                            {tag.replace("-", " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!chatLoading && chatMessages.length === 0 ? (
                  <p className="text-xs text-slate-400">No messages yet. Start the first community check-in.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activePanel === "feed" ? <form onSubmit={submitReport} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Post anonymous report</p>
          <label className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(e) => setForm((prev) => ({ ...prev, anonymous: e.target.checked }))}
            />
            Anonymous
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm text-slate-300"
          >
            {["Harassment", "Unsafe Transit", "Suspicious Activity", "Cyber Abuse", "Other"].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            value={form.area}
            onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
            placeholder="Area / landmark"
            className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          placeholder="Describe what happened so others can stay aware..."
          className="w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-2 text-sm"
        />
        {submitMessage ? <p className="text-xs text-purple-400">{submitMessage}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </form> : null}

      {activePanel === "feed" && loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading community activity...
        </div>
      ) : null}

      {activePanel === "feed" ? <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
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
            {item.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-purple-400">
                    {tag.replace("-", " ")}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="text-[11px] text-pink-400 mt-2 font-medium">Source: {item.source}</p>
            {item.verified ? (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                Verified report
              </div>
            ) : null}
          </div>
        ))}
        {!loading && items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-sm text-slate-400">
            No activity found. Try a different city or refresh.
          </div>
        ) : null}
      </div> : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Moderator queue (demo)</p>
          <button onClick={loadPendingReports} className="text-xs font-semibold text-purple-400">Refresh queue</button>
        </div>
        {moderationLoading ? (
          <p className="text-xs text-slate-400">Loading pending reports...</p>
        ) : null}
        {!moderationLoading && pendingReports.length === 0 ? (
          <p className="text-xs text-slate-400">No pending reports.</p>
        ) : null}
        <div className="space-y-2">
          {pendingReports.map((report) => (
            <div key={report.id} className="rounded-xl border border-white/10 bg-[#141523] p-3">
              <p className="text-xs text-slate-400">{report.city} • {report.category}</p>
              <p className="text-sm font-semibold text-white">{report.title}</p>
              <p className="text-xs text-slate-400 mt-1">{report.description}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => moderateReport(report.id, "approve")} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white">Approve</button>
                <button onClick={() => moderateReport(report.id, "reject")} className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-semibold text-white">Reject</button>
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
    name: "Ayesha",
    phone: "+923001112233",
    city: "Lahore",
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
    <div className="flex flex-col h-full bg-[#141523] text-white">
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <p className="font-semibold text-white">Legal Aid Chat</p>
        <button onClick={handleGenerateDraft} className="text-xs rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-purple-300 font-semibold hover:bg-white/20 transition-colors">Draft FIR</button>
      </div>
      <div className="px-4 py-3 bg-white/5 backdrop-blur-md border-b border-white/10 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Nearby Police & Help</p>
          <div className="flex items-center gap-2">
            <button
              onClick={detectCityFromLocation}
              disabled={detectingCity}
              className="text-xs rounded-lg border border-white/20 bg-white/5 backdrop-blur-md px-2 py-1 text-purple-400 font-semibold disabled:opacity-50 hover:bg-white/10 transition-colors"
            >
              {detectingCity ? "Detecting..." : "Use my location"}
            </button>
            <select
              value={nearbyCity}
              onChange={(e) => setNearbyCity(e.target.value)}
              className="text-xs rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2 py-1 text-slate-300 focus:ring-2 focus:ring-purple-500/50 outline-none"
            >
              {["Lahore", "Karachi", "Islamabad", "Peshawar"].map((city) => (
                <option key={city} value={city} className="bg-[#141523] text-white">{city}</option>
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
                <div key={`${contact.name}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 hover:bg-white/10 transition-colors">
                  <p className="text-[11px] text-pink-400 font-semibold">{contact.type}</p>
                  <p className="text-sm font-semibold text-white">{contact.name}</p>
                  <p className="text-[11px] text-slate-400">{contact.address}</p>
                  <a href={`tel:${contact.phone}`} className="text-xs font-semibold text-purple-400 mt-1 inline-block">{contact.phone}</a>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-pink-500/20 bg-pink-500/10 backdrop-blur-md p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-300">Nearby NGOs</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nearbyNgos.map((ngo, idx) => (
                  <div key={`${ngo.name}-${idx}`} className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-2.5 hover:bg-white/10 transition-colors">
                    <p className="text-sm font-semibold text-white">{ngo.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ngo.focus}</p>
                    <p className="text-[11px] text-slate-400">{ngo.address}</p>
                    <a href={`tel:${ngo.phone}`} className="text-xs font-semibold text-pink-400 mt-1 inline-block">{ngo.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <form onSubmit={requestConsult} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">Request Legal Consult</p>
            <label className="text-[10px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
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
              className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <input
              value={consultForm.phone}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone"
              className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={consultForm.city}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
              className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <select
              value={consultForm.issueType}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, issueType: e.target.value }))}
              className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {["Harassment", "Cyber Abuse", "Blackmail", "Domestic Violence", "FIR Filing", "Other"].map((issue) => (
                <option key={issue} value={issue} className="bg-[#141523] text-white">{issue}</option>
              ))}
            </select>
            <input
              value={consultForm.preferredTime}
              onChange={(e) => setConsultForm((prev) => ({ ...prev, preferredTime: e.target.value }))}
              placeholder="Preferred time"
              className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <textarea
            value={consultForm.description}
            onChange={(e) => setConsultForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
            placeholder="Briefly explain your issue..."
            className="w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {consultStatus ? <p className="text-[11px] text-purple-400">{consultStatus}</p> : null}
          <button
            type="submit"
            disabled={consultLoading}
            className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white py-2 text-xs font-semibold disabled:opacity-60 transition-transform active:scale-95"
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
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const scan = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const data = await api("/dm/scan", { method: "POST", body: JSON.stringify({ text, systemPrompt: DM_SCAN_SYSTEM_PROMPT }) });
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-xl font-semibold">DM Harassment Scanner</h2>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full rounded-2xl border border-white/10 p-3 text-sm" placeholder="Paste message..." />
      <button onClick={scan} className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white py-3 text-sm font-semibold">{loading ? "Analyzing..." : "Scan with AI"}</button>
      {result ? <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-sm space-y-1"><p><strong>Classification:</strong> {result.classification}</p><p><strong>Severity:</strong> {result.severity}/10</p><p><strong>Law:</strong> {result.peca_section}</p><p>{result.summary}</p></div> : null}
    </div>
  );
}

function SimpleDetector({ title, button, doneText }) {
  const [done, setDone] = useState(false);
  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-sm">{done ? doneText : "Ready for analysis"}</div>
      {!done ? <button onClick={() => setDone(true)} className="w-full rounded-2xl bg-stone-900 text-white py-3 text-sm font-semibold">{button}</button> : null}
    </div>
  );
}

function DistressListener({ onTriggerSOS }) {
  const [listening, setListening] = useState(false);
  const [detected, setDetected] = useState(false);
  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      <h2 className="text-xl font-semibold">Distress Listener</h2>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-center">
        <Ear className={`w-12 h-12 mx-auto ${listening ? "text-emerald-700" : "text-slate-400"}`} />
        <p className="mt-2 text-sm">{detected ? "Trigger detected" : listening ? "Listening..." : "Ready"}</p>
        {!listening ? <button onClick={() => setListening(true)} className="mt-4 rounded-full bg-emerald-700 text-white px-4 py-2 text-sm">Start listening</button> : null}
        {listening && !detected ? <button onClick={() => setDetected(true)} className="mt-4 rounded-full bg-stone-900 text-white px-4 py-2 text-sm">Simulate detection</button> : null}
        {detected ? <button onClick={onTriggerSOS} className="mt-3 rounded-full bg-red-600 text-white px-4 py-2 text-sm">Trigger SOS</button> : null}
      </div>
    </div>
  );
}

function SafeTransit({ contacts, autoDialPolice }) {
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
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-xl font-semibold">Safe Transit</h2>
      <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
        <p className="text-xs text-slate-400">Transit mode: <span className="font-semibold text-white">{tripMode === "online" ? "Backend tracked" : "Local manual fallback"}</span></p>
        <p className="text-[11px] text-slate-400 mt-1">
          Works without map API keys. If backend/API fails, manual safety check-in flow continues.
        </p>
      </div>
      {!trip ? <button onClick={startTrip} className="w-full rounded-2xl bg-emerald-800 text-white py-3 text-sm font-semibold">Start tracked trip</button> : null}
      {trip?.status === "active" ? <button onClick={simulateDeviation} className="w-full rounded-xl bg-stone-900 text-white py-2.5 text-xs font-semibold">Mark possible deviation</button> : null}
      {trip ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3">
          <p className="text-xs text-slate-400">Shared with: {contacts.map((c) => c.name).join(", ") || "none"}</p>
          <p className="text-xs text-slate-400 mt-1">Auto-dial police: {autoDialPolice ? "enabled" : "disabled"}</p>
          {nextCheckInAt ? (
            <p className="text-xs text-pink-400 mt-1">Next check-in due: {new Date(nextCheckInAt).toLocaleTimeString()}</p>
          ) : null}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={checkInText}
              onChange={(e) => setCheckInText(e.target.value)}
              placeholder="I'm safe at..."
              className="sm:col-span-2 rounded-lg border border-white/10 px-2.5 py-2 text-xs"
            />
            <button onClick={submitCheckIn} className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white px-2.5 py-2 text-xs font-semibold">Add check-in</button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-[11px] text-slate-400">Check-in timer (min):</label>
            <input
              type="number"
              min={1}
              max={30}
              value={checkInTimerMinutes}
              onChange={(e) => setCheckInTimerMinutes(Math.max(1, Math.min(30, Number(e.target.value) || 5)))}
              className="w-16 rounded border border-white/20 px-2 py-1 text-xs"
            />
            <button onClick={markSafeArrival} className="ml-auto rounded-lg bg-emerald-700 text-white px-2.5 py-1.5 text-[11px] font-semibold">
              Mark arrived safe
            </button>
          </div>
          {statusMessage ? <p className="text-xs text-purple-400 mt-2">{statusMessage}</p> : null}
          <div className="mt-2 space-y-1">{trip.events?.map((event, i) => <p key={`${event}-${i}`} className="text-xs text-slate-300">• {event}</p>)}</div>
        </div>
      ) : null}
    </div>
  );
}

function SOSScreen({ onClose, contacts, autoDialPolice, cancelPin }) {
  const [phase, setPhase] = useState("countdown");
  const [countdown, setCountdown] = useState(5);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("active");
      api("/sos/start", { method: "POST", body: JSON.stringify({ source: "manual" }) }).catch(() => {});
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const stopSOS = async () => {
    if (phase === "countdown") return onClose();
    try {
      await api("/sos/stop", { method: "POST", body: JSON.stringify({ pin }) });
      onClose();
    } catch {
      setError("Incorrect PIN");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-red-700 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {phase === "countdown" ? <><p className="text-xs uppercase tracking-[0.3em] text-red-200 font-semibold">SOS in</p><p className="text-[8rem] font-bold leading-none mt-2">{countdown}</p></> : <>
          <div className="w-32 h-32 rounded-full bg-white/5 backdrop-blur-md/15 flex items-center justify-center mb-5"><Radio className="w-16 h-16" /></div>
          <p className="text-3xl font-bold">SOS active</p>
          <p className="text-sm text-red-100 mt-2 text-center">Notified: {contacts.map((c) => c.name).join(", ") || "none"}</p>
          <p className="text-xs text-red-100 mt-1">Auto-dial police: {autoDialPolice ? "enabled" : "disabled"}</p>
          <input value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} placeholder={`Enter PIN (${cancelPin})`} className="mt-4 w-56 rounded-lg bg-white/5 backdrop-blur-md/15 border border-white/40 px-3 py-2 text-sm outline-none placeholder:text-red-100" />
          {error ? <p className="text-xs mt-2">{error}</p> : null}
        </>}
      </div>
      <div className="px-6 pb-8"><button onClick={stopSOS} className="w-full py-4 rounded-2xl bg-white/5 backdrop-blur-md/15 border border-white/20 text-sm font-semibold">{phase === "countdown" ? "Cancel SOS" : "I'm safe — end alert"}</button></div>
    </div>
  );
}

function MoreScreen({ settings, setSettings, contacts, setContacts }) {
  const [name, setName] = useState("");
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
    const data = await api("/contacts", { method: "POST", body: JSON.stringify({ name: name.trim() }) });
    setContacts(data.contacts);
    setName("");
  };
  const removeContact = async (id) => {
    const data = await api(`/contacts/${id}`, { method: "DELETE" });
    setContacts(data.contacts);
  };
  const updateSetting = async (next) => {
    const data = await api("/settings", { method: "PUT", body: JSON.stringify(next) });
    setSettings(data.settings);
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
  return (
    <div className="px-4 pt-4 pb-24 space-y-5">
      <h2 className="text-2xl font-semibold">Resources & Settings</h2>
      <div className="space-y-2">
        {[{ n: "Police", no: "15", i: Phone }, { n: "Madadgaar", no: "1099", i: Heart }, { n: "FIA Cybercrime", no: "1991", i: Shield }, { n: "Punjab Women Helpline", no: "1043", i: Building2 }].map((h) => {
          const Icon = h.i;
          return <div key={h.n} className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Icon className="w-4.5 h-4.5 text-purple-300" /></div><div className="flex-1"><p className="text-sm font-semibold">{h.n}</p></div><button className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white text-xs font-semibold">{h.no}</button></div>;
        })}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Trusted Contacts</p>
        {contacts.map((contact) => <div key={contact.id} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2"><span className="text-sm">{contact.name}</span><button onClick={() => removeContact(contact.id)} className="text-xs font-semibold text-rose-700">Remove</button></div>)}
        <div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="New contact" className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm" /><button onClick={addContact} className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white px-3 py-2 text-xs font-semibold">Add</button></div>
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
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-pink-400 font-semibold">Evidence Vault</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={evidenceForm.incidentId} onChange={(e) => setEvidenceForm((prev) => ({ ...prev, incidentId: e.target.value }))} placeholder="Incident ID" className="rounded-lg border border-white/10 px-3 py-2 text-sm" />
          <input value={evidenceForm.title} onChange={(e) => setEvidenceForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Evidence title" className="rounded-lg border border-white/10 px-3 py-2 text-sm" />
        </div>
        <textarea value={evidenceForm.content} onChange={(e) => setEvidenceForm((prev) => ({ ...prev, content: e.target.value }))} rows={3} placeholder="Evidence content (or metadata)" className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button onClick={uploadEvidence} className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25 text-white px-3 py-2 text-xs font-semibold">Upload evidence</button>
          <button onClick={exportEvidencePacket} className="rounded-lg bg-stone-900 text-white px-3 py-2 text-xs font-semibold">Export packet</button>
        </div>
        {evidenceMsg ? <p className="text-xs text-slate-400">{evidenceMsg}</p> : null}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-pink-400 font-semibold">Legal Consult Requests</p>
          <button onClick={loadConsultRequests} className="text-xs font-semibold text-purple-400">Refresh</button>
        </div>
        {consultLoading ? <p className="text-xs text-slate-400">Loading requests...</p> : null}
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {consultRequests.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-[#141523] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-white">{item.issueType} • {item.city}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.urgent ? "bg-rose-100 text-rose-700" : "bg-white/10 text-pink-400"}`}>
                  {item.urgent ? "Urgent" : "Normal"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
              <p className="text-[10px] text-slate-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {!consultLoading && consultRequests.length === 0 ? <p className="text-xs text-slate-400">No consult requests yet.</p> : null}
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
    { id: "dm", title: "DM Harassment Scanner", icon: MessageSquare },
    { id: "deepfake", title: "Deepfake Detector", icon: ImageIcon },
    { id: "voice", title: "Voice Clone Detector", icon: Volume2 },
    { id: "distress", title: "Distress Listener", icon: Ear },
  ];
  return <div className="px-4 pt-5 pb-24 space-y-3">{tools.map((t) => { const Icon = t.icon; return <button key={t.id} onClick={() => onSelectTool(t.id)} className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-left flex items-center gap-3 hover:shadow-sm"><div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Icon className="w-5 h-5 text-purple-300" /></div><span className="font-semibold text-sm flex-1">{t.title}</span><ChevronRight className="w-4 h-4 text-slate-500" /></button>; })}</div>;
}

export default function App() {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useUser();
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [devBypass, setDevBypass] = useState(false);
  
  const [screen, setScreen] = useState("home");
  const [shieldTool, setShieldTool] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [lang, setLang] = useState("en");
  const [contacts, setContacts] = useState([]);
  const [settings, setSettings] = useState({ stealthMode: false, autoDialPolice: true, cancelPin: "1234" });
  const [backendOk, setBackendOk] = useState(true);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [timelineText, setTimelineText] = useState("");
  const [timelineSaving, setTimelineSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = clerkSignedIn || !!supabaseSession;

  useEffect(() => {
    Promise.all([api("/health"), api("/state")])
      .then(([, state]) => {
        setContacts(state.contacts || []);
        setSettings(state.settings || settings);
        setBackendOk(true);
      })
      .catch(() => setBackendOk(false));
  }, []);

  const loadTimeline = async () => {
    try {
      const data = await api("/safety/timeline");
      setTimelineEntries(data.entries || []);
    } catch {
      setTimelineEntries([]);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      loadTimeline();
    }, 9000);
    return () => clearInterval(timerId);
  }, []);

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
    } catch {
      // ignore temporary errors in UI
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
    if (screen === "home") return <HomeScreen onNavigate={handleNavigate} onSOS={() => setSosActive(true)} lang={lang} contactsCount={contacts.length} stealthMode={settings.stealthMode} canInstall={Boolean(installPromptEvent)} onInstall={handleInstallApp} timelineEntries={timelineEntries} timelineText={timelineText} setTimelineText={setTimelineText} onAddTimeline={addTimelineEntry} timelineSaving={timelineSaving} />;
    if (screen === "legal") return <LegalChat />;
    if (screen === "transit") return <SafeTransit contacts={contacts} autoDialPolice={settings.autoDialPolice} />;
    if (screen === "community") return <CommunityScreen />;
    if (screen === "more") return <MoreScreen settings={settings} setSettings={setSettings} contacts={contacts} setContacts={setContacts} />;
    if (screen === "shield") {
      if (shieldTool === "dm") return <DMScanner />;
      if (shieldTool === "deepfake") return <SimpleDetector title="Deepfake Detector" button="Analyze sample image" doneText="Likely AI-generated image (92.4%)" />;
      if (shieldTool === "voice") return <SimpleDetector title="Voice Clone Detector" button="Analyze sample call" doneText="Synthetic voice likely (87.1%)" />;
      if (shieldTool === "distress") return <DistressListener onTriggerSOS={() => setSosActive(true)} />;
      return <ShieldHub onSelectTool={setShieldTool} />;
    }
    return null;
  }, [screen, shieldTool, lang, contacts, settings, installPromptEvent, timelineEntries, timelineText, timelineSaving]);

  const title =
    screen === "transit"
      ? "Safe Transit"
      : screen === "community"
      ? "Community"
      : screen === "more"
      ? "Resources"
      : screen === "shield" && !shieldTool
      ? "AI Threat Shield"
      : null;

  if (!clerkLoaded) {
    return (
      <div className="min-h-screen bg-[#141523] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!isAuthenticated && !devBypass) {
    return <WelcomeAuthScreen onBypass={() => setDevBypass(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#141523] text-white">
      <div className="w-full max-w-5xl mx-auto min-h-screen lg:min-h-[92vh] lg:my-4 bg-[#141523] shadow-xl lg:rounded-3xl overflow-hidden flex flex-col relative z-0">
        {!sosActive ? <Header lang={lang} setLang={setLang} title={title} showBack={screen === "shield" && shieldTool !== null} onBack={() => setShieldTool(null)} /> : null}
        <main className={`flex-1 ${screen === "legal" ? "flex flex-col" : "overflow-y-auto"}`}>{rendered}</main>
        {!sosActive ? <BottomNav active={screen} onNavigate={handleNavigate} /> : null}
        {sosActive ? <SOSScreen onClose={() => setSosActive(false)} contacts={contacts} autoDialPolice={settings.autoDialPolice} cancelPin={settings.cancelPin} /> : null}
      </div>
      {!backendOk ? (
        <div className="fixed bottom-3 right-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-900 flex items-center gap-1.5 z-50">
          <AlertCircle className="w-3.5 h-3.5" /> Backend offline. Start with `npm run dev:full`.
        </div>
      ) : null}
    </div>
  );
}
