-- ============================================================
-- 0004 — create_event RPC
-- Buluşma oluşturur (RLS: host_id = auth.uid()). meet_point opsiyonel.
-- SQL Editor'de çalıştır.
-- ============================================================

create or replace function public.create_event(
  p_title       text,
  p_description text,
  p_event_type  text,
  p_province    text,
  p_location    text,
  p_starts_at   timestamptz,
  p_capacity    integer default null,
  p_route_id    uuid default null,
  p_lng         float8 default null,
  p_lat         float8 default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Giriş yapman gerekiyor.';
  end if;

  insert into public.events (
    host_id, route_id, title, description, event_type, province, location,
    meet_point, starts_at, capacity
  )
  values (
    auth.uid(), p_route_id, p_title, nullif(p_description, ''),
    p_event_type::public.route_type, p_province, p_location,
    case
      when p_lng is not null and p_lat is not null
      then st_setsrid(st_makepoint(p_lng, p_lat), 4326)
      else null
    end,
    p_starts_at, p_capacity
  )
  returning id into new_id;

  -- host'u otomatik katılımcı yap
  insert into public.event_attendees (event_id, user_id, status)
  values (new_id, auth.uid(), 'gidiyor')
  on conflict (event_id, user_id) do nothing;

  return new_id;
end;
$$;
