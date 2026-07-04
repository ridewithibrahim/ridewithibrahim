-- ============================================================
-- 0007 — Kamp noktaları (harita katmanı)
-- SQL Editor'de çalıştır.
-- ============================================================

create table if not exists public.camp_spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lng double precision not null,
  lat double precision not null,
  description text,
  source text not null default 'osm',
  created_at timestamptz not null default now()
);

alter table public.camp_spots enable row level security;

create policy "camp spots public read" on public.camp_spots
  for select using (true);

create policy "camp spots auth insert" on public.camp_spots
  for insert with check (auth.role() = 'authenticated');

create policy "camp spots admin delete" on public.camp_spots
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
