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
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-900">Clerk Authentication</p>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>

      {!isLoaded ? (
        <p className="text-xs text-stone-400">Loading...</p>
      ) : (
        <>
          <Show when="signed-out">
            <div className="flex flex-wrap gap-2">
              <SignInButton mode="modal">
                <button className="rounded-lg bg-violet-900 px-3 py-2 text-xs font-semibold text-white">
                  Sign in with Clerk
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-semibold text-violet-800">
                  Create account
                </button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <p className="text-xs text-emerald-700 font-semibold">
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs font-semibold text-amber-800">Supabase Auth not configured</p>
        <p className="text-[11px] text-amber-700 mt-1">
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
    <div className="rounded-xl border border-violet-200 bg-white p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-900">Supabase Authentication</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-lg border border-stone-200 px-2.5 py-2 text-xs"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="rounded-lg border border-stone-200 px-2.5 py-2 text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={signIn} disabled={loading} className="rounded-lg bg-violet-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
          Sign in
        </button>
        <button onClick={signUp} disabled={loading} className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-semibold text-violet-800 disabled:opacity-60">
          Sign up
        </button>
        <button onClick={signOut} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700">
          Sign out
        </button>
      </div>
      {userEmail
        ? <p className="text-[11px] text-emerald-700">✓ Active user: {userEmail}</p>
        : <p className="text-[11px] text-stone-500">No active Supabase session.</p>}
      {status ? <p className="text-[11px] text-violet-700">{status}</p> : null}
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
