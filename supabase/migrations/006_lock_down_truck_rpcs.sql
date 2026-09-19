revoke execute on function public.submit_truck_sighting(text,double precision,double precision) from anon;
revoke execute on function public.confirm_truck_report(uuid,double precision,double precision) from anon;
revoke execute on function public.live_truck_session_feed(text) from anon;
revoke execute on function public.recent_pending_truck_reports(text) from anon;
revoke execute on function public.recent_truck_feed(text) from anon;

grant execute on function public.submit_truck_sighting(text,double precision,double precision) to authenticated;
grant execute on function public.confirm_truck_report(uuid,double precision,double precision) to authenticated;
grant execute on function public.live_truck_session_feed(text) to authenticated;
grant execute on function public.recent_pending_truck_reports(text) to authenticated;
grant execute on function public.recent_truck_feed(text) to authenticated;
