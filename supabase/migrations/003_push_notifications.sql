-- Store Expo push tokens per signed-in user and selected neighborhood.
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  neighborhood text not null check (neighborhood in ('بن يوب','العميرات')),
  platform text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_neighborhood_idx
  on public.push_tokens(neighborhood)
  where enabled = true;
create index if not exists push_tokens_user_idx on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "read own push tokens" on public.push_tokens;
create policy "read own push tokens"
on public.push_tokens for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "insert own push token" on public.push_tokens;
create policy "insert own push token"
on public.push_tokens for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "update own push token" on public.push_tokens;
create policy "update own push token"
on public.push_tokens for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "delete own push token" on public.push_tokens;
create policy "delete own push token"
on public.push_tokens for delete
to authenticated
using (user_id = auth.uid());

-- Internal deduplication table used only by the Edge Function/service role.
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.truck_reports(id) on delete cascade,
  event_type text not null default 'truck_confirmed',
  created_at timestamptz not null default now(),
  unique(report_id, event_type)
);

alter table public.notification_events enable row level security;
-- No client policies by design. Service role bypasses RLS.
