-- ============================================================
-- 0003 — route_comments'ı uuid şemayla uyumlu hale getir
-- DİKKAT: mevcut route_comments tablosunu (ve içindeki veriyi) SİLER.
-- Eski tasarım (bigint route_id, username, text) uuid rotalarla uyumsuz.
-- SQL Editor'de çalıştır.
-- ============================================================

drop table if exists public.route_comments cascade;

create table public.route_comments (
  id         uuid primary key default gen_random_uuid(),
  route_id   uuid not null references public.routes (id)   on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index route_comments_route_idx on public.route_comments (route_id, created_at desc);

alter table public.route_comments enable row level security;

create policy "route_comments read"
  on public.route_comments for select using (true);

create policy "route_comments insert"
  on public.route_comments for insert with check (auth.uid() = user_id);

create policy "route_comments delete"
  on public.route_comments for delete using (auth.uid() = user_id);
