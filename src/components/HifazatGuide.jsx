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

/** Offline answers when the API is unreachable (e.g. dev server not running). */
function offlineLegalReply(userText) {
  const t = String(userText || "").toLowerCase();
  if (t.includes("rights") || t.includes("what are my")) {
    return [
      "1) **Laws (Pakistan):** Workplace harassment is covered by the **Protection Against Harassment of Women at the Workplace Act 2010**. Online threats, blackmail, and intimate images without consent often fall under **PECA 2016** and related PPC provisions (e.g. **354, 509** for physical harassment — confirm facts with a lawyer).",
      "2) **Right now:** Stay in a **public, lit place**; note **time, place, descriptions**; tell someone you trust where you are; **do not delete** evidence yet.",
      "3) **Numbers:** Police **15**, women’s helpline **1099**, Rescue **1122**, FIA Cybercrime **1991** (urgent danger → **15** first).",
      "_This is general orientation, not legal advice._",
    ].join("\n\n");
  }
  if (t.includes("following") || t.includes("follow")) {
    return [
      "1) **Law:** Persistent following can amount to **criminal intimidation / harassment** depending on facts (PPC / PECA context if coordinated online).",
      "2) **Right now:** Do **not** lead them to your home. Walk toward **shops, guards, a station**, or enter a **busy venue**. Call a trusted contact on speaker. If you feel immediate threat, call **15**.",
      "3) **After:** File a note with **police** or helpline **1099**; keep **screenshots / witness names** if any.",
      "_Not a substitute for police or counsel._",
    ].join("\n\n");
  }
  if (t.includes("online") || t.includes("harassed") || t.includes("cyber") || t.includes("dm")) {
    return [
      "1) **Laws:** **PECA 2016** addresses many electronic crimes; **Anti-Harassment Act 2010** can apply to workplace-linked online abuse. Exact sections depend on your facts.",
      "2) **Right now:** **Screenshot** URLs, profiles, timestamps; **stop engaging** the harasser; tighten **privacy**; if threats involve intimate images or blackmail, consider **FIA Cybercrime (1991)**.",
      "3) **Numbers:** **1991** (FIA cyber), **1099** (women’s helpline), **15** if you fear immediate harm.",
      "_Preserve evidence before blocking if safe to do so._",
    ].join("\n\n");
  }
  if (t.includes("emergency") || t.includes("number") || t.includes("helpline")) {
    return [
      "**Key numbers (Pakistan)**",
      "• **15** — Police emergency",
      "• **1122** — Rescue (medical/fire)",
      "• **1099** — Government women’s helpline",
      "• **1991** — FIA Cybercrime",
      "• **1166** — Child protection (where active)",
      "If you are **unsafe now**, call **15** or **1099** first.",
    ].join("\n\n");
  }
  return [
    "**Quick safety orientation** (offline mode — connect the API for full AI answers.)",
    "• **Immediate danger:** **15** (police) or **1099**.",
    "• **Online harm:** **1991** / FIA cyber complaint portal — keep **screenshots** and **timestamps**.",
    "• **Workplace harassment:** Anti-Harassment Act **2010** process (ombuds / inquiry) — document incidents.",
    "Run **`npm run dev:full`** locally or deploy the API so Hifazat can use your **GROQ_API_KEY** / **GEMINI_API_KEY**.",
  ].join("\n\n");
}

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

/**
 * @param {{ variant?: "fab" | "page" }} props
 * - `fab` — floating widget (optional; not mounted from main when using in-app page only).
 * - `page` — full-width in-app screen under the main header.
 */
