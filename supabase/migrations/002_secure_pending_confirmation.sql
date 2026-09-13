-- Secure second-user confirmation flow for recent truck sightings.

create or replace function public.recent_pending_truck_reports(target_neighborhood text)
returns table (
  id uuid,
  neighborhood text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.neighborhood, r.latitude, r.longitude, r.created_at
  from public.truck_reports r
  where auth.uid() is not null
    and r.neighborhood = target_neighborhood
    and r.status = 'pending'
    and r.reporter_id <> auth.uid()
    and r.created_at > now() - interval '15 minutes'
  order by r.created_at desc
  limit 10;
$$;

revoke all on function public.recent_pending_truck_reports(text) from public;
grant execute on function public.recent_pending_truck_reports(text) to authenticated;

-- Remove the older confirmation RPC so proximity is always checked server-side.
drop function if exists public.confirm_truck_report(uuid);

create or replace function public.confirm_truck_report(
  target_report uuid,
  confirmer_lat double precision,
  confirmer_lon double precision
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  report_owner uuid;
  report_lat double precision;
  report_lon double precision;
  report_created timestamptz;
  report_status text;
  distance_m double precision;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if confirmer_lat not between -90 and 90 or confirmer_lon not between -180 and 180 then
    raise exception 'Invalid confirmer location';
  end if;

  select reporter_id, latitude, longitude, created_at, status
    into report_owner, report_lat, report_lon, report_created, report_status
  from public.truck_reports
  where id = target_report;

  if report_owner is null then
    raise exception 'Report not found';
  end if;

  if report_owner = auth.uid() then
    raise exception 'Reporter cannot confirm own report';
  end if;

  if report_status <> 'pending' then
    raise exception 'Report is no longer pending';
  end if;

  if report_created < now() - interval '15 minutes' then
    raise exception 'Report is too old to confirm';
  end if;

  -- Haversine distance in metres. Confirmation requires user to be within 800 m.
  distance_m := 6371000 * 2 * asin(
    sqrt(
      power(sin(radians(confirmer_lat - report_lat) / 2), 2) +
      cos(radians(report_lat)) * cos(radians(confirmer_lat)) *
      power(sin(radians(confirmer_lon - report_lon) / 2), 2)
    )
  );

  if distance_m > 800 then
    raise exception 'You are too far from this sighting to confirm it';
  end if;

  insert into public.report_confirmations(report_id, user_id)
  values (target_report, auth.uid())
  on conflict (report_id, user_id) do nothing;

  update public.truck_reports
  set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
  where id = target_report and status = 'pending';
end;
$$;

revoke all on function public.confirm_truck_report(uuid, double precision, double precision) from public;
grant execute on function public.confirm_truck_report(uuid, double precision, double precision) to authenticated;
