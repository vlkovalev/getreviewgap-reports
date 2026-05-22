create extension if not exists "pgcrypto";

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  base_url text not null,
  source_type text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DISABLED','BLOCKED')),
  rate_limit_seconds integer not null default 10,
  robots_note text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  source_id uuid not null references public.sources(id) on delete cascade,
  name text not null,
  target_urls text[] not null default '{}',
  schedule text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','RUNNING','FAILED')),
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.scrape_jobs(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','SUCCESS','PARTIAL','FAILED','BLOCKED')),
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  products_found integer not null default 0,
  products_created integer not null default 0,
  products_updated integer not null default 0,
  error_message text,
  log jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  external_id text,
  url text not null,
  title text,
  brand text,
  category text,
  image_url text,
  currency text not null default 'USD',
  current_price numeric,
  original_price numeric,
  discount_amount numeric,
  discount_percentage numeric,
  availability text,
  rating numeric,
  review_count integer,
  seller_name text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  scrape_run_id uuid not null references public.scrape_runs(id) on delete cascade,
  price numeric,
  original_price numeric,
  currency text not null default 'USD',
  availability text,
  rating numeric,
  review_count integer,
  captured_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  report_type text not null,
  title text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','GENERATING','COMPLETED','FAILED')),
  filters jsonb,
  summary jsonb,
  data jsonb,
  error_message text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  format text not null check (format in ('CSV','JSON','PDF')),
  file_url text,
  status text not null default 'READY' check (status in ('READY','FAILED')),
  created_at timestamptz not null default now()
);

create index if not exists sources_status_idx on public.sources(status);
create index if not exists scrape_jobs_source_status_idx on public.scrape_jobs(source_id, status);
create index if not exists scrape_runs_job_status_idx on public.scrape_runs(job_id, status);
create index if not exists scrape_runs_created_at_idx on public.scrape_runs(created_at desc);
create index if not exists products_source_idx on public.products(source_id);
create index if not exists products_brand_idx on public.products(brand);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_availability_idx on public.products(availability);
create index if not exists product_snapshots_product_captured_idx on public.product_snapshots(product_id, captured_at desc);
create index if not exists reports_type_status_idx on public.reports(report_type, status);
create index if not exists exports_report_idx on public.exports(report_id);

alter table public.sources enable row level security;
alter table public.scrape_jobs enable row level security;
alter table public.scrape_runs enable row level security;
alter table public.products enable row level security;
alter table public.product_snapshots enable row level security;
alter table public.reports enable row level security;
alter table public.exports enable row level security;

create policy "Users manage own sources" on public.sources for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own jobs" on public.scrape_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read own reports" on public.reports for select using (auth.uid() = user_id);
create policy "Users create own reports" on public.reports for insert with check (auth.uid() = user_id);
create policy "Service role manages scraper data" on public.products for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages snapshots" on public.product_snapshots for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages runs" on public.scrape_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "Service role manages exports" on public.exports for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
