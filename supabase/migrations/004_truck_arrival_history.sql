-- Sanitized history of confirmed truck arrivals for the account statistics screen.
-- Only confirmed timestamps and neighborhood are exposed; reporter identity/location is not returned.

create or replace function public.truck_arrival_history(
  target_neighborhood text,
  history_limit integer default 50
)
returns table (
  id uuid,
  neighborhood text,
  confirmed_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.neighborhood, r.confirmed_at
  from public.truck_reports r
  where auth.uid() is not null
    and r.neighborhood = target_neighborhood
    and r.status = 'confirmed'
    and r.confirmed_at is not null
  order by r.confirmed_at desc
  limit least(greatest(coalesce(history_limit, 50), 1), 100);
$$;

revoke all on function public.truck_arrival_history(text, integer) from public;
grant execute on function public.truck_arrival_history(text, integer) to authenticated;
