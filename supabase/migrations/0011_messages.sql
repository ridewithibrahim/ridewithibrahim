-- ============================================================
-- 0011 — Mesajlaşma + Engelleme + Şikâyet
-- SQL Editor'de çalıştır.
-- ============================================================

-- ---------- Tablolar ----------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  last_message_text text,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);
create index if not exists messages_unread_idx on public.messages (read) where read = false;

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

create policy "conv participants read" on public.conversations
  for select using (auth.uid() in (user_a, user_b));
-- conversations'a ekleme yalnızca RPC ile (aşağıda, security definer).

create policy "msg participants read" on public.messages
  for select using (
    exists (select 1 from public.conversations c
            where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
  );

create policy "msg send" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversations c
                where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
    -- iki yönlü engel kontrolü: engel varsa mesaj GÖNDERİLEMEZ
    and not exists (
      select 1 from public.blocks b
      join public.conversations c on c.id = conversation_id
      where (b.blocker_id = c.user_a and b.blocked_id = c.user_b)
         or (b.blocker_id = c.user_b and b.blocked_id = c.user_a)
    )
  );

create policy "msg mark read" on public.messages
  for update using (
    exists (select 1 from public.conversations c
            where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b))
  );

create policy "blocks own read" on public.blocks
  for select using (blocker_id = auth.uid());
create policy "blocks own insert" on public.blocks
  for insert with check (blocker_id = auth.uid());
create policy "blocks own delete" on public.blocks
  for delete using (blocker_id = auth.uid());

create policy "reports insert" on public.reports
  for insert with check (reporter_id = auth.uid());
create policy "reports admin read" on public.reports
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ---------- RPC: konuşmayı bul ya da oluştur ----------

create or replace function public.get_or_create_conversation(p_other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  ua uuid; ub uuid; conv uuid;
begin
  if me is null then raise exception 'Giriş yapman gerekiyor.'; end if;
  if p_other is null or p_other = me then raise exception 'Geçersiz kullanıcı.'; end if;
  if not exists (select 1 from profiles where id = p_other) then
    raise exception 'Kullanıcı bulunamadı.';
  end if;
  if exists (select 1 from blocks
             where (blocker_id = me and blocked_id = p_other)
                or (blocker_id = p_other and blocked_id = me)) then
    raise exception 'Bu kişiyle mesajlaşma engellenmiş.';
  end if;

  ua := least(me, p_other);
  ub := greatest(me, p_other);
  select id into conv from conversations where user_a = ua and user_b = ub;
  if conv is null then
    insert into conversations (user_a, user_b) values (ua, ub) returning id into conv;
  end if;
  return conv;
end $$;

-- ---------- Tetikleyici: son mesaj özetini konuşmaya işle ----------

create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations
     set last_message_at = new.created_at,
         last_message_text = left(new.content, 120)
   where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists trg_touch_conv on public.messages;
create trigger trg_touch_conv
  after insert on public.messages
  for each row execute function public.touch_conversation();
