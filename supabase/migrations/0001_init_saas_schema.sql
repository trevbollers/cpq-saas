-- ============================================
-- CPQ SaaS – Core SaaS Schema (Option C, trigger-free)
-- Supabase (Postgres) - public schema
-- ============================================

-- Enable pgcrypto for gen_random_uuid (if not already)
create extension if not exists "pgcrypto";

-- ============================================
-- PLANS
-- ============================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,         -- e.g. 'free', 'builder', 'business'
  name text not null,
  description text,
  price_monthly_cents integer not null default 0,
  currency text not null default 'USD',
  max_users integer,
  max_products integer,
  max_api_calls_per_month integer,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- TENANTS (customers / manufacturers)
-- ============================================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  plan_id uuid references public.plans(id),
  status text not null default 'active', -- active | trialing | suspended | canceled
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_plan_id_idx on public.tenants (plan_id);


-- ============================================
-- PROFILES (extends auth.users)
-- One row per user, optional tenant + role
-- NOTE: No trigger – you must create a row here in your app when a user registers.
-- ============================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  role text not null default 'user',  -- user | admin | super_admin
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);
create index if not exists profiles_role_idx on public.profiles (role);


-- ============================================
-- SUBSCRIPTIONS (per tenant)
-- ============================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  external_id text,                   -- e.g. Stripe subscription ID
  status text not null default 'trialing',  -- trialing | active | past_due | canceled
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_tenant_id_idx on public.subscriptions (tenant_id);
create index if not exists subscriptions_plan_id_idx   on public.subscriptions (plan_id);
create index if not exists subscriptions_status_idx    on public.subscriptions (status);


-- ============================================
-- BILLING CUSTOMERS (mapping tenants -> Stripe/etc)
-- ============================================
create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null default 'stripe',
  external_customer_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_customer_id)
);

create index if not exists billing_customers_tenant_id_idx on public.billing_customers (tenant_id);


-- ============================================
-- PLAN FEATURES (feature flags per plan)
-- ============================================
create table if not exists public.plan_features (
  id bigserial primary key,
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_code text not null,         -- e.g. 'recipe_builder', 'multi_bom'
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, feature_code)
);

create index if not exists plan_features_plan_id_idx on public.plan_features (plan_id);


-- ============================================
-- TENANT SETTINGS (per-tenant configuration)
-- ============================================
create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  branding jsonb not null default '{}'::jsonb, -- logo URLs, colors, etc.
  locale text not null default 'en-US',
  currency text not null default 'USD',
  units text not null default 'imperial',      -- or 'metric'
  timezone text not null default 'UTC',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============================================
-- AUDIT LOGS
-- ============================================
create table if not exists public.audit_logs (
  id bigserial primary key,
  tenant_id uuid references public.tenants(id),
  user_id uuid references auth.users(id),
  action text not null,       -- e.g. 'login', 'product_created'
  description text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_tenant_id_idx  on public.audit_logs (tenant_id);
create index if not exists audit_logs_user_id_idx    on public.audit_logs (user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at);


-- ============================================
-- USAGE METRICS (per tenant, per event) – trigger-free
-- ============================================
create table if not exists public.usage_metrics (
  id bigserial primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id),
  metric_code text not null,       -- e.g. 'products_configured', 'quotes_generated'
  value numeric not null default 1,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists usage_metrics_tenant_metric_idx
  on public.usage_metrics (tenant_id, metric_code, occurred_at);

-- View for daily analytics (computes period_date without generated columns or triggers)
create or replace view public.usage_metrics_daily as
select
  id,
  tenant_id,
  user_id,
  metric_code,
  value,
  occurred_at,
  occurred_at::date as period_date,
  created_at
from public.usage_metrics;


-- ============================================
-- API KEYS (per tenant)
-- Store **hashes**, not raw keys
-- ============================================
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  label text,
  key_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  unique (key_hash)
);

create index if not exists api_keys_tenant_id_idx   on public.api_keys (tenant_id);
create index if not exists api_keys_revoked_at_idx  on public.api_keys (revoked_at);