export default function HifazatGuide({ variant = "fab" }) {
  const isPage = variant === "page";
  const [blockedByWelcome, setBlockedByWelcome] = useState(() => {
    try {
      return localStorage.getItem("nigaban_welcomed") !== "true";
    } catch {
      return true;
    }
  });
  const [open, setOpen] = useState(isPage);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const messagesRef = useRef(null);
  const [messages, setMessages] = useState(() => loadSessionMessages() || []);

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
    if (blockedByWelcome || isPage) return;
    const saved = loadSessionMessages();
    if (saved?.length) {
      messagesRef.current = saved;
      setMessages(saved);
      setOpen(true);
      return;
    }
    let isFirst;
    try {
      isFirst = localStorage.getItem(AUTO_OPEN_KEY) !== "true";
    } catch {
      isFirst = true;
    }
    if (isFirst) {
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
  }, [blockedByWelcome, isPage]);

  useEffect(() => {
    if (isPage && !blockedByWelcome && messages.length === 0) {
      const greet = { role: "assistant", content: GREETING, id: "g0" };
      messagesRef.current = [greet];
      setMessages([greet]);
    }
  }, [blockedByWelcome, isPage, messages.length]);

  useEffect(() => {
    if ((!open && !isPage) || blockedByWelcome) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, open, loading, blockedByWelcome, isPage]);

  const sendText = useCallback(
    async (text) => {
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
        const reply =
          String(data.reply || "").trim() ||
          offlineLegalReply(trimmed) ||
          "Call 15 if you are in danger now.";
        const withAssistant = [...messagesRef.current, { role: "assistant", content: reply, id: `a-${Date.now()}` }];
        messagesRef.current = withAssistant;
        setMessages(withAssistant);
      } catch {
        const offline = offlineLegalReply(trimmed);
        const fallback = [
          ...messagesRef.current,
          {
            role: "assistant",
            content:
              offline ||
              "I could not reach the API. Run **npm run dev:full** (Vite + server on port 8787) or set **VITE_API_URL** to your deployed backend. If you are unsafe now, call **15** or **1099**.",
            id: `a-${Date.now()}`,
          },
        ];
        messagesRef.current = fallback;
        setMessages(fallback);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const onSubmit = (e) => {
    e?.preventDefault?.();
    const t = input.trim();
    if (!t) return;
    setInput("");
    sendText(t);
  };

  if (blockedByWelcome) return null;

  const bubbleUser =
    "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed aurora-bg text-white rounded-br-md shadow-[0_6px_18px_-8px_rgba(168,85,247,0.55)]";
  const bubbleBot =
    "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed bg-white/[0.06] text-slate-100 border border-white/[0.08] rounded-bl-md whitespace-pre-wrap";

  const chatPanel = (
    <>
      {!isPage ? (
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/[0.08] bg-gradient-to-r from-indigo-900/45 via-violet-900/45 to-pink-900/35">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] border border-white/[0.1]">
            <Shield className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">Hifazat Guide</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Pakistan legal safety · AI</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/10 text-slate-400" aria-label="Close chat">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className={`overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar ${isPage ? "flex-1 min-h-0 max-h-[calc(100dvh-12rem)] sm:max-h-[calc(100dvh-10rem)]" : "h-72"}`}
      >
        {messages.map((m) => (
          <div key={m.id || `${m.role}-${String(m.content).slice(0, 20)}`} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" ? (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 mt-0.5">
                <Shield className="w-4 h-4 text-emerald-300" />
              </div>
            ) : null}
            <div className={m.role === "user" ? bubbleUser : bubbleBot}>{m.content}</div>
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-10">
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
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
          >
            {c.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 p-3 border-t border-white/10 bg-black/20 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask in English or اردو…"
          className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="shrink-0 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 p-2.5 text-white disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </>
  );

  if (isPage) {
    return (
      <div className="flex flex-col min-h-0 h-full w-full max-w-4xl mx-auto animate-in fade-in">
        <div className="px-4 sm:px-6 pt-2 pb-3 border-b border-white/10 shrink-0">
          <p className="text-xs text-slate-400">
            Pakistan-focused legal <strong className="text-slate-200">orientation</strong> — not a substitute for a lawyer or police. AI when the API is connected; offline answers if not.
          </p>
        </div>
        <div className="flex flex-col flex-1 min-h-0 rounded-2xl border border-white/10 bg-[#12101c]/90 mt-3 mx-3 sm:mx-6 mb-4 overflow-hidden">{chatPanel}</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-40 right-4 z-[360] flex flex-col items-end gap-2 max-w-[100vw]">
      {open ? (
        <div className="w-[min(100vw-1.5rem,22rem)] rounded-2xl border border-white/15 bg-[#12101c]/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {chatPanel}
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
