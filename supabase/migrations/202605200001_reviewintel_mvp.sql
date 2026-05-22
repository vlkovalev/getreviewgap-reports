create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  company text,
  website text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  product_url text not null,
  asin text,
  product_name text not null default 'Amazon product',
  competitor_name text,
  marketplace text not null default 'amazon.com',
  status text not null default 'DRAFT' check (status in ('DRAFT','RUNNING','READY','FAILED','NEEDS_REVIEW')),
  review_count integer not null default 0,
  input_reviews jsonb,
  summary jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  report_id uuid references public.review_reports(id) on delete cascade,
  name text not null,
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','SUCCEEDED','FAILED')),
  input jsonb not null,
  output jsonb,
  error_message text,
  provider text,
  model text,
  token_estimate integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  status text not null default 'INCOMPLETE' check (status in ('TRIALING','ACTIVE','PAST_DUE','CANCELED','INCOMPLETE')),
  plan text not null,
  stripe_customer_id text,
  stripe_sub_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists review_reports_email_idx on public.review_reports(email);
create index if not exists review_reports_status_idx on public.review_reports(status);
create index if not exists review_reports_created_at_idx on public.review_reports(created_at desc);
create index if not exists agent_runs_report_id_idx on public.agent_runs(report_id);
create index if not exists agent_runs_status_idx on public.agent_runs(status);
create index if not exists subscriptions_email_idx on public.subscriptions(email);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists audit_events_entity_idx on public.audit_events(entity);
create index if not exists audit_events_created_at_idx on public.audit_events(created_at desc);

alter table public.profiles enable row level security;
alter table public.review_reports enable row level security;
alter table public.agent_runs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_events enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own review reports"
  on public.review_reports for select
  using (auth.uid() = user_id);

create policy "Users can create own review reports"
  on public.review_reports for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can read own agent runs"
  on public.agent_runs for select
  using (auth.uid() = user_id);

create policy "Users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role manages review reports"
  on public.review_reports for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages agent runs"
  on public.agent_runs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages audit events"
  on public.audit_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
