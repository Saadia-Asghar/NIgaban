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
        <button onClick={signOut} className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors">
          Sign out
        </button>
      </div>
      {userEmail
        ? <p className="text-[11px] text-emerald-400">✓ Active user: {userEmail}</p>
        : <p className="text-[11px] text-slate-400">No active Supabase session.</p>}
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
