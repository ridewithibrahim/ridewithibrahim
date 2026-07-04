-- ============================================================
-- 0006 — Moderasyon: admin bayrağı + admin silme yetkileri
-- SQL Editor'de çalıştır. Mevcut politikalara DOKUNMAZ, üstüne ekler.
-- ============================================================

-- 1) Admin bayrağı
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2) Adminler her içeriği silebilsin (sahip politikalarıyla OR'lanır)
create policy "admin delete any route" on public.routes
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "admin delete any comment" on public.route_comments
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "admin delete any event" on public.events
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- 3) KENDİNİ ADMİN YAP — kullanıcı adını kendi adınla değiştir:
update public.profiles set is_admin = true where username = 'KULLANICIADIN';
