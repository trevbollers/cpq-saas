-- Tenant membership table
create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),

  unique(tenant_id, user_id)
);

-- RLS: only allow service role full access
alter table public.tenant_members enable row level security;

create policy "service role can do everything"
on public.tenant_members
for all
to service_role
using (true)
WITH CHECK (true);