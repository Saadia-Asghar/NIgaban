-- Mirror Clerk users into Postgres (same DB as Supabase) for app data / analytics.
create table if not exists public.clerk_profiles (
  clerk_user_id text primary key,
  email text not null default '',
  full_name text not null default '',
  image_url text,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists clerk_profiles_email_idx on public.clerk_profiles (lower(email));
