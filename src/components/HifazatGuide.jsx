import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Shield, X } from "lucide-react";
import { api } from "../lib/api.js";

const SESSION_KEY = "nigaban_hifazat_session_v1";
const AUTO_OPEN_KEY = "nigaban_hifazat_auto_open_done";

const GREETING =
  "Assalam u Alaikum! I am Hifazat — your safety guide. Did you know harassment in public is a criminal offense under PECA 2016 and the Anti-Harassment Act 2010?";

const CHIPS = [
  { label: "What are my rights?", text: "What are my rights?" },
  { label: "Someone is following me", text: "Someone is following me. What should I do right now?" },
  { label: "I was harassed online", text: "I was harassed online. What laws apply and what steps should I take?" },
  { label: "Emergency numbers Pakistan", text: "List key emergency numbers in Pakistan for women’s safety." },
];

function loadSessionMessages() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function saveSessionMessages(list) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export default function HifazatGuide() {
  const [blockedByWelcome, setBlockedByWelcome] = useState(() => {
    try {
      return localStorage.getItem("nigaban_welcomed") !== "true";
    } catch {
      return true;
    }
  });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const messagesRef = useRef(null);
  const [messages, setMessages] = useState(() => {
    const m = loadSessionMessages() || [];
    messagesRef.current = m;
    return m;
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const onWelcomed = () => setBlockedByWelcome(false);
    window.addEventListener("nigaban-welcomed", onWelcomed);
    return () => window.removeEventListener("nigaban-welcomed", onWelcomed);
  }, []);

  useEffect(() => {
    saveSessionMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (blockedByWelcome) return;
    const saved = loadSessionMessages();
    if (saved?.length) {
      messagesRef.current = saved;
      setMessages(saved);
      setOpen(true);
      return;
    }
    let first = false;
    try {
      first = localStorage.getItem(AUTO_OPEN_KEY) !== "true";
    } catch {
      first = true;
    }
    if (first) {
      try {
        localStorage.setItem(AUTO_OPEN_KEY, "true");
      } catch {
        // ignore
      }
      const greet = { role: "assistant", content: GREETING, id: "g0" };
      messagesRef.current = [greet];
      setMessages([greet]);
      setOpen(true);
    }
  }, [blockedByWelcome]);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, open, loading]);

  const sendText = useCallback(async (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed || loading) return;
    const userMsg = { role: "user", content: trimmed, id: `u-${Date.now()}` };
    const snapshot = [...messagesRef.current, userMsg];
    messagesRef.current = snapshot;
    setMessages(snapshot);
    setLoading(true);
    try {
      const hist = snapshot.map((m) => ({ role: m.role, content: m.content }));
      const data = await api("/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          history: hist.slice(0, -1),
        }),
      });
      const reply = String(data.reply || "").trim() || "Call 15 if you are in danger now.";
      const withAssistant = [...messagesRef.current, { role: "assistant", content: reply, id: `a-${Date.now()}` }];
      messagesRef.current = withAssistant;
      setMessages(withAssistant);
    } catch {
      const fallback = [
        ...messagesRef.current,
        {
          role: "assistant",
          content: "I could not reach the server. Try again, or call 15 (police) / 1099 (helpline) if you need help immediately.",
          id: `a-${Date.now()}`,
        },
      ];
      messagesRef.current = fallback;
      setMessages(fallback);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const onSubmit = (e) => {
    e?.preventDefault?.();
    const t = input.trim();
    if (!t) return;
    setInput("");
    sendText(t);
  };

  if (blockedByWelcome) return null;

  return (
    <div className="fixed bottom-40 right-4 z-[360] flex flex-col items-end gap-2 max-w-[100vw]">
      {open ? (
        <div className="w-[min(100vw-1.5rem,22rem)] rounded-2xl border border-white/15 bg-[#12101c]/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 bg-gradient-to-r from-violet-900/50 to-purple-900/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/10">
              <Shield className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Hifazat Guide</p>
              <p className="text-[10px] text-slate-400">Legal safety · Pakistan</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/10 text-slate-400" aria-label="Close chat">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="h-72 overflow-y-auto px-3 py-2 space-y-3 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id || `${m.role}-${String(m.content).slice(0, 20)}`} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 mt-0.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    m.role === "user" ? "bg-violet-600 text-white rounded-br-md" : "bg-white/10 text-slate-100 border border-white/10 rounded-bl-md"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                Hifazat is typing…
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5 px-2 pb-2 border-t border-white/5 pt-2">
            {CHIPS.map((c) => (
              <button
                key={c.label}
                type="button"
                disabled={loading}
                onClick={() => sendText(c.text)}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
              >
                {c.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex gap-1.5 p-2 border-t border-white/10 bg-black/20">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in English or اردو…"
              className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 p-2.5 text-white disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/40 border-2 border-[#141523] active:scale-95 transition-transform"
        aria-label={open ? "Close Hifazat" : "Open Hifazat safety guide"}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
