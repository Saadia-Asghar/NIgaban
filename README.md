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

## Clerk → database sync

After sign-in or sign-up with Clerk, the app calls `POST /api/auth/clerk-sync` with the Clerk session token. The server verifies the JWT and upserts a row in `public.clerk_profiles` (same database as Supabase). This keeps a mirror of Clerk users in Postgres for your own queries and RLS you may add later.

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `npm run dev`  | Vite only                            |
| `npm run server` | Express API                        |
| `npm run dev:full` | API + Vite (recommended)         |
| `npm run build` | Production frontend bundle        |
