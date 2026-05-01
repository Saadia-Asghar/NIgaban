import { useEffect, useState } from "react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/react";
import { supabase, supabaseEnabled } from "../lib/authClients";

function ClerkAuthCard() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">Clerk Authentication</p>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>

      {!isLoaded ? (
        <p className="text-xs text-slate-400">Loading...</p>
      ) : (
        <>
          <Show when="signed-out">
            <div className="flex flex-wrap gap-2">
              <SignInButton mode="modal">
                <button className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/25">
                  Sign in with Clerk
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
                  Create account
                </button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <p className="text-xs text-emerald-400 font-semibold">
              ✓ Signed in as {user?.primaryEmailAddress?.emailAddress || user?.fullName || "user"}
            </p>
          </Show>
        </>
      )}
    </div>
  );
}

function SupabaseAuthCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseEnabled || !supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email || "");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || "");
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!supabaseEnabled) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 backdrop-blur-md p-3">
        <p className="text-xs font-semibold text-amber-300">Supabase Auth not configured</p>
        <p className="text-[11px] text-amber-200/70 mt-1">
          Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
        </p>
      </div>
    );
  }

  const signUp = async () => {
    setStatus("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    setStatus(error ? error.message : "Signup successful. Check your email for confirmation.");
  };

  const signIn = async () => {
    setStatus("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    setStatus(error ? error.message : "Signed in with Supabase.");
  };

  const signOut = async () => {
    setStatus("");
    await supabase.auth.signOut();
    setStatus("Signed out.");
  };

  const signInWithGoogle = async () => {
    setStatus("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) setStatus(error.message);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">Supabase Authentication</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={signIn} disabled={loading} className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-500/25 disabled:opacity-60">
          Sign in
        </button>
        <button onClick={signUp} disabled={loading} className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-60">
          Sign up
        </button>
        <button onClick={signInWithGoogle} disabled={loading} className="rounded-lg border border-indigo-500/50 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors disabled:opacity-60 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google Auth
        </button>
      </div>
      {userEmail
        ? <p className="text-[11px] text-emerald-400">✓ Active user: {userEmail}</p>
        : null}
      {status ? <p className="text-[11px] text-pink-400">{status}</p> : null}
    </div>
  );
}

export default function AuthHub() {
  return (
    <div className="space-y-2">
      <ClerkAuthCard />
      <SupabaseAuthCard />
    </div>
  );
}
