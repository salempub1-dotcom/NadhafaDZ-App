-- Restrict accepted truck sightings to the confirmed NadhafaDZ pilot service corridor.
-- A sighting is valid only when it is close to one of the canonical route/neighborhood points.

create or replace function public.is_within_service_area(
  target_lat double precision,
  target_lon double precision
)
returns boolean
language sql
immutable
set search_path = public
as $$
  with service_points(latitude, longitude) as (
    values
      (36.651640::double precision, 3.108959::double precision),
      (36.652214::double precision, 3.112289::double precision),
      (36.652788::double precision, 3.115609::double precision),
      (36.653063::double precision, 3.116484::double precision),
      (36.653178::double precision, 3.118758::double precision)
  ), distances as (
    select 6371000 * 2 * asin(
      least(1, sqrt(
        power(sin(radians(target_lat - latitude) / 2), 2) +
        cos(radians(latitude)) * cos(radians(target_lat)) *
        power(sin(radians(target_lon - longitude) / 2), 2)
      ))
    ) as distance_m
    from service_points
  )
  select coalesce(min(distance_m) <= 650, false) from distances;
$$;

revoke all on function public.is_within_service_area(double precision,double precision) from public;
grant execute on function public.is_within_service_area(double precision,double precision) to authenticated;

create or replace function public.submit_truck_sighting(
  target_neighborhood text,
  target_lat double precision,
  target_lon double precision
)
returns table (
  report_id uuid,
  report_status text,
  report_session_id uuid,
  report_sighting_kind text,
  auto_confirmed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_session public.truck_sessions%rowtype;
  last_lat double precision;
  last_lon double precision;
  distance_m double precision;
  new_report_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if target_neighborhood not in ('بن يوب','العميرات') then raise exception 'Invalid neighborhood'; end if;
  if target_lat not between -90 and 90 or target_lon not between -180 and 180 then raise exception 'Invalid location'; end if;

  -- Never accept a truck sighting that is outside the confirmed pilot corridor/neighborhood perimeter.
  if not public.is_within_service_area(target_lat, target_lon) then
    raise exception 'OUTSIDE_SERVICE_AREA';
  end if;

  update public.truck_sessions
  set status = 'ended', ended_at = coalesce(ended_at, now())
  where neighborhood = target_neighborhood
    and status = 'active'
    and last_sighting_at < now() - interval '45 minutes';

  select * into active_session
  from public.truck_sessions
  where neighborhood = target_neighborhood and status = 'active'
  order by started_at desc
  limit 1
  for update;

  if active_session.id is not null then
    select r.latitude, r.longitude into last_lat, last_lon
    from public.truck_reports r
    where r.session_id = active_session.id and r.status = 'confirmed'
    order by coalesce(r.confirmed_at, r.created_at) desc
    limit 1;

    if last_lat is not null then
      distance_m := 6371000 * 2 * asin(
        least(1, sqrt(
          power(sin(radians(target_lat - last_lat) / 2), 2) +
          cos(radians(last_lat)) * cos(radians(target_lat)) *
          power(sin(radians(target_lon - last_lon) / 2), 2)
        ))
      );
    else
      distance_m := 0;
    end if;

    if distance_m <= 1500 then
      insert into public.truck_reports(
        reporter_id, neighborhood, latitude, longitude, status, confirmed_at, session_id, sighting_kind
      ) values (
        auth.uid(), target_neighborhood, target_lat, target_lon, 'confirmed', now(), active_session.id, 'session_point'
      ) returning id into new_report_id;

      update public.truck_sessions set last_sighting_at = now() where id = active_session.id;
      return query select new_report_id, 'confirmed'::text, active_session.id, 'session_point'::text, true;
      return;
    end if;
  end if;

  insert into public.truck_reports(reporter_id, neighborhood, latitude, longitude, status, sighting_kind)
  values (auth.uid(), target_neighborhood, target_lat, target_lon, 'pending', 'candidate')
  returning id into new_report_id;

  return query select new_report_id, 'pending'::text, null::uuid, 'candidate'::text, false;
end;
$$;

revoke all on function public.submit_truck_sighting(text,double precision,double precision) from public;
grant execute on function public.submit_truck_sighting(text,double precision,double precision) to authenticated;

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
  report_neighborhood text;
  report_lat double precision;
  report_lon double precision;
  report_created timestamptz;
  report_status text;
  distance_m double precision;
  active_session_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if confirmer_lat not between -90 and 90 or confirmer_lon not between -180 and 180 then raise exception 'Invalid confirmer location'; end if;

  select reporter_id, neighborhood, latitude, longitude, created_at, status
    into report_owner, report_neighborhood, report_lat, report_lon, report_created, report_status
  from public.truck_reports where id = target_report for update;

  if report_owner is null then raise exception 'Report not found'; end if;
  if report_owner = auth.uid() then raise exception 'Reporter cannot confirm own report'; end if;
  if report_status <> 'pending' then raise exception 'Report is no longer pending'; end if;
  if report_created < now() - interval '15 minutes' then raise exception 'Report is too old to confirm'; end if;

  -- Defense in depth: old or malformed reports outside the approved area can never become confirmed.
  if not public.is_within_service_area(report_lat, report_lon) then
    raise exception 'OUTSIDE_SERVICE_AREA';
  end if;

  distance_m := 6371000 * 2 * asin(
    least(1, sqrt(
      power(sin(radians(confirmer_lat - report_lat) / 2), 2) +
      cos(radians(report_lat)) * cos(radians(confirmer_lat)) *
      power(sin(radians(confirmer_lon - report_lon) / 2), 2)
    ))
  );
  if distance_m > 800 then raise exception 'You are too far from this sighting to confirm it'; end if;

  insert into public.report_confirmations(report_id, user_id)
  values (target_report, auth.uid())
  on conflict (report_id, user_id) do nothing;

  update public.truck_sessions
  set status = 'ended', ended_at = coalesce(ended_at, now())
  where neighborhood = report_neighborhood and status = 'active'
    and last_sighting_at < now() - interval '45 minutes';

  select id into active_session_id
  from public.truck_sessions
  where neighborhood = report_neighborhood and status = 'active'
  order by started_at desc limit 1 for update;

  if active_session_id is null then
    insert into public.truck_sessions(neighborhood, status, started_at, last_sighting_at, anchor_report_id)
    values (report_neighborhood, 'active', now(), now(), target_report)
    returning id into active_session_id;
  else
    update public.truck_sessions set last_sighting_at = now() where id = active_session_id;
  end if;

  update public.truck_reports
  set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now()),
      session_id = active_session_id, sighting_kind = 'session_point'
  where id = target_report and status = 'pending';
end;
$$;

revoke all on function public.confirm_truck_report(uuid,double precision,double precision) from public;
grant execute on function public.confirm_truck_report(uuid,double precision,double precision) to authenticated;
