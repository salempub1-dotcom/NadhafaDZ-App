-- Add reference point 8 to the permanent NadhafaDZ service-area geofence.

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
      (36.653178::double precision, 3.118758::double precision),
      (36.654640::double precision, 3.116191::double precision)
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
