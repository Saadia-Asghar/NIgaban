import { useEffect, useState } from "react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/react";
import { supabase, supabaseEnabled } from "../lib/authClients";
import { CheckCircle2, Loader2, Shield } from "lucide-react";

/* ── Clerk Card ─────────────────────────────────────────────── */
function ClerkAuthCard({ compact = false }) {
  const { isLoaded, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <Show when="signed-out">
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <SignInButton mode="modal">
          <button className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-900/40 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Sign in with email or Google
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="w-full rounded-2xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 active:scale-[0.98] transition-all">
            Create a free account
          </button>
        </SignUpButton>
      </div>
      {/* When signed in, show profile summary */}
      <Show when="signed-in">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-300">Signed in</p>
            <p className="text-xs text-emerald-400/70 truncate">{user?.primaryEmailAddress?.emailAddress || user?.fullName || ""}</p>
          </div>
          <UserButton />
        </div>
      </Show>
    </Show>
  );
}

ClerkAuthCard.displayName = "ClerkAuthCard";

/* ── Supabase fallback (hidden unless Clerk isn't configured) ── */
function SupabaseCompactCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("signin");

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email || "");
      if (data.session?.access_token) {
        try { localStorage.setItem("nigehbaan_token", data.session.access_token); } catch { /* ignore */ }
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email || "");
      if (session?.access_token) {
        try { localStorage.setItem("nigehbaan_token", session.access_token); } catch { /* ignore */ }
      } else if (event === "SIGNED_OUT") {
        try { localStorage.removeItem("nigehbaan_token"); } catch { /* ignore */ }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!supabaseEnabled) return null;

  if (userEmail) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-300">Signed in</p>
          <p className="text-xs text-emerald-400/70 truncate">{userEmail}</p>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setStatus(""); setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      setStatus(error ? error.message : "Check your email to confirm.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setStatus(error.message); return; }
      if (data?.session?.access_token) {
        try { localStorage.setItem("nigehbaan_token", data.session.access_token); } catch { /* ignore */ }
      }
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setStatus(error.message);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          required
          className="w-full rounded-xl glass-dark px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
          className="w-full rounded-xl glass-dark px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98] transition-transform"
      >
        {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}
        className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors"
      >
        {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
      {status ? <p className="text-xs text-center text-pink-400">{status}</p> : null}
    </form>
  );
}

SupabaseCompactCard.displayName = "SupabaseCompactCard";

/* ── Main Export ─────────────────────────────────────────────── */
export default function AuthHub({ compact = false }) {
  const { isLoaded, isSignedIn } = useUser();
  const clerkKeyConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  // If Clerk is configured and user is signed in, show minimal signed-in state
  if (clerkKeyConfigured && isLoaded && isSignedIn) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="flex-1 text-sm font-semibold text-emerald-300">Signed in with Clerk</p>
        <UserButton />
      </div>
    );
  }

  // Clerk configured but not signed in — show Clerk buttons
  if (clerkKeyConfigured) {
    return <ClerkAuthCard compact={compact} />;
  }

  // Clerk not configured — fall back to Supabase
  if (supabaseEnabled) {
    return <SupabaseCompactCard />;
  }

  // Neither configured
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center space-y-2">
      <p className="text-sm font-semibold text-amber-300">Auth not configured</p>
      <p className="text-xs text-amber-200/60 leading-relaxed">
        Add <code className="text-amber-300">VITE_CLERK_PUBLISHABLE_KEY</code> or Supabase credentials to enable sign-in.
      </p>
    </div>
  );
}
