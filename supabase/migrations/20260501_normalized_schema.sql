-- Nigehbaan normalized backend schema

create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  stealth_mode boolean not null default false,
  auto_dial_police boolean not null default true,
  cancel_pin text not null default '1234',
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id text primary key,
  name text not null,
  phone text not null default ''
);

create table if not exists public.trips (
  id text primary key,
  destination text not null,
  destination_coords jsonb,
  started_at timestamptz not null,
  status text not null default 'active',
  events jsonb not null default '[]'::jsonb,
  location_history jsonb not null default '[]'::jsonb,
  no_movement_since timestamptz,
  distance_trend_up_count integer not null default 0,
  last_distance_to_destination_km double precision
);

create table if not exists public.sos_logs (
  id text primary key,
  started_at timestamptz not null,
  stopped_at timestamptz,
  source text not null default 'manual',
  active boolean not null default true,
  dispatch_logs jsonb not null default '[]'::jsonb
);

create table if not exists public.community_reports (
  id text primary key,
  city text not null,
  category text not null,
  area text not null,
  description text not null,
  anonymous boolean not null default true,
  level text not null default 'watch',
  title text not null,
  tags text[] not null default '{}',
  verified boolean not null default false,
  status text not null default 'pending',
  moderation_reason text not null default '',
  moderated_at timestamptz,
  time timestamptz not null default now()
);

create table if not exists public.community_chat_messages (
  id text primary key,
  city text not null,
  mode text not null default 'chat',
  text text not null,
  alias text not null default 'Anonymous',
  anonymous boolean not null default true,
  area text,
  category text,
  tags text[] not null default '{}',
  severity text not null default 'normal',
  created_at timestamptz not null default now()
);

create table if not exists public.legal_queue (
  id text primary key,
  type text not null,
  status text not null,
  user_id text not null,
  draft text not null,
  created_at timestamptz not null default now(),
  reviewer_notes text not null default ''
);

create table if not exists public.evidence_vault (
  id text primary key,
  incident_id text not null,
  title text not null,
  type text not null,
  checksum text not null,
  size integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_timeline (
  id text primary key,
  incident_id text not null,
  action text not null,
  evidence_id text not null,
  previous_hash text not null,
  event_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id text primary key,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

create table if not exists public.auth_users (
  id text primary key,
  phone text not null unique,
  verified_woman boolean not null default false,
  roles jsonb not null default '["user"]'::jsonb,
  verification_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.otp_codes (
  id text primary key,
  phone text not null,
  code text not null,
  device_id text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_sessions (
  token text primary key,
  user_id text not null,
  phone text not null,
  roles jsonb not null default '["user"]'::jsonb,
  verified_woman boolean not null default false,
  verification_method text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.moderator_profiles (
  user_id text primary key,
  phone text not null unique,
  display_name text not null,
  role text not null default 'moderator',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.app_settings (id, stealth_mode, auto_dial_police, cancel_pin)
values (1, false, true, '1234')
on conflict (id) do nothing;
