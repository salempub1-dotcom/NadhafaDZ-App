-- NadhafaDZ MVP data model.
-- This migration intentionally leaves the existing public.profiles table unchanged.

create table if not exists public.truck_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  neighborhood text not null check (neighborhood in ('بن يوب','العميرات')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  status text not null default 'pending' check (status in ('pending','confirmed','expired')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists truck_reports_created_at_idx on public.truck_reports(created_at desc);
create index if not exists truck_reports_neighborhood_idx on public.truck_reports(neighborhood, created_at desc);

create table if not exists public.report_confirmations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.truck_reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(report_id, user_id)
);

alter table public.truck_reports enable row level security;
alter table public.report_confirmations enable row level security;

-- A citizen may create a report only as themselves.
drop policy if exists "insert own truck report" on public.truck_reports;
create policy "insert own truck report"
on public.truck_reports for insert
to authenticated
with check (reporter_id = auth.uid());

-- A citizen may read their own raw reports. Public feed will later be exposed through a sanitized RPC/view.
drop policy if exists "read own truck reports" on public.truck_reports;
create policy "read own truck reports"
on public.truck_reports for select
to authenticated
using (reporter_id = auth.uid());

-- Confirmations are always tied to the signed-in user.
drop policy if exists "insert own confirmation" on public.report_confirmations;
create policy "insert own confirmation"
on public.report_confirmations for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "read own confirmations" on public.report_confirmations;
create policy "read own confirmations"
on public.report_confirmations for select
to authenticated
using (user_id = auth.uid());

-- Mark a report confirmed after a second distinct user confirms it.
create or replace function public.confirm_truck_report(target_report uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  report_owner uuid;
  confirmation_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select reporter_id into report_owner from public.truck_reports where id = target_report;
  if report_owner is null then
    raise exception 'Report not found';
  end if;
  if report_owner = auth.uid() then
    raise exception 'Reporter cannot confirm own report';
  end if;

  insert into public.report_confirmations(report_id, user_id)
  values (target_report, auth.uid())
  on conflict (report_id, user_id) do nothing;

  select count(*) into confirmation_count
  from public.report_confirmations
  where report_id = target_report;

  if confirmation_count >= 1 then
    update public.truck_reports
    set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
    where id = target_report and status = 'pending';
  end if;
end;
$$;

revoke all on function public.confirm_truck_report(uuid) from public;
grant execute on function public.confirm_truck_report(uuid) to authenticated;

-- Sanitized recent feed: no reporter identity is returned.
create or replace function public.recent_truck_feed(target_neighborhood text)
returns table (
  id uuid,
  neighborhood text,
  latitude double precision,
  longitude double precision,
  status text,
  created_at timestamptz,
  confirmed_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.neighborhood, r.latitude, r.longitude, r.status, r.created_at, r.confirmed_at
  from public.truck_reports r
  where auth.uid() is not null
    and r.neighborhood = target_neighborhood
    and r.status = 'confirmed'
    and r.created_at > now() - interval '2 hours'
  order by r.created_at desc
  limit 20;
$$;

revoke all on function public.recent_truck_feed(text) from public;
grant execute on function public.recent_truck_feed(text) to authenticated;
