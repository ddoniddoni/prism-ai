create table public.analytics_daily (
  id bigint generated always as identity primary key,
  date date not null,
  device text not null check (device in ('desktop', 'mobile', 'tablet')),
  category text not null,
  product text not null,
  traffic_source text not null,
  region text not null,
  customer_segment text not null,
  campaign text,
  revenue numeric not null check (revenue >= 0),
  orders integer not null check (orders >= 0),
  units_sold integer not null check (units_sold >= 0),
  customers integer not null check (customers >= 0),
  sessions integer not null check (sessions >= 0),
  ad_spend numeric not null check (ad_spend >= 0),
  attributed_revenue numeric not null check (attributed_revenue >= 0),
  refunds integer not null check (refunds >= 0)
);

create index analytics_daily_date_idx on public.analytics_daily (date);

create table public.analytics_dataset_metadata (
  dataset_key text primary key,
  version text not null,
  min_date date not null,
  max_date date not null,
  row_count integer not null check (row_count > 0),
  updated_at timestamptz not null default now(),
  check (dataset_key = 'analytics_daily'),
  check (min_date <= max_date)
);

create table public.analysis_history (
  id bigint generated always as identity primary key,
  analysis_id text not null,
  session_id text not null,
  request_hash text not null,
  context jsonb not null,
  dashboard jsonb not null,
  metadata jsonb not null,
  created_at timestamptz not null default now()
);

create index analysis_history_session_created_idx
  on public.analysis_history (session_id, created_at desc);

create table public.analysis_operation_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('completed', 'failed', 'rate_limited')),
  request_hash text not null,
  data_source text not null check (data_source in ('local', 'supabase')),
  provider text check (provider in ('mock', 'gemini')),
  cache_hit boolean not null default false,
  fallback_used boolean not null default false,
  partial boolean not null default false,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  error_code text,
  created_at timestamptz not null default now()
);

create index analysis_operation_events_created_idx
  on public.analysis_operation_events (created_at desc);

alter table public.analytics_daily enable row level security;
alter table public.analytics_dataset_metadata enable row level security;
alter table public.analysis_history enable row level security;
alter table public.analysis_operation_events enable row level security;

revoke all on table public.analytics_daily from anon, authenticated;
revoke all on table public.analytics_dataset_metadata from anon, authenticated;
revoke all on table public.analysis_history from anon, authenticated;
revoke all on table public.analysis_operation_events from anon, authenticated;
