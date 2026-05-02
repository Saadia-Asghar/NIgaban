# Nigehbaan

Women’s safety companion (React + Vite + Express). Auth uses **Clerk** (email + Google in the Clerk UI) and optional **Supabase Auth** (email/password + Google). App data can live in **Supabase Postgres** via `SUPABASE_DB_URL`.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev:full
```

- Frontend: [http://localhost:5173](http://localhost:5173) (proxies `/api` to the server).
- API: `http://localhost:8787` (override with `PORT`).

## Auth setup

1. **Clerk** (dashboard): Create an application; enable **Email** and **Google**; copy the **Publishable** key into `VITE_CLERK_PUBLISHABLE_KEY` and the **Secret** key into `CLERK_SECRET_KEY` (server only, never expose in Vite).
2. **Optional** `CLERK_AUTHORIZED_PARTIES`: comma-separated origins (e.g. `http://localhost:5173`) for stricter JWT checks. Leave empty for local experiments.
3. **Supabase** (dashboard): Project URL + anon key → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Enable **Google** if you use Supabase Google sign-in; set **Redirect URLs** to match your site.
4. **Database**: Set `SUPABASE_DB_URL` (or `DATABASE_URL`) so the server can run. Apply SQL under `supabase/migrations/` (includes `clerk_profiles` for Clerk user sync).

### Verify the auth backend

With the API running (`npm run server` or `npm run dev:full`):

```bash
curl -s http://localhost:8787/api/auth/status
```

You want `clerkSecretConfigured` and `databaseQueryable` both **true** so Clerk JWT verification and `clerk_profiles` sync work. If `databaseUrlConfigured` is false, set `SUPABASE_DB_URL` in `.env` and restart the server.

## Clerk → database sync

After sign-in or sign-up with Clerk, the app calls `POST /api/auth/clerk-sync` with the Clerk session token. The server verifies the JWT and upserts a row in `public.clerk_profiles` (same database as Supabase). This keeps a mirror of Clerk users in Postgres for your own queries and RLS you may add later.

All frontend `fetch("/api/...")` helpers send **`Authorization: Bearer <Clerk session JWT>`** when you are signed in with Clerk (and fall back to the legacy OTP token when present). Protected routes (`/api/auth/me`, `/api/auth/verify-identity`, moderation) resolve that JWT on the server with `CLERK_SECRET_KEY`, so **Clerk authentication is tied to the same Express + Postgres stack** as the rest of the app.

### GitHub / Cursor “authority” vs this app

Authorizing **Supabase** or **Clerk** in GitHub or in **Cursor** (MCP / integrations) only helps those products talk to those platforms from the IDE or GitHub features. **It does not set environment variables for Nigehbaan.**

For sync to run, the **Express server** process must still have, in real env vars (or a `.env` file you never commit):

- `CLERK_SECRET_KEY` — so `/api/auth/clerk-sync` can verify the Clerk JWT  
- `SUPABASE_DB_URL` — so the server can write to `clerk_profiles` in Postgres  

If you deploy with **GitHub Actions** or another host, add the same keys as **encrypted repository / environment secrets** and inject them into the deploy step (for example `CLERK_SECRET_KEY`, `SUPABASE_DB_URL`, `VITE_*` for the build). The publishable Supabase anon key stays client-side (`VITE_SUPABASE_ANON_KEY`); the DB URL and Clerk secret stay server-side only.

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `npm run dev`  | Vite only                            |
| `npm run server` | Express API                        |
| `npm run dev:full` | API + Vite (recommended)         |
| `npm run build` | Production frontend bundle        |
