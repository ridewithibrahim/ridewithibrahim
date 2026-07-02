-- ============================================================
-- 0002 — create_route RPC
-- GeoJSON koordinat dizisinden güvenli şekilde geometry yazar.
-- RLS geçerli (security invoker): user_id = auth.uid() atanır.
-- SQL Editor'de çalıştır.
-- ============================================================

create or replace function public.create_route(
  p_title            text,
  p_description       text,
  p_route_type        text,
  p_difficulty        text,
  p_province          text,
  p_distance_m        integer,
  p_elevation_gain_m  integer,
  p_duration_min      integer,
  p_coords            jsonb,          -- [[lng,lat], [lng,lat], ...]
  p_gpx_url           text default null
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

  insert into public.routes (
    user_id, title, description, route_type, difficulty, province,
    distance_m, elevation_gain_m, duration_min, path, gpx_url
  )
  values (
    auth.uid(), p_title, nullif(p_description, ''),
    p_route_type::public.route_type, p_difficulty::public.difficulty, p_province,
    coalesce(p_distance_m, 0), coalesce(p_elevation_gain_m, 0), coalesce(p_duration_min, 0),
    st_setsrid(
      st_geomfromgeojson(
        jsonb_build_object('type', 'LineString', 'coordinates', p_coords)::text
      ),
      4326
    ),
    p_gpx_url
  )
  returning id into new_id;

  return new_id;
end;
$$;
