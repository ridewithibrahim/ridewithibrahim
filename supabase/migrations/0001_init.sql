-- ============================================================
-- TEMİZ KURULUM — RideWithIbrahim
-- DİKKAT: Aşağıdaki tablolar (profiles, routes, events vb.) VARSA
-- silinir ve içindeki veriler gider. Yeni/boş projede sorun değil.
-- auth.users (kullanıcı hesapların) bu işlemden ETKİLENMEZ.
-- ============================================================

drop view     if exists public.weekly_leaderboard cascade;
drop table    if exists public.event_attendees   cascade;
drop table    if exists public.events            cascade;
drop table    if exists public.comments          cascade;
drop table    if exists public.route_saves       cascade;
drop table    if exists public.route_likes       cascade;
drop table    if exists public.routes            cascade;
drop table    if exists public.profiles          cascade;
drop function if exists public.routes_nearby      cascade;
drop function if exists public.bump_route_counter cascade;
drop function if exists public.handle_new_user    cascade;
drop type     if exists public.rsvp_status cascade;
drop type     if exists public.difficulty  cascade;
drop type     if exists public.route_type  cascade;

-- ============================================================
-- RideWithIbrahim — initial schema
-- Run in Supabase SQL Editor (or `supabase db push`).
-- PostGIS can also be enabled from Dashboard → Database → Extensions.
-- ============================================================

create extension if not exists postgis with schema extensions;

-- ---------- ENUMS ----------
create type public.route_type as enum ('yol', 'mtb', 'moto', 'kamp');
create type public.difficulty  as enum ('kolay', 'orta', 'zor', 'uzman');
create type public.rsvp_status as enum ('gidiyor', 'belki', 'gitmiyor');

-- ---------- PROFILES ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  full_name   text,
  avatar_url  text,
  bio         text,
  city        text,
  created_at  timestamptz not null default now()
);

-- ---------- ROUTES ----------
create table public.routes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  title             text not null,
  description       text,
  route_type        public.route_type not null,
  difficulty        public.difficulty  not null,
  province          text not null,                 -- il (filtreleme için)
  distance_m        integer not null default 0,    -- metre
  elevation_gain_m  integer not null default 0,    -- metre
  duration_min      integer not null default 0,    -- dakika
  path              geometry(LineString, 4326) not null,
  start_point       geometry(Point, 4326)
                      generated always as (st_startpoint(path)) stored,
  gpx_url           text,                          -- storage: gpx bucket
  thumbnail_url     text,                          -- storage: route-thumbnails
  likes_count       integer not null default 0,
  saves_count       integer not null default 0,
  created_at        timestamptz not null default now()
);

create index routes_path_gix      on public.routes using gist (path);
create index routes_start_gix     on public.routes using gist (start_point);
create index routes_filter_idx    on public.routes (route_type, difficulty, province);
create index routes_created_idx   on public.routes (created_at desc);
create index routes_user_idx      on public.routes (user_id);

-- ---------- LIKES / SAVES ----------
create table public.route_likes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  route_id   uuid not null references public.routes (id)   on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