-- ============================================
-- INVITES (invite users into tenants)
-- ============================================
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'user',   -- role to grant on accept
  token text not null,                 -- secure random token
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email, accepted_at)
);

create index if not exists invites_tenant_id_idx on public.invites (tenant_id);
create index if not exists invites_email_idx     on public.invites (email);
create index if not exists invites_token_idx     on public.invites (token);


-- ============================================
-- RLS: ENABLE + POLICIES
-- Strategy:
--  - Normal users: access only rows with their tenant_id
--  - super_admin: access everything
--  - Some tables (plans) are globally readable
-- ============================================

-- Helper function: returns true if current user is super_admin
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and role = 'super_admin'
  );
$$;


-- -------------------
-- PLANS
-- -------------------
alter table public.plans enable row level security;

-- Plans: readable by everyone (or you can tighten later)
create policy plans_select_policy
on public.plans
for select
using (true);


-- -------------------
-- TENANTS
-- -------------------
alter table public.tenants enable row level security;

create policy tenants_select_policy
on public.tenants
for select
using (
  public.is_super_admin()
  or id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
);

create policy tenants_update_policy
on public.tenants
for update
using (
  public.is_super_admin()
  or id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  )
);

create policy tenants_insert_policy
on public.tenants
for insert
with check (public.is_super_admin());

create policy tenants_delete_policy
on public.tenants
for delete
using (public.is_super_admin());


-- -------------------
-- PROFILES
-- -------------------
alter table public.profiles enable row level security;

create policy profiles_select_policy
on public.profiles
for select
using (
  public.is_super_admin()
  or user_id = auth.uid()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  )
);

create policy profiles_update_self_policy
on public.profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy profiles_admin_update_policy
on public.profiles
for update
using (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  )
)
with check (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  )
);


-- -------------------
-- SUBSCRIPTIONS, TENANT_SETTINGS, BILLING_CUSTOMERS
-- -------------------
alter table public.subscriptions     enable row level security;
alter table public.tenant_settings   enable row level security;
alter table public.billing_customers enable row level security;

create policy subscriptions_tenant_policy
on public.subscriptions
for all
using (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
)
with check (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
);

create policy tenant_settings_tenant_policy
on public.tenant_settings
for all
using (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
)
with check (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
);

create policy billing_customers_tenant_policy
on public.billing_customers
for all
using (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
)
with check (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
);


-- -------------------
-- API KEYS, INVITES
-- -------------------
alter table public.api_keys enable row level security;
alter table public.invites  enable row level security;

create policy api_keys_tenant_policy
on public.api_keys
for all
using (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
      and role in ('admin')
  )
)
with check (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
      and role in ('admin')
  )
);

create policy invites_tenant_policy
on public.invites
for all
using (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
      and role in ('admin')
  )
)
with check (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
      and role in ('admin')
  )
);


-- -------------------
-- AUDIT_LOGS, USAGE_METRICS
-- (read-only to tenant, inserts via app / service role)
-- -------------------
alter table public.audit_logs    enable row level security;
alter table public.usage_metrics enable row level security;

create policy audit_logs_select_policy
on public.audit_logs
for select
using (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
);

create policy usage_metrics_select_policy
on public.usage_metrics
for select
using (
  public.is_super_admin()
  or tenant_id = (
    select tenant_id from public.profiles
    where user_id = auth.uid()
  )
);

-- Inserts for these are typically performed by backend/service role
create policy audit_logs_insert_policy
on public.audit_logs
for insert
with check (true);

create policy usage_metrics_insert_policy
on public.usage_metrics
for insert
with check (true);


-- ============================================
-- SEED DATA: PLANS
-- ============================================
insert into public.plans (code, name, description, price_monthly_cents, features)
values
  ('free',     'Free',     'Free tier for evaluation and small teams',          0,
    jsonb_build_object('max_users', 3,  'max_products', 50)),
  ('builder',  'Builder',  'Builder tier with recipe builder and more volume',  19900,
    jsonb_build_object('max_users', 20, 'max_products', 500)),
  ('business', 'Business', 'Business tier for multi-team manufacturing',       49900,
    jsonb_build_object('max_users', 100,'max_products', 5000))
on conflict (code) do nothing;