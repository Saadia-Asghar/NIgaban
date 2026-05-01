import { useEffect, useMemo, useRef, useState } from "react";
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
  Compass,
  Users,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

function Header({ lang, setLang, title, showBack, onBack, user, onLogout }) {
  return (
    <header className="sticky top-0 z-20 border-b border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 px-4 py-3 backdrop-blur flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button onClick={onBack} className="rounded-full p-1.5 hover:bg-stone-200/60"><ChevronLeft className="w-5 h-5" /></button>
        ) : (
          <div className="w-9 h-9 rounded-full bg-violet-800 text-white flex items-center justify-center font-bold">ن</div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-stone-900">{title || "Nigehbaan"}</h1>
          {!title ? <p className="text-[10px] text-stone-500">نگہبان · your guardian</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user && <button onClick={onLogout} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-900">Logout</button>}
        <button onClick={() => setLang((v) => (v === "en" ? "ur" : "en"))} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-violet-200 text-violet-900 flex items-center gap-1">
          <Languages className="w-3.5 h-3.5" />{lang === "en" ? "EN" : "اردو"}
        </button>
      </div>
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
    <nav className="sticky bottom-0 border-t border-violet-200 bg-white/95 px-2 py-2 flex items-center justify-around">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const activeTab = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onNavigate(tab.id)} className={`px-3 py-1.5 rounded-xl ${activeTab ? "text-violet-900 bg-violet-100" : "text-stone-500"}`}>
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

function OnboardingScreen({ onFinish }) {
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
  const isLast = step === slides.length - 1;
  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500 font-semibold">Onboarding</p>
          <button onClick={onFinish} className="text-xs font-semibold text-stone-500 hover:text-stone-700">Skip</button>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${slide.color} flex items-center justify-center`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-stone-900">{slide.title}</h3>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">{slide.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-8 bg-rose-900" : "w-3 bg-stone-300"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 ? (
            <button
              onClick={() => setStep((v) => v - 1)}
              className="flex-1 rounded-xl border border-stone-300 text-stone-700 py-2.5 text-sm font-semibold"
            >
              Back
            </button>
          ) : null}
          <button
            onClick={() => (isLast ? onFinish() : setStep((v) => v + 1))}
            className="flex-1 rounded-xl bg-rose-900 text-white py-2.5 text-sm font-semibold"
          >
            {isLast ? "Get Started" : "Next"}
          </button>
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
  const quickChecklist = [
    { id: "contacts", label: "Add at least 3 trusted contacts", done: contactsCount >= 3, action: "more" },
    { id: "timeline", label: "Create your first Safety Timeline note", done: timelineEntries.length > 0, action: "home" },
    { id: "community", label: "Open Community and check city alerts", done: false, action: "community" },
    { id: "transit", label: "Start a Safe Transit trip before travel", done: false, action: "transit" },
  ];
  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-500">{new Date().toDateString()}</p>
        <h2 className="text-2xl font-semibold text-stone-900 mt-1">{greeting}</h2>
      </div>
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-800 p-5 text-white">
        <p className="text-[11px] uppercase tracking-[0.2em] text-violet-100">Welcome to Nigehbaan</p>
        <h3 className="text-xl font-semibold mt-1">Your women safety companion</h3>
        <p className="text-sm text-violet-100 mt-2 leading-relaxed">
          Nigehbaan helps you handle harassment, unsafe travel, and emergencies with SOS, legal guidance, AI threat tools, and community alerts.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/10 border border-white/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-violet-100">Step 1</p>
            <p className="text-xs mt-1">Set trusted contacts in Resources</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-violet-100">Step 2</p>
            <p className="text-xs mt-1">Use Transit + Shield during risky situations</p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/20 p-2.5">
            <p className="text-[11px] uppercase tracking-wide text-violet-100">Step 3</p>
            <p className="text-xs mt-1">Tap SOS immediately if danger escalates</p>
          </div>
        </div>
        {canInstall ? (
          <button
            onClick={onInstall}
            className="mt-3 w-full rounded-xl bg-white text-violet-900 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" />
            Install app on mobile home screen
          </button>
        ) : null}
      </div>
      <div className="rounded-2xl border border-violet-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">Quick Start Checklist</p>
          <p className="text-xs text-violet-800 font-semibold">
            {quickChecklist.filter((item) => item.done).length}/{quickChecklist.length} completed
          </p>
        </div>
        <div className="space-y-2">
          {quickChecklist.map((item) => (
            <button
              key={item.id}
              onClick={() => (item.action === "home" ? null : onNavigate(item.action))}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-left flex items-center justify-between gap-2"
            >
              <span className="text-xs text-stone-700">{item.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {item.done ? "Done" : item.action === "home" ? "On this screen" : "Open"}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-violet-200 bg-white p-4 space-y-2">
        <p className="text-sm font-semibold text-stone-900">How it works</p>
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
          <div key={guide.id} className="rounded-xl border border-stone-200 bg-stone-50">
            <button
              onClick={() => setOpenGuide((prev) => (prev === guide.id ? "" : guide.id))}
              className="w-full px-3 py-2 text-left flex items-center justify-between gap-2"
            >
              <span className="text-xs font-semibold text-stone-800">{guide.title}</span>
              <ChevronRight className={`w-4 h-4 text-stone-500 transition ${openGuide === guide.id ? "rotate-90" : ""}`} />
            </button>
            {openGuide === guide.id ? <p className="px-3 pb-3 text-xs text-stone-600">{guide.body}</p> : null}
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-violet-200 bg-white p-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-700" />
        <p className="text-sm text-stone-700">All clear. {contactsCount} trusted contacts active.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-violet-200 bg-white p-3">
          <Shield className="w-4 h-4 text-violet-800" />
          <p className="text-xs font-semibold mt-1 text-stone-900">What this app is for</p>
          <p className="text-[11px] text-stone-600 mt-1">Prevent abuse, collect evidence, and trigger emergency response fast.</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-white p-3">
          <Compass className="w-4 h-4 text-violet-800" />
          <p className="text-xs font-semibold mt-1 text-stone-900">How to use it</p>
          <p className="text-[11px] text-stone-600 mt-1">Open tools by tab: Shield, Legal, Transit, Community, and Resources.</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-white p-3">
          <Users className="w-4 h-4 text-violet-800" />
          <p className="text-xs font-semibold mt-1 text-stone-900">Community help</p>
          <p className="text-[11px] text-stone-600 mt-1">Find nearby NGOs, share safety updates, and report incidents quickly.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-violet-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">Safety Timeline (real-time)</p>
          <span className="text-[10px] uppercase tracking-wide rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700 font-semibold">Live</span>
        </div>
        <p className="text-xs text-stone-500">
          Add quick notes when meeting someone new, spotting suspicious activity, or starting a risky commute.
        </p>
        <div className="flex gap-2">
          <input
            value={timelineText}
            onChange={(e) => setTimelineText(e.target.value)}
            placeholder="Add safety note..."
            className="flex-1 rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm"
          />
          <button
            onClick={onAddTimeline}
            disabled={timelineSaving || !timelineText.trim()}
            className="rounded-lg bg-violet-900 text-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
          >
            {timelineSaving ? "Saving..." : "Add"}
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {timelineEntries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-stone-200 bg-stone-50 p-2.5">
              <p className="text-xs text-stone-700">{entry.text}</p>
              <p className="text-[10px] text-stone-500 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          ))}
          {timelineEntries.length === 0 ? <p className="text-xs text-stone-500">No timeline notes yet.</p> : null}
        </div>
      </div>
      {stealthMode ? <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">Stealth mode enabled.</div> : null}
      <div className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 flex items-center justify-between">
        <p className="text-xs text-stone-600">Safety profile completion</p>
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
            <button key={item.id} onClick={() => onNavigate(item.id)} className="rounded-2xl border border-violet-200 bg-white p-4 text-left hover:shadow-md hover:-translate-y-[1px] transition">
              <Icon className="w-5 h-5 mb-2 text-violet-800" />
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{item.subtitle}</p>
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
    if (level === "advisory") return "bg-violet-100 text-violet-800 border-violet-200";
    return "bg-stone-100 text-stone-700 border-stone-200";
  };

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="rounded-2xl border border-violet-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Community Awareness</h2>
            <p className="text-xs text-stone-500 mt-1">Current activities, alerts, and verified safety updates.</p>
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="text-xs rounded-lg border border-violet-200 bg-white px-2 py-1 text-stone-700"
          >
            {["Lahore", "Karachi", "Islamabad", "Peshawar"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => loadFeed(city)}
        className="w-full rounded-xl bg-violet-900 text-white py-2.5 text-sm font-semibold"
      >
        Refresh activity feed
      </button>
      <div className="rounded-xl border border-violet-200 bg-white px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${liveUpdates ? "bg-emerald-500" : "bg-stone-400"}`} />
          <p className="text-xs text-stone-700">
            {liveUpdates ? "Real-time updates ON" : "Real-time updates OFF"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastLiveSync ? (
            <p className="text-[10px] text-stone-500">Last sync: {new Date(lastLiveSync).toLocaleTimeString()}</p>
          ) : null}
          <button
            onClick={() => setLiveUpdates((v) => !v)}
            className="text-xs font-semibold text-violet-800"
          >
            {liveUpdates ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-violet-200 bg-white p-2">
        <button
          onClick={() => setActivePanel("feed")}
          className={`rounded-xl py-2 text-xs font-semibold ${activePanel === "feed" ? "bg-violet-900 text-white" : "bg-stone-100 text-stone-700"}`}
        >
          Activity Feed
        </button>
        <button
          onClick={() => setActivePanel("chat")}
          className={`rounded-xl py-2 text-xs font-semibold ${activePanel === "chat" ? "bg-violet-900 text-white" : "bg-stone-100 text-stone-700"}`}
        >
          City Safety Chat
        </button>
      </div>

      <div className="rounded-2xl border border-violet-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">Nearby NGOs ({city})</p>
          <button onClick={() => loadNgos(city)} className="text-xs font-semibold text-violet-800">Refresh NGOs</button>
        </div>
        {ngoLoading ? <p className="text-xs text-stone-500">Loading nearby NGOs...</p> : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ngos.map((ngo) => (
            <div key={`${ngo.name}-${ngo.phone}`} className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
              <p className="text-sm font-semibold text-stone-900">{ngo.name}</p>
              <p className="text-[11px] text-stone-600 mt-0.5">{ngo.focus}</p>
              <p className="text-[11px] text-stone-500 mt-1">{ngo.address}</p>
              <a href={`tel:${ngo.phone}`} className="text-xs font-semibold text-violet-800 mt-1 inline-block">{ngo.phone}</a>
            </div>
          ))}
        </div>
        {!ngoLoading && ngos.length === 0 ? <p className="text-xs text-stone-500">No NGOs found for this city.</p> : null}
      </div>

      {activePanel === "chat" ? (
        <div className="space-y-3">
          <form onSubmit={sendChatMessage} className="rounded-2xl border border-violet-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={chatForm.mode}
                onChange={(e) => setChatForm((prev) => ({ ...prev, mode: e.target.value }))}
                className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm text-stone-700"
              >
                <option value="chat">General chat</option>
                <option value="incident">Report incident</option>
              </select>
              <select
                value={chatForm.category}
                onChange={(e) => setChatForm((prev) => ({ ...prev, category: e.target.value }))}
                className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm text-stone-700"
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
                className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm"
              />
              <input
                value={chatForm.area}
                onChange={(e) => setChatForm((prev) => ({ ...prev, area: e.target.value }))}
                placeholder="Area / landmark (required for incident)"
                className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm"
              />
            </div>
            <label className="text-[11px] text-stone-600 flex items-center gap-1.5">
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
              className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm"
            />
            {chatMessageStatus ? <p className="text-xs text-violet-800">{chatMessageStatus}</p> : null}
            <button
              type="submit"
              disabled={sendingChat}
              className="w-full rounded-xl bg-violet-900 text-white py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {sendingChat ? "Sending..." : chatForm.mode === "incident" ? "Post incident report" : "Send to chat"}
            </button>
          </form>

          <div className="rounded-2xl border border-violet-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-stone-900">#{city.toLowerCase()}-safety channel</p>
              <button onClick={() => loadChat(city)} className="text-xs font-semibold text-violet-800">Refresh chat</button>
            </div>
            {chatLoading ? (
              <p className="text-xs text-stone-500">Loading chat messages...</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`rounded-xl border p-3 ${msg.mode === "incident" ? "border-rose-200 bg-rose-50/60" : "border-stone-200 bg-stone-50"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-stone-800">{msg.alias || "Anonymous"}</p>
                      <p className="text-[10px] text-stone-500">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                    {msg.mode === "incident" ? (
                      <p className="text-[10px] mt-1 inline-block rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 font-semibold text-rose-800 uppercase tracking-wide">
                        Incident Report
                      </p>
                    ) : null}
                    <p className="text-sm text-stone-700 mt-1">{msg.text}</p>
                    {msg.area ? <p className="text-[11px] text-stone-500 mt-1">Area: {msg.area}</p> : null}
                    {msg.tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.tags.map((tag) => (
                          <span key={`${msg.id}-${tag}`} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                            {tag.replace("-", " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!chatLoading && chatMessages.length === 0 ? (
                  <p className="text-xs text-stone-500">No messages yet. Start the first community check-in.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activePanel === "feed" ? <form onSubmit={submitReport} className="rounded-2xl border border-violet-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">Post anonymous report</p>
          <label className="text-[11px] text-stone-600 flex items-center gap-1.5">
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
            className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm text-stone-700"
          >
            {["Harassment", "Unsafe Transit", "Suspicious Activity", "Cyber Abuse", "Other"].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            value={form.area}
            onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
            placeholder="Area / landmark"
            className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          placeholder="Describe what happened so others can stay aware..."
          className="w-full rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-sm"
        />
        {submitMessage ? <p className="text-xs text-violet-800">{submitMessage}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-violet-900 text-white py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </form> : null}

      {activePanel === "feed" && loading ? (
        <div className="rounded-2xl border border-violet-200 bg-white p-4 text-sm text-stone-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading community activity...
        </div>
      ) : null}

      {activePanel === "feed" ? <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-violet-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border font-semibold ${levelStyle(item.level)}`}>
                {item.level}
              </span>
              <span className="text-[11px] text-stone-500">
                {new Date(item.time).toLocaleString()}
              </span>
            </div>
            <p className="text-sm font-semibold text-stone-900 mt-2">{item.title}</p>
            <p className="text-xs text-stone-600 mt-1">{item.description}</p>
            {item.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                    {tag.replace("-", " ")}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="text-[11px] text-violet-700 mt-2 font-medium">Source: {item.source}</p>
            {item.verified ? (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                Verified report
              </div>
            ) : null}
          </div>
        ))}
        {!loading && items.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
            No activity found. Try a different city or refresh.
          </div>
        ) : null}
      </div> : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">Moderator queue (demo)</p>
          <button onClick={loadPendingReports} className="text-xs font-semibold text-violet-800">Refresh queue</button>
        </div>
        {moderationLoading ? (
          <p className="text-xs text-stone-500">Loading pending reports...</p>
        ) : null}
        {!moderationLoading && pendingReports.length === 0 ? (
          <p className="text-xs text-stone-500">No pending reports.</p>
        ) : null}
        <div className="space-y-2">
          {pendingReports.map((report) => (
            <div key={report.id} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="text-xs text-stone-500">{report.city} • {report.category}</p>
              <p className="text-sm font-semibold text-stone-900">{report.title}</p>
              <p className="text-xs text-stone-600 mt-1">{report.description}</p>
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
  const [draftText, setDraftText] = useState("");
  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [nearbyCity, setNearbyCity] = useState("Lahore");
  const [nearbyContacts, setNearbyContacts] = useState([]);
  const [nearbyNgos, setNearbyNgos] = useState([]);
  const [helpLoading, setHelpLoading] = useState(false);
  const [detectingCity, setDetectingCity] = useState(false);
  const [detectMessage, setDetectMessage] = useState("");
  const scrollRef = useRef(null);
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

  const generateDraft = () => {
    const incidentSummary = messages.filter(m => m.role === "user").map(m => m.content).join(" ");
    const draft = `First Information Report (FIR) Draft

Incident Summary: ${incidentSummary}

Complainant Details:
Name: [Your Full Name]
CNIC: [Your CNIC Number]
Address: [Your Address]
Phone: [Your Phone Number]

Accused Details: [If known]
Name: [Accused Name]
Description: [Description of accused]

Date and Time of Incident: [Date and Time]
Place of Incident: [Location]

Details of Incident:
[Describe what happened in detail, including any witnesses, evidence, etc.]

Legal Sections: [Based on advice above]

Complainant Signature: ____________________
Date: ____________________

Note: This is a draft. Please consult a lawyer before filing.`;
    setDraftText(draft);
  };

  const submitDraft = async () => {
    setSubmittingDraft(true);
    try {
      await api("/legal/queue", { method: "POST", body: JSON.stringify({ draft: draftText }) });
      setShowDraft(false);
      setDraftText("");
    } catch {
      // ignore
    } finally {
      setSubmittingDraft(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-violet-200 px-4 py-3 flex items-center justify-between">
        <p className="font-semibold text-stone-900">Legal Aid Chat</p>
        <button onClick={() => setShowDraft(true)} className="text-xs rounded-full bg-violet-50 border border-violet-200 px-3 py-1.5 text-violet-900 font-semibold">Draft FIR</button>
      </div>
      <div className="px-4 py-3 bg-violet-50/50 border-b border-violet-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-violet-900 uppercase tracking-wide">Nearby Police & Help</p>
          <div className="flex items-center gap-2">
            <button
              onClick={detectCityFromLocation}
              disabled={detectingCity}
              className="text-xs rounded-lg border border-violet-300 bg-white px-2 py-1 text-violet-800 font-semibold disabled:opacity-50"
            >
              {detectingCity ? "Detecting..." : "Use my location"}
            </button>
            <select
              value={nearbyCity}
              onChange={(e) => setNearbyCity(e.target.value)}
              className="text-xs rounded-lg border border-violet-200 bg-white px-2 py-1 text-stone-700"
            >
              {["Lahore", "Karachi", "Islamabad", "Peshawar"].map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        {detectMessage ? <p className="text-[11px] text-violet-800">{detectMessage}</p> : null}
        {helpLoading ? (
          <p className="text-xs text-stone-500">Loading nearby support...</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nearbyContacts.map((contact, idx) => (
                <div key={`${contact.name}-${idx}`} className="rounded-xl border border-violet-200 bg-white px-3 py-2">
                  <p className="text-[11px] text-violet-700 font-semibold">{contact.type}</p>
                  <p className="text-sm font-semibold text-stone-900">{contact.name}</p>
                  <p className="text-[11px] text-stone-500">{contact.address}</p>
                  <a href={`tel:${contact.phone}`} className="text-xs font-semibold text-violet-800 mt-1 inline-block">{contact.phone}</a>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-900">Nearby NGOs</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nearbyNgos.map((ngo, idx) => (
                  <div key={`${ngo.name}-${idx}`} className="rounded-lg border border-fuchsia-200 bg-white p-2.5">
                    <p className="text-sm font-semibold text-stone-900">{ngo.name}</p>
                    <p className="text-[11px] text-stone-600 mt-0.5">{ngo.focus}</p>
                    <p className="text-[11px] text-stone-500">{ngo.address}</p>
                    <a href={`tel:${ngo.phone}`} className="text-xs font-semibold text-fuchsia-800 mt-1 inline-block">{ngo.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-stone-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-violet-900 text-white" : "bg-white border border-violet-200 text-stone-800"}`}>{m.content}</div>
          </div>
        ))}
        {loading ? <div className="inline-flex items-center gap-2 text-xs bg-white border border-violet-200 rounded-xl px-3 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Thinking...</div> : null}
      </div>
      <div className="bg-white border-t border-violet-200 px-3 py-3 flex gap-2">
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} className="flex-1 rounded-2xl bg-stone-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300" placeholder="Describe incident..." />
        <button onClick={send} disabled={loading || !input.trim()} className="w-10 h-10 rounded-full bg-violet-900 text-white disabled:bg-stone-300"><Send className="w-4 h-4 mx-auto" /></button>
      </div>
      {showDraft ? (
        <div className="fixed inset-0 z-40 bg-stone-900/50 flex items-end sm:items-center sm:justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
              <p className="font-semibold">FIR Draft</p>
              <button onClick={() => setShowDraft(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="px-4 py-3">
              <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={15} className="w-full border border-stone-200 p-3 text-sm rounded-lg" placeholder="Draft will appear here..." />
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <button onClick={generateDraft} className="flex-1 rounded-xl bg-violet-900 text-white py-2 text-sm font-semibold">Generate Draft</button>
              <button onClick={submitDraft} disabled={submittingDraft || !draftText.trim()} className="flex-1 rounded-xl bg-emerald-600 text-white py-2 text-sm font-semibold disabled:bg-stone-300">
                {submittingDraft ? "Submitting..." : "Submit for Review"}
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
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="w-full rounded-2xl border border-stone-200 p-3 text-sm" placeholder="Paste message..." />
      <button onClick={scan} className="w-full rounded-2xl bg-violet-900 text-white py-3 text-sm font-semibold">{loading ? "Analyzing..." : "Scan with AI"}</button>
      {result ? <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm space-y-1"><p><strong>Classification:</strong> {result.classification}</p><p><strong>Severity:</strong> {result.severity}/10</p><p><strong>Law:</strong> {result.peca_section}</p><p>{result.summary}</p></div> : null}
    </div>
  );
}

function SimpleDetector({ title, button, doneText }) {
  const [done, setDone] = useState(false);
  return (
    <div className="px-4 pt-4 pb-24 space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">{done ? doneText : "Ready for analysis"}</div>
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
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center">
        <Ear className={`w-12 h-12 mx-auto ${listening ? "text-emerald-700" : "text-stone-500"}`} />
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
  const [currentLocation, setCurrentLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    if (trip && trip.status === "active") {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCurrentLocation([lat, lon]);
          // Send location to server
          api("/transit/location", {
            method: "POST",
            body: JSON.stringify({ tripId: trip.id, lat, lon }),
          }).then((data) => setTrip(data.trip));
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      setWatchId(id);
      return () => {
        navigator.geolocation.clearWatch(id);
      };
    } else if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [trip]);

  const startTrip = async () => {
    const data = await api("/transit/start", { method: "POST", body: JSON.stringify({ destination: "University Gate" }) });
    setTrip(data.trip);
  };

  const stopTrip = async () => {
    if (trip) {
      // Assume stop by setting status to completed
      const updatedTrip = { ...trip, status: "completed" };
      setTrip(updatedTrip);
      setCurrentLocation(null);
    }
  };

  const simulateDeviation = async () => {
    if (!trip) return;
    const data = await api("/transit/deviation", { method: "POST", body: JSON.stringify({ tripId: trip.id }) });
    setTrip(data.trip);
  };

  const mapCenter = currentLocation || [31.5204, 74.3587]; // Default to Lahore
  const path = trip?.locationHistory?.map((loc) => [loc.lat, loc.lon]) || [];

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <h2 className="text-xl font-semibold">Safe Transit</h2>
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden" style={{ height: '400px' }}>
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {currentLocation && (
            <Marker position={currentLocation}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {trip?.destinationCoords && (
            <Marker position={[trip.destinationCoords.lat, trip.destinationCoords.lon]}>
              <Popup>Destination</Popup>
            </Marker>
          )}
          {path.length > 1 && (
            <Polyline positions={path} color="blue" />
          )}
        </MapContainer>
      </div>
      {!trip ? (
        <button onClick={startTrip} className="w-full rounded-2xl bg-emerald-800 text-white py-3 text-sm font-semibold">
          Start tracked trip
        </button>
      ) : trip.status === "active" ? (
        <div className="space-y-2">
          <button onClick={stopTrip} className="w-full rounded-2xl bg-red-800 text-white py-3 text-sm font-semibold">
            Stop trip
          </button>
          <button onClick={simulateDeviation} className="w-full rounded-xl bg-stone-900 text-white py-2.5 text-xs font-semibold">
            Simulate deviation
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-stone-600">Trip {trip.status}</p>
      )}
      {trip ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-3">
          <p className="text-xs text-stone-500">Shared with: {contacts.map((c) => c.name).join(", ") || "none"}</p>
          <p className="text-xs text-stone-500 mt-1">Auto-dial police: {autoDialPolice ? "enabled" : "disabled"}</p>
          <div className="mt-2 space-y-1">
            {trip.events?.map((event, i) => (
              <p key={`${event}-${i}`} className="text-xs text-stone-700">• {event}</p>
            ))}
          </div>
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
          <div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center mb-5"><Radio className="w-16 h-16" /></div>
          <p className="text-3xl font-bold">SOS active</p>
          <p className="text-sm text-red-100 mt-2 text-center">Notified: {contacts.map((c) => c.name).join(", ") || "none"}</p>
          <p className="text-xs text-red-100 mt-1">Auto-dial police: {autoDialPolice ? "enabled" : "disabled"}</p>
          <input value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} placeholder={`Enter PIN (${cancelPin})`} className="mt-4 w-56 rounded-lg bg-white/15 border border-white/40 px-3 py-2 text-sm outline-none placeholder:text-red-100" />
          {error ? <p className="text-xs mt-2">{error}</p> : null}
        </>}
      </div>
      <div className="px-6 pb-8"><button onClick={stopSOS} className="w-full py-4 rounded-2xl bg-white/15 border border-white/20 text-sm font-semibold">{phase === "countdown" ? "Cancel SOS" : "I'm safe — end alert"}</button></div>
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
  return (
    <div className="px-4 pt-4 pb-24 space-y-5">
      <h2 className="text-2xl font-semibold">Resources & Settings</h2>
      <div className="space-y-2">
        {[{ n: "Police", no: "15", i: Phone }, { n: "Madadgaar", no: "1099", i: Heart }, { n: "FIA Cybercrime", no: "1991", i: Shield }, { n: "Punjab Women Helpline", no: "1043", i: Building2 }].map((h) => {
          const Icon = h.i;
          return <div key={h.n} className="rounded-2xl bg-white border border-violet-200 p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><Icon className="w-4.5 h-4.5 text-violet-900" /></div><div className="flex-1"><p className="text-sm font-semibold">{h.n}</p></div><button className="px-3 py-1.5 rounded-full bg-violet-900 text-white text-xs font-semibold">{h.no}</button></div>;
        })}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-stone-500 font-semibold">Trusted Contacts</p>
        {contacts.map((contact) => <div key={contact.id} className="flex items-center justify-between bg-stone-100 rounded-lg px-3 py-2"><span className="text-sm">{contact.name}</span><button onClick={() => removeContact(contact.id)} className="text-xs font-semibold text-rose-700">Remove</button></div>)}
        <div className="flex gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="New contact" className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm" /><button onClick={addContact} className="rounded-lg bg-violet-900 text-white px-3 py-2 text-xs font-semibold">Add</button></div>
      </div>
      <div className="rounded-2xl border border-violet-200 bg-white p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-violet-700 font-semibold">Auth & Identity (OTP)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (+92...)" className="rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Device ID" className="rounded-lg border border-stone-200 px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={requestOtp} className="rounded-lg bg-violet-900 text-white px-3 py-2 text-xs font-semibold">Request OTP</button>
          <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter OTP" className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          <button onClick={verifyOtp} className="rounded-lg bg-emerald-700 text-white px-3 py-2 text-xs font-semibold">Verify</button>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={checkSession} className="text-xs font-semibold text-violet-800">Check session</button>
          {session ? <span className="text-[11px] text-emerald-700 font-semibold">Logged in</span> : <span className="text-[11px] text-stone-500">Guest</span>}
        </div>
        {authMsg ? <p className="text-xs text-stone-600">{authMsg}</p> : null}
      </div>
      <div className="rounded-2xl border border-violet-200 bg-white p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-violet-700 font-semibold">Evidence Vault</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={evidenceForm.incidentId} onChange={(e) => setEvidenceForm((prev) => ({ ...prev, incidentId: e.target.value }))} placeholder="Incident ID" className="rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          <input value={evidenceForm.title} onChange={(e) => setEvidenceForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Evidence title" className="rounded-lg border border-stone-200 px-3 py-2 text-sm" />
        </div>
        <textarea value={evidenceForm.content} onChange={(e) => setEvidenceForm((prev) => ({ ...prev, content: e.target.value }))} rows={3} placeholder="Evidence content (or metadata)" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button onClick={uploadEvidence} className="rounded-lg bg-violet-900 text-white px-3 py-2 text-xs font-semibold">Upload evidence</button>
          <button onClick={exportEvidencePacket} className="rounded-lg bg-stone-900 text-white px-3 py-2 text-xs font-semibold">Export packet</button>
        </div>
        {evidenceMsg ? <p className="text-xs text-stone-600">{evidenceMsg}</p> : null}
      </div>
      <div className="rounded-2xl bg-stone-100 border border-stone-200 p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-stone-500 font-semibold">Settings</p>
        <div className="flex items-center gap-3"><EyeOff className="w-4 h-4" /><p className="flex-1 text-sm">Stealth mode</p><input type="checkbox" checked={settings.stealthMode} onChange={(e) => updateSetting({ stealthMode: e.target.checked })} /></div>
        <div className="flex items-center gap-3"><Phone className="w-4 h-4" /><p className="flex-1 text-sm">Auto-dial police</p><input type="checkbox" checked={settings.autoDialPolice} onChange={(e) => updateSetting({ autoDialPolice: e.target.checked })} /></div>
        <div className="flex items-center gap-3"><Lock className="w-4 h-4" /><p className="flex-1 text-sm">SOS cancel PIN</p><input value={settings.cancelPin} onChange={(e) => updateSetting({ cancelPin: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="w-16 rounded border border-stone-300 px-2 py-1 text-xs" /></div>
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
  return <div className="px-4 pt-5 pb-24 space-y-3">{tools.map((t) => { const Icon = t.icon; return <button key={t.id} onClick={() => onSelectTool(t.id)} className="w-full rounded-2xl border border-violet-200 bg-white p-4 text-left flex items-center gap-3 hover:shadow-sm"><div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><Icon className="w-5 h-5 text-violet-900" /></div><span className="font-semibold text-sm flex-1">{t.title}</span><ChevronRight className="w-4 h-4 text-stone-400" /></button>; })}</div>;
}

function Auth({ supabase, mode, setMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-violet-800 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4">ن</div>
          <h1 className="text-2xl font-bold text-stone-900">Nigehbaan</h1>
          <p className="text-stone-600">Your women safety companion</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-900 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        {message && <p className="text-center text-sm text-stone-600 mt-4">{message}</p>}
        <div className="text-center mt-4">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-violet-900 font-semibold"
          >
            {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('signin'); // signin or signup
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
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem("nigehbaan_onboarding_done") !== "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return <Auth supabase={supabase} mode={authMode} setMode={setAuthMode} />;
  }

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

  const finishOnboarding = () => {
    try {
      localStorage.setItem("nigehbaan_onboarding_done", "true");
    } catch {
      // local storage can be unavailable in strict browser contexts
    }
    setShowOnboarding(false);
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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="w-full max-w-5xl mx-auto min-h-screen lg:min-h-[92vh] lg:my-4 bg-stone-50 shadow-xl lg:rounded-3xl overflow-hidden flex flex-col">
        {!sosActive ? <Header lang={lang} setLang={setLang} title={title} showBack={screen === "shield" && shieldTool !== null} onBack={() => setShieldTool(null)} user={user} onLogout={handleLogout} /> : null}
        <main className={`flex-1 ${screen === "legal" ? "flex flex-col" : "overflow-y-auto"}`}>{rendered}</main>
        {!sosActive ? <BottomNav active={screen} onNavigate={handleNavigate} /> : null}
        {sosActive ? <SOSScreen onClose={() => setSosActive(false)} contacts={contacts} autoDialPolice={settings.autoDialPolice} cancelPin={settings.cancelPin} /> : null}
      </div>
      {!backendOk ? (
        <div className="fixed bottom-3 right-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-900 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> Backend offline. Start with `npm run dev:full`.
        </div>
      ) : null}
      {showOnboarding ? <OnboardingScreen onFinish={finishOnboarding} /> : null}
    </div>
  );
}