create table public.route_saves (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  route_id   uuid not null references public.routes (id)   on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

-- ---------- COMMENTS ----------
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  route_id   uuid not null references public.routes (id)   on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index comments_route_idx on public.comments (route_id, created_at desc);

-- ---------- EVENTS (buluşmalar) ----------
create table public.events (
  id           uuid primary key default gen_random_uuid(),
  host_id      uuid not null references public.profiles (id) on delete cascade,
  route_id     uuid references public.routes (id) on delete set null,
  title        text not null,
  description  text,
  event_type   public.route_type not null,
  province     text not null,
  location     text not null,                 -- "Bebek, İstanbul"
  meet_point   geometry(Point, 4326),
  starts_at    timestamptz not null,
  capacity     integer,
  created_at   timestamptz not null default now()
);
create index events_upcoming_idx on public.events (starts_at);
create index events_filter_idx   on public.events (event_type, province);

create table public.event_attendees (
  event_id   uuid not null references public.events (id)   on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     public.rsvp_status not null default 'gidiyor',
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ============================================================
-- COUNTERS (triggers)
-- ============================================================
create or replace function public.bump_route_counter()
returns trigger language plpgsql as $$
declare
  col text := tg_argv[0];           -- 'likes_count' | 'saves_count'
  delta int := case when tg_op = 'INSERT' then 1 else -1 end;
  rid uuid := case when tg_op = 'INSERT' then new.route_id else old.route_id end;
begin
  execute format('update public.routes set %I = greatest(%I + $1, 0) where id = $2', col, col)
    using delta, rid;
  return null;
end; $$;

create trigger trg_likes_count after insert or delete on public.route_likes
  for each row execute function public.bump_route_counter('likes_count');
create trigger trg_saves_count after insert or delete on public.route_saves
  for each row execute function public.bump_route_counter('saves_count');

-- ============================================================
-- NEW USER → PROFILE
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- WEEKLY LEADERBOARD (haftalık rota paylaşımı)
-- ============================================================
create or replace view public.weekly_leaderboard as
  select
    p.id, p.username, p.avatar_url,
    count(r.id) as route_count,
    coalesce(sum(r.distance_m), 0) as total_distance_m
  from public.profiles p
  join public.routes r
    on r.user_id = p.id and r.created_at >= now() - interval '7 days'
  group by p.id
  order by route_count desc, total_distance_m desc;

-- ============================================================
-- NEARBY ROUTES (mekânsal RPC) — supabase.rpc('routes_nearby', ...)
-- ============================================================
create or replace function public.routes_nearby(
  lat float8, lng float8, radius_m float8 default 50000
)
returns setof public.routes language sql stable as $$
  select *
  from public.routes
  where st_dwithin(
    start_point::geography,
    st_setsrid(st_makepoint(lng, lat), 4326)::geography,
    radius_m
  )
  order by st_distance(
    start_point::geography,
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.routes          enable row level security;
alter table public.route_likes     enable row level security;
alter table public.route_saves     enable row level security;
alter table public.comments        enable row level security;
alter table public.events          enable row level security;
alter table public.event_attendees enable row level security;

-- profiles: herkes okur, kişi kendi profilini günceller
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- routes: herkes okur, sahibi yazar/günceller/siler
create policy "routes read"   on public.routes for select using (true);
create policy "routes insert" on public.routes for insert with check (auth.uid() = user_id);
create policy "routes update" on public.routes for update using (auth.uid() = user_id);
create policy "routes delete" on public.routes for delete using (auth.uid() = user_id);

-- likes / saves: kişi sadece kendi kaydını yönetir, okuma herkese açık
create policy "likes read"   on public.route_likes for select using (true);
create policy "likes write"  on public.route_likes for insert with check (auth.uid() = user_id);
create policy "likes delete" on public.route_likes for delete using (auth.uid() = user_id);
create policy "saves read"   on public.route_saves for select using (true);
create policy "saves write"  on public.route_saves for insert with check (auth.uid() = user_id);
create policy "saves delete" on public.route_saves for delete using (auth.uid() = user_id);

-- comments: herkes okur, giriş yapan yazar, sahibi siler
create policy "comments read"   on public.comments for select using (true);
create policy "comments insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments delete" on public.comments for delete using (auth.uid() = user_id);

-- events: herkes okur, host yönetir
create policy "events read"   on public.events for select using (true);
create policy "events insert" on public.events for insert with check (auth.uid() = host_id);
create policy "events update" on public.events for update using (auth.uid() = host_id);
create policy "events delete" on public.events for delete using (auth.uid() = host_id);

-- attendees: herkes okur, kişi kendi katılımını yönetir
create policy "attendees read"   on public.event_attendees for select using (true);
create policy "attendees write"  on public.event_attendees for insert with check (auth.uid() = user_id);
create policy "attendees update" on public.event_attendees for update using (auth.uid() = user_id);
create policy "attendees delete" on public.event_attendees for delete using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('gpx', 'gpx', true), ('route-thumbnails', 'route-thumbnails', true)
on conflict (id) do nothing;

create policy "storage public read"
  on storage.objects for select
  using (bucket_id in ('gpx', 'route-thumbnails'));

create policy "storage auth upload"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('gpx', 'route-thumbnails'));

create policy "storage owner delete"
  on storage.objects for delete to authenticated
  using (owner = auth.uid());