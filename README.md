# NIgaban — AI Safety Companion 🛡️

Pakistan's first AI-aware safety companion for women. Live trip share, encrypted SOS, fake call, ride-driver logger, verified legal-rights cards, and a hand-curated NGO directory — all built as a Progressive Web App that works **offline-first**.

> **One-line pitch:** Safety that thinks ahead — for women who refuse to wait.

[![PWA](https://img.shields.io/badge/PWA-ready-green.svg)]() [![Offline](https://img.shields.io/badge/Offline--first-Yes-blue.svg)]() [![License](https://img.shields.io/badge/license-MIT-violet.svg)]()

---

## ✨ What's inside

### Safety Toolkit (10 tools, all work offline, all deterministic)

| Tool | What it does | Needs internet? |
|---|---|---|
| **SOS button** (centre of bottom nav) | 3-second cancel countdown → SMS to circle + GPS log | ❌ |
| **Guardian Timer** | "Watch over me until I check in" — auto-alerts circle on miss | ❌ |
| **Saved Places** | Home / Work / friends — one-tap "On my way / Arrived / Pick me up" SMS | ❌ |
| **Quick Capture** | Photo + GPS + timestamp stamped on JPEG, saved on device | ❌ |
| **Safety Scripts** | 12 preset SMS templates across 4 categories | ❌ |
| **Ride Safety** | Log driver/plate/destination + 15-min check-in countdown | ❌ |
| **Self-Defense** | 7 verified technique cards (Pakistan-context advice) | ❌ |
| **Know Your Rights** | 6 verified Pakistan-law cards (Anti-Harassment 2010, PECA 2016, PPC §354/§509) | ❌ |
| **Verified Help** | 6 government helplines + 8 women's-rights NGOs, all dialable | ❌ |
| **Distress Listener** | Web Speech keyword detection + 5-second cancel countdown | ❌ |

### AI features (clearly disclaimed, with offline fallbacks)

- **Hifazat Legal Guide** — Pakistan-aware safety Q&A in English & Urdu
- **Legal AI Desk** — chat, draft FIR, request lawyer consult

### Supporting features

- **Safe Transit** — backend-tracked live trip sharing
- **Community Pulse** — anonymous incident reports + heatmap
- **Fake Call** overlay, **Siren** (Web Audio), **Voice Note** recorder
- **Shake-to-SOS** + **triple-S** keyboard shortcut
- **Stealth mode** (renames the app to "Personal Notes")
- **Three OS-level shortcuts** when installed: SOS / Hifazat / Transit

---

## 🚀 Deploy in 5 minutes (Vercel)

The app **boots and works fully without any API keys.** AI features stay disabled gracefully.

### 1. Clone & install

```bash
git clone https://github.com/Saadia-Asghar/NIgaban.git
cd NIgaban
npm install
```

### 2. Local development

```bash
npm run dev:full   # frontend (5173) + backend (8787) together
# or run them separately:
npm run dev        # frontend only
npm run server     # backend only
```

Open <http://localhost:5173> — sign in with Clerk if configured, or click **Continue as guest**.

### 3. One-click Vercel deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Saadia-Asghar/NIgaban)

After the import, add environment variables (all optional — the app works without any of them):

| Variable | Purpose | Free tier |
|---|---|---|
| `GROQ_API_KEY` | Hifazat + Legal chat | [console.groq.com](https://console.groq.com) |
| `GEMINI_API_KEY` | (optional) image vision fallback | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `GOOGLE_MAPS_API_KEY` | server-side directions | [Google Cloud](https://console.cloud.google.com) |
| `VITE_GOOGLE_MAPS_API_KEY` | browser maps | same |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk auth | [clerk.com](https://clerk.com) |
| `CLERK_SECRET_KEY` | Clerk JWT verify | same |
| `SUPABASE_URL` | Supabase auth fallback | [supabase.com](https://supabase.com) |
| `MODERATOR_BOOTSTRAP_KEY` | Moderation panel | any random string |

See [.env.example](.env.example) for the full list with examples.

### 4. Verify the deploy

After Vercel builds:

- Visit your domain → boot splash → marketing landing
- Click **Try in browser** → guest mode → home dashboard
- Tap each bottom-nav tab → all should render without errors
- Bottom-centre SOS button → 3-second countdown should appear

---

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 + custom Aurora + neumorphic design system |
| Icons | [Lucide](https://lucide.dev) |
| Auth | [Clerk](https://clerk.com) (primary) + [Supabase](https://supabase.com) (fallback) + Guest mode |
| Backend | Express 5 (single `api/index.js` deployed as Vercel function) |
| Storage | Local JSON file (dev) → Supabase Postgres (prod, optional) |
| AI | Groq Llama 3.3 (chat), Gemini Vision (optional image fallback) |
| PWA | Custom service worker (cache-first shell, network-first APIs) |

### Project layout

```
nigaban-app/
├── api/
│   └── index.js                # Express app — deployed as Vercel function
├── public/
│   ├── favicon.svg             # Aurora shield logo
│   ├── manifest.webmanifest    # PWA manifest with 3 shortcuts
│   └── sw.js                   # service worker
├── src/
│   ├── App.jsx                 # main app (Header, all screens, BottomNav)
│   ├── components/
│   │   ├── AboutScreen.jsx     # version, FAQs, credits, disclaimers
│   │   ├── AppShell.jsx        # ErrorBoundary + OfflineIndicator
│   │   ├── AuthHub.jsx         # Clerk + Supabase + guest entry
│   │   ├── Brand.jsx           # NigabanLogo (SVG) + NigabanWordmark
│   │   ├── FakeCallOverlay.jsx
│   │   ├── FirstVisitWelcome.jsx
│   │   ├── HifazatGuide.jsx    # Legal AI chat (with offline fallback)
│   │   ├── MarketingLanding.jsx
│   │   ├── SafeZonesMap.jsx
│   │   ├── SafetyMapScreen.jsx
│   │   └── VoiceNoteRecorder.jsx
│   ├── lib/
│   │   ├── api.js              # fetch wrapper + bearer auth
│   │   ├── authClients.js      # Supabase init
│   │   ├── brand.js            # taglines, hero copy
│   │   ├── haptics.js          # Vibration API helpers
│   │   ├── incidentReport.js   # PDF/text export
│   │   └── toastContext.jsx
│   └── index.css               # Aurora + neumorphic design system
├── .env.example                # all environment variables
├── package.json
├── vite.config.js
└── vercel.json                 # rewrites + headers
```

---

## 🛡️ Trust & safety design principles

1. **Deterministic over AI for safety-critical actions.** No AI scanner can fire SOS or replace a human decision.
2. **Confirmation gates.** Every auto-trigger (Distress Listener, Guardian Timer expiry) gives the user a cancel window.
3. **Local-first storage.** Voice notes, captures, saved places — all live in browser memory or localStorage. Nothing uploads unless the user chooses.
4. **Verifiable content.** Legal cards cite their statute. NGO entries link to public websites. No AI-generated authority.
5. **Honest disclaimers.** AI features carry "orientation, not advice" labels. Self-defense content tells users to take a real class.
6. **Offline-first.** App shell + every safety tool works without internet. AI chat has static fallbacks for common questions.

---

## 🌍 Localising for other countries

The app is Pakistan-tuned but easy to localise:

1. **Helplines & NGOs** — edit `VerifiedHelp` in `src/App.jsx`
2. **Legal cards** — edit `KnowYourRights` in `src/App.jsx`
3. **Self-defense advice** — edit `SelfDefense` in `src/App.jsx`
4. **Brand tagline** — edit `src/lib/brand.js`
5. **Default city** — search `"Lahore"` in `src/App.jsx`

---

## 🔒 Privacy summary

| Data | Where it lives | Uploaded? |
|---|---|---|
| Trusted-circle SMS | Native phone SMS app | ❌ — NIgaban never sees the message |
| Voice notes | Browser memory | ❌ — until user downloads |
| Quick captures | Browser memory | ❌ — until user downloads |
| Saved places | localStorage | ❌ |
| Timeline entries | Backend (your deploy) | ✅ — owned by deployer |
| GPS during SOS | Backend (one-shot) | ✅ — only on active SOS |
| Community reports | Backend | ✅ — anonymous by default |

---

## 🤝 Contributing

PRs welcome. Especially valuable:

- **Verified content updates** — phone numbers change, NGOs move offices. Open a PR with the source.
- **Translations** — Urdu UI, regional languages.
- **City presets** — additional cities beyond Lahore / Karachi / Islamabad / Peshawar.
- **Accessibility audits** — VoiceOver / TalkBack walkthroughs.

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

## 🆘 In immediate danger?

This README is not a substitute for emergency services.

- **Police** — `15`
- **Madadgaar (Women's Helpline)** — `1099`
- **FIA Cybercrime** — `1991`
- **Rescue** — `1122`

Made with ♥ for women in Pakistan.
