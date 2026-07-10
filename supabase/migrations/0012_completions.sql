-- ============================================================
-- 0012 — Rota tamamlama sistemi
-- SQL Editor'de çalıştır.
-- ============================================================

create table if not exists public.route_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, route_id)
);

create index if not exists completions_user_idx on public.route_completions (user_id);
create index if not exists completions_route_idx on public.route_completions (route_id);

alter table public.route_completions enable row level security;

create policy "completions public read" on public.route_completions
  for select using (true);

create policy "completions own insert" on public.route_completions
  for insert with check (auth.uid() = user_id);

create policy "completions own delete" on public.route_completions
  for delete using (auth.uid() = user_id);

-- Bildirim türlerine 'complete' ekle
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('like', 'comment', 'join', 'complete'));

-- Rota tamamlanınca sahibine haber ver (zırhlı — hata beğeni/tamamlamayı düşüremez)
create or replace function public.notify_route_complete()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  begin
    select user_id into owner from routes where id = new.route_id;
    if owner is not null and owner <> new.user_id then
      insert into notifications (user_id, actor_id, type, route_id)
      values (owner, new.user_id, 'complete', new.route_id);
    end if;
  exception when others then
    null;
  end;
  return new;
end $$;

drop trigger if exists trg_notify_complete on public.route_completions;
create trigger trg_notify_complete
  after insert on public.route_completions
  for each row execute function public.notify_route_complete();
