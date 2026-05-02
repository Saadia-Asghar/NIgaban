-- Hackathon: AI summaries and map pins for community reports; GPS on SOS logs
alter table public.community_reports add column if not exists ai_summary text not null default '';
alter table public.community_reports add column if not exists lat double precision;
alter table public.community_reports add column if not exists lon double precision;

alter table public.sos_logs add column if not exists location jsonb;
