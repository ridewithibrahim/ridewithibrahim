-- ============================================================
-- 0008 — Bildirimler: tablo + otomatik tetikleyiciler
-- SQL Editor'de çalıştır.
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,   -- alıcı
  actor_id uuid not null references public.profiles(id) on delete cascade,  -- yapan kişi
  type text not null check (type in ('like', 'comment', 'join')),
  route_id uuid references public.routes(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);

alter table public.notifications enable row level security;

create policy "own notifications read" on public.notifications
  for select using (auth.uid() = user_id);

create policy "own notifications update" on public.notifications
  for update using (auth.uid() = user_id);

create policy "own notifications delete" on public.notifications
  for delete using (auth.uid() = user_id);

-- Ekleme yalnızca tetikleyicilerle (security definer) yapılır; kullanıcı insert politikası yok.

-- ---------- Tetikleyiciler ----------

-- Rota beğenilince sahibine haber ver (kendi beğenisi hariç)
create or replace function public.notify_route_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from routes where id = new.route_id;
  if owner is not null and owner <> new.user_id then
    insert into notifications (user_id, actor_id, type, route_id)
    values (owner, new.user_id, 'like', new.route_id);
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_like on public.route_likes;
create trigger trg_notify_like
  after insert on public.route_likes
  for each row execute function public.notify_route_like();

-- Rotaya yorum gelince sahibine haber ver
create or replace function public.notify_route_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from routes where id = new.route_id;
  if owner is not null and owner <> new.user_id then
    insert into notifications (user_id, actor_id, type, route_id)
    values (owner, new.user_id, 'comment', new.route_id);
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_comment on public.route_comments;
create trigger trg_notify_comment
  after insert on public.route_comments
  for each row execute function public.notify_route_comment();

-- Buluşmaya katılım gelince organizatöre haber ver
create or replace function public.notify_event_join()
returns trigger language plpgsql security definer set search_path = public as $$
declare host uuid;
begin
  select host_id into host from events where id = new.event_id;
  if host is not null and host <> new.user_id then
    insert into notifications (user_id, actor_id, type, event_id)
    values (host, new.user_id, 'join', new.event_id);
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_join on public.event_attendees;
create trigger trg_notify_join
  after insert on public.event_attendees
  for each row execute function public.notify_event_join();
