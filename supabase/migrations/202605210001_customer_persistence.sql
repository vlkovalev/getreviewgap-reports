create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_accounts(id) on delete cascade,
  amount integer not null,
  reason text not null,
  reference_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_purchases (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customer_accounts(id) on delete set null,
  provider text not null,
  provider_id text,
  plan_id text not null,
  amount integer not null,
  currency text not null default 'usd',
  status text not null default 'pending',
  credits integer not null default 0,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports add column if not exists customer_id uuid references public.customer_accounts(id) on delete set null;

create index if not exists customer_accounts_created_at_idx on public.customer_accounts(created_at);
create index if not exists credit_transactions_customer_id_idx on public.credit_transactions(customer_id);
create index if not exists credit_transactions_created_at_idx on public.credit_transactions(created_at);
create index if not exists customer_purchases_customer_id_idx on public.customer_purchases(customer_id);
create index if not exists customer_purchases_provider_idx on public.customer_purchases(provider);
create index if not exists customer_purchases_status_idx on public.customer_purchases(status);
create index if not exists reports_customer_id_idx on public.reports(customer_id);

alter table public.customer_accounts enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.customer_purchases enable row level security;

create policy "Service role can manage customer accounts" on public.customer_accounts for all using (true) with check (true);
create policy "Service role can manage credit transactions" on public.credit_transactions for all using (true) with check (true);
create policy "Service role can manage customer purchases" on public.customer_purchases for all using (true) with check (true);
